"""
AI Compliance Decision Demo Script
For 3-minute hackathon presentation

This script tests the compliance engine with the demo cases
"""

import json
import requests
import sys

# Load demo cases
with open('../sample-data/compliance_demo_cases.json', 'r') as f:
    demo_data = json.load(f)

ML_API_URL = 'http://localhost:8000'

def test_case(case_number):
    """Test a specific demo case"""
    case = None
    for c in demo_data['cases']:
        if c['case_number'] == case_number:
            case = c
            break
    
    if not case:
        print(f"Case {case_number} not found")
        return
    
    print(f"\n{'='*80}")
    print(f"CASE: {case['case_number']} - {case['scenario']}")
    print(f"{'='*80}\n")
    
    # Make decision request
    response = requests.post(
        f"{ML_API_URL}/compliance/decide",
        json={
            'case_data': case['context'],
            'proposed_action': case['proposed_action']
        }
    )
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    decision = response.json()
    
    # Display decision
    print(f"DECISION: {decision['decision']}")
    print(f"\nCompliance Status: {decision['compliance_validation']['status']}")
    print(f"Ethical Risk Score: {decision['ethical_risk_assessment']['total_score']}/100")
    
    # Show violations if any
    if decision['compliance_validation'].get('violated_rules'):
        print(f"\n🚫 VIOLATIONS DETECTED:")
        for violation in decision['compliance_validation']['violated_rules']:
            print(f"  - {violation['rule']}")
            print(f"    {violation['legal_reference']}")
            print(f"    Penalty: {violation.get('potential_penalty', 'N/A')}\n")
    
    # Show alternatives if any
    if decision.get('alternative_actions'):
        print(f"\n✅ SAFER ALTERNATIVES:")
        for alt in decision['alternative_actions']:
            print(f"  - {alt['action']}: {alt['reason']}")
    
    # Show explanation summary
    print(f"\n📋 EXPLANATION SUMMARY:")
    print(decision['explanation']['decision_summary'])
    
    print(f"\n{'='*80}\n")


def demo_flow():
    """Run the 3-minute demo flow"""
    
    print("\n" + "="*80)
    print("AI COMPLIANCE DECISION SYSTEM - DEMO FLOW")
    print("="*80 + "\n")
    
    # Demo 1: Disputed Debt - Critical Violation
    print("DEMO 1: Disputed Debt (Critical FDCPA Violation)")
    test_case("CASE-10004")
    
    input("Press Enter to continue to Demo 2...")
    
    # Demo 2: Vulnerable Debtor - Requires Approval
    print("\nDEMO 2: Vulnerable Debtor Protection")
    test_case("CASE-10007")
    
    input("Press Enter to continue to Demo 3...")
    
    # Demo 3: Compliant Action - Allowed
    print("\nDEMO 3: Compliant Action (Low Risk)")
    test_case("CASE-10001")
    
    print("\n" + "="*80)
    print("DEMO COMPLETE")
    print("="*80 + "\n")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        case_number = sys.argv[1]
        test_case(case_number)
    else:
        demo_flow()
