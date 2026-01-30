/**
 * Workload Analytics Service
 * 
 * Provides visibility into DCA workload distribution and SLA risks
 * 
 * PURPOSE:
 * - Fair workload allocation
 * - SLA risk monitoring
 * - Rebalancing recommendations
 * 
 * EXPLICITLY AVOIDS:
 * - Real-time surveillance
 * - Micromanagement metrics
 * - Privacy-invasive tracking
 */

import Case from '../models/Case';
import { Op } from 'sequelize';

export interface WorkloadSummary {
    totalActiveDCAs: number;
    totalAssignedCases: number;
    averageCasesPerDCA: number;
    caseRange: { min: number; max: number };
    totalAmount: number;
    averageAmountPerDCA: number;
    workloadBalance: 'balanced' | 'imbalanced' | 'critical';
    workloadStdDev: number;
}

export interface DCAWorkload {
    dcaId: number;
    dcaName: string;
    caseCount: number;
    totalAmount: number;
    averageCaseAge: number;
    slaRisk: 'low' | 'medium' | 'high';
    capacityStatus: 'idle' | 'balanced' | 'near_capacity' | 'overloaded';
    capacityColor: 'blue' | 'green' | 'yellow' | 'red';
}

export interface SLARiskDistribution {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    totalCases: number;
}

export interface RebalancingRecommendation {
    action: 'reassign' | 'monitor' | 'no_action';
    fromDCA?: { id: number; name: string };
    toDCA?: { id: number; name: string };
    caseCount?: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

export class WorkloadAnalytics {

    /**
     * Get aggregate workload summary
     */
    async getWorkloadSummary(): Promise<WorkloadSummary> {
        // Get all active cases with DCA assignments
        const activeCases = await Case.findAll({
            where: {
                status: {
                    [Op.in]: ['assigned', 'in_progress', 'follow_up']
                },
                assignedDcaId: { [Op.ne]: null } as any
            }
        });

        // Group by DCA
        const dcaWorkloads = new Map<number, { count: number; amount: number }>();

        for (const caseItem of activeCases) {
            const dcaId = caseItem.assignedDcaId!;
            const current = dcaWorkloads.get(dcaId) || { count: 0, amount: 0 };
            dcaWorkloads.set(dcaId, {
                count: current.count + 1,
                amount: current.amount + Number(caseItem.amount)
            });
        }

        const totalActiveDCAs = dcaWorkloads.size;
        const totalAssignedCases = activeCases.length;
        const averageCasesPerDCA = totalActiveDCAs > 0 ? totalAssignedCases / totalActiveDCAs : 0;

        // Calculate case range
        const caseCounts = Array.from(dcaWorkloads.values()).map(d => d.count);
        const caseRange = {
            min: caseCounts.length > 0 ? Math.min(...caseCounts) : 0,
            max: caseCounts.length > 0 ? Math.max(...caseCounts) : 0
        };

        // Calculate total and average amount
        const totalAmount = activeCases.reduce((sum, c) => sum + Number(c.amount), 0);
        const averageAmountPerDCA = totalActiveDCAs > 0 ? totalAmount / totalActiveDCAs : 0;

        // Calculate standard deviation for workload balance
        const workloadStdDev = this.calculateStdDev(caseCounts);

        let workloadBalance: 'balanced' | 'imbalanced' | 'critical';
        if (workloadStdDev < 15) {
            workloadBalance = 'balanced';
        } else if (workloadStdDev < 25) {
            workloadBalance = 'imbalanced';
        } else {
            workloadBalance = 'critical';
        }

        return {
            totalActiveDCAs,
            totalAssignedCases,
            averageCasesPerDCA: Math.round(averageCasesPerDCA),
            caseRange,
            totalAmount,
            averageAmountPerDCA: Math.round(averageAmountPerDCA),
            workloadBalance,
            workloadStdDev: Math.round(workloadStdDev * 10) / 10
        };
    }

    /**
     * Get detailed workload for all DCAs
     */
    async getDCAWorkloads(): Promise<DCAWorkload[]> {
        // Get all active cases grouped by DCA
        const activeCases = await Case.findAll({
            where: {
                status: {
                    [Op.in]: ['assigned', 'in_progress', 'follow_up']
                },
                assignedDcaId: { [Op.ne]: null } as any
            }
        });

        // Group by DCA
        const dcaMap = new Map<number, Case[]>();

        for (const caseItem of activeCases) {
            const dcaId = caseItem.assignedDcaId!;
            const cases = dcaMap.get(dcaId) || [];
            cases.push(caseItem);
            dcaMap.set(dcaId, cases);
        }

        // Calculate workload metrics for each DCA
        const workloads: DCAWorkload[] = [];

        for (const [dcaId, cases] of dcaMap.entries()) {
            const dcaName = cases[0].assignedDcaName || `DCA-${dcaId}`;
            const caseCount = cases.length;
            const totalAmount = cases.reduce((sum, c) => sum + Number(c.amount), 0);

            // Calculate average case age
            const now = new Date();
            const averageCaseAge = Math.round(
                cases.reduce((sum, c) => {
                    const ageMs = now.getTime() - c.createdAt!.getTime();
                    const ageDays = ageMs / (1000 * 60 * 60 * 24);
                    return sum + ageDays;
                }, 0) / cases.length
            );

            // Calculate SLA risk
            const slaRisk = this.calculateSLARisk(cases);

            // Determine capacity status
            const capacityStatus = this.getCapacityStatus(caseCount);

            workloads.push({
                dcaId,
                dcaName,
                caseCount,
                totalAmount,
                averageCaseAge,
                slaRisk,
                capacityStatus: capacityStatus.status,
                capacityColor: capacityStatus.color
            });
        }

        // Sort by case count descending
        workloads.sort((a, b) => b.caseCount - a.caseCount);

        return workloads;
    }

