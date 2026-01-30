"""
Ethical Risk Scorer
Quantifies potential harm across multiple dimensions:
- Harassment risk
- Psychological pressure risk
- Vulnerable debtor risk
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta


class EthicalRiskScorer:
    """
    ML-based ethical harm assessment for debt collection actions
    Scores risk from 0-100 across multiple harm dimensions
    """
    
    def __init__(self):
        self.risk_thresholds = {
            'low': 40,
            'medium': 70,
            'high': 100
        }
        
        # Weights for total risk calculation
        self.dimension_weights = {
            'harassment': 0.40,
            'psychological_pressure': 0.35,
            'vulnerable_debtor': 0.25
        }
    
    def assess_risk(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main risk assessment entry point
        
        Args:
            action: Proposed action
            context: Case context
        
        Returns:
            Complete ethical risk assessment
        """
        # Calculate individual risk dimensions
        harassment_risk = self._calculate_harassment_risk(action, context)
        pressure_risk = self._calculate_psychological_pressure_risk(action, context)
        vulnerability_risk = self._calculate_vulnerable_debtor_risk(action, context)
        
        # Calculate weighted total score
        total_score = (
            harassment_risk * self.dimension_weights['harassment'] +
            pressure_risk * self.dimension_weights['psychological_pressure'] +
            vulnerability_risk * self.dimension_weights['vulnerable_debtor']
        )
        
        # Determine recommendation
        recommendation = self._get_recommendation(total_score)
        
        # Identify risk factors
        risk_factors = self._identify_risk_factors(
            action, context, harassment_risk, pressure_risk, vulnerability_risk
        )
        
        # Suggest harm-minimizing alternative
        alternative = self._suggest_harm_minimizing_alternative(
            action, context, total_score
        )
        
        return {
            'total_score': round(total_score, 2),
            'recommendation': recommendation,
            'risk_breakdown': {
                'harassment_risk': round(harassment_risk, 2),
                'psychological_pressure_risk': round(pressure_risk, 2),
                'vulnerable_debtor_risk': round(vulnerability_risk, 2)
            },
            'risk_factors': risk_factors,
            'harm_minimizing_alternative': alternative
        }
    
    def _calculate_harassment_risk(self, action: str, context: Dict[str, Any]) -> float:
        """
        Calculate harassment risk based on contact frequency and channel diversity
        
        Formula: base_risk = (contacts_last_7_days * 15) + (same_channel_ratio * 25) + (tone_score * 20)
        """
        contact_history = context.get('contact_history', {})
        
        # Contact frequency risk
        contacts_last_7_days = len(contact_history.get('contacts_last_7_days', []))
        frequency_risk = min(contacts_last_7_days * 15, 60)  # Cap at 60
        
        # Channel diversity risk (using same channel repeatedly = higher risk)
        same_channel_ratio = self._calculate_same_channel_ratio(contact_history, action)
        channel_risk = same_channel_ratio * 25
        
        # Tone/content aggressiveness (basic heuristic)
        tone_risk = self._assess_message_tone(action) * 20
        
        total_harassment_risk = frequency_risk + channel_risk + tone_risk
        return min(total_harassment_risk, 100)
    
    def _calculate_psychological_pressure_risk(self, action: str, context: Dict[str, Any]) -> float:
        """
        Calculate psychological pressure based on escalation tactics and urgency
        
        Formula: pressure_risk = escalation_count * 20 + urgency_keywords * 15 + time_pressure_score * 10
        """
        contact_history = context.get('contact_history', {})
        
        # Escalation threat risk
        escalation_count = contact_history.get('escalation_count', 0)
        escalation_risk = min(escalation_count * 20, 40)
        
        # Urgency manipulation (detect keywords like "final", "immediate", "urgent")
        urgency_risk = self._detect_urgency_manipulation(action) * 15
        
        # Time pressure tactics
        time_pressure_risk = self._assess_time_pressure(action, context) * 10
        
        # Legal threat language (if not legally accurate)
        legal_threat_risk = self._detect_false_legal_threats(action, context) * 30
        
        total_pressure_risk = escalation_risk + urgency_risk + time_pressure_risk + legal_threat_risk
        return min(total_pressure_risk, 100)
    
    def _calculate_vulnerable_debtor_risk(self, action: str, context: Dict[str, Any]) -> float:
        """
        Calculate vulnerability-specific risk
        
        Formula: vulnerability_risk = vulnerability_flag * 50 + medical_debt * 30 + hardship_score * 20
        """
        if not context.get('vulnerability_flag', False):
            return 0.0
        
        # Base vulnerability risk
        base_risk = 50
        
        # Medical debt indicator
        vulnerability_details = context.get('vulnerability_details', {})
        medical_debt_risk = 30 if vulnerability_details.get('medical_debt_indicator', False) else 0
        
        # Recent hardship events
        hardship_score = self._assess_hardship_severity(vulnerability_details)
        hardship_risk = hardship_score * 20
        
        # Elderly or disability multiplier
        vulnerability_reasons = context.get('vulnerability_reasons', [])
        if 'elderly' in vulnerability_reasons or 'cognitive_impairment' in vulnerability_reasons:
            multiplier = 1.3
        else:
            multiplier = 1.0
        
        total_vulnerability_risk = (base_risk + medical_debt_risk + hardship_risk) * multiplier
        return min(total_vulnerability_risk, 100)
    
    def _get_recommendation(self, total_score: float) -> str:
        """Convert total risk score to recommendation"""
        if total_score >= self.risk_thresholds['medium']:
            return 'DO_NOT_PROCEED'
        elif total_score >= self.risk_thresholds['low']:
            return 'REQUIRE_SUPERVISOR_APPROVAL'
        else:
            return 'PROCEED_WITH_CAUTION'
    
    def _identify_risk_factors(
        self, 
        action: str, 
        context: Dict[str, Any],
        harassment_risk: float,
        pressure_risk: float,
        vulnerability_risk: float
    ) -> List[str]:
        """Generate human-readable risk factor descriptions"""
        factors = []
        
        # Harassment factors
        if harassment_risk > 60:
            contact_count = len(context.get('contact_history', {}).get('contacts_last_7_days', []))
            factors.append(f"✗ High contact frequency: {contact_count} attempts in past 7 days (high harassment risk)")
        
        # Pressure factors
        if pressure_risk > 60:
            if 'escalat' in action.lower() or 'legal' in action.lower():
                factors.append("✗ Language contains escalation threats without legal basis")
        
        # Vulnerability factors
        if vulnerability_risk > 60:
            vulnerability_reasons = context.get('vulnerability_reasons', [])
            factors.append(f"✗ Debtor flagged as vulnerable ({', '.join(vulnerability_reasons)})")
        
        # Positive factors (low risk indicators)
        if harassment_risk < 30:
            factors.append("✓ Low contact frequency (within reasonable limits)")
        
        if context.get('response_history') == 'partial_payment_promise':
            factors.append("✓ Debtor showing good faith effort (payment promise)")
        
        return factors
    
    def _suggest_harm_minimizing_alternative(
        self, 
        action: str, 
        context: Dict[str, Any],
        current_risk: float
    ) -> Dict[str, Any]:
        """Suggest lower-harm alternative action"""
        
        # Payment plan offer is generally lowest harm
        if current_risk > 50 and 'payment_plan' not in action.lower():
            return {
                'action': 'send_payment_plan_offer',
                'expected_risk': 22,
                'rationale': 'Empathetic approach more likely to succeed with less harm'
            }
        
        # Email is less intrusive than phone/SMS
        if 'sms' in action.lower() or 'phone' in action.lower():
            channel_switch_risk = max(current_risk - 15, 10)
            return {
                'action': 'send_email_reminder',
                'expected_risk': channel_switch_risk,
                'rationale': 'Email allows debtor to respond at convenience, less intrusive'
            }
        
        # Default: suggest waiting
        return {
            'action': 'wait_72h_then_gentle_reminder',
            'expected_risk': max(current_risk - 20, 15),
            'rationale': 'Additional time may allow debtor to respond without pressure'
        }
    
    # Helper methods
    
    def _calculate_same_channel_ratio(self, contact_history: Dict[str, Any], action: str) -> float:
        """Calculate ratio of contacts using same channel"""
        recent_contacts = contact_history.get('contacts_last_7_days', [])
        if not recent_contacts:
            return 0.0
        
        proposed_channel = self._extract_channel(action)
        same_channel_count = sum(1 for c in recent_contacts 
                                 if c.get('channel', '').lower() == proposed_channel)
        
        return same_channel_count / len(recent_contacts)
    
    def _assess_message_tone(self, action: str) -> float:
        """Assess aggressiveness of message tone (0-1 scale)"""
        aggressive_keywords = [
            'demand', 'immediately', 'must', 'required', 'legal action',
            'consequences', 'failure to', 'final notice'
        ]
        
        action_lower = action.lower()
        aggressive_count = sum(1 for keyword in aggressive_keywords if keyword in action_lower)
        
        return min(aggressive_count / 3, 1.0)  # Normalize to 0-1
    
    def _detect_urgency_manipulation(self, action: str) -> float:
        """Detect false urgency tactics (0-1 scale)"""
        urgency_keywords = [
            'final', 'last chance', 'immediately', 'urgent', 'deadline',
            'expires', 'limited time'
        ]
        
        action_lower = action.lower()
        urgency_count = sum(1 for keyword in urgency_keywords if keyword in action_lower)
        
        return min(urgency_count / 2, 1.0)
    
    def _assess_time_pressure(self, action: str, context: Dict[str, Any]) -> float:
        """Assess artificial time pressure tactics (0-1 scale)"""
        # If action mentions deadline but case isn't actually time-critical
        days_overdue = context.get('days_overdue', 0)
        
        if 'deadline' in action.lower() and days_overdue < 60:
            return 0.8  # Artificial urgency for non-critical case
        
        return 0.0
    
    def _detect_false_legal_threats(self, action: str, context: Dict[str, Any]) -> float:
        """Detect potentially false legal threat language (0-1 scale)"""
        legal_keywords = ['legal action', 'lawsuit', 'court', 'attorney', 'sue']
        
        action_lower = action.lower()
        has_legal_language = any(keyword in action_lower for keyword in legal_keywords)
        
        # If using legal language but case hasn't gone through proper escalation
        contact_count = context.get('contact_history', {}).get('past_contact_count', 0)
        
        if has_legal_language and contact_count < 4:
            return 1.0  # Premature legal threat
        
        return 0.0
    
    def _assess_hardship_severity(self, vulnerability_details: Dict[str, Any]) -> float:
        """Assess severity of financial hardship (0-1 scale)"""
        severity = 0.0
        
        if vulnerability_details.get('recent_hardship'):
            severity += 0.5
        
        if vulnerability_details.get('income_status') == 'fixed_income_social_security':
            severity += 0.3
        
        if vulnerability_details.get('medical_debt_indicator'):
            severity += 0.2
        
        return min(severity, 1.0)
    
    def _extract_channel(self, action: str) -> str:
        """Extract communication channel from action string"""
        if 'sms' in action.lower():
            return 'sms'
        elif 'email' in action.lower():
            return 'email'
        elif 'phone' in action.lower() or 'call' in action.lower():
            return 'phone'
        return 'other'
