import { scheduleJob } from 'node-schedule';
import ticketService from '../services/ticketService';
import { logger } from '../utils/logger';

/**
 * SLA Monitoring Job
 * Runs every hour to check for overdue tickets and cases
 */
export const startSLAMonitorJob = () => {
    // Schedule: Run every hour at minute 0
    const rule = '0 * * * *'; // Cron format: Every hour at 0 minutes

    const job = scheduleJob('sla-monitor', rule, async () => {
        logger.info('Starting SLA monitoring job');

        try {
            // Get overdue tickets
            const overdueTickets = await ticketService.getOverdueTickets();

            if (overdueTickets.length > 0) {
                logger.warn(`Found ${overdueTickets.length} overdue tickets (SLA breached)`, {
                    count: overdueTickets.length,
                    tickets: overdueTickets.map(t => ({
                        id: t.id,
                        subject: t.subject,
                        priority: t.priority,
                        dueDate: t.dueDate,
                        hoursOverdue: Math.floor((Date.now() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60)),
                    })),
                });

                // Future enhancement: Send notifications to assignees
                // Future enhancement: Escalate urgent overdue tickets
            } else {
                logger.info('No overdue tickets found - all SLAs are being met');
            }

            // TODO: Check for overdue cases (similar logic)
            // const overdueCases = await Case.findAll({ where: { slaDueDate: { $lt: new Date() } } });

        } catch (error: any) {
            logger.error('SLA monitoring job failed', {
                error: error.message,
                stack: error.stack,
            });
        }
    });

    logger.info('SLA monitoring job scheduled - runs every hour');
    return job;
};

/**
 * Manual SLA check trigger (for testing)
 */
export const triggerSLACheckNow = async () => {
    logger.info('Manual SLA check triggered');

    const overdueTickets = await ticketService.getOverdueTickets();
    return {
        overdueTickets,
        count: overdueTickets.length,
    };
};
