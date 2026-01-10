import sys
import os
import time
import requests

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from connectors.db_connector import DBConnector

def check_sla_breaches():
    """Monitor SLA status and trigger escalations"""
    print("Starting SLA monitoring...")
    
    # Call backend API to trigger SLA check
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    
    try:
        # This would call a backend endpoint that runs WorkflowEngine.checkSLABreaches()
        response =requests.post(f'{backend_url}/api/internal/check-sla')
        
        if response.status_code == 200:
            print(f"SLA check completed: {response.json()}")
        else:
            print(f"SLA check failed: {response.status_code}")
    except Exception as e:
        print(f"Error checking SLA: {e}")

if __name__ == '__main__':
    print("SLA Monitor - Running...")
    check_sla_breaches()
    print("SLA Monitor - Complete")
