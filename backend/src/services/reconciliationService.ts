import { Reconciliation, ReconciliationItem, Payment, Case } from '../models';
import { Op } from 'sequelize';

export class ReconciliationService {
    /**
     * Run reconciliation for a period
     */
    async runReconciliation(periodEnd: Date, processedBy: number) {
        const periodStart = new Date(periodEnd);
        periodStart.setDate(1); // First day of the month

        // Create reconciliation record
        const reconciliation = await Reconciliation.create({
            reconciliationPeriod: periodEnd,
            processedBy,
            status: 'in_progress',
        });

        try {
            // Get all verified payments in the period
            const payments = await Payment.findAll({
                where: {
                    status: { [Op.in]: ['verified', 'applied'] },
                    verifiedAt: {
                        [Op.between]: [periodStart, periodEnd],
                    },
                },
                include: [{ model: Case, as: 'case' }],
            });

            let matchedCount = 0;
            let exceptionCount = 0;
            let totalMatchedAmount = 0;
            const exceptionDetails: any[] = [];

            // Process each payment
            for (const payment of payments) {
                const matchResult = await this.matchPaymentWithSAP(payment);

                await ReconciliationItem.create({
                    reconciliationId: reconciliation.id,
                    paymentId: payment.id,
                    sapDocumentNumber: matchResult.sapDocumentNumber,
                    matchStatus: matchResult.status,
                    mismatchDetails: matchResult.mismatchDetails,
                });

                if (matchResult.status === 'matched') {
                    matchedCount++;
                    totalMatchedAmount += parseFloat(payment.amount.toString());
                } else {
                    exceptionCount++;
                    exceptionDetails.push({
                        paymentId: payment.id,
                        issue: matchResult.status,
                        expected: matchResult.mismatchDetails?.expectedAmount,
                        actual: parseFloat(payment.amount.toString()),
                    });
                }
            }

            // Update reconciliation with results
            await reconciliation.update({
                matchedCount,
                exceptionCount,
                totalMatchedAmount,
                exceptionDetails,
                status: 'completed',
                completedAt: new Date(),
            });

            return reconciliation;
        } catch (error) {
            await reconciliation.update({
                status: 'failed',
            });
            throw error;
        }
    }

    /**
     * Match payment with SAP (simulated)
     */
    private async matchPaymentWithSAP(payment: any): Promise<{
        status: 'matched' | 'amount_mismatch' | 'date_mismatch' | 'not_found';
        sapDocumentNumber?: string;
        mismatchDetails?: any;
    }> {
        // Simulated SAP matching logic
        // In production, this would call SAP API

        const caseRecord = payment.case;
        if (!caseRecord) {
            return { status: 'not_found' };
        }

        const paymentAmount = parseFloat(payment.amount.toString());
        const caseAmount = parseFloat(caseRecord.amount.toString());
        const amountDiff = Math.abs(paymentAmount - caseAmount);
        const percentDiff = (amountDiff / caseAmount) * 100;

        // Amount mismatch if difference > 5%
        if (percentDiff > 5) {
            return {
                status: 'amount_mismatch',
                mismatchDetails: {
                    expectedAmount: caseAmount,
                    actualAmount: paymentAmount,
                },
            };
        }

        // Simulate successful match
        return {
            status: 'matched',
            sapDocumentNumber: payment.sapDocumentNumber || `SAP-RECON-${Date.now()}`,
        };
    }

    /**
     * Get all reconciliations
     */
    async getReconciliations() {
        return await Reconciliation.findAll({
            order: [['reconciliationPeriod', 'DESC']],
        });
    }

    /**
     * Get reconciliation by ID with items
     */
    async getReconciliationById(id: number) {
        return await Reconciliation.findByPk(id, {
            include: [
                {
                    model: ReconciliationItem,
                    as: 'items',
                    include: [
                        {
                            model: Payment,
                            as: 'payment',
                            include: [{ model: Case, as: 'case' }],
                        },
                    ],
                },
            ],
        });
    }

    /**
     * Get exceptions for a reconciliation
     */
    async getExceptions(reconciliationId: number) {
        return await ReconciliationItem.findAll({
            where: {
                reconciliationId,
                matchStatus: { [Op.ne]: 'matched' },
            },
            include: [
                {
                    model: Payment,
                    as: 'payment',
                    include: [{ model: Case, as: 'case' }],
                },
            ],
        });
    }
}

export default new ReconciliationService();
