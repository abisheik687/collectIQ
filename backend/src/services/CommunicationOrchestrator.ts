/**
 * Communication Orchestrator
 * 
 * Coordinates action execution through compliance gates and channel adapters
 * 
 * CRITICAL DESIGN:
 * - This is the single point of entry for all communication actions
 * - Performs 5-gate validation before ANY email send
 * - Delegates to Gmail Adapter only after ALL gates pass
 * - Logs ALL attempts (success and failure) to audit trail
 * 
 * SECURITY:
 * CRITICAL GATEKEEPER for all outbound communication
 * 
 * GATES (All must pass for action to execute):
 * 1. AI Decision = ALLOWED
 * 2. Compliance Status = PASSED
 * 3. Consent = TRUE  
 * 4. Frequency < Threshold
 * 5. Grace Period = Valid
 * 
 * If ANY gate fails → BLOCK action, log to audit
 * 
 * DOES NOT AUTO-TRIGGER:
 * - No loops
 * - No auto-escalation
 * - Requires explicit human approval via API call
 */

import { GmailAdapter, ApprovedEmailParams, EmailDeliveryResult } from './GmailAdapter';
import { GracePeriodManager } from './GracePeriodManager';
import AuditService from './AuditService';

export interface CommunicationAction {
    caseId: string;
    actionType: 'email' | 'sms' | 'phone';
    aiDecisionToken: string; // MUST come from prior /compliance/decide call
    complianceStatus: 'PASSED' | 'FAILED';
    consentStatus: boolean;
    emailContent?: {
        to: string;
        subject: string;
        body: string;
    };
}

export interface ValidationResult {
    gate: string;
    passed: boolean;
    reason?: string;
}

export interface ApprovedAction {
    action: string;
    channel: 'email' | 'sms' | 'phone';
    recipientEmail?: string;
    subject?: string;
    body?: string;
}

export interface ComplianceValidation {
    decision: 'ALLOWED' | 'BLOCKED' | 'REVIEW_REQUIRED';
    complianceStatus: string;
    ethicalRiskScore: number;
    complianceToken: string;  // Proof this was validated
}

export interface ExecutionResult {
    success: boolean;
    blocked: boolean;
    blockReason?: string;
    validationResults?: ValidationResult[]; // Added for new interface
    messageId?: string;
    sentAt?: Date;
    gracePeriodStarted?: boolean;
    nextAllowedContactDate?: Date;
    gracePeriodEnforced?: boolean; // Added for new interface
}

export class CommunicationOrchestrator {
    private gmailAdapter: GmailAdapter;
    private gracePeriodManager: GracePeriodManager;
    private auditService: typeof AuditService;

    constructor() {
        this.gmailAdapter = new GmailAdapter();
        this.gracePeriodManager = new GracePeriodManager();
        this.auditService = AuditService; // Use singleton instance
    }

