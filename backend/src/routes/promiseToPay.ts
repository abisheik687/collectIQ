import { Router, Request, Response } from 'express';
import promiseToPayService from '../services/promiseToPayService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/promise-to-pay
 * Create a promise to pay
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { caseId, promisedAmount, promisedDate, customerRemarks } = req.body;

        if (!caseId || !promisedAmount || !promisedDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: caseId, promisedAmount, promisedDate',
            });
        }

        const promise = await promiseToPayService.createPromise({
            caseId,
            promisedAmount: parseFloat(promisedAmount),
            promisedDate: new Date(promisedDate),
            createdBy: userId,
            customerRemarks,
        });

        res.status(201).json({
            success: true,
            data: promise,
            message: 'Promise to pay created successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/promise-to-pay
 * Get all promises
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { caseId, status } = req.query;

        const promises = await promiseToPayService.getPromises({
            caseId: caseId ? parseInt(caseId as string) : undefined,
            status: status as string,
        });

        res.json({
            success: true,
            data: promises,
            count: promises.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/promise-to-pay/:id
 * Get promise by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const promise = await promiseToPayService.getPromiseById(parseInt(req.params.id));

        if (!promise) {
            return res.status(404).json({
                success: false,
                error: 'Promise not found',
            });
        }

        res.json({
            success: true,
            data: promise,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/promise-to-pay/:id
 * Update promise status
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: status',
            });
        }

        const promise = await promiseToPayService.updatePromise(parseInt(req.params.id), status);

        res.json({
            success: true,
            data: promise,
            message: 'Promise updated successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
