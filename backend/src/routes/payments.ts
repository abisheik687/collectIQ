import { Router, Request, Response } from 'express';
import paymentService from '../services/paymentService';
import { authMiddleware, checkPermission } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/payments
 * Submit a new payment (DCA Collector)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }

        const {
            caseId,
            utrReference,
            amount,
            currency,
            paymentDate,
            bankName,
            supportingDocs,
        } = req.body;

        // Validation
        if (!caseId || !utrReference || !amount || !paymentDate || !bankName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: case Id, utrReference, amount, paymentDate, bankName',
            });
        }

        const payment = await paymentService.submitPayment({
            caseId,
            utrReference,
            amount: parseFloat(amount),
            currency: currency || 'USD',
            paymentDate: new Date(paymentDate),
            bankName,
            submittedBy: userId,
            supportingDocs: supportingDocs || [],
        });

        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment submitted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/payments
 * Get all payments with filters
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        const {
            caseId,
            status,
            dateFrom,
            dateTo,
            limit,
            offset,
        } = req.query;

        const filters: any = {
            caseId: caseId ? parseInt(caseId as string) : undefined,
            status: status as string,
            dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo: dateTo ? new Date(dateTo as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
        };

        // DCA users should only see their own payments
        if (userRole === 'dca_collector' || userRole === 'dca_admin') {
            filters.submittedBy = userId;
        }

        const { payments, total } = await paymentService.getPayments(filters);

        res.json({
            success: true,
            data: payments,
            pagination: {
                total,
                limit: filters.limit,
                offset: filters.offset,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/payments/:id
 * Get single payment by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const payment = await paymentService.getPaymentById(parseInt(req.params.id));

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found',
            });
        }

        res.json({
            success: true,
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/payments/case/:caseId
 * Get all payments for a case
 */
router.get('/case/:caseId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const caseId = parseInt(req.params.caseId);
        const payments = await paymentService.getPaymentsByCase(caseId);

        res.json({
            success: true,
            data: payments,
            count: payments.length,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/v1/payments/:id/verify
 * Verify payment (FedEx Finance User only)
 */
router.patch('/:id/verify', authMiddleware, checkPermission('fedex_admin', 'fedex_user'), async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }

        const paymentId = parseInt(req.params.id);
        const { approve, rejectionReason } = req.body;

        if (approve === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: approve (boolean)',
            });
        }

        if (!approve && !rejectionReason) {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason is required when rejecting a payment',
            });
        }

        const payment = await paymentService.verifyPayment(
            paymentId,
            userId,
            approve,
            rejectionReason
        );

        res.json({
            success: true,
            data: payment,
            message: approve ? 'Payment verified successfully' : 'Payment rejected',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
