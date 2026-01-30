import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import WorkflowEngine from '../services/WorkflowEngine';
import AuditService from '../services/AuditService';
import Case from '../models/Case';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/workflow/:caseId/transition
 * 
 * Attempt to transition a case to a new workflow stage
 * ENFORCES GUARDRAILS - will reject invalid transitions
 */
router.post('/:caseId/transition', async (req: AuthRequest, res: Response) => {
    try {
        const caseId = parseInt(req.params.caseId);
        const { newStage } = req.body;

        if (!newStage) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: newStage'
            });
        }

        // Attempt transition - will throw if invalid
        try {
            await WorkflowEngine.transitionStage(caseId, newStage);

            // Log successful transition
            await AuditService.log({
                action: 'WORKFLOW_TRANSITION_SUCCESS',
                entityType: 'Case',
                entityId: caseId,
                userId: req.user!.id,
                userName: req.user!.email,
                details: `Transitioned to ${newStage}`,
                ipAddress: req.ip || '127.0.0.1',
                userAgent: req.get('user-agent') || 'unknown'
            });

            res.json({
                success: true,
                message: `Case transitioned to ${newStage} stage`,
                stage: newStage
            });

        } catch (error: any) {
            // Log workflow violation attempt
            if (error.message.includes('WORKFLOW_VIOLATION') || error.message.includes('COMPLIANCE_BLOCK')) {
                await AuditService.log({
                    action: 'WORKFLOW_VIOLATION_PREVENTED',
                    entityType: 'Case',
                    entityId: caseId,
                    userId: req.user!.id,
                    userName: req.user!.email,
                    details: error.message,
                    ipAddress: req.ip || '127.0.0.1',
                    userAgent: req.get('user-agent') || 'unknown'
                });
            }

            // Return user-friendly error
            return res.status(400).json({
                success: false,
                error: error.message,
                type: error.message.includes('WORKFLOW_VIOLATION') ? 'workflow_violation' : 'compliance_block',
                compliance: true // Indicates this is a compliance enforcement, not a technical error
            });
        }

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/workflow/:caseId/allowed-actions
 * 
 * Get valid next workflow stages for a case
 * Shows "what can I do next" to guide users
 */
router.get('/:caseId/allowed-actions', async (req: AuthRequest, res: Response) => {
    try {
        const caseId = parseInt(req.params.caseId);

        const status = await WorkflowEngine.getWorkflowStatus(caseId);

        res.json({
            success: true,
            currentStage: status.currentStage,
            allowedTransitions: status.allowedTransitions,
            requiredActions: status.requiredActions,
            slaStatus: status.slaStatus
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/workflow/violations
 * 
 * Get statistics on prevented workflow violations
 * Admin only - for compliance reporting
 */
router.get('/violations', async (req: AuthRequest, res: Response) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const violationCount = await WorkflowEngine.getPreventedViolationsCount();

        // Get recent violations for display
        const AuditLog = (await import('../models/AuditLog')).default;
        const recentViolations = await AuditLog.findAll({
            where: {
                action: 'WORKFLOW_VIOLATION_PREVENTED'
            },
            order: [['timestamp', 'DESC']],
            limit: 10,
            attributes: ['id', 'userName', 'entityId', 'details', 'timestamp']
        });

        res.json({
            success: true,
            totalViolationsPrevented: violationCount,
            recentViolations: recentViolations.map(v => ({
                id: v.id,
                caseId: v.entityId,
                user: v.userName,
                reason: v.details,
                timestamp: v.timestamp
            })),
            complianceRate: '100%' // All violations were prevented
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/workflow/sop-adherence
 * 
 * Get SOP adherence metrics for compliance dashboard
 * Admin only
 */
router.get('/sop-adherence', async (req: AuthRequest, res: Response) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        // Calculate SOP adherence rate
        const totalCases = await Case.count();
        const violationsPrevented = await WorkflowEngine.getPreventedViolationsCount();

        // Get workflow statistics
        const Workflow = (await import('../models/Workflow')).default;
        const workflows = await Workflow.findAll();

        const stageDistribution = workflows.reduce((acc: any, wf: any) => {
            acc[wf.currentStage] = (acc[wf.currentStage] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            metrics: {
                totalCases,
                violationsPrevented,
                adherenceRate: '100%', // Technical enforcement = 100% adherence
                stageDistribution,
                guardrailStatus: 'ENFORCED'
            },
            message: 'Code-enforced guardrails ensure 100% SOP compliance'
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
