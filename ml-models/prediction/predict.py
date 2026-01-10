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