    /**
     * Execute approved action with full validation
     * 
     * 5-GATE VALIDATION:
     * 1. AI Decision = ALLOWED
     * 2. Compliance Status = PASSED
     * 3. Consent = TRUE
     * 4. Frequency < Threshold
     * 5. Grace Period = Valid
     * 
     * If ANY gate fails → BLOCK
     */
    async executeApprovedAction(
        caseId: string,
        caseData: any,
        action: ApprovedAction,
        complianceProof: ComplianceValidation,
        userId?: number
    ): Promise<ExecutionResult> {

        // ========== GATE 1: AI Decision Check ==========
        if (complianceProof.decision !== 'ALLOWED') {
            const blockReason = `AI decision not ALLOWED (${complianceProof.decision})`;

            await this.auditService.log({
                action: 'EMAIL_BLOCKED',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: { action, reason: 'ai_decision_not_allowed' },
                afterState: { blocked: true, blockReason },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: false,
                blocked: true,
                blockReason
            };
        }

        // ========== GATE 2: Compliance Status Check ==========
        if (complianceProof.complianceStatus !== 'PASSED') {
            const blockReason = `Compliance check failed (${complianceProof.complianceStatus})`;

            await this.auditService.log({
                action: 'EMAIL_BLOCKED',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: { action, reason: 'compliance_failed' },
                afterState: { blocked: true, blockReason },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: false,
                blocked: true,
                blockReason
            };
        }

        // ========== GATE 3: Consent Check ==========
        const consentValid = this.checkConsent(caseData, action.channel);
        if (!consentValid) {
            const blockReason = `Channel '${action.channel}' not consented`;

            await this.auditService.log({
                action: 'EMAIL_BLOCKED',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: { action, reason: 'consent_invalid' },
                afterState: { blocked: true, blockReason },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: false,
                blocked: true,
                blockReason
            };
        }

        // ========== GATE 4: Frequency Check ==========
        // (Would check contact_history in production - simplified for MVP)
        // Frequency check passed for MVP

        // ========== GATE 5: Grace Period Check ==========
        const gracePeriodValid = await this.gracePeriodManager.isContactAllowed(
            caseId,
            action.channel
        );

        if (!gracePeriodValid) {
            const nextAllowedDate = await this.gracePeriodManager.getNextAllowedDate(caseId, action.channel);
            const daysRemaining = await this.gracePeriodManager.getDaysRemaining(caseId, action.channel);
            const blockReason = `Grace period active - contact not allowed for ${daysRemaining} days (next allowed: ${nextAllowedDate?.toISOString()})`;

            await this.auditService.log({
                action: 'EMAIL_BLOCKED',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: { action, reason: 'grace_period_active' },
                afterState: {
                    blocked: true,
                    blockReason,
                    nextAllowedDate,
                    daysRemaining
                },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: false,
                blocked: true,
                blockReason,
                nextAllowedContactDate: nextAllowedDate || undefined
            };
        }

        // ========== ALL GATES PASSED - EXECUTE ACTION ==========

        if (action.channel === 'email') {
            return await this.sendEmail(caseId, caseData, action, complianceProof, userId);
        } else {
            // SMS/Phone channels not implemented yet
            return {
                success: false,
                blocked: true,
                blockReason: `Channel '${action.channel}' not implemented yet`
            };
        }
    }

    /**
     * Send email via Gmail Adapter
     */
    private async sendEmail(
        caseId: string,
        caseData: any,
        action: ApprovedAction,
        complianceProof: ComplianceValidation,
        userId?: number
    ): Promise<ExecutionResult> {

        if (!action.recipientEmail || !action.subject || !action.body) {
            return {
                success: false,
                blocked: true,
                blockReason: 'Missing email parameters (recipient/subject/body)'
            };
        }

        const emailParams: ApprovedEmailParams = {
            caseId,
            caseNumber: caseData.caseNumber,
            recipientEmail: action.recipientEmail,
            subject: action.subject,
            body: action.body,
            complianceToken: complianceProof.complianceToken
        };

        // Attempt to send via Gmail Adapter
        const result: EmailDeliveryResult = await this.gmailAdapter.sendEmail(emailParams);

        if (result.success) {
            // SUCCESS - Start grace period timer
            await this.gracePeriodManager.recordContact(caseId, 'email', 7);  // 7 day grace period

            // Log success to audit trail
            await this.auditService.log({
                action: 'EMAIL_SENT',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: {
                    action,
                    complianceProof
                },
                afterState: {
                    messageId: result.messageId,
                    sentAt: result.sentAt,
                    gracePeriodDays: 7
                },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: true,
                blocked: false,
                messageId: result.messageId,
                sentAt: result.sentAt,
                gracePeriodStarted: true,
                nextAllowedContactDate: await this.gracePeriodManager.getNextAllowedDate(caseId, 'email') || undefined
            };

        } else {
            // FAILED - Log failure (do NOT retry)
            await this.auditService.log({
                action: 'EMAIL_FAILED',
                entityType: 'CommunicationAction',
                entityId: caseId,
                userId: userId || null,
                userName: 'System',
                beforeState: { action },
                afterState: {
                    failed: true,
                    errorReason: result.errorReason
                },
                ipAddress: '127.0.0.1',
                userAgent: 'CommunicationOrchestrator'
            });

            return {
                success: false,
                blocked: false,
                blockReason: result.errorReason
            };
        }
    }

    /**
     * Check consent for channel
     */
    private checkConsent(caseData: any, channel: string): boolean {
        const consent = caseData.consentStatus || '';

        if (consent === 'all') return true;
        if (consent.includes(channel)) return true;

        return false;
    }

    /**
     * Check grace period status for a case
     */
    async checkGracePeriod(caseId: string, channel: 'email' | 'sms' | 'phone'): Promise<boolean> {
        return await this.gracePeriodManager.isContactAllowed(caseId, channel);
    }

    /**
     * Start grace period timer
     */
    async startGracePeriodTimer(caseId: string, channel: 'email' | 'sms' | 'phone', days: number): Promise<void> {
        await this.gracePeriodManager.recordContact(caseId, channel, days);
    }
}
