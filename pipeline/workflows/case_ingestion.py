"""
Case Ingestion Workflow

Automated workflow for:
1. Loading sample/external data
2. Enriching with ML predictions
3. Creating cases in the system
4. Initializing workflows
"""

import sys
import os
import json
import requests

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def ingest_cases(data_source):
    """Main case ingestion workflow"""
    print(f"=== Case Ingestion Workflow ===")
    print(f"Source: {data_source}")
    
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    ml_api_url = os.getenv('ML_API_URL', 'http://localhost:8000')
    
    # Load data
    with open(data_source, 'r') as f:
        accounts = json.load(f)
    
    print(f"\nLoaded {len(accounts)} accounts")
    
    ingested_count = 0
    
    for account in accounts:
        try:
            print(f"\nProcessing: {account.get('account_number')}")
            
            # Step 1: Get ML prediction
            ml_payload = {
                'overdueDays': account.get('overdue_days', 30),
                'amount': account.get('amount', 0),
                'historicalPayments': account.get('historical_payments', 0),
                'contactFrequency': 0
            }
            
            print("  → Requesting ML prediction...")
            ml_response = requests.post(f'{ml_api_url}/predict', json=ml_payload)
            prediction = ml_response.json()
            
            print(f"  → Payment Probability: {prediction['paymentProbability']}%")
            print(f"  → Priority: {prediction['priority']}")
            
            # Step 2: Create case via API
            case_payload = {
                'accountNumber': account['account_number'],
                'customerName': account['customer_name'],
                'amount': account['amount'],
                'overdueDays': account['overdue_days'],
                'historicalPayments': account.get('historical_payments', 0),
                'contactFrequency': 0
            }
            
            print("  → Creating case...")
            # Note: This would need authentication token in production
            # case_response = requests.post(f'{backend_url}/api/cases', json=case_payload)
            
            print("  ✓ Case created (simulated)")
            ingested_count += 1
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print(f"\n=== Workflow Complete ===")
    print(f"Successfully ingested: {ingested_count}/{len(accounts)} cases")

if __name__ == '__main__':
    # Use extracted data from RPA or sample data
    data_file = os.path.join(os.path.dirname(__file__), '..', '..', 'sample-data', 'users.json')
    
    if not os.path.exists(data_file):
        print("Error: Data file not found")
        sys.exit(1)
    
    # For demo, we'll simulate the workflow
    print("Case Ingestion Workflow - Demo Mode")
    print("In production, this would:")
    print("  1. Connect to data sources (RPA, API, CSV)")
    print("  2. Call ML API for scoring")
    print("  3. Create cases via backend API")
    print("  4. Initialize workflows")
    print("\nWorkflow ready for  execution.")
