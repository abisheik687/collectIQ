/**
 * Communication Service
 * Handles email and SMS sending with template support and compliance validation
 */

import Communication from '../models/Communication';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';

// Mock implementations - replace with actual API keys
const SENDGRID_ENABLED = !!process.env.SENDGRID_API_KEY;
const TWILIO_ENABLED = !!process.env.TWILIO_SID && !!process.env.TWILIO_TOKEN;

interface SendEmailParams {
    caseId: number;
    template: string;
    recipient: string;
    subject: string;
    variables: Record<string, any>;
    sentBy: number;
    sentByName: string;
}

interface SendSMSParams {
    caseId: number;
    template: string;
    recipient: string;
    variables: Record<string, any>;
    sentBy: number;
    sentByName: string;
}

// Message templates (dollar signs escaped to prevent template literal interpretation)
const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
    payment_reminder: {
        subject: 'Payment Reminder - Account {{accountNumber}}',
        body: 'Dear {{customerName}},\n\nThis is a friendly reminder that your account {{accountNumber}} has an outstanding balance of ${{amount}}.\n\nDue Date: {{dueDate}}\nDays Overdue: {{overdueDays}}\n\nTo avoid further action, please submit your payment as soon as possible.\n\nThank you for your cooperation.\n\nBest regards,\n{{dcaName}}',
    },
    settlement_offer: {
        subject: 'Settlement Offer - Account {{accountNumber}}',
        body: 'Dear {{customerName}},\n\nWe are pleased to offer you a settlement opportunity for account {{accountNumber}}.\n\nOriginal Amount: ${{amount}}\nSettlement Offer: ${{settlementAmount}}\nDiscount: {{discount}}%\n\nThis offer is valid until {{expiryDate}}.\n\nTo accept this offer, please contact us immediately.\n\nSincerely,\n{{dcaName}}',
    },
    payment_confirmation: {
        subject: 'Payment Received - Account {{accountNumber}}',
        body: 'Dear {{customerName}},\n\nWe have successfully received your payment of ${{paymentAmount}} for account {{accountNumber}}.\n\nRemaining Balance: ${{remainingBalance}}\nPayment Date: {{paymentDate}}\n\nThank you for your payment.\n\nBest regards,\n{{dcaName}}',
    },
    case_closure: {
        subject: 'Account Resolved - {{accountNumber}}',
        body: 'Dear {{customerName}},\n\nWe are pleased to inform you that your account {{accountNumber}} has been successfully resolved and closed.\n\nFinal Payment: ${{finalAmount}}\nClosure Date: {{closureDate}}\n\nThank you for your cooperation throughout this process.\n\nBest regards,\n{{dcaName}}',
    },
};

const SMS_TEMPLATES: Record<string, string> = {
    payment_reminder: 'Reminder: Account {{accountNumber}} has ${{amount}} due. Overdue {{overdueDays}} days. Please pay ASAP. -{{dcaName}}',
    payment_confirmation: 'Payment received: ${{paymentAmount}} for account {{accountNumber}}. Thank you! -{{dcaName}}',
    settlement_offer: 'Settlement offer: Pay ${{settlementAmount}} ({{discount}}% off) for account {{accountNumber}}. Valid until {{expiryDate}}. -{{dcaName}}',
};

// Profanity and threat detection
const PROHIBITED_WORDS = [
    'sue', 'jail', 'arrest', 'prison', 'garnish', 'seize', 'legal action',
    'lawsuit', 'court', 'attorney', 'lawyer', // Common but often prohibited without proper disclosures
];

export class CommunicationService {
    /**
     * Validate message for compliance (no threats, profanity)
     */
    private static validateCompliance(message: string): { valid: boolean; reason?: string } {
        const lowerMessage = message.toLowerCase();

        for (const word of PROHIBITED_WORDS) {
            if (lowerMessage.includes(word)) {
                return {
                    valid: false,
                    reason: `Message contains prohibited term: "${word}". Please review FDCPA guidelines.`,
                };
            }
        }

        return { valid: true };
    }

