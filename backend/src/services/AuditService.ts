import AuditLog from '../models/AuditLog';
import { logger } from '../utils/logger';

export interface AuditData {
    action: string;
    entityType: string;
    entityId: number | string;  // Allow string for case IDs
    userId: number | null;  // Allow null for system actions
    userName: string;
    beforeState?: any;
    afterState?: any;
    ipAddress?: string;
    userAgent?: string;
}

class AuditServiceClass {
    async log(data: AuditData): Promise<void> {
        try {
            await AuditLog.create({
                ...data,
                timestamp: new Date(),
            });
        } catch (error) {
            logger.error('Failed to create audit log:', error);
            // Don't throw - audit logging should not break the main flow
        }
    }

    async getAuditTrail(filters: {
        entityType?: string;
        entityId?: number;
        userId?: number;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ logs: any[]; total: number }> {
        const where: any = {};

        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.entityId) where.entityId = filters.entityId;
        if (filters.userId) where.userId = filters.userId;

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) where.timestamp.$gte = filters.startDate;
            if (filters.endDate) where.timestamp.$lte = filters.endDate;
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
            order: [['timestamp', 'DESC']],
        });

        return {
            logs: rows,
            total: count,
        };
    }

    async exportAuditTrail(filters: any): Promise<string> {
        const { logs } = await this.getAuditTrail({ ...filters, limit: 10000 });

        // Simple CSV export
        const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'IP Address'];
        const rows = logs.map(log => [
            log.timestamp.toISOString(),
            log.action,
            log.entityType,
            log.entityId,
            log.userName,
            log.ipAddress || 'N/A',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        return csv;
    }
}

// Export singleton instance
export const AuditService = new AuditServiceClass();
export default AuditService;
