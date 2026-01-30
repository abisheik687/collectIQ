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
        Smart DCA Assignment - matches cases to best-fit DCA
        
        Args:
            case: dict with case features
            available_dcas: list of dicts with DCA info (id, name, success_rate, current_load, specialization)
        
        Returns:
            dict with recommended DCA and explanation
        """
        if not available_dcas:
            return None
        
        priority_score = self.calculate_priority_score(case)
        case_amount = case.get('amount', 0)
        
        # Score each DCA based on fit
        dca_scores = []
        for dca in available_dcas:
            score = 0
            reasons = []
            
            # Factor 1: Success rate (40% weight)
            success_rate = dca.get('success_rate', 50) / 100
            score += success_rate * 40
            if success_rate > 0.7:
                reasons.append(f"{dca['name']} has {success_rate*100:.0f}% success rate")
            
            # Factor 2: Workload capacity (30% weight)
            current_load = dca.get('current_load', 0)
            max_load = dca.get('max_load', 50)
            capacity = 1 - (current_load / max_load)
            score += capacity * 30
            if capacity > 0.5:
                reasons.append(f"Available capacity ({int(capacity*100)}%)")
            
            # Factor 3: Case complexity match (30% weight)
            specialization = dca.get('specialization', 'general')
            
            # High-value cases → specialist DCAs
            if priority_score >= 75 and specialization == 'high_value':
                score += 30
                reasons.append("Specializes in high-value cases")
            # Complex cases → experienced DCAs
            elif priority_score >= 50 and specialization == 'complex':
                score += 25
                reasons.append("Experienced with complex cases")
            # Standard cases → general DCAs
            elif specialization == 'general':
                score += 20
                reasons.append("General case handler")
            else:
                score += 15
            
            dca_scores.append({
                'dca_id': dca.get('id'),
                'dca_name': dca.get('name'),
                'score': round(score, 2),
                'reasons': reasons,
                'success_rate': success_rate * 100,
                'current_load': current_load
            })
        
        # Sort by score (descending)
        dca_scores.sort(key=lambda x: x['score'], reverse=True)
        
        best_match = dca_scores[0]
        
        return {
            'recommended_dca_id': best_match['dca_id'],
            'recommended_dca_name': best_match['dca_name'],
            'match_score': best_match['score'],
            'reasons': best_match['reasons'],
            'alternative': dca_scores[1] if len(dca_scores) > 1 else None,
            'explanation': self._format_assignment_explanation(case, best_match)
        }
    
    def _format_assignment_explanation(self, case, dca_match):
        """Generate human-readable explanation for DCA assignment"""
        priority = case.get('priority', 'medium')
        amount = case.get('amount', 0)
        
        explanation = f"Assigned to {dca_match['dca_name']} because: "
        explanation += " | ".join(dca_match['reasons'])
        
        if priority == 'high':
            explanation += " | High-priority case requires experienced handler"
        
        if amount > 10000:
            explanation += f" | High-value case (${amount:,.2f}) needs specialized attention"
        
        return explanation

