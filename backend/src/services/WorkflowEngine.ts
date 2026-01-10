import Case from '../models/Case';
import Workflow from '../models/Workflow';
import { logger } from '../utils/logger';
import { addHours, isBefore, differenceInHours } from 'date-fns';

class WorkflowEngine {
    private readonly SLA_HOURS = parseInt(process.env.DEFAULT_SLA_HOURS || '48');
    private readonly ESCALATION_SLA_HOURS = parseInt(process.env.ESCALATION_SLA_HOURS || '72');

    async initializeWorkflow(caseId: number): Promise<Workflow> {
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
        });

        await this.updateCaseSLA(caseId);
        return workflow;
    }

    async transitionStage(
        caseId: number,
        newStage: 'assign' | 'contact' | 'follow_up' | 'escalate' | 'close'
    ): Promise<void> {
        const workflow = await Workflow.findOne({ where: { caseId } });

        if (!workflow) {
            throw new Error('Workflow not found for case');
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
        };
    }
}

export default new WorkflowEngine();
