import { RecurrenceRule, scheduleJob } from 'node-schedule';
import reconciliationService from '../services/reconciliationService';
import { logger } from '../utils/logger';

/**
 * Automated Monthly Reconciliation Job
 * Runs on the 1st of every month at 2:00 AM
 */
export const startReconciliationJob = () => {
    // Schedule: Run on 1st of every month at 2:00 AM
    const rule = new RecurrenceRule();
    rule.date = 1;
    rule.hour = 2;
    rule.minute = 0;

    const job = scheduleJob('monthly-reconciliation', rule, async () => {
        logger.info('Starting automated monthly reconciliation job');

        try {
            // Get last month's end date
            const now = new Date();
            const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month

            // Run reconciliation (system user ID: 1)
            const result = await reconciliationService.runReconciliation(periodEnd, 1);

            logger.info('Monthly reconciliation completed successfully', {
                reconciliationId: result.id,
                matchedCount: result.matchedCount,
                exceptionCount: result.exceptionCount,
                totalAmount: result.totalMatchedAmount,
            });

            // If there are exceptions, send notification (future enhancement)
            if (result.exceptionCount > 0) {
                logger.warn(`Reconciliation has ${result.exceptionCount} exceptions requiring review`, {
                    reconciliationId: result.id,
                });
            }
        } catch (error: any) {
            logger.error('Monthly reconciliation job failed', {
                error: error.message,
                stack: error.stack,
            });
        }
    });

    logger.info('Monthly reconciliation job scheduled - runs on 1st of each month at 2:00 AM');
    return job;
};

/**
 * Manual reconciliation trigger (for testing)
 */
export const triggerReconciliationNow = async () => {
    logger.info('Manual reconciliation triggered');

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const result = await reconciliationService.runReconciliation(periodEnd, 1);
    return result;
};
