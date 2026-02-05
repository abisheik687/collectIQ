import { Router, Request, Response } from 'express';
import reconciliationService from '../services/reconciliationService';
import { authMiddleware, checkPermission } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/reconciliation
 * Trigger reconciliation
 */
router.post('/', authMiddleware, checkPermission('fedex_admin', 'fedex_user'), async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { periodEnd } = req.body;
        if (!periodEnd) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: periodEnd',
            });
        }

        const reconciliation = await reconciliationService.runReconciliation(
            new Date(periodEnd),
            userId
        );

        res.status(201).json({
            success: true,
            data: reconciliation,
            message: 'Reconciliation completed successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/reconciliation
 * Get all reconciliations
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const reconciliations = await reconciliationService.getReconciliations();

        res.json({
            success: true,
            data: reconciliations,
            count: reconciliations.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/reconciliation/:id
 * Get reconciliation details with items
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const reconciliation = await reconciliationService.getReconciliationById(parseInt(req.params.id));

        if (!reconciliation) {
            return res.status(404).json({
                success: false,
                error: 'Reconciliation not found',
            });
        }

        res.json({
            success: true,
            data: reconciliation,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/reconciliation/:id/exceptions
 * Get exceptions for a reconciliation
 */
router.get('/:id/exceptions', authMiddleware, async (req: Request, res: Response) => {
    try {
        const exceptions = await reconciliationService.getExceptions(parseInt(req.params.id));

        res.json({
            success: true,
            data: exceptions,
            count: exceptions.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
