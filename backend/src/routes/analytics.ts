import { Router, Response } from 'express';
import { Op } from 'sequelize';
import Case from '../models/Case';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sequelize } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Recovery rate analytics
router.get('/recovery-rate', async (_req: AuthRequest, res: Response, next) => {
    try {
        const totalCases = await Case.count();
        const resolvedCases = await Case.count({ where: { status: 'resolved' } });
        const closedCases = await Case.count({ where: { status: 'closed' } });

        const totalAmount = await Case.sum('amount');
        const recoveredAmount = await Case.sum('amount', {
            where: { status: { [Op.in]: ['resolved', 'closed'] } },
        });

        const recoveryRate = totalCases > 0 ? ((resolvedCases + closedCases) / totalCases) * 100 : 0;
        const amountRecoveryRate = totalAmount > 0 ? (recoveredAmount / totalAmount) * 100 : 0;

        res.json({
            totalCases,
            resolvedCases,
            closedCases,
            recoveryRate: recoveryRate.toFixed(2),
            totalAmount,
            recoveredAmount,
            amountRecoveryRate: amountRecoveryRate.toFixed(2),
        });
    } catch (error) {
        next(error);
    }
});

// Aging bucket distribution
router.get('/aging-buckets', async (_req: AuthRequest, res: Response, next) => {
    try {
        const buckets = await sequelize.query(`
      SELECT 
        CASE 
          WHEN overdueDays <= 30 THEN '0-30 days'
          WHEN overdueDays <= 60 THEN '31-60 days'
          WHEN overdueDays <= 90 THEN '61-90 days'
          WHEN overdueDays <= 120 THEN '91-120 days'
          ELSE '120+ days'
        END as bucket,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM cases
      GROUP BY bucket
      ORDER BY MIN(overdueDays)
    `, { type: 'SELECT' });

        res.json({ buckets });
    } catch (error) {
        next(error);
    }
});

// SLA compliance metrics
router.get('/sla-compliance', async (_req: AuthRequest, res: Response, next) => {
    try {
        const onTrack = await Case.count({ where: { slaStatus: 'on_track' } });
        const warning = await Case.count({ where: { slaStatus: 'warning' } });
        const breached = await Case.count({ where: { slaStatus: 'breached' } });

        const total = onTrack + warning + breached;
        const complianceRate = total > 0 ? ((onTrack + warning) / total) * 100 : 0;

        res.json({
            onTrack,
            warning,
            breached,
            total,
            complianceRate: complianceRate.toFixed(2),
        });
    } catch (error) {
        next(error);
    }
});

// DCA performance comparison
router.get('/dca-performance', async (_req: AuthRequest, res: Response, next) => {
    try {
        const performance = await sequelize.query(`
      SELECT 
        assignedDcaName as dca_name,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved_cases,
        AVG(mlPaymentProbability) as avg_payment_probability,
        AVG(mlRiskScore) as avg_risk_score
      FROM cases
      WHERE assignedDcaId IS NOT NULL
      GROUP BY assignedDcaName
      ORDER BY resolved_cases DESC
    `, { type: 'SELECT' });

        res.json({ performance });
    } catch (error) {
        next(error);
    }
});

// Status distribution
router.get('/status-distribution', async (_req: AuthRequest, res: Response, next) => {
    try {
        const distribution = await Case.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['status'],
        });

        res.json({ distribution });
    } catch (error) {
        next(error);
    }
});

// Priority distribution
router.get('/priority-distribution', async (_req: AuthRequest, res: Response, next) => {
    try {
        const distribution = await Case.findAll({
            attributes: [
                'priority',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['priority'],
        });

        res.json({ distribution });
    } catch (error) {
        next(error);
    }
});

export default router;
