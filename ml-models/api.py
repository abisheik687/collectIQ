from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from prediction.predict import PaymentPredictor
from scoring.risk_engine import RiskEngine
from recommendation.prioritizer import CasePrioritizer

app = Flask(__name__)
CORS(app)

# Initialize ML components
predictor = PaymentPredictor()
risk_engine = RiskEngine()
prioritizer = CasePrioritizer()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor.is_trained
    })

@app.route('/predict', methods=['POST'])
def predict_payment():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['overdueDays', 'amount', 'historicalPayments', 'contactFrequency']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Get prediction
        prediction = predictor.predict(data)
        
        # Get risk assessment
        risk_features = {
            **data,
            'paymentProbability': prediction['paymentProbability']
        }
        risk_assessment = risk_engine.get_risk_assessment(risk_features)
        
        # Combine results
        result = {
            **prediction,
            'riskLevel': risk_assessment['riskLevel'],
            'riskFactors': risk_assessment['riskFactors']
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/score-risk', methods=['POST'])
def score_risk():
    try:
        data = request.get_json()
        
        risk_assessment = risk_engine.get_risk_assessment(data)
        return jsonify(risk_assessment)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/prioritize', methods=['POST'])
def prioritize():
    try:
        data = request.get_json()
        
        # Single case prioritization
        if 'cases' in data:
            prioritized_cases = prioritizer.prioritize_cases(data['cases'])
            return jsonify({'cases': prioritized_cases})
        else:
            # Single case score
            priority_score = prioritizer.calculate_priority_score(data)
            
            if priority_score >= 75:
                priority_level = 'high'
            elif priority_score >= 50:
                priority_level = 'medium'
            else:
                priority_level = 'low'
            
            return jsonify({
                'priorityScore': priority_score,
                'priorityLevel': priority_level
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend-dca', methods=['POST'])
def recommend_dca():
    try:
        data = request.get_json()
        
        case = data.get('case', {})
        available_dcas = data.get('available_dcas', [])
        
        recommendation = prioritizer.recommend_dca_assignment(case, available_dcas)
        
        return jsonify({'recommended_dca': recommendation})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    print(f"Starting CollectIQ ML API on port {port}")
    print(f"Model loaded: {predictor.is_trained}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
