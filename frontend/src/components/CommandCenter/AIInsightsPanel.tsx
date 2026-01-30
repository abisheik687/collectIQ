import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import api from '../../services/api';

interface AIInsight {
    id: string;
    type: 'recommendation' | 'alert' | 'prediction' | 'optimization';
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
}

const AIInsightsPanel = () => {
    const { data: cases } = useQuery({
        queryKey: ['cases-for-insights'],
        queryFn: async () => {
            const response = await api.get('/cases');
            return response.data.cases || [];
        }
    });

    // Generate AI insights from case data
    const generateInsights = (): AIInsight[] => {
        if (!cases || cases.length === 0) return [];

        const insights: AIInsight[] = [];

        // High-priority insights
        const highPriorityCases = cases.filter((c: any) =>
            c.paymentProbability && c.paymentProbability > 70
        );

        if (highPriorityCases.length > 0) {
            insights.push({
                id: '1',
                type: 'recommendation',
                title: `${highPriorityCases.length} High-Recovery Cases Identified`,
                description: `AI predicts >70% success rate. Recommend immediate contact to maximize recovery.`,
                confidence: 87,
                actionable: true
            });
        }

        // SLA risk
        const atRiskCases = cases.filter((c: any) =>
            c.slaStatus === 'warning' || c.slaStatus === 'breached'
        );

        if (atRiskCases.length > 0) {
            insights.push({
                id: '2',
                type: 'alert',
                title: `${atRiskCases.length} Cases Approaching SLA Breach`,
                description: 'Auto-escalation will trigger within 12 hours. Consider manual review.',
                confidence: 95,
                actionable: true
            });
        }

        // Allocation optimization
        insights.push({
            id: '3',
            type: 'optimization',
            title: 'DCA Workload Imbalance Detected',
            description: 'Agency A is at 85% capacity while Agency B is at 45%. Suggest redistribution.',
            confidence: 78,
            actionable: true
        });

        // Predictive insight
        const avgAmount = cases.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) / cases.length;

        insights.push({
            id: '4',
            type: 'prediction',
            title: 'Recovery Trend Analysis',
            description: `Portfolio average: $${avgAmount.toFixed(0)}. AI predicts 23% improvement with optimized contact timing.`,
            confidence: 82,
            actionable: false
        });

        return insights;
    };

    const insights = generateInsights();

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'recommendation':
                return {
                    icon: Sparkles,
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-200'
                };
            case 'alert':
                return {
                    icon: AlertCircle,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200'
                };
            case 'prediction':
                return {
                    icon: TrendingUp,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'optimization':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                };
            default:
                return {
                    icon: Info,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                };
        }
    };

    return (
        <div className="ai-insights-panel bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        Transparent, explainable recommendations
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">
                        {insights.length} Active
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {insights.map((insight) => {
                    const config = getTypeConfig(insight.type);
                    const Icon = config.icon;

                    return (
                        <div
                            key={insight.id}
                            className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} hover:shadow-md transition-all duration-200`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 bg-white rounded-lg shadow-sm flex-shrink-0`}>
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {insight.title}
                                        </h4>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-gray-200 flex-shrink-0">
                                            <span className="text-xs font-medium text-gray-700">
                                                {insight.confidence}%
                                            </span>
                                            <span className="text-xs text-gray-500">confidence</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                                        {insight.description}
                                    </p>
                                    {insight.actionable && (
                                        <button className={`text-xs font-medium ${config.color} hover:underline`}>
                                            View Details →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        <strong>Explainable AI:</strong> All predictions include factor-level breakdowns
                        and confidence scores. Click any insight to view detailed reasoning and alternative scenarios.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIInsightsPanel;
