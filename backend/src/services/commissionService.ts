import { Commission, DCAVendor, Payment, Case } from '../models';
import { Op } from 'sequelize';

export class CommissionService {
    /**
     * Calculate commission for a DCA vendor for a given period
     */
    async calculateCommission(dcaVendorId: number, periodStart: Date, periodEnd: Date) {
        // Get vendor with commission rules
        const vendor = await DCAVendor.findByPk(dcaVendorId);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        // Get all verified payments for this vendor in the period
        const payments = await Payment.findAll({
            where: {
                status: { [Op.in]: ['verified', 'applied'] },
                verifiedAt: {
                    [Op.between]: [periodStart, periodEnd],
                },
            },
            include: [{
                model: Case,
                as: 'case',
                where: {
                    dcaVendorId,
                },
                attributes: ['id', 'caseNumber', 'accountNumber'],
            }],
        });

        if (payments.length === 0) {
            throw new Error('No verified payments found for this period');
        }

        // Calculate tiered commission
        const commissionRules = vendor.commissionRules as {
            tiers: Array<{
                min: number;
                max: number | null;
                rate: number;
            }>;
        };

        const breakdown: Array<{
            tier: string;
            paymentsCount: number;
            amount: number;
            rate: number;
            commission: number;
        }> = [];

        const tiers = commissionRules.tiers.sort((a, b) => a.min - b.min);

        // Group payments by tier
        for (const tier of tiers) {
            const tierPayments = payments.filter(p => {
                const amt = parseFloat(p.amount.toString());
                if (tier.max === null) {
                    return amt >= tier.min;
                }
                return amt >= tier.min && amt < tier.max;
            });

            if (tierPayments.length > 0) {
                const tierAmount = tierPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
                const tierCommission = tierAmount * tier.rate;

                breakdown.push({
                    tier: tier.max === null
                        ? `$${tier.min.toLocaleString()}+`
                        : `$${tier.min.toLocaleString()} - $${tier.max.toLocaleString()}`,
                    paymentsCount: tierPayments.length,
                    amount: tierAmount,
                    rate: tier.rate,
                    commission: tierCommission,
                });
            }
        }

        // Calculate totals
        const totalCollected = breakdown.reduce((sum, b) => sum + b.amount, 0);
        const totalCommission = breakdown.reduce((sum, b) => sum + b.commission, 0);
        const blendedRate = totalCollected > 0 ? totalCommission / totalCollected : 0;

        // Check if commission record already exists for this period
        const existing = await Commission.findOne({
            where: {
                dcaVendorId,
                periodStart,
                periodEnd,
            },
        });

        let commission;
        if (existing) {
            // Update existing
            commission = await existing.update({
                totalCollected,
                commissionRate: blendedRate,
                commissionAmount: totalCommission,
                calculationDetails: { breakdown },
                status: 'calculated',
            });
        } else {
            // Create new
            commission = await Commission.create({
                dcaVendorId,
                periodStart,
                periodEnd,
                totalCollected,
                commissionRate: blendedRate,
                commissionAmount: totalCommission,
                calculationDetails: { breakdown },
                status: 'calculated',
            });
        }

        // Auto-approve if below threshold (e.g., $50,000)
        if (totalCommission < 50000) {
            await commission.update({ status: 'approved' });
        }

        return commission;
    }

    /**
     * Get all commissions with filters
     */
    async getCommissions(filters?: {
        dcaVendorId?: number;
        status?: string;
        periodStart?: Date;
        periodEnd?: Date;
    }) {
        const where: any = {};

        if (filters?.dcaVendorId) {
            where.dcaVendorId = filters.dcaVendorId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.periodStart) {
            where.periodStart = { [Op.gte]: filters.periodStart };
        }

        if (filters?.periodEnd) {
            where.periodEnd = { [Op.lte]: filters.periodEnd };
        }

        return await Commission.findAll({
            where,
            include: [{ model: DCAVendor, as: 'dcaVendor' }],
            order: [['periodEnd', 'DESC']],
        });
    }

    /**
     * Get commission by ID
     */
    async getCommissionById(id: number) {
        return await Commission.findByPk(id, {
            include: [{ model: DCAVendor, as: 'dcaVendor' }],
        });
    }

    /**
     * Approve commission payout
     */
    async approveCommission(id: number) {
        const commission = await Commission.findByPk(id);
        if (!commission) {
            throw new Error('Commission not found');
        }

        // Set payout date to 15th of next month
        const nextMonth = new Date(commission.periodEnd);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(15);

        await commission.update({
            status: 'approved',
            payoutDate: nextMonth,
        });

        return commission;
    }

    /**
     * Mark commission as paid
     */
    async markAsPaid(id: number) {
        const commission = await Commission.findByPk(id);
        if (!commission) {
            throw new Error('Commission not found');
        }

        await commission.update({
            status: 'paid',
        });

        return commission;
    }

    /**
     * Calculate commissions for all vendors for a period (scheduled job)
     */
    async calculateAllVendorCommissions(periodStart: Date, periodEnd: Date) {
        const vendors = await DCAVendor.findAll({
            where: { isActive: true },
        });

        const results = [];

        for (const vendor of vendors) {
            try {
                const commission = await this.calculateCommission(vendor.id, periodStart, periodEnd);
                results.push({
                    vendorId: vendor.id,
                    vendorName: vendor.vendorName,
                    success: true,
                    commission,
                });
            } catch (error: any) {
                results.push({
                    vendorId: vendor.id,
                    vendorName: vendor.vendorName,
                    success: false,
                    error: error.message,
                });
            }
        }

        return results;
    }
}

export default new CommissionService();
