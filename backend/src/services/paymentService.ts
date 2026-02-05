import { Payment, Case, User } from '../models';
import { Op } from 'sequelize';

export class PaymentService {
    /**
     * Submit a new payment (DCA Collector)
     */
    async submitPayment(paymentData: {
        caseId: number;
        utrReference: string;
        amount: number;
        currency?: string;
        paymentDate: Date;
        bankName: string;
        submittedBy: number;
        supportingDocs?: any[];
    }) {
        // Validate case exists
        const caseRecord = await Case.findByPk(paymentData.caseId);
        if (!caseRecord) {
            throw new Error('Case not found');
        }

        // Check for duplicate UTR
        const existing = await Payment.findOne({
            where: { utrReference: paymentData.utrReference },
        });

        if (existing) {
            throw new Error('Payment with this UTR reference already exists');
        }

        // Create payment
        const payment = await Payment.create({
            ...paymentData,
            currency: paymentData.currency || 'USD',
            status: 'submitted',
            submittedAt: new Date(),
        });

        // Auto-trigger matching (simulated SAP matching)
        await this.autoMatchPayment(payment.id);

        // Update case status
        await caseRecord.update({
            status: 'promise_to_pay',
        });

        return payment;
    }

    /**
     * Auto-match payment with SAP (simulated)
     */
    async autoMatchPayment(paymentId: number) {
        const payment = await Payment.findByPk(paymentId, {
            include: [{ model: Case, as: 'case' }],
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Simulate SAP matching logic
        // In production, this would call SAP API

        // Simple rule: if amount matches case amount within 5%, it's a match
        const caseRecord = payment.case;
        if (!caseRecord) {
            return payment;
        }

        const amountDiff = Math.abs(parseFloat(payment.amount.toString()) - parseFloat(caseRecord.amount.toString()));
        const percentDiff = (amountDiff / parseFloat(caseRecord.amount.toString())) * 100;

        if (percentDiff < 5) {
            // Auto-matched
            await payment.update({
                status: 'matched',
                sapDocumentNumber: `SAP-${Date.now()}-${caseRecord.accountNumber}`,
            });
        }

        return payment;
    }

    /**
     * Verify payment (FedEx Finance User)
     */
    async verifyPayment(paymentId: number, verifiedBy: number, approve: boolean, rejectionReason?: string) {
        const payment = await Payment.findByPk(paymentId, {
            include: [{ model: Case, as: 'case' }],
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        if (approve) {
            await payment.update({
                status: 'verified',
                verifiedBy,
                verifiedAt: new Date(),
            });

            // Update case status to resolved
            if (payment.case) {
                const caseRecord = payment.case;

                // Check if total payments >= case amount
                const allPayments = await Payment.findAll({
                    where: {
                        caseId: caseRecord.id,
                        status: { [Op.in]: ['verified', 'applied'] },
                    },
                });

                const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

                if (totalPaid >= parseFloat(caseRecord.amount.toString())) {
                    await caseRecord.update({
                        status: 'resolved',
                    });
                } else {
                    await caseRecord.update({
                        status: 'partial_paid',
                    });
                }

                // Trigger commission calculation for the DCA vendor
                if (caseRecord.dcaVendorId) {
                    // Import to avoid circular dependency
                    const vendorService = require('./vendorService').default;
                    await vendorService.updatePerformanceMetrics(caseRecord.dcaVendorId);
                }
            }
        } else {
            await payment.update({
                status: 'rejected',
                verifiedBy,
                verifiedAt: new Date(),
                rejectionReason,
            });
        }

        return payment;
    }

    /**
     * Get payments with filters
     */
    async getPayments(filters?: {
        caseId?: number;
        status?: string;
        submittedBy?: number;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        const includeOptions: any[] = [
            { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'accountNumber', 'customerName'] },
            { model: User, as: 'submitter', attributes: ['id', 'name', 'email'] },
        ];

        if (filters?.caseId) {
            where.caseId = filters.caseId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.submittedBy) {
            where.submittedBy = filters.submittedBy;
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.paymentDate = {};
            if (filters.dateFrom) {
                where.paymentDate[Op.gte] = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.paymentDate[Op.lte] = filters.dateTo;
            }
        }

        const { rows: payments, count } = await Payment.findAndCountAll({
            where,
            include: includeOptions,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['submittedAt', 'DESC']],
        });

        return { payments, total: count };
    }

    /**
     * Get payment by ID
     */
    async getPaymentById(id: number) {
        return await Payment.findByPk(id, {
            include: [
                { model: Case, as: 'case' },
                { model: User, as: 'submitter', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'verifier', attributes: ['id', 'name', 'email'] },
            ],
        });
    }

    /**
     * Get payments for a case
     */
    async getPaymentsByCase(caseId: number) {
        return await Payment.findAll({
            where: { caseId },
            include: [
                { model: User, as: 'submitter', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'verifier', attributes: ['id', 'name', 'email'] },
            ],
            order: [['submittedAt', 'DESC']],
        });
    }
}

export default new PaymentService();
