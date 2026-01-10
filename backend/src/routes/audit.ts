import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import AuditService from '../services/AuditService';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get audit logs
router.get('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            entityType,
            entityId,
            userId,
            startDate,
            endDate,
            page = '1',
            limit = '50',
        } = req.query;

        const filters: any = {
            limit: parseInt(limit as string),
            offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        };

        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = parseInt(entityId as string);
        if (userId) filters.userId = parseInt(userId as string);
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const { logs, total } = await AuditService.getAuditTrail(filters);

        res.json({
            logs,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Export audit logs as CSV
router.get('/export', async (req: AuthRequest, res: Response, next) => {
    try {
        const { entityType, entityId, userId, startDate, endDate } = req.query;

        const filters: any = {};
        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = parseInt(entityId as string);
        if (userId) filters.userId = parseInt(userId as string);
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const csv = await AuditService.exportAuditTrail(filters);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-trail.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
});

export default router;
