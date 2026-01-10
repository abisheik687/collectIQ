import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Generate synthetic training data
def generate_training_data(n_samples=1000):
    np.random.seed(42)
    
    data = {
        'overdue_days': np.random.randint(1, 180, n_samples),
        'amount': np.random.uniform(100, 20000, n_samples),
        'historical_payments': np.random.randint(0, 10, n_samples),
        'contact_frequency': np.random.randint(0, 20, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate target based on features (probability of payment)
    # Higher historical payments, lower overdue days, moderate amount = higher probability
    probability = np.zeros(n_samples)
    
    for i in range(n_samples):
        score = 50  # Base score
        
        # Overdue days impact (negative)
        if df.loc[i, 'overdue_days'] < 30:
            score += 25
        elif df.loc[i, 'overdue_days'] < 60:
            score += 15
        elif df.loc[i, 'overdue_days'] < 90:
            score += 5
        elif df.loc[i, 'overdue_days'] < 120:
            score -= 10
        else:
            score -= 25
        
        # Amount impact
        if df.loc[i, 'amount'] < 2000:
            score += 15
        elif df.loc[i, 'amount'] < 5000:
            score += 10
        elif df.loc[i, 'amount'] < 10000:
            score += 0
        else:
            score -= 10
        
        # Historical payments (positive)
        score += df.loc[i, 'historical_payments'] * 5
        
        # Contact frequency (positive but diminishing)
        score += min(df.loc[i, 'contact_frequency'] * 2, 15)
        
        # Add some noise
        score += np.random.normal(0, 10)
        
        # Clamp
        probability[i] = max(0, min(100, score))
    
    df['payment_probability'] = probability
    
    # Create class labels (high/medium/low)
    df['payment_class'] = pd.cut(
        df['payment_probability'],
        bins=[0, 40, 70, 100],
        labels=['low', 'medium', 'high']
    )
    
    return df

# Train the model
def train_model():
    print("Generating training data...")
    df = generate_training_data(1000)
    
    # Features
    X = df[['overdue_days', 'amount', 'historical_payments', 'contact_frequency']]
    y = df['payment_class']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model and scaler
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'payment_predictor.pkl')
    scaler_path = os.path.join(model_dir, 'scaler.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\nModel saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance)
    
    return model, scaler

if __name__ == '__main__':
    train_model()
