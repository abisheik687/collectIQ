/**
 * Admin Governance API Routes
 * 
 * Endpoints for:
 * - Multi-format report exports (PDF, Word, CSV)
 * - BPI rankings and DCA performance
 * - Workload visibility and analytics
 * 
 * SECURITY: Admin role required for all routes
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ReportExportService } from '../services/ReportExportService';
import { BPICalculator } from '../services/BPICalculator';
import { WorkloadAnalytics } from '../services/WorkloadAnalytics';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();
const reportService = new ReportExportService();
const bpiCalculator = new BPICalculator();
const workloadAnalytics = new WorkloadAnalytics();
import AutoAssignmentService from '../services/AutoAssignmentService';
import AuditService from '../services/AuditService';

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/admin/reports/export
 * 
 * Generate report in requested format
 * Requires: Admin role
 */
router.post('/reports/export', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const { reportType, format, dateRange, filters, includeDetails } = req.body;

        if (!reportType || !format || !dateRange) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: reportType, format, dateRange'
            });
        }

        // Generate report
        const result = await reportService.generateReport(
            {
                reportType,
                format,
                dateRange: {
                    startDate: new Date(dateRange.startDate),
                    endDate: new Date(dateRange.endDate)
                },
                filters,
                includeDetails
            },
            req.user!.email
        );

        // Log export action
        await reportService.logExportAction(
            req.user!.id,
            req.user!.email,
            result.metadata,
            req.ip || '127.0.0.1'
        );

        res.json(result);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/reports/download/:filename
 * 
 * Download generated report
 */
router.get('/reports/download/:filename', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../exports', filename);

        // Security: Prevent directory traversal
        if (!filePath.startsWith(path.join(__dirname, '../../exports'))) {
            return res.status(403).json({
                success: false,
                error: 'Invalid file path'
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Report not found or expired'
            });
        }

        // Set appropriate content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: { [key: string]: string } = {
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/performance/bpi
 * 
 * Get BPI rankings for period
 * Query params: startDate, endDate, topN (default 5)
 */
router.get('/performance/bpi', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        const topN = req.query.topN ? parseInt(req.query.topN as string) : 5;

        const rankings = await bpiCalculator.rankDCAs(startDate, endDate, topN);

        res.json({
            success: true,
            period: { startDate, endDate },
            rankings
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/performance/dca/:id
 * 
 * Get individual DCA performance
 */
router.get('/performance/dca/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const dcaId = parseInt(req.params.id);
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

        // DCAs can view their own performance, admins can view any
        if (req.user!.role !== 'enterprise' && req.user!.id !== dcaId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const dcaName = req.user!.name || `DCA-${dcaId}`;
        const performance = await bpiCalculator.getDCAPerformance(dcaId, dcaName, startDate, endDate);

        res.json({
            success: true,
            performance
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/workload/summary
 * 
 * Get aggregate workload summary
 */
router.get('/workload/summary', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const summary = await workloadAnalytics.getWorkloadSummary();

        res.json({
            success: true,
            summary
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/workload/dcas
 * 
 * Get detailed DCA workload distribution
 */
router.get('/workload/dcas', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const workloads = await workloadAnalytics.getDCAWorkloads();

        res.json({
            success: true,
            workloads
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/workload/sla-risk
 * 
 * Get SLA risk distribution
 */
router.get('/workload/sla-risk', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const distribution = await workloadAnalytics.getSLARiskDistribution();

        res.json({
            success: true,
            distribution
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/workload/recommendations
 * 
 * Get rebalancing recommendations
 */
router.get('/workload/recommendations', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        const recommendations = await workloadAnalytics.getRebalancingRecommendations();

        res.json({
            success: true,
            recommendations
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/auto-assign
 * 
 * Auto-assign all unassigned cases to DCAs using AI algorithm
 * Requires: Admin role
 */
router.post('/auto-assign', async (req: AuthRequest, res: Response, next) => {
    try {
        // Check admin role
        if (req.user!.role !== 'enterprise') {
            return res.status(403).json({
                success: false,
                error: 'Admin role required'
            });
        }

        // Run auto-assignment
        const result = await AutoAssignmentService.assignUnassignedCases();

        // Audit log
        await AuditService.log({
            action: 'AUTO_ASSIGN_CASES',
            entityType: 'Case',
            entityId: null as any,
            userId: req.user!.id,
            userName: req.user!.name,
            afterState: {
                assigned: result.assigned,
                unassigned: result.unassigned,
                dcaDistribution: result.assignments.reduce((acc: any, a) => {
                    acc[a.dcaName] = (acc[a.dcaName] || 0) + 1;
                    return acc;
                }, {})
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
});

export default router;
