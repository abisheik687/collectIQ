import { Router, Response } from 'express';
import Communication from '../models/Communication';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get communications for a case
router.get('/case/:caseId', async (req: AuthRequest, res: Response, next) => {
    try {
        const communications = await Communication.findAll({
            where: { caseId: req.params.caseId },
            order: [['createdAt', 'DESC']],
        });

        res.json({ communications });
    } catch (error) {
        next(error);
    }
});

// Send communication (simulated)
router.post('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            caseId,
            channel,
            templateId,
            subject,
            content,
            recipientEmail,
            recipientPhone,
        } = req.body;

        // Create communication record
        const communication = await Communication.create({
            caseId,
            channel,
            templateId,
            subject,
            content,
            recipientEmail,
            recipientPhone,
            status: 'sent', // Simulated immediate send
            sentAt: new Date(),
            deliveredAt: new Date(), // Simulated immediate delivery
            createdBy: req.user!.id,
        });

        res.status(201).json({ communication });
    } catch (error) {
        next(error);
    }
});

export default router;
