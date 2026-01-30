from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from prediction.predict import PaymentPredictor
from scoring.risk_engine import RiskEngine
from recommendation.prioritizer import CasePrioritizer
from compliance.decision_orchestrator import DecisionOrchestrator

app = Flask(__name__)
CORS(app)

# Initialize ML components
predictor = PaymentPredictor()
risk_engine = RiskEngine()
prioritizer = CasePrioritizer()
compliance_orchestrator = DecisionOrchestrator()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'CollectIQ ML API',
        'version': '1.0.0',
        'modules': ['predictor', 'risk_engine', 'prioritizer', 'compliance_engine']
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Original prediction endpoint - payment probability"""
    try:
        data = request.json
        prediction = predictor.predict(data)
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

@app.route('/predict/explain', methods=['POST'])
def predict_with_explanation():
    """
    Explainable AI endpoint - provides transparent predictions with factor explanations
    
    Request: { "overdueDays": 45, "amount": 5000, "historicalPayments": 2, "contactFrequency": 1 }
    Returns: Prediction + detailed explanation of factors and reasoning
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['overdueDays', 'amount', 'historicalPayments', 'contactFrequency']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Get explainable prediction
        result = predictor.predict_with_explanation(data)
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/allocate/smart', methods=['POST'])
def smart_allocation():
    """
    Smart DCA Allocation endpoint - AI-driven assignment with explanations
    
    Request: { "case": {...}, "available_dcas": [...] }
    Returns: Best-fit DCA with match score and reasons
    """
    try:
        data = request.get_json()
        
        case = data.get('case', {})
        available_dcas = data.get('available_dcas', [])
        
        if not case or not available_dcas:
            return jsonify({
                'success': False,
                'error': 'Missing case or available_dcas'
            }), 400
        
        # Add priority score to case
        case['priorityScore'] = prioritizer.calculate_priority_score(case)
        
        # Get smart allocation recommendation
        recommendation = prioritizer.recommend_dca_assignment(case, available_dcas)
        
        return jsonify({
            'success': True,
            'allocation': recommendation
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/compliance/decide', methods=['POST'])
def compliance_decide():
    """
    AI Compliance Decision Endpoint
    
    Request: { "case_data": {...}, "proposed_action": "send_sms" }
    Returns: Complete decision with compliance, ethical, explanation
    """
    try:
        data = request.get_json()
        
        case_data = data.get('case_data', {})
        proposed_action = data.get('proposed_action', '')
        
        if not proposed_action:
            return jsonify({'error': 'Missing proposed_action'}), 400
        
        # Make compliance decision
        decision = compliance_orchestrator.make_decision(case_data, proposed_action)
        
        return jsonify({
            'success': True,
            **decision
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    print(f"Starting CollectIQ ML API on port {port}")
    print(f"Model loaded: {predictor.is_trained}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
