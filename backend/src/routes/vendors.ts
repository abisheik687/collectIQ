import { Router, Request, Response } from 'express';
import vendorService from '../services/vendorService';
import { authMiddleware, checkPermission } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/vendors
 * Get all DCA vendors with optional filtering
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { region, isActive } = req.query;

        const vendors = await vendorService.getAllVendors({
            region: region as string,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });

        res.json({
            success: true,
            data: vendors,
            count: vendors.length,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/vendors/:id
 * Get single vendor by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const vendor = await vendorService.getVendorById(parseInt(req.params.id));

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found',
            });
        }

        res.json({
            success: true,
            data: vendor,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/vendors
 * Create new DCA vendor (Admin only)
 */
router.post('/', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const { vendorName, contactPerson, email, phone, region, commissionRules } = req.body;

        // Validation
        if (!vendorName || !contactPerson || !email || !phone || !region) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: vendorName, contactPerson, email, phone, region',
            });
        }

        const vendor = await vendorService.createVendor({
            vendorName,
            contactPerson,
            email,
            phone,
            region,
            commissionRules,
        });

        res.status(201).json({
            success: true,
            data: vendor,
            message: 'Vendor created successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/v1/vendors/:id
 * Update vendor details (Admin only)
 */
router.patch('/:id', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const vendorId = parseInt(req.params.id);
        const updateData = req.body;

        const vendor = await vendorService.updateVendor(vendorId, updateData);

        res.json({
            success: true,
            data: vendor,
            message: 'Vendor updated successfully',
        });
    } catch (error: any) {
        if (error.message === 'Vendor not found') {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/v1/vendors/:id
 * Deactivate vendor (Admin only)
 */
router.delete('/:id', authMiddleware, checkPermission('fedex_admin'), async (req: Request, res: Response) => {
    try {
        const vendorId = parseInt(req.params.id);

        await vendorService.deactivateVendor(vendorId);

        res.json({
            success: true,
            message: 'Vendor deactivated successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/vendors/:id/refresh-metrics
 * Manually refresh vendor performance metrics
 */
router.post('/:id/refresh-metrics', authMiddleware, async (req: Request, res: Response) => {
    try {
        const vendorId = parseInt(req.params.id);
        const vendor = await vendorService.updatePerformanceMetrics(vendorId);

        res.json({
            success: true,
            data: vendor,
            message: 'Performance metrics updated',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
