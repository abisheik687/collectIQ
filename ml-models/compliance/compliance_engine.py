"""
Compliance Rules Engine
Validates all proposed actions against FDCPA, TCPA, CFPB regulations
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pytz


class ComplianceEngine:
    """
    Rule-based compliance validator for debt collection actions
    Enforces FDCPA, TCPA, CFPB Regulation F, and company policies
    """
    
    def __init__(self):
        self.frequency_limits = {
            'phone': {'count': 3, 'period_days': 7},
            'sms': {'count': 1, 'period_days': 1},
            'email': {'count': 2, 'period_days': 7}
        }
        
        self.contact_hours = {
            'start': 8,  # 8 AM
            'end': 21    # 9 PM
        }
    
    def validate_action(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main validation entry point - runs all compliance checks
        
        Args:
            action: Proposed action (e.g., 'send_sms', 'send_email', 'escalate')
            context: Case context with contact history, consent, etc.
        
        Returns:
            Dict with compliance validation results
        """
        results = {
            'status': 'PASSED',
            'checks_performed': {},
            'violated_rules': [],
            'warnings': []
        }
        
        # Run all validation checks
        checks = [
            self._check_contact_time_window(action, context),
            self._check_frequency_limits(action, context),
            self._check_consent_validation(action, context),
            self._check_dispute_handling(action, context),
            self._check_vulnerable_debtor_protection(action, context),
            self._check_bankruptcy_stay(action, context)
        ]
        
        # Aggregate results
        for check in checks:
            results['checks_performed'][check['check_name']] = check['status']
            
            if check['status'] == 'FAIL':
                results['status'] = 'FAILED'
                if 'violation' in check:
                    results['violated_rules'].append(check['violation'])
            
            elif check['status'] == 'WARNING':
                if results['status'] == 'PASSED':
                    results['status'] = 'PASSED_WITH_WARNINGS'
                if 'warning' in check:
                    results['warnings'].append(check['warning'])
        
        return results
    
    def _check_contact_time_window(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        FDCPA §805(a) - No contact before 8 AM or after 9 PM debtor local time
        """
        if action not in ['send_phone_call', 'send_sms']:
            return {'check_name': 'contact_time_window', 'status': 'PASS', 'reason': 'N/A for this channel'}
        
        # Get debtor timezone
        debtor_tz = context.get('debtor_info', {}).get('timezone', 'America/New_York')
        try:
            tz = pytz.timezone(debtor_tz)
            current_time = datetime.now(tz)
            current_hour = current_time.hour
            
            if current_hour < self.contact_hours['start'] or current_hour >= self.contact_hours['end']:
                next_available = current_time.replace(hour=self.contact_hours['start'], minute=0, second=0)
                if current_hour >= self.contact_hours['end']:
                    next_available += timedelta(days=1)
                
                return {
                    'check_name': 'contact_time_window',
                    'status': 'FAIL',
                    'reason': f'Contact attempted at {current_hour}:00 (outside allowed hours 8 AM - 9 PM)',
                    'violation': {
                        'rule': 'FDCPA_TIME_WINDOW',
                        'legal_reference': 'FDCPA 15 USC § 1692c(a)(1)',
                        'severity': 'HIGH',
                        'next_allowed_time': next_available.isoformat()
                    }
                }
        except Exception as e:
            # Default to warning if timezone issues
            return {'check_name': 'contact_time_window', 'status': 'WARNING', 'reason': f'Timezone error: {str(e)}'}
        
        return {'check_name': 'contact_time_window', 'status': 'PASS', 'reason': 'Within allowed hours'}
    
    def _check_frequency_limits(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        CFPB Regulation F - Contact frequency limits
        """
        channel = self._extract_channel(action)
        if channel not in self.frequency_limits:
            return {'check_name': 'frequency_limits', 'status': 'PASS', 'reason': 'No limit for this action'}
        
        limit = self.frequency_limits[channel]
        contacts_in_period = self._count_recent_contacts(
            context.get('contact_history', {}),
            channel,
            limit['period_days']
        )
        
        if contacts_in_period >= limit['count']:
            return {
                'check_name': 'frequency_limits',
                'status': 'FAIL',
                'reason': f"{channel.upper()} limit reached: {contacts_in_period}/{limit['count']} in {limit['period_days']} days",
                'violation': {
                    'rule': 'CFPB_CONTACT_FREQUENCY',
                    'legal_reference': 'CFPB Regulation F 12 CFR § 1006.14',
                    'severity': 'HIGH',
                    'current_usage': f"{contacts_in_period}/{limit['count']}",
                    'reset_date': (datetime.now() + timedelta(days=limit['period_days'])).isoformat()
                }
            }
        
        return {
            'check_name': 'frequency_limits',
            'status': 'PASS',
            'reason': f"{channel.upper()}: {contacts_in_period}/{limit['count']} used"
        }
    
    def _check_consent_validation(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        TCPA - Requires prior express consent for SMS/autodialer
        """
        channel = self._extract_channel(action)
        if channel not in ['sms', 'phone']:
            return {'check_name': 'channel_consent', 'status': 'PASS', 'reason': 'No consent required'}
        
        consent_status = context.get('consent_status', '')
        consented_channels = self._parse_consent(consent_status)
        
        if channel == 'sms' and 'sms' not in consented_channels:
            return {
                'check_name': 'channel_consent',
                'status': 'FAIL',
                'reason': f'SMS channel not consented (consent: {consent_status})',
                'violation': {
                    'rule': 'TCPA_CONSENT_VIOLATION',
                    'legal_reference': 'TCPA 47 USC § 227',
                    'severity': 'CRITICAL',
                    'potential_penalty': '$500-$1,500 per message',
                    'consented_channels': consented_channels
                }
            }
        
        return {'check_name': 'channel_consent', 'status': 'PASS', 'reason': 'Channel consented'}
    
    def _check_dispute_handling(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        FDCPA §809(b) - Must cease collection if debt disputed until validation provided
        """
        response_history = context.get('response_history', '')
        
        if response_history in ['disputed', 'validation_requested']:
            validation_provided = context.get('dispute_details', {}).get('validation_provided', False)
            
            if not validation_provided:
                return {
                    'check_name': 'dispute_handling',
                    'status': 'FAIL',
                    'reason': 'Debt disputed - validation required before continued collection',
                    'violation': {
                        'rule': 'FDCPA_DISPUTE_HANDLING',
                        'legal_reference': 'FDCPA 15 USC § 1692g(b)',
                        'severity': 'CRITICAL',
                        'mandatory_action': 'PROVIDE_DEBT_VALIDATION',
                        'override_allowed': False
                    }
                }
        
        return {'check_name': 'dispute_handling', 'status': 'PASS'}
    
    def _check_vulnerable_debtor_protection(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Company Policy + State Laws - Enhanced protections for vulnerable consumers
        """
        if not context.get('vulnerability_flag', False):
            return {'check_name': 'vulnerable_debtor', 'status': 'PASS'}
        
        vulnerability_reasons = context.get('vulnerability_reasons', [])
        
        return {
            'check_name': 'vulnerable_debtor',
            'status': 'WARNING',
            'reason': f'Vulnerable debtor flag active: {", ".join(vulnerability_reasons)}',
            'warning': {
                'type': 'VULNERABLE_DEBTOR_PROTECTION',
                'description': f'Case flagged for: {", ".join(vulnerability_reasons)}',
                'policy': 'COMPANY_POLICY_VDP_2024',
                'required_action': 'Supervisor approval required before any contact',
                'vulnerability_categories': vulnerability_reasons
            }
        }
    
    def _check_bankruptcy_stay(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bankruptcy Code - Automatic stay prohibits all collection activity
        """
        bankruptcy_details = context.get('bankruptcy_details', {})
        
        if bankruptcy_details.get('automatic_stay_active', False):
            return {
                'check_name': 'bankruptcy_stay',
                'status': 'FAIL',
                'reason': 'Bankruptcy automatic stay active - all collection prohibited',
                'violation': {
                    'rule': 'BANKRUPTCY_AUTO_STAY_VIOLATION',
                    'legal_reference': '11 USC § 362 - Automatic Stay',
                    'severity': 'CRITICAL',
                    'bankruptcy_case': bankruptcy_details.get('case_number'),
                    'filing_date': bankruptcy_details.get('filing_date'),
                    'potential_penalty': 'Contempt of court, damages, attorney fees',
                    'mandatory_action': 'CEASE_ALL_COLLECTION_IMMEDIATELY',
                    'override_allowed': False
                }
            }
        
        return {'check_name': 'bankruptcy_stay', 'status': 'PASS'}
    
    def suggest_alternatives(self, blocked_action: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Suggest compliant alternative actions when primary action is blocked
        """
        alternatives = []
        
        # Always suggest email if consented (no time/frequency restrictions typically)
        consent = context.get('consent_status', '')
        if 'email' in consent.lower():
            alternatives.append({
                'action': 'send_email',
                'compliance_status': 'ALLOWED',
                'reason': 'Email channel available with no time/frequency restrictions in most cases'
            })
        
        # Suggest waiting if frequency limit hit
        channel = self._extract_channel(blocked_action)
        if channel in self.frequency_limits:
            limit = self.frequency_limits[channel]
            alternatives.append({
                'action': f'wait_{limit["period_days"]}d_then_{channel}',
                'compliance_status': 'ALLOWED_WITH_DELAY',
                'reason': f'Wait {limit["period_days"]} days for frequency limit reset'
            })
        
        # For disputed debt, suggest validation
        if context.get('response_history') in ['disputed', 'validation_requested']:
            alternatives.append({
                'action': 'provide_debt_validation',
                'compliance_status': 'REQUIRED',
                'reason': 'Legal requirement to validate debt before continued collection'
            })
        
        return alternatives
    
    # Helper methods
    
    def _extract_channel(self, action: str) -> str:
        """Extract communication channel from action string"""
        if 'sms' in action.lower():
            return 'sms'
        elif 'email' in action.lower():
            return 'email'
        elif 'phone' in action.lower() or 'call' in action.lower():
            return 'phone'
        return 'other'
    
    def _count_recent_contacts(self, contact_history: Dict[str, Any], channel: str, days: int) -> int:
        """Count contacts on specific channel in last N days"""
        contacts_in_period = contact_history.get(f'contacts_last_{days}_days', [])
        
        # Handle both list and count formats
        if isinstance(contacts_in_period, int):
            return contacts_in_period
        
        if isinstance(contacts_in_period, list):
            return sum(1 for contact in contacts_in_period 
                      if contact.get('channel', '').lower() == channel)
        
        # Fallback: check specific counters
        if channel == 'sms' and 'sms_count_today' in contact_history:
            return contact_history['sms_count_today']
        
        return 0
    
    def _parse_consent(self, consent_status: str) -> List[str]:
        """Parse consent string into list of consented channels"""
        if consent_status == 'all':
            return ['phone', 'sms', 'email']
        elif consent_status == 'none':
            return []
        else:
            # Parse formats like "phone_email" or "sms,email"
            return [ch.strip() for ch in consent_status.replace('_', ',').split(',')]
