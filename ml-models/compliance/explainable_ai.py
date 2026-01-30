"""
Explainable AI Layer
Generates human-readable, judge-friendly explanations for every AI decision
"""

from typing import Dict, Any, List


class ExplainableAI:
    """
    Natural language explanation generator for compliance decisions
    Produces judge-friendly, stakeholder-specific explanations
    """
    
    def __init__(self):
        self.legal_citations = {
            'FDCPA_TIME_WINDOW': 'FDCPA 15 USC § 1692c(a)(1)',
            'CFPB_CONTACT_FREQUENCY': 'CFPB Regulation F 12 CFR § 1006.14',
            'TCPA_CONSENT_VIOLATION': 'TCPA 47 USC § 227',
            'FDCPA_DISPUTE_HANDLING': 'FDCPA 15 USC § 1692g(b)',
            'BANKRUPTCY_AUTO_STAY_VIOLATION': '11 USC § 362 - Automatic Stay'
        }
    
    def generate_explanation(
        self,
        decision: str,
        action: str,
        context: Dict[str, Any],
        compliance_results: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive explanation for AI decision
        
        Args:
            decision: AI decision (ALLOWED, BLOCKED, REVIEW_REQUIRED)
            action: Proposed action
            context: Case context
            compliance_results: Compliance validation results
            ethical_assessment: Ethical risk assessment
        
        Returns:
            Multi-section explanation with legal citations
        """
        explanation = {
            'decision_summary': self._generate_decision_summary(
                decision, action, compliance_results, ethical_assessment
            ),
            'why_this_action': None,
            'why_not_alternatives': None,
            'why_blocked': None,
            'principles_applied': self._generate_principles_applied(
                decision, ethical_assessment, context
            ),
            'legal_justification': None,
            'expected_outcome': None
        }
        
        if decision == 'ALLOWED':
            explanation['why_this_action'] = self._explain_allowed_action(
                action, context, compliance_results, ethical_assessment
            )
            explanation['expected_outcome'] = self._generate_outcome_prediction(
                action, context, ethical_assessment
            )
        
        elif decision == 'BLOCKED':
            explanation['why_blocked'] = self._explain_blocked_action(
                action, context, compliance_results, ethical_assessment
            )
            explanation['why_not_alternatives'] = self._explain_safer_alternatives(
                action, context, compliance_results
            )
            explanation['legal_justification'] = self._generate_legal_justification(
                compliance_results
            )
        
        elif decision == 'REVIEW_REQUIRED':
            explanation['why_this_action'] = self._explain_review_required(
                action, context, ethical_assessment
            )
            explanation['why_not_alternatives'] = self._explain_why_approval_needed(
                context, ethical_assessment
            )
        
        return explanation
    
    def _generate_decision_summary(
        self,
        decision: str,
        action: str,
        compliance_results: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> str:
        """Generate executive summary of decision"""
        
        if decision == 'ALLOWED':
            return f"""
Recommended Action: {self._humanize_action(action)}

Decision: ✅ ALLOWED
Compliance Status: {compliance_results.get('status', 'UNKNOWN')}
Ethical Risk Score: {ethical_assessment.get('total_score', 0)}/100 (Low)

This action has passed all compliance checks and carries low ethical risk. 
Proceed with action as recommended.
""".strip()
        
        elif decision == 'BLOCKED':
            violations = compliance_results.get('violated_rules', [])
            violation_count = len(violations)
            
            return f"""
Proposed Action: {self._humanize_action(action)}

Decision: 🚫 BLOCKED
Compliance Status: FAILED ({violation_count} violation{'s' if violation_count > 1 else ''})
Ethical Risk Score: {ethical_assessment.get('total_score', 0)}/100

This action violates regulatory requirements and cannot proceed. See details below.
""".strip()
        
        else:  # REVIEW_REQUIRED
            return f"""
Proposed Action: {self._humanize_action(action)}

Decision: ⚠️ SUPERVISOR APPROVAL REQUIRED
Compliance Status: {compliance_results.get('status', 'PASSED')}
Ethical Risk Score: {ethical_assessment.get('total_score', 0)}/100 (Moderate)
Recommendation: {ethical_assessment.get('recommendation', 'UNKNOWN')}

This action requires human review before proceeding. See approval requirements below.
""".strip()
    
    def _explain_allowed_action(
        self,
        action: str,
        context: Dict[str, Any],
        compliance_results: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> str:
        """Explain why this action is recommended"""
        
        days_overdue = context.get('days_overdue', 0)
        payment_prob = context.get('paymentProbability', 50)
        past_contacts = context.get('contact_history', {}).get('past_contact_count', 0)
        
        explanation = f"""
Case is {days_overdue} days overdue ({"moderate" if days_overdue < 60 else "high"} urgency) with {past_contacts} previous contact attempt{'s' if past_contacts != 1 else ''}.

ML-predicted payment probability: {payment_prob}% ({"high" if payment_prob > 60 else "medium" if payment_prob > 40 else "low"} likelihood of success).

Compliance validation:
"""
        
        for check_name, status in compliance_results.get('checks_performed', {}).items():
            check_display = check_name.replace('_', ' ').title()
            explanation += f"- {check_display}: {status}\n"
        
        explanation += f"\nEthical risk score: {ethical_assessment.get('total_score', 0)}/100 ({"low" if ethical_assessment.get('total_score', 0) < 40 else "moderate"} harm potential)\n"
        
        # Add positive factors
        factors = ethical_assessment.get('risk_factors', [])
        positive_factors = [f for f in factors if f.startswith('✓')]
        if positive_factors:
            explanation += "\nPositive indicators:\n"
            for factor in positive_factors:
                explanation += f"  {factor}\n"
        
        return explanation.strip()
    
    def _explain_blocked_action(
        self,
        action: str,
        context: Dict[str, Any],
        compliance_results: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> List[str]:
        """Explain why action is blocked"""
        
        reasons = []
        
        # Legal violations
        for violation in compliance_results.get('violated_rules', []):
            rule_name = violation.get('rule', 'UNKNOWN')
            legal_ref = self.legal_citations.get(rule_name, 'See compliance policy')
            severity = violation.get('severity', 'UNKNOWN')
            
            reason = f"LEGAL VIOLATION: {violation.get('reason', 'Unspecified violation')}"
            reason += f"\n  Legal Reference: {legal_ref}"
            reason += f"\n  Severity: {severity}"
            
            if 'potential_penalty' in violation:
                reason += f"\n  Potential Penalty: {violation['potential_penalty']}"
            
            reasons.append(reason)
        
        # Ethical concerns
        total_risk = ethical_assessment.get('total_score', 0)
        if total_risk > 70:
            reasons.append(
                f"ETHICAL CONCERN: Ethical risk score {total_risk}/100 exceeds acceptable threshold. "
                f"This action carries high risk of harassment claims or consumer harm."
            )
        
        # Specific risk factors
        negative_factors = [f for f in ethical_assessment.get('risk_factors', []) if f.startswith('✗')]
        if negative_factors:
            reasons.append(
                "RISK FACTORS IDENTIFIED:\n  " + "\n  ".join(negative_factors)
            )
        
        return reasons
    
    def _explain_safer_alternatives(
        self,
        action: str,
        context: Dict[str, Any],
        compliance_results: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Explain safer alternative actions"""
        
        alternatives = []
        
        # Check if disputed debt
        if context.get('response_history') in ['disputed', 'validation_requested']:
            alternatives.append({
                'action': 'document_dispute_and_provide_validation',
                'rationale': 'Legal requirement under FDCPA §809(b) to validate debt before continued collection',
                'status': 'MANDATORY'
            })
        
        # Check consent status for channel alternatives
        consent = context.get('consent_status', '')
        if 'email' in consent.lower() and 'sms' in action.lower():
            alternatives.append({
                'action': 'send_email_instead',
                'rationale': 'Email channel has consent and avoids TCPA violation risk',
                'status': 'RECOMMENDED'
            })
        
        # Suggest waiting if frequency limits hit
        if any('frequency' in v.get('rule', '').lower() 
               for v in compliance_results.get('violated_rules', [])):
            alternatives.append({
                'action': 'wait_and_retry_after_cooldown',
                'rationale': 'Allows frequency limit reset period to pass, then retry with compliant timing',
                'status': 'ALLOWED_WITH_DELAY'
            })
        
        return alternatives
    
    def _explain_review_required(
        self,
        action: str,
        context: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> str:
        """Explain why supervisor review is required"""
        
        vulnerability_reasons = context.get('vulnerability_reasons', [])
        total_risk = ethical_assessment.get('total_score', 0)
        
        explanation = f"""
This case requires supervisor review for the following reasons:

Vulnerability Status: {', '.join(vulnerability_reasons) if vulnerability_reasons else 'Moderate ethical risk'}
Ethical Risk Score: {total_risk}/100 (Moderate - between 40 and 70)

Recommended Approach: {self._humanize_action(action)}

Rationale:
"""
        
        if 'payment_plan' in action.lower():
            explanation += "- Payment plan offer balances recovery goals with ethical treatment\n"
            explanation += "- Debtor has shown willingness to pay, suggesting good faith effort\n"
        
        explanation += f"- Empathetic approach more likely to succeed than aggressive tactics\n"
        
        if vulnerability_reasons:
            explanation += f"\nVulnerable Debtor Considerations:\n"
            if 'medical_hardship' in vulnerability_reasons:
                explanation += "- Medical hardship may limit earning capacity\n"
            if 'elderly' in vulnerability_reasons:
                explanation += "- Elderly status requires extra care in communication tone\n"
        
        explanation += "\nSupervisor should review and approve approach before proceeding."
        
        return explanation.strip()
    
    def _explain_why_approval_needed(
        self,
        context: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> str:
        """Explain why human approval is required"""
        
        vulnerability_reasons = context.get('vulnerability_reasons', [])
        
        if vulnerability_reasons:
            return f"""
Approval Required: Vulnerable debtor protection policy

Categories: {', '.join(vulnerability_reasons)}

Policy Requirements:
- All actions on vulnerable debtors must be reviewed by supervisor
- Ensure communication tone is empathetic and non-coercive
- Verify proposed terms are reasonable given debtor circumstances
- Document approval decision and reasoning

This is a company policy safeguard to prevent harm to vulnerable consumers.
""".strip()
        
        else:
            total_risk = ethical_assessment.get('total_score', 0)
            return f"""
Approval Required: Moderate ethical risk (score: {total_risk}/100)

While this action passes compliance checks, the ethical risk score falls in the moderate range (40-70).
Supervisor review ensures:
- Approach is proportional to case circumstances
- No unintended pressure tactics
- Best Balance of recovery and ethical treatment

Approval serves as quality control checkpoint for borderline cases.
""".strip()
    
    def _generate_principles_applied(
        self,
        decision: str,
        ethical_assessment: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[str]:
        """List ethical principles applied in decision"""
        
        principles = []
        
        # Least harmful action principle
        if decision == 'ALLOWED':
            total_risk = ethical_assessment.get('total_score', 0)
            principles.append(
                f"✓ Least Harmful Action: Selected option with ethical risk score {total_risk}/100 "
                f"(among available compliant alternatives)"
            )
        
        # Consent-first principle
        consent = context.get('consent_status', '')
        if consent and consent != 'none':
            principles.append(
                f"✓ Consent-First Principle: Using only consented channels ({consent})"
            )
        
        # Vulnerable debtor protection
        if context.get('vulnerability_flag'):
            principles.append(
                "✓ Vulnerable Debtor Protection: Enhanced safeguards applied for vulnerable consumer"
            )
        
        # Transparency principle
        principles.append(
            "✓ Transparency Principle: Communication must be factually accurate with no misleading urgency"
        )
        
        # Graduated response
        past_contacts = context.get('contact_history', {}).get('past_contact_count', 0)
        if past_contacts > 0:
            principles.append(
                f"✓ Graduated Response: Action follows {past_contacts} previous contact attempt(s)"
            )
        
        return principles
    
    def _generate_legal_justification(self, compliance_results: Dict[str, Any]) -> str:
        """Generate legal justification for blocking decision"""
        
        violations = compliance_results.get('violated_rules', [])
        if not violations:
            return "No legal violations detected."
        
        justification = "Legal Violations Preventing Action:\n\n"
        
        for i, violation in enumerate(violations, 1):
            rule_name = violation.get('rule', 'UNKNOWN')
            legal_ref = self.legal_citations.get(rule_name, 'See compliance policy')
            
            justification += f"{i}. {rule_name}\n"
            justification += f"   Citation: {legal_ref}\n"
            justification += f"   Violation: {violation.get('reason', 'Unspecified')}\n"
            
            if 'potential_penalty' in violation:
                justification += f"   Penalty Risk: {violation['potential_penalty']}\n"
            
            if not violation.get('override_allowed', True):
                justification += f"   Override: NOT PERMITTED (critical violation)\n"
            
            justification += "\n"
        
        justification += "Proceeding with this action would expose the company to regulatory liability."
        
        return justification.strip()
    
    def _generate_outcome_prediction(
        self,
        action: str,
        context: Dict[str, Any],
        ethical_assessment: Dict[str, Any]
    ) -> str:
        """Predict expected outcome of action"""
        
        payment_prob = context.get('paymentProbability', 50)
        
        if 'payment_plan' in action.lower():
            return f"{payment_prob + 20}% probability of payment arrangement within 7 days (payment plan offers typically increase engagement)"
        
        elif 'email' in action.lower():
            return f"{payment_prob}% probability of payment within 7 days; {payment_prob + 28}% probability of engagement (reply/call back)"
        
        else:
            return f"{payment_prob}% probability of successful payment outcome"
    
    def _humanize_action(self, action: str) -> str:
        """Convert action code to human-readable description"""
        
        action_map = {
            'send_email': 'Send Email - Payment Reminder',
            'send_sms': 'Send SMS - Payment Notice',
            'send_phone_call': 'Place Phone Call - Account Discussion',
            'send_payment_plan_offer': 'Send Email - Payment Plan Offer',
            'escalate': 'Escalate to Next Level',
            'legal_referral': 'Refer to Legal Department',
            'provide_debt_validation': 'Send Debt Validation Notice'
        }
        
        for key, value in action_map.items():
            if key in action.lower():
                return value
        
        return action.replace('_', ' ').title()