    /**
     * Compile Handlebars template with variables
     */
    private static compileTemplate(template: string, variables: Record<string, any>): string {
        const compiled = Handlebars.compile(template);
        return compiled(variables);
    }

    /**
     * Send email via SendGrid
     */
    static async sendEmail(params: SendEmailParams): Promise<Communication> {
        try {
            // Get template
            const emailTemplate = EMAIL_TEMPLATES[params.template];
            if (!emailTemplate) {
                throw new Error(`Email template "${params.template}" not found`);
            }

            // Compile subject and body
            const subject = this.compileTemplate(emailTemplate.subject, params.variables);
            const message = this.compileTemplate(emailTemplate.body, params.variables);

            // Validate compliance
            const validation = this.validateCompliance(message);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            // Create communication record
            const comm = await Communication.create({
                caseId: params.caseId,
                type: 'email',
                template: params.template,
                recipient: params.recipient,
                subject,
                message,
                status: 'pending',
                sentBy: params.sentBy,
                sentByName: params.sentByName,
            });

            // Send via SendGrid (mock for now)
            if (SENDGRID_ENABLED) {
                // TODO: Actual SendGrid integration
                // const sgMail = require('@sendgrid/mail');
                // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                // await sgMail.send({ to: params.recipient, from: '...', subject, html: message });
                logger.info(`[MOCK] Email sent to ${params.recipient}: ${subject}`);
            } else {
                logger.warn('[MOCK] SendGrid not configured - email logged only');
            }

            // Update status
            await comm.update({
                status: 'sent',
                sentAt: new Date(),
            });

            return comm;
        } catch (error: any) {
            logger.error('Failed to send email:', error);
            throw error;
        }
    }

    /**
     * Send SMS via Twilio
     */
    static async sendSMS(params: SendSMSParams): Promise<Communication> {
        try {
            // Get template
            const smsTemplate = SMS_TEMPLATES[params.template];
            if (!smsTemplate) {
                throw new Error(`SMS template "${params.template}" not found`);
            }

            // Compile message
            const message = this.compileTemplate(smsTemplate, params.variables);

            // Validate compliance
            const validation = this.validateCompliance(message);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            // Validate length (SMS limit: 160 chars)
            if (message.length > 160) {
                throw new Error(`SMS message too long (${message.length} chars). Max 160 characters.`);
            }

            // Create communication record
            const comm = await Communication.create({
                caseId: params.caseId,
                type: 'sms',
                template: params.template,
                recipient: params.recipient,
                message,
                status: 'pending',
                sentBy: params.sentBy,
                sentByName: params.sentByName,
            });

            // Send via Twilio (mock for now)
            if (TWILIO_ENABLED) {
                // TODO: Actual Twilio integration
                // const twilio = require('twilio');
                // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
                // await client.messages.create({ to: params.recipient, from: '...', body: message });
                logger.info(`[MOCK] SMS sent to ${params.recipient}: ${message}`);
            } else {
                logger.warn('[MOCK] Twilio not configured - SMS logged only');
            }

            // Update status
            await comm.update({
                status: 'sent',
                sentAt: new Date(),
            });

            return comm;
        } catch (error: any) {
            logger.error('Failed to send SMS:', error);
            throw error;
        }
    }

    /**
     * Get communication history for a case
     */
    static async getCommunicationHistory(caseId: number): Promise<Communication[]> {
        return await Communication.findAll({
            where: { caseId },
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Get available templates
     */
    static getAvailableTemplates() {
        return {
            email: Object.keys(EMAIL_TEMPLATES).map((key) => ({
                id: key,
                name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                subject: EMAIL_TEMPLATES[key].subject,
            })),
            sms: Object.keys(SMS_TEMPLATES).map((key) => ({
                id: key,
                name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            })),
        };
    }
}

export default CommunicationService;
