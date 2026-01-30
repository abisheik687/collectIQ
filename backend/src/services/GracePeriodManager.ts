/**
 * Grace Period Manager
 * 
 * Tracks time since last contact per case/channel
 * Enforces configurable grace periods before allowing next contact
 * 
 * IMPORTANT: This does NOT auto-send emails after expiration.
 * It only tracks eligibility and triggers escalation review.
 */

export interface GracePeriodRecord {
    caseId: string;
    channel: 'email' | 'sms' | 'phone';
    lastContactDate: Date;
    gracePeriodDays: number;
    nextAllowedContactDate: Date;
    escalationEligible: boolean;
}

export interface EscalationCheck {
    eligible: boolean;
    reason?: string;
    conditions: {
        gracePeriodExpired: boolean;
        noPaymentReceived: boolean;
        noResponseReceived: boolean;
        noVulnerabilityFlag: boolean;
        complianceStillValid: boolean;
    };
}

export class GracePeriodManager {
    private gracePeriodStore: Map<string, GracePeriodRecord> = new Map();

    // Default grace periods (configurable)
    private readonly DEFAULT_GRACE_PERIODS = {
        email: 7,   // 7 days default for email
        sms: 1,     // 1 day for SMS
        phone: 3    // 3 days for phone calls
    };

    /**
     * Record a contact event
     * Starts grace period timer for this case/channel
     */
    async recordContact(
        caseId: string,
        channel: 'email' | 'sms' | 'phone',
        customGracePeriodDays?: number
    ): Promise<void> {
        const gracePeriodDays = customGracePeriodDays || this.DEFAULT_GRACE_PERIODS[channel];
        const lastContactDate = new Date();
        const nextAllowedContactDate = new Date();
        nextAllowedContactDate.setDate(nextAllowedContactDate.getDate() + gracePeriodDays);

        const record: GracePeriodRecord = {
            caseId,
            channel,
            lastContactDate,
            gracePeriodDays,
            nextAllowedContactDate,
            escalationEligible: false
        };

        const key = `${caseId}_${channel}`;
        this.gracePeriodStore.set(key, record);

        console.log(`Grace period started: Case ${caseId}, Channel ${channel}, ${gracePeriodDays} days`);
    }

    /**
     * Check if contact is allowed based on grace period
     * 
     * @returns true if contact allowed, false if grace period active
     */
    async isContactAllowed(caseId: string, channel: 'email' | 'sms' | 'phone'): Promise<boolean> {
        const key = `${caseId}_${channel}`;
        const record = this.gracePeriodStore.get(key);

        if (!record) {
            // No previous contact - allowed
            return true;
        }

        const now = new Date();
        const allowed = now >= record.nextAllowedContactDate;

        return allowed;
    }

    /**
     * Get next allowed contact date for a case/channel
     */
    async getNextAllowedDate(caseId: string, channel: 'email' | 'sms' | 'phone'): Promise<Date | null> {
        const key = `${caseId}_${channel}`;
        const record = this.gracePeriodStore.get(key);

        if (!record) {
            return null;  // No restriction
        }

        return record.nextAllowedContactDate;
    }

    /**
     * Get days remaining in grace period
     */
    async getDaysRemaining(caseId: string, channel: 'email' | 'sms' | 'phone'): Promise<number> {
        const key = `${caseId}_${channel}`;
        const record = this.gracePeriodStore.get(key);

        if (!record) {
            return 0;
        }

        const now = new Date();
        const diffTime = record.nextAllowedContactDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * Check escalation eligibility
     * 
     * IMPORTANT: This does NOT trigger escalation automatically.
     * It only checks conditions. Human must approve escalation.
     * 
     * @param caseData Current case data
     * @returns Escalation eligibility with all conditions checked
     */
    async checkEscalationEligibility(caseData: any): Promise<EscalationCheck> {
        const channel = 'email';  // Check email grace period
        const key = `${caseData.id}_${channel}`;
        const record = this.gracePeriodStore.get(key);

        // Condition 1: Grace period expired
        const gracePeriodExpired = record ? new Date() >= record.nextAllowedContactDate : false;

        // Condition 2: No payment received
        const noPaymentReceived = caseData.status !== 'resolved' && caseData.status !== 'paid';

        // Condition 3: No response from debtor
        const noResponseReceived = !caseData.responseHistory || caseData.responseHistory === 'no_contact_yet';

        // Condition 4: No vulnerability flag
        const noVulnerabilityFlag = !caseData.vulnerabilityFlag;

        // Condition 5: Compliance still valid (would need to re-check via compliance engine)
        // For now, assume valid if no disputed debt
        const complianceStillValid = caseData.responseHistory !== 'disputed';

        const eligible = gracePeriodExpired &&
            noPaymentReceived &&
            noResponseReceived &&
            noVulnerabilityFlag &&
            complianceStillValid;

        return {
            eligible,
            reason: eligible ? 'All conditions met for escalation' : 'One or more conditions not met',
            conditions: {
                gracePeriodExpired,
                noPaymentReceived,
                noResponseReceived,
                noVulnerabilityFlag,
                complianceStillValid
            }
        };
    }

    /**
     * Get grace period status for all channels
     */
    async getGracePeriodStatus(caseId: string): Promise<{ [channel: string]: any }> {
        const channels: Array<'email' | 'sms' | 'phone'> = ['email', 'sms', 'phone'];
        const status: { [channel: string]: any } = {};

        for (const channel of channels) {
            const key = `${caseId}_${channel}`;
            const record = this.gracePeriodStore.get(key);

            if (record) {
                const daysRemaining = await this.getDaysRemaining(caseId, channel);
                const contactAllowed = await this.isContactAllowed(caseId, channel);

                status[channel] = {
                    lastContactDate: record.lastContactDate,
                    nextAllowedDate: record.nextAllowedContactDate,
                    contactAllowed,
                    daysRemaining
                };
            } else {
                status[channel] = {
                    lastContactDate: null,
                    nextAllowedDate: null,
                    contactAllowed: true,
                    daysRemaining: 0
                };
            }
        }

        return status;
    }

    /**
     * Clear grace period for a case/channel (admin override)
     */
    async clearGracePeriod(caseId: string, channel: 'email' | 'sms' | 'phone'): Promise<void> {
        const key = `${caseId}_${channel}`;
        this.gracePeriodStore.delete(key);
        console.log(`Grace period cleared: Case ${caseId}, Channel ${channel}`);
    }
}
