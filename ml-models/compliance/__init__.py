"""
AI Compliance Decision System
Enterprise-grade compliance and ethical AI layer for debt collection

Components:
- compliance_engine: Rule-based compliance validator
- ethical_risk_scorer: ML-based harm assessment
- explainable_ai: Natural language explanation generator
- decision_orchestrator: Main decision coordination layer
"""

__version__ = "1.0.0"
__author__ = "CollectIQ Team"

from .compliance_engine import ComplianceEngine
from .ethical_risk_scorer import EthicalRiskScorer
from .explainable_ai import ExplainableAI
from .decision_orchestrator import DecisionOrchestrator

__all__ = [
    'ComplianceEngine',
    'EthicalRiskScorer',
    'ExplainableAI',
    'DecisionOrchestrator'
]
