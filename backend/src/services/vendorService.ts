import { DCAVendor } from '../models';
import { Op } from 'sequelize';

export class VendorService {
    /**
     * Get all DCA vendors with optional filtering
     */
    async getAllVendors(filters?: {
        region?: string;
        isActive?: boolean;
    }) {
        const where: any = {};

        if (filters?.region) {
            where.region = filters.region;
        }

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        return await DCAVendor.findAll({
            where,
            order: [['vendorName', 'ASC']],
        });
    }

    /**
     * Get vendor by ID
     */
    async getVendorById(id: number) {
        return await DCAVendor.findByPk(id);
    }

    /**
     * Create new DCA vendor
     */
    async createVendor(vendorData: {
        vendorName: string;
        contactPerson: string;
        email: string;
        phone: string;
        region: string;
        commissionRules?: any;
    }) {
        return await DCAVendor.create(vendorData);
    }

    /**
     * Update vendor
     */
    async updateVendor(id: number, updateData: Partial<{
        vendorName: string;
        contactPerson: string;
        email: string;
        phone: string;
        region: string;
        commissionRules: any;
        isActive: boolean;
    }>) {
        const vendor = await DCAVendor.findByPk(id);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        return await vendor.update(updateData);
    }

    /**
     * Update vendor performance metrics (called automatically)
     */
    async updatePerformanceMetrics(vendorId: number) {
        const vendor = await DCAVendor.findByPk(vendorId, {
            include: ['cases'],
        });

        if (!vendor) {
            throw new Error('Vendor not found');
        }

        // Import here to avoid circular dependency
        const { Case, Payment } = require('../models');

        // Get total cases assigned
        const totalCasesAssigned = await Case.count({
            where: { dcaVendorId: vendorId },
        });

        // Get total collected amount
        const payments = await Payment.findAll({
            include: [{
                model: Case,
                as: 'case',
                where: { dcaVendorId: vendorId },
                attributes: [],
            }],
            where: {
                status: { [Op.in]: ['verified', 'applied'] },
            },
        });

        const totalCollected = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

        // Get resolved cases count
        const resolvedCases = await Case.count({
            where: {
                dcaVendorId: vendorId,
                status: { [Op.in]: ['resolved', 'closed'] },
            },
        });

        // Calculate success rate
        const successRate = totalCasesAssigned > 0
            ? (resolvedCases / totalCasesAssigned) * 100
            : 0;

        // Update vendor metrics
        await vendor.update({
            totalCasesAssigned,
            totalCollected,
            successRate: parseFloat(successRate.toFixed(2)),
        });

        return vendor;
    }

    /**
     * Deactivate vendor
     */
    async deactivateVendor(id: number) {
        return await this.updateVendor(id, { isActive: false });
    }
}

export default new VendorService();
