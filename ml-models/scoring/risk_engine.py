class RiskEngine:
    def __init__(self):
        self.risk_thresholds = {
            'high': 70,
            'medium': 40,
            'low': 0
        }
    
    def calculate_risk_score(self, features):
        """
        Calculate risk score from 0-100 (higher = more risky)
        
        Args:
            features: dict with payment_probability and other factors
        """
        # Base risk is inverse of payment probability
        base_risk = 100 - features.get('paymentProbability', 50)
        
        # Adjust for overdue days
        overdue_days = features.get('overdueDays', 0)
        if overdue_days > 120:
            base_risk += 15
        elif overdue_days > 90:
            base_risk += 10
        elif overdue_days > 60:
            base_risk += 5
        
        # Adjust for amount
        amount = features.get('amount', 0)
        if amount > 15000:
            base_risk += 10
        elif amount > 10000:
            base_risk += 5
        
        # Historical defaults adjustment
        historical_defaults = features.get('historicalDefaults', 0)
        base_risk += historical_defaults * 10
        
        # Clamp to 0-100
        risk_score = max(0, min(100, base_risk))
        
        return risk_score
    
    def classify_risk(self, risk_score):
        """Classify risk level"""
        if risk_score >= self.risk_thresholds['high']:
            return 'high'
        elif risk_score >= self.risk_thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    def get_risk_assessment(self, features):
        """Complete risk assessment"""
        risk_score = self.calculate_risk_score(features)
        risk_level = self.classify_risk(risk_score)
        
        # Risk factors
        risk_factors = []
        
        if features.get('overdueDays', 0) > 90:
            risk_factors.append('Long overdue period')
        
        if features.get('amount', 0) > 10000:
            risk_factors.append('High outstanding amount')
        
        if features.get('historicalPayments', 0) < 2:
            risk_factors.append('Limited payment history')
        
        if features.get('contactFrequency', 0) == 0:
            risk_factors.append('No contact attempts')
        
        return {
            'riskScore': round(risk_score, 2),
            'riskLevel': risk_level,
            'riskFactors': risk_factors
        }
