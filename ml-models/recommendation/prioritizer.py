class CasePrioritizer:
    def __init__(self):
        pass
    
    def calculate_priority_score(self, features):
        """
        Calculate a composite priority score (0-100)
        Higher score = higher priority for recovery efforts
        
        Combines:
        - Payment probability
        - Amount
        - Overdue days
        - SLA status
        """
        score = 0
        
        # Payment probability weight: 40%
        payment_prob = features.get('paymentProbability', 50)
        score += payment_prob * 0.4
        
        # Amount weight: 30% (normalized to 0-100)
        amount = features.get('amount', 0)
        # Assume max important amount is $20,000
        amount_score = min(amount / 20000 * 100, 100)
        score += amount_score * 0.3
        
        # Overdue criticality: 20%
        overdue_days = features.get('overdueDays', 0)
        if 30 <= overdue_days <= 90:
            # Sweet spot - not too fresh, not too old
            overdue_score = 100
        elif overdue_days < 30:
            overdue_score = 60
        elif overdue_days <= 120:
            overdue_score = 70
        else:
            overdue_score = 40  # Very old, lower priority
        score += overdue_score * 0.2
        
        # SLA urgency: 10%
        sla_status = features.get('slaStatus', 'on_track')
        sla_scores = {
            'breached': 100,
            'warning': 80,
            'on_track': 50
        }
        score += sla_scores.get(sla_status, 50) * 0.1
        
        return round(score, 2)
    
    def prioritize_cases(self, cases):
        """
        Prioritize a list of cases
        
        Args:
            cases: list of dicts with case features
        
        Returns:
            sorted list with priority scores
        """
        prioritized = []
        
        for case in cases:
            priority_score = self.calculate_priority_score(case)
            
            # Classify
            if priority_score >= 75:
                priority_level = 'high'
            elif priority_score >= 50:
                priority_level = 'medium'
            else:
                priority_level = 'low'
            
            prioritized.append({
                **case,
                'priorityScore': priority_score,
                'priorityLevel': priority_level
            })
        
        # Sort by priority score descending
        prioritized.sort(key=lambda x: x['priorityScore'], reverse=True)
        
        return prioritized
    
    def recommend_dca_assignment(self, case, available_dcas):
        """
        Recommend DCA assignment based on case characteristics and DCA performance
        
        Args:
            case: dict with case features
            available_dcas: list of dicts with DCA info (name, success_rate, current_load)
        
        Returns:
            recommended DCA
        """
        if not available_dcas:
            return None
        
        priority_score = self.calculate_priority_score(case)
        
        # For high priority cases, assign to best performing DCA
        if priority_score >= 75:
            best_dca = max(available_dcas, key=lambda x: x.get('success_rate', 0))
            return best_dca
        
        # For medium/low priority, balance load
        least_loaded = min(available_dcas, key=lambda x: x.get('current_load', 0))
        return least_loaded
