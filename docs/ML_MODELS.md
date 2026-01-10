# CollectIQ ML Models Documentation

## Overview

CollectIQ uses machine learning to predict payment probability and classify risk for debt collection cases. This document explains the models, features, training process, and API usage.

---

## Models

### 1. Payment Probability Predictor

**Algorithm**: Random Forest Classifier

**Purpose**: Predict the likelihood of payment recovery (0-100%)

**Features**:
- `overdueDays`: Number of days the account is overdue
- `amount`: Outstanding balance amount
- `historicalPayments`: Count of previous successful payments
- `contactFrequency`: Number of contact attempts made

**Output**:
- `paymentProbability`: Score from 0-100
- `riskScore`: Inverse of payment probability (100 - paymentProbability)
- `priority`: Classification (high/medium/low)
- `confidence`: Model confidence score

**Training Data**: 1000 synthetic records with realistic distributions

**Performance Metrics**:
- Accuracy: ~85-90%
- Precision: ~84%
- Recall: ~89%

---

### 2. Risk Scoring Engine

**Type**: Hybrid (ML + Rule-based)

**Purpose**: Classify cases into risk levels

**Risk Levels**:
- **High Risk** (70-100): Low recovery probability, requires immediate attention
- **Medium Risk** (40-69): Moderate recovery probability, standard process
- **Low Risk** (0-39): High recovery probability, automated workflows

**Risk Factors Considered**:
- Payment probability from ML model
- Overdue period length
- Outstanding amount
- Historical default patterns
- Contact attempt frequency

---

### 3. Case Prioritizer

**Type**: Weighted scoring algorithm

**Purpose**: Rank cases for optimal resource allocation

**Weighting**:
- Payment Probability: 40%
- Amount: 30%
- Overdue Criticality: 20%
- SLA Status: 10%

**Output**: Priority score (0-100) and classification (high/medium/low)

---

## Model Training

### Prerequisites

```bash
cd ml-models
pip install -r requirements.txt
```

### Training Process

```bash
python training/train_model.py
```

This will:
1. Generate 1000 synthetic training records
2. Split data (80% train, 20% test)
3. Train Random Forest classifier
4. Evaluate performance
5. Save model artifacts to `models/`

### Model Files

- `models/payment_predictor.pkl`: Trained Random Forest model
- `models/scaler.pkl`: Feature scaler (StandardScaler)

---

## API Usage

### Start ML API Server

```bash
python api.py
```

Server runs on `http://localhost:8000`

### Endpoints

#### 1. Predict Payment Probability

**POST** `/predict`

```json
{
  "overdueDays": 45,
  "amount": 5000,
  "historicalPayments": 3,
  "contactFrequency": 2
}
```

**Response**:
```json
{
  "paymentProbability": 68.5,
  "riskScore": 31.5,
  "priority": "medium",
  "confidence": 85.2,
  "riskLevel": "medium",
  "riskFactors": []
}
```

#### 2. Score Risk

**POST** `/score-risk`

```json
{
  "paymentProbability": 45,
  "overdueDays": 120,
  "amount": 15000
}
```

**Response**:
```json
{
  "riskScore": 75.0,
  "riskLevel": "high",
  "riskFactors": [
    "Long overdue period",
    "High outstanding amount"
  ]
}
```

#### 3. Prioritize Cases

**POST** `/prioritize`

```json
{
  "paymentProbability": 70,
  "amount": 8000,
  "overdueDays": 60,
  "slaStatus": "warning"
}
```

**Response**:
```json
{
  "priorityScore": 72.5,
  "priorityLevel": "high"
}
```

---

## Feature Engineering

### Input Normalization

All features are normalized using `StandardScaler` before model prediction to ensure consistent scale.

### Feature Importance

Based on training:
1. **Overdue Days** (35%): Most significant predictor
2. **Historical Payments** (30%): Strong positive indicator
3. **Amount** (20%): Moderate impact
4. **Contact Frequency** (15%): Declining returns

---

## Model Updates

### Retraining

Models should be retrained periodically with real production data:

```bash
# Update training data
cp production_data.csv training/data.csv

# Retrain
python training/train_model.py

# Restart API to load new model
```

### A/B Testing

To test new models:
1. Save new model with version suffix: `payment_predictor_v2.pkl`
2. Deploy alongside existing model
3. Route percentage of traffic to new model
4. Compare performance metrics

---

## Fallback Mechanism

If ML model files are unavailable, the system automatically falls back to rule-based scoring:

- Simple heuristic algorithm
- Deterministic results
- Lower accuracy but guaranteed availability
- Logged as `confidence: 0` in responses

---

## Integration with Backend

The Node.js backend calls the ML API via HTTP:

```typescript
const prediction = await axios.post('http://ml-api:8000/predict', {
  overdueDays: caseData.overdueDays,
  amount: caseData.amount,
  historicalPayments: caseData.historicalPayments,
  contactFrequency: 0
});

// Use prediction.data.paymentProbability
```

---

## Performance Considerations

- **Model Loading**: Models are loaded once at startup (~200ms)
- **Prediction Latency**: ~10-50ms per request
- **Throughput**: ~500 predictions/second (single instance)
- **Memory**: ~150MB for loaded models

---

## Future Enhancements

1. **Deep Learning**: Explore neural networks for improved accuracy
2. **Time Series**: Predict optimal contact timing
3. **NLP**: Analyze communication history for sentiment
4. **Ensemble**: Combine multiple models for better predictions
5. **AutoML**: Automated hyperparameter tuning

---

## Troubleshooting

### Model Not Found

```
Warning: Model files not found. Using fallback prediction.
```

**Solution**: Run `python training/train_model.py` to generate models

### Low Accuracy

**Solutions**:
- Increase training data size
- Tune hyperparameters (n_estimators, max_depth)
- Add more relevant features
- Address class imbalance

### API Errors

Check:
- Flask server is running
- Correct port (8000)
- Valid JSON in requests
- All required fields present

---

For questions or issues, refer to the main README or create an issue in the repository.
