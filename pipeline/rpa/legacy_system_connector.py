"""
Simulated RPA Script for Legacy System Data Extraction

This script demonstrates how CollectIQ would integrate with legacy systems
using robotic process automation to extract overdue account data.
"""

import json
import random
from datetime import datetime, timedelta

def simulate_legacy_extraction():
    """
    Simulates extraction of data from a legacy system.
    In production, this would use actual RPA tools like UiPath, Automation Anywhere, etc.
    """
    print("[ RPA ] Connecting to legacy system...")
    print("[ RPA ] Authenticating...")
    print("[ RPA ] Navigating to overdue accounts module...")
    print("[ RPA ] Extracting data...")
    
    # Simulate extracted data
    extracted_accounts = []
    
    for i in range(5):
        account = {
            "account_number": f"LEG-{random.randint(10000, 99999)}",
            "customer_name": f"Customer {i+1}",
            "amount": round(random.uniform(1000, 20000), 2),
            "overdue_days": random.randint(30, 180),
            "last_payment_date": (datetime.now() - timedelta(days=random.randint(60, 365))).isoformat(),
            "customer_phone": f"+1-555-{random.randint(1000, 9999)}",
            "customer_email": f"customer{i+1}@example.com"
        }
        extracted_accounts.append(account)
    
    print(f"[ RPA ] Extracted {len(extracted_accounts)} accounts")
    
    # Save to file for processing
    output_file = 'extracted_accounts.json'
    with open(output_file, 'w') as f:
        json.dump(extracted_accounts, f, indent=2)
    
    print(f"[ RPA ] Data saved to {output_file}")
    print("[ RPA ] Disconnecting from legacy system...")
    
    return extracted_accounts

if __name__ == '__main__':
    print("=== CollectIQ RPA - Legacy System Connector ===")
    accounts = simulate_legacy_extraction()
    print(f"\n✓ Successfully extracted {len(accounts)} overdue accounts")
    print("\nSample record:")
    print(json.dumps(accounts[0], indent=2))
