/**
 * Auto-Assignment Service
 * Intelligently assigns unassigned cases to DCAs based on:
 * - Workload balance (current case count)
 * - Performance scores (BPI)
 * - Capacity limits (max cases per DCA)
 */

import Case from '../models/Case';
import { WorkloadAnalytics } from './WorkloadAnalytics';
import { BPICalculator } from './BPICalculator';
import WorkflowEngine from './WorkflowEngine';
import { sequelize } from '../config/database';

interface DCAScore {
    dcaId: number;
    dcaName: string;
    score: number;
    currentCases: number;
    bpi: number;
    capacity: number;
}

interface AssignmentResult {
    assigned: number;
    unassigned: number;
    assignments: {
        caseId: number;
        caseNumber: string;
        dcaId: number;
        dcaName: string;
        score: number;
    }[];
    errors: string[];
}

// Configuration
const CAPACITY_LIMITS = {
    idle: 5,
    balanced: 15,
    near_capacity: 25,
    overloaded: 26, // DCAs with 26+ cases are excluded
};

const WEIGHTS = {
    performance: 0.4,  // BPI influence
    capacity: 0.3,     // Available slots
    workload: 0.3,     // Current load penalty
};

export class AutoAssignmentService {
    private workloadAnalytics: WorkloadAnalytics;
    private bpiCalculator: BPICalculator;

    constructor() {
        this.workloadAnalytics = new WorkloadAnalytics();
        this.bpiCalculator = new BPICalculator();
    }

    /**
     * Main method: Auto-assign all unassigned cases
     */
    async assignUnassignedCases(): Promise<AssignmentResult> {
        const transaction = await sequelize.transaction();

        try {
            // Fetch unassigned cases (status = 'new', no DCA assigned)
            const unassignedCases = await Case.findAll({
                where: {
                    status: 'new',
                    assignedDcaId: null,
                },
                order: [
                    ['priority', 'DESC'], // high > medium > low
                    ['riskScore', 'DESC'], // highest risk first
                ],
                transaction,
            });

            if (unassignedCases.length === 0) {
                await transaction.commit();
                return {
                    assigned: 0,
                    unassigned: 0,
                    assignments: [],
                    errors: [],
                };
            }

            // Fetch DCA workloads and filter available DCAs
            const dcaWorkloads = await this.workloadAnalytics.getDCAWorkloads();
            const availableDCAs = dcaWorkloads.filter(
                (dca) => dca.caseCount < CAPACITY_LIMITS.overloaded
            );

            if (availableDCAs.length === 0) {
                await transaction.rollback();
                return {
                    assigned: 0,
                    unassigned: unassignedCases.length,
                    assignments: [],
                    errors: ['No available DCAs with capacity'],
                };
            }

            // Get BPI scores for all DCAs
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = new Date();
            const bpiRankings = await this.bpiCalculator.rankDCAs(startDate, endDate, 100);

            const assignments: AssignmentResult['assignments'] = [];
            const errors: string[] = [];
            let assigned = 0;

            // Assign each case
            for (const caseItem of unassignedCases) {
                try {
                    // Calculate scores for all available DCAs
                    const dcaScores = await this.calculateDCAScores(
                        availableDCAs,
                        bpiRankings,
                        assignments // Pass current assignments array
                    );

                    if (dcaScores.length === 0) {
                        errors.push(`Case ${caseItem.caseNumber}: No available DCAs`);
                        continue;
                    }

                    // Sort by score (highest first)
                    // Add small random factor to break ties and ensure fair distribution
                    dcaScores.sort((a, b) => {
                        const scoreDiff = b.score - a.score;
                        // If scores are very close (within 0.05), randomize to prevent bias
                        if (Math.abs(scoreDiff) < 0.05) {
                            return Math.random() - 0.5;
                        }
                        return scoreDiff;
                    });
                    const bestDCA = dcaScores[0];

                    // Assign case
                    await caseItem.update(
                        {
                            assignedDcaId: bestDCA.dcaId,
                            assignedDcaName: bestDCA.dcaName,
                            status: 'assigned',
                        },
                        { transaction }
                    );

                    // Transition workflow
                    await WorkflowEngine.transitionStage(caseItem.id, 'contact');

                    assignments.push({
                        caseId: caseItem.id,
                        caseNumber: caseItem.caseNumber,
                        dcaId: bestDCA.dcaId,
                        dcaName: bestDCA.dcaName,
                        score: bestDCA.score,
                    });

                    assigned++;

                    // Update DCA workload in memory
                    const dca = availableDCAs.find((d) => d.dcaId === bestDCA.dcaId);
                    if (dca) {
                        dca.caseCount++;
                    }
                } catch (error: any) {
                    errors.push(`Case ${caseItem.caseNumber}: ${error.message}`);
                }
            }

            await transaction.commit();

            return {
                assigned,
                unassigned: unassignedCases.length - assigned,
                assignments,
                errors,
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Calculate assignment scores for all DCAs
     */
    private async calculateDCAScores(
        dcaWorkloads: any[],
        bpiRankings: any[],
        assignments: AssignmentResult['assignments']
    ): Promise<DCAScore[]> {
        const scores: DCAScore[] = [];

        for (const dca of dcaWorkloads) {
            // Find BPI score
            const bpiData = bpiRankings.find((b) => b.dcaId === dca.dcaId);
            const bpi = bpiData ? bpiData.bpi : 50; // Default to 50 if no BPI data

            // Calculate current assignments for THIS specific DCA
            const assignedToThisDCA = assignments.filter(a => a.dcaId === dca.dcaId).length;
            const currentCases = dca.caseCount + assignedToThisDCA;
            const maxCapacity = CAPACITY_LIMITS.overloaded - 1; // 25 max
            const availableCapacity = Math.max(0, maxCapacity - currentCases);

            // Skip if at capacity
            if (availableCapacity === 0) continue;

            // Normalize scores to 0-1 range
            const normalizedBPI = bpi / 100; // BPI is 0-100
            const normalizedCapacity = availableCapacity / maxCapacity;
            const normalizedWorkload = 1 - currentCases / maxCapacity;

            // Calculate weighted score
            const score =
                WEIGHTS.performance * normalizedBPI +
                WEIGHTS.capacity * normalizedCapacity +
                WEIGHTS.workload * normalizedWorkload;

            scores.push({
                dcaId: dca.dcaId,
                dcaName: dca.dcaName,
                score: Math.round(score * 100) / 100, // Round to 2 decimal places
                currentCases,
                bpi,
                capacity: availableCapacity,
            });
        }

        return scores;
    }
}

export default new AutoAssignmentService();
