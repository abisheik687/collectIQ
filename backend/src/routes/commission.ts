import { Router, Request, Response } from 'express';
import commissionService from '../services/commissionService';
import { authMiddleware, checkPermission } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/commission/calculate
 * Calculate commission for a vendor and period
 */
router.post('/calculate', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const { dcaVendorId, periodStart, periodEnd } = req.body;

        if (!dcaVendorId || !periodStart || !periodEnd) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: dcaVendorId, periodStart, periodEnd',
            });
        }

        const commission = await commissionService.calculateCommission(
            parseInt(dcaVendorId),
            new Date(periodStart),
            new Date(periodEnd)
        );

        res.status(201).json({
            success: true,
            data: commission,
            message: 'Commission calculated successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/commission/calculate-all
 * Calculate commissions for all vendors for a period
 */
router.post('/calculate-all', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const { periodStart, periodEnd } = req.body;

        if (!periodStart || !periodEnd) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: periodStart, periodEnd',
            });
        }

        const results = await commissionService.calculateAllVendorCommissions(
            new Date(periodStart),
            new Date(periodEnd)
        );

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            data: results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: results.length - successCount,
            },
            message: `Calculated commissions for ${successCount} out of ${results.length} vendors`,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/commission
 * Get all commissions with filters
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { dcaVendorId, status, periodStart, periodEnd } = req.query;

        const commissions = await commissionService.getCommissions({
            dcaVendorId: dcaVendorId ? parseInt(dcaVendorId as string) : undefined,
            status: status as string,
            periodStart: periodStart ? new Date(periodStart as string) : undefined,
            periodEnd: periodEnd ? new Date(periodEnd as string) : undefined,
        });

        res.json({
            success: true,
            data: commissions,
            count: commissions.length,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/commission/:id
 * Get single commission by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const commission = await commissionService.getCommissionById(parseInt(req.params.id));

        if (!commission) {
            return res.status(404).json({
                success: false,
                error: 'Commission not found',
            });
        }

        res.json({
            success: true,
            data: commission,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/v1/commission/:id/approve
 * Approve commission payout
 */
router.patch('/:id/approve', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const commission = await commissionService.approveCommission(parseInt(req.params.id));

        res.json({
            success: true,
            data: commission,
            message: 'Commission approved successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/v1/commission/:id/mark-paid
 * Mark commission as paid
 */
router.patch('/:id/mark-paid', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const commission = await commissionService.markAsPaid(parseInt(req.params.id));

        res.json({
            success: true,
            data: commission,
            message: 'Commission marked as paid',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
