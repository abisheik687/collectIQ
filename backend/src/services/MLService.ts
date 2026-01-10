import axios from 'axios';
import { logger } from '../utils/logger';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface PredictionInput {
    overdueDays: number;
    amount: number;
    historicalPayments: number;
    contactFrequency: number;
    customerAge?: number;
}

interface PredictionResponse {
    paymentProbability: number;
    riskScore: number;
    priority: 'high' | 'medium' | 'low';
}

class MLService {
    async predictPaymentProbability(input: PredictionInput): Promise<PredictionResponse> {
        try {
            const response = await axios.post(`${ML_API_URL}/predict`, input, {
                timeout: 5000,
            });

            return response.data;
        } catch (error: any) {
            logger.error('ML API call failed:', error.message);

            // Fallback to rule-based scoring if ML API is unavailable
            return this.fallbackScoring(input);
        }
    }

    private fallbackScoring(input: PredictionInput): PredictionResponse {
        logger.warn('Using fallback rule-based scoring');

        // Simple rule-based algorithm
        let score = 50;

        // Overdue days impact (negative)
        if (input.overdueDays < 30) score += 20;
        else if (input.overdueDays < 60) score += 10;
        else if (input.overdueDays < 90) score -= 10;
        else score -= 30;

        // Amount impact
        if (input.amount < 1000) score += 15;
        else if (input.amount < 5000) score += 5;
        else if (input.amount > 10000) score -= 10;

        // Historical payments (positive)
        score += Math.min(input.historicalPayments * 5, 25);

        // Contact frequency (positive)
        score += Math.min(input.contactFrequency * 3, 15);

        // Clamp between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Calculate risk score (inverse relationship)
        const riskScore = 100 - score;

        // Determine priority
        let priority: 'high' | 'medium' | 'low';
        if (score >= 70) priority = 'high';
        else if (score >= 40) priority = 'medium';
        else priority = 'low';

        return {
            paymentProbability: score,
            riskScore,
            priority,
        };
    }

    async scoreRisk(input: PredictionInput): Promise<number> {
        const prediction = await this.predictPaymentProbability(input);
        return prediction.riskScore;
    }

    async prioritizeCase(input: PredictionInput): Promise<'high' | 'medium' | 'low'> {
        const prediction = await this.predictPaymentProbability(input);
        return prediction.priority;
    }
}

export default new MLService();
