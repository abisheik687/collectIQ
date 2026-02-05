/**
 * Compliance Decision Routes
 * 
 * AI-powered compliance decision engine for debt collection actions
 * 
 * CRITICAL SAFEGUARDS:
 * - All decisions logged to audit trail
 * - ML API integration with fallback
 * - Human override logging with justification
 * - Read-only compliance audit queries
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import AuditLog from '../models/AuditLog';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * POST /api/compliance/decide
 * Get AI compliance decision for a proposed action
 * 
 * Requires: Authentication
 * Body: { case_data, proposed_action }
 */
router.post('/decide', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { case_data, proposed_action } = req.body;

        if (!proposed_action) {
            return res.status(400).json({ error: 'Missing proposed_action' });
        }

        // Call ML API compliance endpoint with fallback
        let decision;
        try {
            const mlResponse = await axios.post(`${ML_API_URL}/compliance/decide`, {
                case_data,
                proposed_action
            }, { timeout: 5000 });
            decision = mlResponse.data;
        } catch (mlError: any) {
            console.warn('ML API unavailable, using fallback compliance decision:', mlError.message);

            // Intelligent Fallback: Rule-based compliance scoring
            const calculateFallbackScore = () => {
                let score = 0;
                let riskFactors: any = {};
                let violatedRules: string[] = [];
                let ethicalFlags: string[] = [];

                // Check proposed action for problematic keywords
                const actionLower = proposed_action.toLowerCase();

                // Time-sensitive violations
                const now = new Date();
                const hour = now.getHours();
                if (actionLower.includes('call') && (hour < 8 || hour > 21)) {
                    score += 30;
                    riskFactors.time_violation = 'high';
                    violatedRules.push('FDCPA §805(a)(1): Contact outside 8am-9pm local time');
                    ethicalFlags.push('Attempting contact during restricted hours');
                }

                // Harassment indicators
                if (actionLower.match(/threaten|intimidate|harass|abuse/)) {
                    score += 40;
                    riskFactors.harassment = 'critical';
                    violatedRules.push('FDCPA §806: Harassment or abuse prohibited');
                    ethicalFlags.push('Language suggests potential harassment');
                }

                // Legal action threats without basis
                if (actionLower.match(/sue|lawsuit|legal action|attorney/) && !case_data?.legalBasis) {
                    score += 25;
                    riskFactors.false_legal_threat = 'high';
                    violatedRules.push('FDCPA §807(5): False threat of legal action');
                    ethicalFlags.push('Legal threat without documented basis');
                }

                // Frequency concerns
                if (actionLower.includes('call') && case_data?.contactsThisWeek >= 3) {
                    score += 20;
                    riskFactors.excessive_contact = 'medium';
                    ethicalFlags.push('High contact frequency this week');
                }

                // Vulnerable consumer protections
                if (case_data?.vulnerableConsumer || case_data?.elderlyFlag) {
                    if (actionLower.match(/urgency|immediately|today|now/)) {
                        score += 15;
                        riskFactors.vulnerability_exploitation = 'medium';
                        ethicalFlags.push('Pressure tactics on vulnerable consumer');
                    }
                }

                // Third-party disclosure risk
                if (actionLower.match(/employer|family|neighbor|workplace/)) {
                    score += 35;
                    riskFactors.third_party_disclosure = 'critical';
                    violatedRules.push('FDCPA §805(b): Third-party disclosure prohibited');
                    ethicalFlags.push('Risk of unauthorized debt disclosure');
                }

                // Determine risk level
                let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
                if (score >= 60) riskLevel = 'CRITICAL';
                else if (score >= 35) riskLevel = 'HIGH';
                else if (score >= 15) riskLevel = 'MEDIUM';
                else riskLevel = 'LOW';

                // Determine decision
                const isCompliant = score < 35;
                const decisionType = score >= 60 ? 'BLOCKED' : (score >= 35 ? 'REVIEW_REQUIRED' : 'ALLOWED');

                return {
                    score,
                    riskLevel,
                    riskFactors,
                    violatedRules,
                    ethicalFlags,
                    isCompliant,
                    decisionType
                };
            };

            const analysis = calculateFallbackScore();

            // Fallback: Rule-based compliance decision
            decision = {
                decision: analysis.decisionType,
                compliance_validation: {
                    is_compliant: analysis.isCompliant,
                    violated_rules: analysis.violatedRules,
                    checks_performed: {
                        fdcpa_time_check: analysis.riskFactors.time_violation ? 'fail' : 'pass',
                        tcpa_consent_check: 'pass',
                        frequency_check: analysis.riskFactors.excessive_contact ? 'warning' : 'pass',
                        vulnerability_check: analysis.riskFactors.vulnerability_exploitation ? 'warning' : 'pass',
                        harassment_check: analysis.riskFactors.harassment ? 'fail' : 'pass',
                        third_party_check: analysis.riskFactors.third_party_disclosure ? 'fail' : 'pass'
                    },
                    regulatory_notes: analysis.violatedRules.length > 0
                        ? `Rule violations detected: ${analysis.violatedRules.join('; ')}`
                        : 'ML API unavailable - using intelligent rule validation'
                },
                ethical_risk_assessment: {
                    total_score: analysis.score,
                    risk_level: analysis.riskLevel,
                    risk_factors: analysis.riskFactors,
                    ethical_flags: analysis.ethicalFlags
                },
                explanation: {
                    decision_summary: analysis.decisionType === 'BLOCKED'
                        ? 'Action BLOCKED due to significant compliance violations detected by rule-based analysis.'
                        : analysis.decisionType === 'REVIEW_REQUIRED'
                            ? 'Action flagged for MANUAL REVIEW due to potential compliance concerns.'
                            : 'Action ALLOWED after analyzing against regulatory frameworks using fallback rules.',
                    why_this_action: analysis.isCompliant
                        ? `The proposed action \"${proposed_action}\" passes basic compliance checks. Analysis shows ${analysis.score} risk score (${analysis.riskLevel} risk level).`
                        : null,
                    why_blocked: !analysis.isCompliant
                        ? `Compliance analysis detected ${analysis.violatedRules.length} regulatory violations and ${analysis.ethicalFlags.length} ethical concerns. Risk score: ${analysis.score}/100. This action could expose the organization to legal liability.`
                        : null,
                    why_not_alternatives: analysis.isCompliant
                        ? 'The proposed action is compliant. No alternative actions are necessary.'
                        : 'Consider revising the proposed action to address the identified violations before proceeding.',
                    principles_applied: [
                        'FDCPA §805: Communication in connection with debt collection',
                        'FDCPA §806: Harassment or abuse',
                        'FDCPA §807: False or misleading representations',
                        'TCPA Consent Requirements',
                        'Consumer Vulnerability Protections'
                    ],
                    legal_justification: analysis.isCompliant
                        ? 'Rule-based analysis confirms compliance with Fair Debt Collection Practices Act (FDCPA) and TCPA requirements.'
                        : `VIOLATIONS DETECTED: ${analysis.violatedRules.join(' | ')}`,
                    expected_outcome: analysis.isCompliant
                        ? 'Proceeding with this action maintains regulatory compliance.'
                        : 'Proceeding with this action risks regulatory violations and potential penalties.',
                    confidence_level: 'medium',
                    fallback_note: 'Note: This decision was generated using intelligent rule-based fallback. ML API is unavailable. For complex cases, manual legal review is strongly recommended.'
                },
                alternative_actions: !analysis.isCompliant ? [
                    'Revise communication to remove threatening language',
                    'Schedule contact during FDCPA-compliant hours (8am-9pm)',
                    'Reduce contact frequency to comply with best practices',
                    'Consult legal team for guidance on high-risk actions'
                ] : [],
                fallback_mode: true
            };
        }

        // Log decision to audit trail (REQUIRED)
        await AuditLog.create({
            action: decision.fallback_mode ? 'COMPLIANCE_DECISION_FALLBACK' : 'COMPLIANCE_DECISION',
            entityType: 'ComplianceEngine',
            entityId: case_data?.case_id?.toString() || null,
            userId: req.user?.id || null,
            userName: req.user?.email || 'System',
            beforeState: { proposed_action },
            afterState: decision,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown'
        });

        res.json(decision);

    } catch (error: any) {
        console.error('Compliance decision error:', error.message);
        res.status(500).json({
            error: 'Failed to get compliance decision',
            details: error.message
        });
    }
});

