/**
 * Email Communication Routes (Gmail Integration)
 * 
 * Controlled email execution via Gmail adapter with full compliance gating
 * 
 * SECURITY:
 * - All emails require prior AI compliance token
 * - 5-gate validation performed before send
 * - All attempts audit logged
 * - No automatic retries or loops
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CommunicationOrchestrator } from '../services/CommunicationOrchestrator';
import { GracePeriodManager } from '../services/GracePeriodManager';

const router = Router();
const orchestrator = new CommunicationOrchestrator();
const gracePeriodManager = new GracePeriodManager();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/email/send
 * 
 * Send approved email via Gmail
 * Requires: AI compliance decision token
 */
router.post('/send', async (req: AuthRequest, res: Response, next) => {
    try {
        const { caseId, recipientEmail, subject, body, complianceToken, caseData, aiDecision, complianceStatus, ethicalRiskScore } = req.body;

        if (!caseId || !recipientEmail || !subject || !body || !complianceToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Execute via orchestrator (performs all 5 gate validation)
        const result = await orchestrator.executeApprovedAction(
            caseId,
            caseData || { id: caseId, consentStatus: 'all' },
            {
                action: 'send_email',
                channel: 'email',
                recipientEmail,
                subject,
                body
            },
            {
                decision: aiDecision || 'ALLOWED',
                complianceStatus: complianceStatus || 'PASSED',
                ethicalRiskScore: ethicalRiskScore || 0,
                complianceToken
            },
            req.user!.id
        );

        if (result.success) {
            res.json({
                success: true,
                messageId: result.messageId,
                sentAt: result.sentAt,
                gracePeriodDays: 7,
                nextAllowedContactDate: result.nextAllowedContactDate
            });
        } else {
            res.json({
                success: false,
                blocked: result.blocked,
                reason: result.blockReason,
                nextAllowedContactDate: result.nextAllowedContactDate
            });
        }

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/email/grace-period/:caseId
 * 
 * Check grace period status
 */
router.get('/grace-period/:caseId', async (req: AuthRequest, res: Response, next) => {
    try {
        const status = await gracePeriodManager.getGracePeriodStatus(req.params.caseId);

        res.json({
            caseId: req.params.caseId,
            channels: status
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/email/escalation-check/:caseId
 * 
 * Check escalation eligibility (does NOT trigger escalation)
 */
router.get('/escalation-check/:caseId', async (req: AuthRequest, res: Response, next) => {
    try {
        const caseData = {
            id: req.params.caseId,
            status: req.query.status as string || 'assigned',
            responseHistory: req.query.responseHistory as string || 'no_contact_yet',
            vulnerabilityFlag: req.query.vulnerabilityFlag === 'true'
        };

        const escalationCheck = await gracePeriodManager.checkEscalationEligibility(caseData);

        res.json({
            caseId: req.params.caseId,
            eligible: escalationCheck.eligible,
            conditions: escalationCheck.conditions,
            recommendedAction: escalationCheck.eligible ? 'escalate_to_dca' : 'maintain_current_status',
            requiresApproval: true
        });

    } catch (error) {
        next(error);
    }
});

export default router;
