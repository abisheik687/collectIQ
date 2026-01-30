/**
 * Gmail Adapter Service
 * 
 * CRITICAL: This is a PASSIVE EXECUTOR, not a decision-maker.
 * - Accepts only pre-approved instructions
 * - Never evaluates business logic
 * - Never overrides AI/compliance decisions
 * - Fails safely (blocks on uncertainty)
 * 
 * Security: OAuth 2.0 with minimal scope (gmail.send only)
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface ApprovedEmailParams {
    caseId: string;
    caseNumber: string;
    recipientEmail: string;
    subject: string;
    body: string;
    complianceToken: string;  // Proof of compliance validation
}

export interface EmailDeliveryResult {
    success: boolean;
    messageId?: string;
    sentAt?: Date;
    errorReason?: string;
}

export class GmailAdapter {
    private oauth2Client: OAuth2Client | null = null;
    private gmail: any = null;
    private isAuthenticated: boolean = false;

    constructor() {
        // OAuth credentials from environment variables
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.error('Gmail credentials missing in environment variables');
            this.isAuthenticated = false;
            return;
        }

        try {
            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'urn:ietf:wg:oauth:2.0:oob'
            );

            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
            this.isAuthenticated = true;

            console.log('Gmail Adapter initialized successfully');
        } catch (error) {
            console.error('Gmail OAuth initialization failed:', error);
            this.isAuthenticated = false;
        }
    }

    /**
     * Validate Gmail connection
     */
    async validateConnection(): Promise<boolean> {
        if (!this.isAuthenticated || !this.gmail) {
            return false;
        }

        try {
            // Test connection with profile fetch
            await this.gmail.users.getProfile({
                userId: 'me'
            });
            return true;
        } catch (error) {
            console.error('Gmail connection validation failed:', error);
            return false;
        }
    }

    /**
     * Send pre-approved email
     * 
     * CRITICAL: This method assumes all validation has been performed.
     * It does NOT check compliance, consent, or frequency limits.
     * Those checks MUST be performed before calling this method.
     * 
     * @param params Pre-approved email parameters with compliance token
     * @returns Delivery result with messageId or error
     */
    async sendEmail(params: ApprovedEmailParams): Promise<EmailDeliveryResult> {
        // DEFENSIVE: Block if not authenticated
        if (!this.isAuthenticated || !this.gmail) {
            return {
                success: false,
                errorReason: 'Gmail adapter not authenticated'
            };
        }

        // DEFENSIVE: Validate compliance token exists
        if (!params.complianceToken) {
            return {
                success: false,
                errorReason: 'Missing compliance token - email blocked'
            };
        }

        // DEFENSIVE: Validate all required fields
        if (!params.recipientEmail || !params.subject || !params.body) {
            return {
                success: false,
                errorReason: 'Missing required email parameters'
            };
        }

        // DEFENSIVE: Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(params.recipientEmail)) {
            return {
                success: false,
                errorReason: 'Invalid recipient email address'
            };
        }

        try {
            // Construct RFC 2822 email message
            const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'collections@collectiq.com';

            const messageParts = [
                `From: CollectIQ Collections <${senderEmail}>`,
                `To: ${params.recipientEmail}`,
                `Subject: ${params.subject}`,
                `Content-Type: text/html; charset=utf-8`,
                '',
                params.body
            ];

            const message = messageParts.join('\n');

            // Base64url encode the message
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Send via Gmail API
            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            // SUCCESS: Email sent
            return {
                success: true,
                messageId: response.data.id,
                sentAt: new Date()
            };

        } catch (error: any) {
            // FAILURE: Log error and return without retrying
            console.error('Gmail send failed:', error.message);

            return {
                success: false,
                errorReason: `Gmail API error: ${error.message || 'Unknown error'}`
            };
        }
    }

    /**
     * Get authentication status
     */
    isReady(): boolean {
        return this.isAuthenticated;
    }
}
