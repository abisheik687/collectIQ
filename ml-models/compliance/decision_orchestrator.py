"""
Decision Orchestrator
Main coordination layer that combines compliance, ethical, and explainability components
"""

from typing import Dict, Any
from .compliance_engine import ComplianceEngine
from .ethical_risk_scorer import EthicalRiskScorer
from .explainable_ai import ExplainableAI


class DecisionOrchestrator:
    """
    Coordinates all AI compliance decision components
    Main entry point for compliance decision API
    """
    
    def __init__(self):
        self.compliance_engine = ComplianceEngine()
        self.ethical_scorer = EthicalRiskScorer()
        self.explainer = ExplainableAI()
    
    def make_decision(self, case_data: Dict[str, Any], proposed_action: str) -> Dict[str, Any]:
        """
        Complete AI compliance decision pipeline
        
        Args:
            case_data: Full case context
            proposed_action: Action to evaluate
        
        Returns:
            Complete decision with compliance, ethical, and explanation
        """
        
        # Step 1: Compliance validation
        compliance_results = self.compliance_engine.validate_action(
            proposed_action,
            case_data
        )
        
        # Step 2: Ethical risk assessment
        ethical_assessment = self.ethical_scorer.assess_risk(
            proposed_action,
            case_data
        )
        
        # Step 3: Determine final decision
        final_decision = self._determine_decision(
            compliance_results,
            ethical_assessment,
            case_data
        )
        
        # Step 4: Generate explanation
        explanation = self.explainer.generate_explanation(
            final_decision['decision'],
            proposed_action,
            case_data,
            compliance_results,
            ethical_assessment
        )
        
        # Step 5: Get alternative actions if blocked
        alternative_actions = []
        if final_decision['decision'] == 'BLOCKED':
            alternative_actions = self.compliance_engine.suggest_alternatives(
                proposed_action,
                case_data
            )
        
        # Combine all results
        return {
            'case_id': case_data.get('case_id'),
            'case_number': case_data.get('case_number'),
            'proposed_action': proposed_action,
            
            'decision': final_decision['decision'],
            'confidence': final_decision.get('confidence', 0.85),
            
            'compliance_validation': compliance_results,
            'ethical_risk_assessment': ethical_assessment,
            'explanation': explanation,
            
            'allowed_actions': final_decision.get('allowed_actions', []),
            'blocked_actions': final_decision.get('blocked_actions', []),
            'alternative_actions': alternative_actions,
            
            'human_override': {
                'allowed': final_decision.get('override_allowed', True),
                'requires_justification': True,
                'approval_level': final_decision.get('approval_level', 'supervisor')
            },
            
            'audit_metadata': {
                'timestamp': self._get_timestamp(),
                'decision_engine_version': '1.0.0'
            }
        }
    
    def _determine_decision(
        self,
        compliance_results: Dict[str, Any],
        ethical_assessment: Dict[str, Any],
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Determine final decision based on compliance and ethical results
        
        Decision Logic:
        1. If compliance FAILED → BLOCKED
        2. If ethical risk > 70 → BLOCKED (DO_NOT_PROCEED)
        3. If ethical risk 40-70 or vulnerable debtor → REVIEW_REQUIRED
        4. Otherwise → ALLOWED
        """
        
        compliance_status = compliance_results.get('status')
        ethical_recommendation = ethical_assessment.get('recommendation')
        total_ethical_risk = ethical_assessment.get('total_score', 0)
        vulnerability_flag = case_data.get('vulnerability_flag', False)
        
        # Check for hard compliance failures
        if compliance_status == 'FAILED':
            # Check if override is allowed
            violated_rules = compliance_results.get('violated_rules', [])
            override_allowed = all(v.get('override_allowed', True) for v in violated_rules)
            
            return {
                'decision': 'BLOCKED',
                'reason': 'Compliance validation failed',
                'override_allowed': override_allowed,
                'blocked_actions': [case_data.get('proposed_action', 'unknown')],
                'allowed_actions': []
            }
        
        # Check ethical risk threshold
        if ethical_recommendation == 'DO_NOT_PROCEED':
            return {
                'decision': 'BLOCKED',
                'reason': f'Ethical risk too high ({total_ethical_risk}/100)',
                'override_allowed': True,
                'approval_level': 'compliance_officer',
                'blocked_actions': [case_data.get('proposed_action', 'unknown')],
                'allowed_actions': []
            }
        
        # Check if supervisor approval required
        if ethical_recommendation == 'REQUIRE_SUPERVISOR_APPROVAL' or vulnerability_flag:
            return {
                'decision': 'REVIEW_REQUIRED',
                'reason': 'Vulnerable debtor or moderate ethical risk',
                'override_allowed': True,
                'approval_level': 'supervisor',
                'tentative_action': case_data.get('proposed_action'),
                'allowed_actions': [],
                'blocked_actions': []
            }
        
        # Warnings but allowed
        if compliance_status == 'PASSED_WITH_WARNINGS':
            return {
                'decision': 'REVIEW_REQUIRED',
                'reason': 'Compliance warnings detected',
                'override_allowed': True,
                'approval_level': 'supervisor',
                'warnings': compliance_results.get('warnings', []),
                'allowed_actions': [case_data.get('proposed_action')],
                'blocked_actions': []
            }
        
        # All clear
        return {
            'decision': 'ALLOWED',
            'reason': 'All checks passed',
            'confidence': 0.92,
            'override_allowed': False,  # No need to override
            'allowed_actions': [case_data.get('proposed_action')],
            'blocked_actions': []
        }
    
    def _get_timestamp(self) -> str:
        """Get current ISO timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
