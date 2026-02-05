import { Case, DCAVendor, User } from '../models';
import { Op } from 'sequelize';

export class AssignmentService {
    /**
     * AI-powered case assignment to DCA vendors
     * Uses ML scores and vendor performance to optimize assignments
     */
    async assignCasesToVendor(caseIds: number[], forceVendorId?: number) {
        const cases = await Case.findAll({
            where: { id: { [Op.in]: caseIds } },
        });

        if (cases.length === 0) {
            throw new Error('No cases found');
        }

        const results = [];

        for (const caseRecord of cases) {
            let selectedVendor;

            if (forceVendorId) {
                // Manual assignment
                selectedVendor = await DCAVendor.findByPk(forceVendorId);
                if (!selectedVendor) {
                    throw new Error(`Vendor ${forceVendorId} not found`);
                }
            } else {
                // AI-powered assignment
                selectedVendor = await this.selectOptimalVendor(caseRecord);
            }

            // Calculate SLA due date based on case priority
            const slaDueDate = this.calculateSLA(caseRecord.priority);

            // Assign case to vendor
            await caseRecord.update({
                dcaVendorId: selectedVendor.id,
                status: 'assigned',
                slaDueDate,
            });

            // Update vendor stats
            await selectedVendor.increment('totalCasesAssigned');

            results.push({
                caseId: caseRecord.id,
                caseNumber: caseRecord.caseNumber,
                assignedVendor: selectedVendor.vendorName,
                vendorId: selectedVendor.id,
                slaDueDate,
            });
        }

        return results;
    }

    /**
     * Select optimal DCA vendor using AI/ML logic
     */
    private async selectOptimalVendor(caseRecord: any): Promise<any> {
        // Get all active vendors
        const vendors = await DCAVendor.findAll({
            where: { isActive: true },
        });

        if (vendors.length === 0) {
            throw new Error('No active vendors available');
        }

        // Scoring algorithm
        const scoredVendors = vendors.map(vendor => {
            let score = 0;

            // Factor 1: ML Payment Probability (40% weight)
            const paymentProb = caseRecord.mlPaymentProbability || 0.5;
            score += paymentProb * 40;

            // Factor 2: Vendor Success Rate (30% weight)
            const successRate = parseFloat(vendor.successRate.toString()) / 100;
            score += successRate * 30;

            // Factor 3: Workload Balancing (20% weight)
            // Prefer vendors with fewer assigned cases
            const workloadScore = Math.max(0, 100 - vendor.totalCasesAssigned);
            score += (workloadScore / 100) * 20;

            // Factor 4: Case Amount vs Vendor Tier Match (10% weight)
            const caseAmount = parseFloat(caseRecord.amount.toString());
            const tierMatch = this.calculateTierMatch(caseAmount, vendor.commissionRules);
            score += tierMatch * 10;

            return {
                vendor,
                score,
            };
        });

        // Sort by score descending
        scoredVendors.sort((a, b) => b.score - a.score);

        // Return top vendor
        return scoredVendors[0].vendor;
    }

    /**
     * Calculate how well case amount matches vendor's commission tiers
     */
    private calculateTierMatch(caseAmount: number, commissionRules: any): number {
        const tiers = commissionRules.tiers || [];

        for (let i = 0; i < tiers.length; i++) {
            const tier = tiers[i];
            if (tier.max === null || caseAmount < tier.max) {
                // Higher tier = better match (incentivize higher commission rates for higher amounts)
                return ((i + 1) / tiers.length) * 100;
            }
        }

        return 50; // Default if no match
    }

    /**
     * Calculate SLA due date based on priority
     */
    private calculateSLA(priority: string): Date {
        const now = new Date();
        let daysToAdd = 30; // Default

        switch (priority) {
            case 'high':
                daysToAdd = 7;
                break;
            case 'medium':
                daysToAdd = 14;
                break;
            case 'low':
                daysToAdd = 30;
                break;
        }

        return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    /**
     * Reassign case to different vendor
     */
    async reassignCase(caseId: number, newVendorId: number, reason?: string) {
        const caseRecord = await Case.findByPk(caseId);
        if (!caseRecord) {
            throw new Error('Case not found');
        }

        const oldVendorId = caseRecord.dcaVendorId;

        // Assign to new vendor
        await this.assignCasesToVendor([caseId], newVendorId);

        // Decrement old vendor's count if exists
        if (oldVendorId) {
            const oldVendor = await DCAVendor.findByPk(oldVendorId);
            if (oldVendor) {
                await oldVendor.decrement('totalCasesAssigned');
            }
        }

        return {
            caseId,
            oldVendorId,
            newVendorId,
            reason,
        };
    }

    /**
     * Assign case to specific collector within a vendor
     */
    async assignToCollector(caseId: number, collectorUserId: number) {
        const caseRecord = await Case.findByPk(caseId);
        if (!caseRecord) {
            throw new Error('Case not found');
        }

        const collector = await User.findByPk(collectorUserId);
        if (!collector) {
            throw new Error('Collector not found');
        }

        // Verify collector belongs to the case's DCA vendor
        if (caseRecord.dcaVendorId !== collector.dcaVendorId) {
            throw new Error('Collector does not belong to the assigned DCA vendor');
        }

        await caseRecord.update({
            assignedToUser: collectorUserId,
        });

        return caseRecord;
    }
}

export default new AssignmentService();
