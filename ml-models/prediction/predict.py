import os
import joblib
import numpy as np

class PaymentPredictor:
    def __init__(self):
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        model_path = os.path.join(model_dir, 'payment_predictor.pkl')
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.is_trained = True
        except FileNotFoundError:
            print("Warning: Model files not found. Using fallback prediction.")
            self.is_trained = False
    
    def predict(self, features):
        """
        Predict payment probability
        
        Args:
            features: dict with keys: overdueDays, amount, historicalPayments, contactFrequency
        
        Returns:
            dict with paymentProbability, riskScore, priority
        """
        if not self.is_trained:
            return self._fallback_prediction(features)
        
        # Prepare input
        X = np.array([[
            features['overdueDays'],
            features['amount'],
            features['historicalPayments'],
            features['contactFrequency']
        ]])
        
        # Scale
        X_scaled = self.scaler.transform(X)
        
        # Predict
        prediction_class = self.model.predict(X_scaled)[0]
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        # Map to payment probability (0-100)
        class_to_prob = {
            'low': 25,
            'medium': 55,
            'high': 85
        }
        base_probability = class_to_prob.get(prediction_class, 50)
        
        # Add some variance based on probabilities
        confidence = max(probabilities)
        payment_probability = base_probability + (confidence - 0.5) * 20
        payment_probability = max(0, min(100, payment_probability))
        
        # Calculate risk score (inverse)
        risk_score = 100 - payment_probability
        
        # Determine priority
        if payment_probability >= 70:
            priority = 'high'
        elif payment_probability >= 40:
            priority = 'medium'
        else:
            priority = 'low'
        
        return {
            'paymentProbability': round(payment_probability, 2),
            'riskScore': round(risk_score, 2),
            'priority': priority,
            'confidence': round(confidence * 100, 2)
        }
    
    def predict_with_explanation(self, features):
        """
        Predict with full explainability - shows WHY the AI made this prediction
        
        Args:
            features: dict with keys: overdueDays, amount, historicalPayments, contactFrequency
        
        Returns:
            dict with prediction AND explanation of factors
        """
        # Get base prediction
        base_prediction = self.predict(features)
        
        if not self.is_trained:
            return {
                **base_prediction,
                'explanation': self._fallback_explanation(features, base_prediction)
            }
        
        # Extract feature importance from the model
        # RandomForest models have feature_importances_ attribute
        feature_names = ['overdueDays', 'amount', 'historicalPayments', 'contactFrequency']
        feature_values = [
            features['overdueDays'],
            features['amount'],
            features['historicalPayments'],
            features['contactFrequency']
        ]
        
        try:
            feature_importances = self.model.feature_importances_
        except AttributeError:
            # Fallback if model doesn't have feature_importances_
            feature_importances = [0.4, 0.3, 0.2, 0.1]  # Default weights
        
        # Create factor explanations
        factors = []
        for i, name in enumerate(feature_names):
            impact = feature_importances[i] * 100
            value = feature_values[i]
            
            # Determine trend (positive or negative impact on payment probability)
            trend = self._determine_trend(name, value)
            
            # Human-readable explanation
            explanation_text = self._format_factor_explanation(name, value, trend, impact)
            
            factors.append({
                'factor': self._humanize_factor_name(name),
                'value': value,
                'impact': round(impact, 1),
                'trend': trend,
                'explanation': explanation_text
            })
        
        # Sort by impact (descending)
        factors.sort(key=lambda x: x['impact'], reverse=True)
        
        # Generate recommendation
        recommendation = self._generate_recommendation(base_prediction, factors)
        
        return {
            **base_prediction,
            'explanation': {
                'summary': f"Payment probability is {base_prediction['priority']} based on {len(factors)} key factors.",
                'factors': factors[:3],  # Top 3 most important factors
                'recommendation': recommendation,
                'reasoning': self._generate_reasoning(features, base_prediction)
            }
        }
    
    def _determine_trend(self, factor_name, value):
        """Determine if factor has positive or negative impact"""
        if factor_name == 'overdueDays':
            return 'negative' if value > 60 else 'neutral'
        elif factor_name == 'amount':
            return 'negative' if value > 10000 else 'neutral'
        elif factor_name == 'historicalPayments':
            return 'positive' if value > 0 else 'negative'
        elif factor_name == 'contactFrequency':
            return 'positive' if value > 2 else 'neutral'
        return 'neutral'
    
    def _humanize_factor_name(self, name):
        """Convert technical name to human-readable"""
        name_map = {
            'overdueDays': 'Days Overdue',
            'amount': 'Outstanding Amount',
            'historicalPayments': 'Payment History',
            'contactFrequency': 'Contact Attempts'
        }
        return name_map.get(name, name)
    
    def _format_factor_explanation(self, name, value, trend, impact):
        """Generate human-readable explanation for a factor"""
        if name == 'overdueDays':
            if value < 30:
                return f"Recently overdue ({value} days) - good recovery window"
            elif value < 90:
                return f"Moderately overdue ({value} days) - urgent action needed"
            else:
                return f"Significantly overdue ({value} days) - recovery challenging"
        elif name == 'amount':
            if value < 5000:
                return f"Moderate amount (${value:,.2f}) - easier to negotiate"
            else:
                return f"High amount (${value:,.2f}) - requires structured plan"
        elif name == 'historicalPayments':
            if value == 0:
                return "No payment history - unknown reliability"
            else:
                return f"{value} previous payments - established pattern"
        elif name == 'contactFrequency':
            if value == 0:
                return "No contact attempts yet"
            else:
                return f"{value} contact attempts - engagement tracked"
        return f"{name}: {value}"
    
    def _generate_recommendation(self, prediction, factors):
        """Generate actionable recommendation based on prediction"""
        prob = prediction['paymentProbability']
        
        if prob >= 70:
            return "HIGH PRIORITY: Contact within 24 hours. High likelihood of recovery with prompt action."
        elif prob >= 50:
            return "MEDIUM PRIORITY: Schedule contact within 48-72 hours. Structured payment plan recommended."
        elif prob >= 30:
            return "Contact with negotiation approach. Consider extended payment terms or settlement."
        else:
            return "LOW PRIORITY: Consider escalation or alternative resolution strategies."
    
    def _generate_reasoning(self, features, prediction):
        """Generate detailed reasoning for the prediction"""
        reasons = []
        
        if features['overdueDays'] > 90:
            reasons.append("Extended overdue period reduces recovery probability")
        
        if features['amount'] > 10000:
            reasons.append("High outstanding amount may require payment plan")
        
        if features['historicalPayments'] > 0:
            reasons.append(f"Customer has made {features['historicalPayments']} previous payments")
        else:
            reasons.append("No previous payment history available")
        
        if features['contactFrequency'] == 0:
            reasons.append("No contact attempts made yet - first contact critical")
        
        return " | ".join(reasons) if reasons else "Standard case profile"
    
    def _fallback_explanation(self, features, prediction):
        """Explanation for fallback (rule-based) predictions"""
        return {
            'summary': "Prediction based on rule-based analysis (ML model not available)",
            'factors': [
                {
                    'factor': 'Days Overdue',
                    'value': features['overdueDays'],
                    'impact': 40.0,
                    'trend': 'negative' if features['overdueDays'] > 60 else 'neutral'
                },
                {
                    'factor': 'Outstanding Amount',
                    'value': features['amount'],
                    'impact': 30.0,
                    'trend': 'negative' if features['amount'] > 10000 else 'neutral'
                }
            ],
            'recommendation': self._generate_recommendation(prediction, []),
            'reasoning': 'Rule-based fallback mode active'
        }
    
    def _fallback_prediction(self, features):
        """Rule-based fallback when model is not available"""
        score = 50
        
        # Overdue days impact
        if features['overdueDays'] < 30:
            score += 20
        elif features['overdueDays'] < 60:
            score += 10
        elif features['overdueDays'] < 90:
            score += 0
        elif features['overdueDays'] < 120:
            score -= 15
        else:
            score -= 30
        
        # Amount impact
        if features['amount'] < 2000:
            score += 15
        elif features['amount'] < 5000:
            score += 10
        elif features['amount'] < 10000:
            score += 0
        else:
            score -= 10
        
        # Historical payments
        score += min(features['historicalPayments'] * 5, 25)
        
        # Contact frequency
        score += min(features['contactFrequency'] * 2, 15)
        
        score = max(0, min(100, score))
        risk_score = 100 - score
        
        if score >= 70:
            priority = 'high'
        elif score >= 40:
            priority = 'medium'
        else:
            priority = 'low'
        
        return {
            'paymentProbability': round(score, 2),
            'riskScore': round(risk_score, 2),
            'priority': priority,
            'confidence': 0
        }