    /**
     * Calculate SLA risk for cases
     */
    private calculateSLARisk(cases: Case[]): 'low' | 'medium' | 'high' {
        const now = new Date();
        let highRiskCount = 0;
        let mediumRiskCount = 0;

        for (const caseItem of cases) {
            if (!caseItem.slaDueDate || !caseItem.lastContactDate) continue;

            const daysUntilSLA = (caseItem.slaDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const daysSinceContact = (now.getTime() - caseItem.lastContactDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysUntilSLA < 3 || daysSinceContact > 14) {
                highRiskCount++;
            } else if (daysUntilSLA < 7 || daysSinceContact > 7) {
                mediumRiskCount++;
            }
        }

        const highRiskRate = highRiskCount / cases.length;
        const mediumRiskRate = mediumRiskCount / cases.length;

        if (highRiskRate > 0.1) return 'high';
        if (mediumRiskRate > 0.2) return 'medium';
        return 'low';
    }

    /**
     * Get capacity status for case count
     */
    private getCapacityStatus(caseCount: number): { status: 'idle' | 'balanced' | 'near_capacity' | 'overloaded'; color: 'blue' | 'green' | 'yellow' | 'red' } {
        if (caseCount > 95) {
            return { status: 'overloaded', color: 'red' };
        } else if (caseCount > 85) {
            return { status: 'near_capacity', color: 'yellow' };
        } else if (caseCount < 65) {
            return { status: 'idle', color: 'blue' };
        } else {
            return { status: 'balanced', color: 'green' };
        }
    }

    /**
     * Get SLA risk distribution across all cases
     */
    async getSLARiskDistribution(): Promise<SLARiskDistribution> {
        const activeCases = await Case.findAll({
            where: {
                status: {
                    [Op.in]: ['assigned', 'in_progress', 'follow_up']
                }
            }
        });

        const now = new Date();
        let lowRisk = 0;
        let mediumRisk = 0;
        let highRisk = 0;

        for (const caseItem of activeCases) {
            if (!caseItem.slaDueDate) {
                lowRisk++; // No SLA = low risk
                continue;
            }

            const daysUntilSLA = (caseItem.slaDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const daysSinceContact = caseItem.lastContactDate
                ? (now.getTime() - caseItem.lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
                : 999;

            if (daysUntilSLA < 3 || daysSinceContact > 14) {
                highRisk++;
            } else if (daysUntilSLA < 7 || daysSinceContact > 7) {
                mediumRisk++;
            } else {
                lowRisk++;
            }
        }

        return {
            lowRisk,
            mediumRisk,
            highRisk,
            totalCases: activeCases.length
        };
    }

    /**
     * Get rebalancing recommendations
     */
    async getRebalancingRecommendations(): Promise<RebalancingRecommendation[]> {
        const workloads = await this.getDCAWorkloads();
        const recommendations: RebalancingRecommendation[] = [];

        if (workloads.length < 2) {
            return [{
                action: 'no_action',
                reason: 'Insufficient DCAs for rebalancing analysis',
                priority: 'low'
            }];
        }

        // Find overloaded and idle DCAs
        const overloaded = workloads.filter(w => w.capacityStatus === 'overloaded');
        const idle = workloads.filter(w => w.capacityStatus === 'idle');

        // Recommend reassignments
        for (const overloadedDCA of overloaded) {
            if (idle.length > 0) {
                const targetDCA = idle[0];
                const casesToMove = Math.min(10, overloadedDCA.caseCount - 85);

                recommendations.push({
                    action: 'reassign',
                    fromDCA: { id: overloadedDCA.dcaId, name: overloadedDCA.dcaName },
                    toDCA: { id: targetDCA.dcaId, name: targetDCA.dcaName },
                    caseCount: casesToMove,
                    reason: `${overloadedDCA.dcaName} is overloaded (${overloadedDCA.caseCount} cases). Rebalance to ${targetDCA.dcaName} (${targetDCA.caseCount} cases) for fair distribution.`,
                    priority: 'high'
                });
            }
        }

        // Monitor near-capacity DCAs
        const nearCapacity = workloads.filter(w => w.capacityStatus === 'near_capacity');
        for (const dca of nearCapacity) {
            recommendations.push({
                action: 'monitor',
                reason: `${dca.dcaName} approaching capacity (${dca.caseCount} cases). Monitor for next assignment.`,
                priority: 'medium'
            });
        }

        // Flag high SLA risk DCAs
        const highSLARisk = workloads.filter(w => w.slaRisk === 'high');
        for (const dca of highSLARisk) {
            recommendations.push({
                action: 'monitor',
                reason: `${dca.dcaName} has high SLA risk cases. Review for priority escalation.`,
                priority: 'high'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                action: 'no_action',
                reason: 'Workload is balanced across all DCAs. No rebalancing needed.',
                priority: 'low'
            });
        }

        return recommendations;
    }

    /**
     * Calculate standard deviation
     */
    private calculateStdDev(values: number[]): number {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

        return Math.sqrt(variance);
    }
}
