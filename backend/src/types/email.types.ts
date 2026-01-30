/**
 * Email Communication Type Definitions
 */

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: 'payment_reminder' | 'payment_plan' | 'escalation' | 'final_notice';
}

export interface EmailExecutionContext {
    caseId: string;
    caseNumber: string;
    debtorName: string;
    amountDue: number;
    daysOverdue: number;
}

export const EMAIL_TEMPLATES: { [key: string]: EmailTemplate } = {
    payment_reminder: {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        subject: 'Payment Reminder - Account {caseNumber}',
        body: `
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <p>Dear {debtorName},</p>
                
                <p>This is a friendly reminder that your account ending in {caseNumber} has an outstanding balance.</p>
                
                <p><strong>Account Summary:</strong></p>
                <ul>
                    <li>Amount Due: ${'{'}amount Due{'}'}</li>
                    <li>Days Overdue: {daysOverdue}</li>
                </ul>
                
                <p>We understand that financial difficulties can arise. If you need assistance, please contact us to discuss payment options.</p>
                
                <p>Best regards,<br>
                CollectIQ Collections</p>
            </body>
            </html>
        `,
        category: 'payment_reminder'
    },
    payment_plan: {
        id: 'payment_plan',
        name: 'Payment Plan Offer',
        subject: 'Payment Plan Available - Account {caseNumber}',
        body: `
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <p>Dear {debtorName},</p>
                
                <p>We would like to help you resolve your account ending in {caseNumber}.</p>
                
                <p>We are offering flexible payment plan options that may work with your budget. Our team is ready to discuss terms that fit your situation.</p>
                
                <p><strong>Current Balance:</strong> ${'{'}amountDue{'}'}</p>
                
                <p>Please call us at your earliest convenience to discuss a payment arrangement.</p>
                
                <p>Sincerely,<br>
                CollectIQ Collections</p>
            </body>
            </html>
        `,
        category: 'payment_plan'
    }
};