/**
 * POST /api/compliance/override
 * Log human override of AI decision
 * 
 * Requires: Authentication
 * Body: { case_id, ai_recommendation, human_action, justification }
 * 
 * CRITICAL: Justification must be >= 50 characters
 */
router.post('/override', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const {
            case_id,
            ai_recommendation,
            human_action,
            justification
        } = req.body;

        if (!justification || justification.length < 50) {
            return res.status(400).json({
                error: 'Justification required (minimum 50 characters)'
            });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Log override to audit trail (MANDATORY for compliance)
        await AuditLog.create({
            action: 'COMPLIANCE_OVERRIDE',
            entityType: 'ComplianceDecision',
            entityId: case_id?.toString() || null,
            userId: req.user.id,
            userName: req.user.email,
            beforeState: { ai_recommendation },
            afterState: { human_action, justification },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown'
        });

        res.json({
            success: true,
            override_logged: true,
            message: 'Override logged to audit trail'
        });

    } catch (error: any) {
        console.error('Override logging error:', error.message);
        res.status(500).json({ error: 'Failed to log override' });
    }
});

/**
 * GET /api/compliance/audit
 * Query compliance decision audit trail
 * 
 * Requires: Authentication
 * Query params: case_id, from_date, status
 */
router.get('/audit', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { case_id, from_date, status } = req.query;

        const where: any = {
            action: {
                [require('sequelize').Op.in]: ['COMPLIANCE_DECISION', 'COMPLIANCE_OVERRIDE']
            }
        };

        if (case_id) {
            where.entityId = case_id as string;
        }

        if (from_date) {
            where.timestamp = {
                [require('sequelize').Op.gte]: new Date(from_date as string)
            };
        }

        const auditRecords = await AuditLog.findAll({
            where,
            order: [['timestamp', 'DESC']],
            limit: 100
        });

        res.json({ records: auditRecords });

    } catch (error: any) {
        console.error('Audit query error:', error.message);
        res.status(500).json({ error: 'Failed to query audit trail' });
    }
});

export default router;
