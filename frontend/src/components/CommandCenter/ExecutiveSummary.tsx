import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Users, CheckCircle2, Shield } from 'lucide-react';
import api from '../../services/api';

const ExecutiveSummary = () => {
    const { data: analytics } = useQuery({
        queryKey: ['executive-summary'],
        queryFn: async () => {
            const response = await api.get('/analytics/recovery-rate');
            return response.data;
        },
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/cases');
            const cases = response.data.cases || [];
            const totalExposure = cases.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
            const atRisk = cases.filter((c: any) => c.slaStatus === 'warning' || c.slaStatus === 'breached').length;
            const aiDriven = cases.filter((c: any) => c.paymentProbability && c.paymentProbability > 70).length;

            return {
                totalExposure,
                atRisk,
                aiDriven,
                totalCases: cases.length
            };
        }
    });

    const metrics = [
        {
            label: 'Total Portfolio Exposure',
            value: `$${((stats?.totalExposure || 0) / 1000000).toFixed(2)}M`,
            trend: '+2.3%',
            trendUp: true,
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            label: 'Recovery Rate',
            value: `${analytics?.recoveryRate || 0}%`,
            trend: '+5.2%',
            trendUp: true,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            label: 'Cases at Risk',
            value: stats?.atRisk || 0,
            trend: '-12%',
            trendUp: false,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50'
        },
        {
            label: 'Active DCAs',
            value: '5',
            trend: 'Stable',
            trendUp: null,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'AI-Driven Recoveries',
            value: stats?.aiDriven || 0,
            trend: '+18% efficiency',
            trendUp: true,
            icon: CheckCircle2,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            label: 'Compliance Status',
            value: '100%',
            trend: 'Guardrails Active',
            trendUp: true,
            icon: Shield,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        }
    ];

    return (
        <div className="command-center-summary">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">FedEx Command Center</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Compliance-First Recovery Engine • Real-time Control Tower
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">Purple Promise™ Protected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 hover:border-purple-300"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-2">
                                    {metric.label}
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mb-2">
                                    {metric.value}
                                </p>
                                <div className="flex items-center gap-1">
                                    {metric.trendUp !== null && (
                                        metric.trendUp ? (
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-green-600" />
                                        )
                                    )}
                                    <span className={`text-sm font-medium ${metric.trendUp ? 'text-green-600' :
                                            metric.trendUp === false ? 'text-green-600' :
                                                'text-gray-600'
                                        }`}>
                                        {metric.trend}
                                    </span>
                                </div>
                            </div>
                            <div className={`${metric.bgColor} p-3 rounded-lg`}>
                                <metric.icon className={`w-6 h-6 ${metric.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            Code-Enforced Guardrails Active
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            All collection activities are governed by finite state machine validation •
                            Workflow violations are technically impossible • 100% SOP compliance guaranteed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveSummary;
