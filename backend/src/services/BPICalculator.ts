/**
 * Balanced Performance Index (BPI) Calculator
 * 
 * Calculates ethical, compliance-first performance scores for DCAs
 * 
 * FORMULA: BPI = (Recovery × 0.40) + (Compliance × 0.30) + (SLA × 0.20) - (Complaints × 0.10)
 * 
 * CRITICAL RULES:
 * - Any compliance violation → BPI = 0 (hard cap)
 * - Rankings period-based only (monthly/quarterly, NOT real-time)
 * - Privacy: Top 5 public, bottom performers private
 */

import Case from '../models/Case';
import AuditLog from '../models/AuditLog';
import { Op } from 'sequelize';

export interface BPIComponents {
    recoveryScore: number;      // 0-100
    complianceScore: number;    // 0-100
    slaScore: number;           // 0-100
    complaintPenalty: number;   // 0-100
}

export interface BPIResult {
    dcaId: number;
    dcaName: string;
    bpi: number;                // Final weighted score
    components: BPIComponents;
    caseCount: number;
    period: {
        startDate: Date;
        endDate: Date;
    };
    eligible: boolean;          // False if compliance violations exist
    ineligibilityReason?: string;
}

export interface RankedDCA extends BPIResult {
    rank: number;
    percentile: number;
}

export class BPICalculator {

