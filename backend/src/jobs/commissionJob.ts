import { RecurrenceRule, scheduleJob } from 'node-schedule';
import commissionService from '../services/commissionService';
import { logger } from '../utils/logger';

/**
 * Automated Monthly Commission Calculation Job
 * Runs on the 2nd of every month at 3:00 AM (after reconciliation)
 */
export const startCommissionJob = () => {
    // Schedule: Run on 2nd of every month at 3:00 AM
    const rule = new RecurrenceRule();
    rule.date = 2;
    rule.hour = 3;
    rule.minute = 0;

    const job = scheduleJob('monthly-commission', rule, async () => {
        logger.info('Starting automated monthly commission calculation job');

        try {
            // Calculate for previous month
            const now = new Date();
            const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
            const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1); // First day of previous month

            // Calculate commissions for all vendors
            const results = await commissionService.calculateAllVendorCommissions(periodStart, periodEnd);

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            logger.info('Monthly commission calculation completed', {
                total: results.length,
                successful,
                failed,
                period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
            });

            // Log failures
            results.filter(r => !r.success).forEach(result => {
                logger.error('Commission calculation failed for vendor', {
                    vendorId: result.vendorId,
                    vendorName: result.vendorName,
                    error: result.error,
                });
            });

            // Log high-value commissions requiring approval
            results.filter(r => r.success && r.commission.commissionAmount >= 50000).forEach(result => {
                logger.warn('High-value commission requires approval', {
                    vendorId: result.vendorId,
                    vendorName: result.vendorName,
                    amount: result.commission.commissionAmount,
                    commissionId: result.commission.id,
                });
            });
        } catch (error: any) {
            logger.error('Monthly commission calculation job failed', {
                error: error.message,
                stack: error.stack,
            });
        }
    });

    logger.info('Monthly commission calculation job scheduled - runs on 2nd of each month at 3:00 AM');
    return job;
};

/**
 * Manual commission calculation trigger (for testing)
 */
export const triggerCommissionCalculationNow = async () => {
    logger.info('Manual commission calculation triggered');

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);

    const results = await commissionService.calculateAllVendorCommissions(periodStart, periodEnd);
    return results;
};
