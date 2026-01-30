import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import CommunicationService from '../services/CommunicationService';
import Case from '../models/Case';
import AuditService from '../services/AuditService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/cases/:id/communicate
 * Send email or SMS to customer
 */
router.post('/:id/communicate', async (req: AuthRequest, res: Response, next) => {
    try {
        const caseId = parseInt(req.params.id);
        const { type, template, recipient } = req.body;

        // Get case details for variables
        const caseRecord = await Case.findByPk(caseId);
        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        // Check access (DCA can only communicate on assigned cases)
        if (req.user!.role === 'dca' && caseRecord.assignedDcaId !== req.user!.id) {
            throw new AppError('Access denied', 403);
        }

        // Prepare template variables
        const variables = {
            customerName: caseRecord.customerName,
            accountNumber: caseRecord.accountNumber,
            caseNumber: caseRecord.caseNumber,
            amount: caseRecord.amount.toLocaleString(),
            overdueDays: caseRecord.overdueDays,
            dcaName: caseRecord.assignedDcaName || 'CollectIQ',
            dueDate: new Date(Date.now() - caseRecord.overdueDays * 24 * 60 * 60 * 1000).toLocaleDateString(),
        };

        let communication;

        if (type === 'email') {
            communication = await CommunicationService.sendEmail({
                caseId,
                template,
                recipient: recipient || caseRecord.customerEmail || '',
                subject: '', // Will be generated from template
                variables,
                sentBy: req.user!.id,
                sentByName: req.user!.name,
            });
        } else if (type === 'sms') {
            communication = await CommunicationService.sendSMS({
                caseId,
                template,
                recipient: recipient || caseRecord.customerPhone || '',
                variables,
                sentBy: req.user!.id,
                sentByName: req.user!.name,
            });
        } else {
            throw new AppError('Invalid communication type', 400);
        }

        // Audit log
        await AuditService.log({
            action: 'SEND_COMMUNICATION',
            entityType: 'Communication',
            entityId: communication.id,
            userId: req.user!.id,
            userName: req.user!.name,
            afterState: {
                type,
                template,
                recipient,
                caseId,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({
            success: true,
            communication,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cases/:id/communications
 * Get communication history for a case
 */
router.get('/:id/communications', async (req: AuthRequest, res: Response, next) => {
    try {
        const caseId = parseInt(req.params.id);

        // Get case to check access
        const caseRecord = await Case.findByPk(caseId);
        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        // Check access
        if (req.user!.role === 'dca' && caseRecord.assignedDcaId !== req.user!.id) {
            throw new AppError('Access denied', 403);
        }

        const communications = await CommunicationService.getCommunicationHistory(caseId);

        res.json({
            communications,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/communication/templates
 * Get available email and SMS templates
 */
router.get('/templates', async (req: AuthRequest, res: Response, next) => {
    try {
        const templates = CommunicationService.getAvailableTemplates();
        res.json({ templates });
    } catch (error) {
        next(error);
    }
});

export default router;