    /**
     * Calculate Recovery Score (40% weight)
     * Based on recovery rate: recovered amount / total assigned
     */
    async calculateRecoveryScore(dcaId: number, startDate: Date, endDate: Date): Promise<number> {
        const cases = await Case.findAll({
            where: {
                assignedDcaId: dcaId,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (cases.length === 0) return 0;

        const totalAssigned = cases.reduce((sum, c) => sum + Number(c.amount), 0);
        const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'closed');
        const totalRecovered = resolvedCases.reduce((sum, c) => sum + Number(c.amount), 0);

        if (totalAssigned === 0) return 0;

        const recoveryRate = (totalRecovered / totalAssigned) * 100;

        // Normalize to 0-100 scale (cap at 100%)
        return Math.min(recoveryRate, 100);
    }

    /**
     * Calculate Compliance Score (30% weight)
     * Based on AI block rate and compliance violations
     * 
     * CRITICAL: Any compliance violation = 0 score
     */
    async calculateComplianceScore(dcaId: number, startDate: Date, endDate: Date): Promise<number> {
        // Check for compliance violations in audit logs
        const complianceViolations = await AuditLog.findAll({
            where: {
                userId: dcaId,
                action: {
                    [Op.in]: ['COMPLIANCE_VIOLATION', 'FDCPA_VIOLATION', 'TCPA_VIOLATION', 'CFPB_VIOLATION']
                },
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        // HARD CAP: Any violation = 0 score
        if (complianceViolations.length > 0) {
            return 0;
        }

        // Calculate based on AI block rate
        const allAIActions = await AuditLog.findAll({
            where: {
                userId: dcaId,
                entityType: 'CommunicationAction',
                action: {
                    [Op.in]: ['EMAIL_SENT', 'EMAIL_BLOCKED', 'SMS_SENT', 'SMS_BLOCKED']
                },
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (allAIActions.length === 0) return 100; // No actions = perfect compliance (benefit of doubt)

        const blockedActions = allAIActions.filter(a => a.action.includes('BLOCKED')).length;
        const blockRate = (blockedActions / allAIActions.length) * 100;

        // Lower block rate = better compliance
        // Penalize block rate: 100 - (blockRate × 2)
        const complianceScore = 100 - (blockRate * 2);

        return Math.max(complianceScore, 0);
    }

    /**
     * Calculate SLA Adherence Score (20% weight)
     * Based on percentage of cases resolved on-time
     */
    async calculateSLAScore(dcaId: number, startDate: Date, endDate: Date): Promise<number> {
        const resolvedCases = await Case.findAll({
            where: {
                assignedDcaId: dcaId,
                status: {
                    [Op.in]: ['resolved', 'closed']
                },
                updatedAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (resolvedCases.length === 0) return 0;

        // Count cases resolved before SLA due date
        const onTimeCases = resolvedCases.filter(c => {
            if (!c.slaDueDate) return true; // No SLA = assume on-time
            return c.updatedAt <= c.slaDueDate;
        });

        const slaAdherence = (onTimeCases.length / resolvedCases.length) * 100;

        return slaAdherence;
    }

    /**
     * Calculate Complaint Penalty (-10% weight)
     * Based on debtor complaints and supervisor escalations
     */
    async calculateComplaintPenalty(dcaId: number, startDate: Date, endDate: Date): Promise<number> {
        const cases = await Case.findAll({
            where: {
                assignedDcaId: dcaId,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (cases.length === 0) return 0;

        // Count complaints from audit logs
        const complaints = await AuditLog.findAll({
            where: {
                userId: dcaId,
                action: {
                    [Op.in]: ['DEBTOR_COMPLAINT', 'SUPERVISOR_ESCALATION', 'ETHICS_FLAG']
                },
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        const complaintRate = (complaints.length / cases.length) * 100;

        // Convert to penalty (higher complaints = higher penalty)
        // Multiply by 5 to make impact significant, cap at 100
        const penalty = Math.min(complaintRate * 5, 100);

        return penalty;
    }

    /**
     * Calculate full BPI for a DCA
     */
    async calculateBPI(dcaId: number, dcaName: string, startDate: Date, endDate: Date): Promise<BPIResult> {
        // Calculate all components
        const recoveryScore = await this.calculateRecoveryScore(dcaId, startDate, endDate);
        const complianceScore = await this.calculateComplianceScore(dcaId, startDate, endDate);
        const slaScore = await this.calculateSLAScore(dcaId, startDate, endDate);
        const complaintPenalty = await this.calculateComplaintPenalty(dcaId, startDate, endDate);

        const components: BPIComponents = {
            recoveryScore,
            complianceScore,
            slaScore,
            complaintPenalty
        };

        // Get case count for context
        const cases = await Case.findAll({
            where: {
                assignedDcaId: dcaId,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        // Check eligibility (compliance score = 0 means ineligible)
        const eligible = complianceScore > 0;
        const ineligibilityReason = !eligible ? 'Compliance violation detected' : undefined;

        // Calculate weighted BPI
        // BPI = (Recovery × 0.40) + (Compliance × 0.30) + (SLA × 0.20) - (Complaints × 0.10)
        const bpi = eligible
            ? (recoveryScore * 0.40) + (complianceScore * 0.30) + (slaScore * 0.20) - (complaintPenalty * 0.10)
            : 0;

        return {
            dcaId,
            dcaName,
            bpi: Math.round(bpi * 10) / 10, // Round to 1 decimal
            components,
            caseCount: cases.length,
            period: { startDate, endDate },
            eligible,
            ineligibilityReason
        };
    }

    /**
     * Rank all DCAs by BPI for a given period
     * Returns top performers only (privacy for low performers)
     */
    async rankDCAs(startDate: Date, endDate: Date, topN: number = 5): Promise<RankedDCA[]> {
        // Get all unique DCAs from cases in period
        const dcaCases = await Case.findAll({
            attributes: ['assignedDcaId', 'assignedDcaName'],
            where: {
                assignedDcaId: { [Op.not]: null },
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: ['assignedDcaId', 'assignedDcaName']
        });

        // Calculate BPI for each DCA
        const bpiResults: BPIResult[] = [];

        for (const dcaCase of dcaCases) {
            if (dcaCase.assignedDcaId && dcaCase.assignedDcaName) {
                const bpi = await this.calculateBPI(
                    dcaCase.assignedDcaId,
                    dcaCase.assignedDcaName,
                    startDate,
                    endDate
                );
                bpiResults.push(bpi);
            }
        }

        // Sort by BPI (descending)
        bpiResults.sort((a, b) => b.bpi - a.bpi);

        // Add ranks and percentiles
        const rankedDCAs: RankedDCA[] = bpiResults.map((result, index) => ({
            ...result,
            rank: index + 1,
            percentile: Math.round(((bpiResults.length - index) / bpiResults.length) * 100)
        }));

        // Return only top N (privacy protection)
        return rankedDCAs.slice(0, topN);
    }

    /**
     * Get individual DCA performance (for DCA self-view)
     */
    async getDCAPerformance(dcaId: number, dcaName: string, startDate: Date, endDate: Date): Promise<BPIResult & { peerAverage: number }> {
        const bpi = await this.calculateBPI(dcaId, dcaName, startDate, endDate);

        // Calculate peer average for context
        const allDCAs = await this.rankDCAs(startDate, endDate, 1000); // Get all
        const peerAverage = allDCAs.reduce((sum, d) => sum + d.bpi, 0) / allDCAs.length;

        return {
            ...bpi,
            peerAverage: Math.round(peerAverage * 10) / 10
        };
    }
}
