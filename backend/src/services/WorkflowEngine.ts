import Case from '../models/Case';
import Workflow from '../models/Workflow';
import { logger } from '../utils/logger';
import { addHours, differenceInHours } from 'date-fns';

class WorkflowEngine {
    private readonly SLA_HOURS = parseInt(process.env.DEFAULT_SLA_HOURS || '48');

    // COMPLIANCE GUARDRAILS: Define allowed workflow transitions (Finite State Machine)
    // This enforces "Guardrails vs. Guidelines" - technically impossible to skip steps
    private readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'assign': ['contact'],
        'contact': ['follow_up', 'close'],
        'follow_up': ['escalate', 'close'],
        'escalate': ['close'],
        'close': [] // Terminal state
    };

    // Required actions before advancing workflow stage
    private readonly REQUIRED_ACTIONS: Record<string, string[]> = {
        'contact': ['case_viewed', 'communication_initiated'],
        'follow_up': ['initial_contact_completed'],
        'escalate': ['follow_up_attempted'],
        'close': ['resolution_documented']
    };

    /**
     * Initialize workflow for a new case
     * @param caseId - The case ID to initialize workflow for
     * @param transaction - Optional Sequelize transaction for atomic operations
     */
    async initializeWorkflow(caseId: number, transaction?: any): Promise<Workflow> {
        const workflow = await Workflow.create({
            caseId,
            currentStage: 'assign',
            slaStatus: 'on_track',
            escalationCount: 0,
            autoAssigned: false,
            lastStageChange: new Date(),
            stageHistory: [{
                stage: 'assign',
                timestamp: new Date(),
            }],
        }, transaction ? { transaction } : {});

        await this.updateCaseSLA(caseId);
        return workflow;
    }

    /**
     * Validates if a workflow transition is allowed by the state machine
     * @throws Error if transition violates SOP requirements
     */
    private validateTransition(currentStage: string, newStage: string): void {
        const allowedStages = this.ALLOWED_TRANSITIONS[currentStage] || [];

        if (!allowedStages.includes(newStage)) {
            const allowedList = allowedStages.length > 0
                ? allowedStages.join(', ')
                : 'none (terminal state)';

            throw new Error(
                `WORKFLOW_VIOLATION: Cannot transition from '${currentStage}' to '${newStage}'. ` +
                `SOP requires progression through: ${allowedList}. ` +
                `This guardrail prevents compliance breaches.`
            );
        }
    }

    /**
     * Verifies that required actions have been completed before stage advancement
     * @throws Error if required actions are missing
     */
    private async verifyRequiredActions(caseId: number, newStage: string): Promise<void> {
        const requiredActions = this.REQUIRED_ACTIONS[newStage] || [];

        if (requiredActions.length === 0) {
            return; // No requirements for this stage
        }

        // Check audit log for required actions
        const AuditLog = (await import('../models/AuditLog')).default;
        const recentActions = await AuditLog.findAll({
            where: {
                entityType: 'Case',
                entityId: caseId
            },
            order: [['timestamp', 'DESC']],
            limit: 50
        });

        const completedActions = recentActions.map(log => log.action);
        const missingActions = requiredActions.filter(action =>
            !completedActions.some(completed =>
                completed.toLowerCase().includes(action.toLowerCase().replace('_', ' '))
            )
        );

        if (missingActions.length > 0) {
            throw new Error(
                `COMPLIANCE_BLOCK: Cannot advance to '${newStage}' stage. ` +
                `Missing required actions: ${missingActions.join(', ')}. ` +
                `Please complete all mandatory SOP steps before proceeding.`
            );
        }
    }

    async transitionStage(
        caseId: number,
        newStage: 'assign' | 'contact' | 'follow_up' | 'escalate' | 'close'
    ): Promise<void> {
        const workflow = await Workflow.findOne({ where: { caseId } });

        if (!workflow) {
            throw new Error('Workflow not found for case');
        }

        // GUARDRAIL ENFORCEMENT: Validate transition is allowed
        this.validateTransition(workflow.currentStage, newStage);

        // COMPLIANCE CHECK: Verify required actions completed (optional strict mode)
        const strictMode = process.env.WORKFLOW_STRICT_MODE !== 'false';
        if (strictMode) {
            try {
                await this.verifyRequiredActions(caseId, newStage);
            } catch (error) {
                // Log compliance block attempt
                logger.warn(`Workflow violation prevented for case ${caseId}: ${error}`);
                throw error;
            }
        }

        const history = workflow.stageHistory || [];
        history.push({
            stage: newStage,
            timestamp: new Date(),
            previousStage: workflow.currentStage,
        });

        await workflow.update({
            currentStage: newStage,
            lastStageChange: new Date(),
            stageHistory: history,
        });

        // If escalating, increment counter
        if (newStage === 'escalate') {
            await workflow.update({
                escalationCount: workflow.escalationCount + 1,
            });
        }

        // Update case status based on workflow stage
        const statusMap: Record<string, string> = {
            assign: 'assigned',
            contact: 'in_progress',
            follow_up: 'follow_up',
            escalate: 'escalated',
            close: 'closed',
        };

        await Case.update(
            { status: statusMap[newStage] as any },
            { where: { id: caseId } }
        );

        await this.updateCaseSLA(caseId);
        logger.info(`Workflow transitioned for case ${caseId}: ${workflow.currentStage} -> ${newStage}`);
    }

    async updateCaseSLA(caseId: number): Promise<void> {
        const caseRecord = await Case.findByPk(caseId);
        if (!caseRecord) return;

        const workflow = await Workflow.findOne({ where: { caseId } });
        if (!workflow) return;

        // Calculate SLA due date from last stage change
        const slaDueDate = addHours(
            workflow.lastStageChange || new Date(),
            this.SLA_HOURS
        );

        const now = new Date();
        const hoursRemaining = differenceInHours(slaDueDate, now);

        let slaStatus: 'on_track' | 'warning' | 'breached';
        if (hoursRemaining < 0) {
            slaStatus = 'breached';
        } else if (hoursRemaining < 12) {
            slaStatus = 'warning';
        } else {
            slaStatus = 'on_track';
        }

        await caseRecord.update({ slaDueDate, slaStatus });
        await workflow.update({ slaStatus });
    }

    async checkSLABreaches(): Promise<void> {
        const workflows = await Workflow.findAll({
            where: {
                currentStage: ['contact', 'follow_up', 'escalate'],
                slaStatus: ['on_track', 'warning'],
            },
        });

        for (const workflow of workflows) {
            await this.updateCaseSLA(workflow.caseId);

            // Auto-escalate if breached
            if (workflow.slaStatus === 'breached' && workflow.currentStage !== 'escalate') {
                logger.warn(`SLA breach detected for case ${workflow.caseId}, auto-escalating`);
                await this.transitionStage(workflow.caseId, 'escalate');
            }
        }
    }

    async getWorkflowStatus(caseId: number): Promise<any> {
        const workflow = await Workflow.findOne({ where: { caseId } });
        const caseRecord = await Case.findByPk(caseId);

        return {
            currentStage: workflow?.currentStage,
            slaStatus: workflow?.slaStatus,
            slaDueDate: caseRecord?.slaDueDate,
            escalationCount: workflow?.escalationCount,
            stageHistory: workflow?.stageHistory,
            allowedTransitions: this.getAllowedTransitions(workflow?.currentStage || 'assign'),
            requiredActions: this.REQUIRED_ACTIONS[workflow?.currentStage || 'assign'] || []
        };
    }

    /**
     * Get allowed next stages from current workflow state
     */
    getAllowedTransitions(currentStage: string): string[] {
        return this.ALLOWED_TRANSITIONS[currentStage] || [];
    }

    /**
     * Get count of prevented workflow violations (for compliance reporting)
     */
    async getPreventedViolationsCount(): Promise<number> {
        // Count audit log entries where workflow violations were blocked
        const AuditLog = (await import('../models/AuditLog')).default;
        const violations = await AuditLog.count({
            where: {
                action: 'WORKFLOW_VIOLATION_PREVENTED'
            }
        });
        return violations;
    }
}

export default new WorkflowEngine();
