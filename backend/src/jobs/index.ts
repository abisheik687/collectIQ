import { logger } from '../utils/logger';
import { startReconciliationJob } from './reconciliationJob';
import { startCommissionJob } from './commissionJob';
import { startSLAMonitorJob } from './slaMonitorJob';

/**
 * Initialize all scheduled jobs
 */
export const initializeJobs = () => {
    logger.info('Initializing scheduled jobs...');

    try {
        // Start all jobs
        startReconciliationJob();
        startCommissionJob();
        startSLAMonitorJob();

        logger.info('All scheduled jobs initialized successfully', {
            jobs: [
                { name: 'monthly-reconciliation', schedule: '1st of month at 2:00 AM' },
                { name: 'monthly-commission', schedule: '2nd of month at 3:00 AM' },
                { name: 'sla-monitor', schedule: 'Every hour' },
            ],
        });
    } catch (error: any) {
        logger.error('Failed to initialize scheduled jobs', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};
