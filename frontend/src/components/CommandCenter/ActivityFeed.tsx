import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, UserPlus, Shield, Clock, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const ActivityFeed = () => {
    const { data: auditLogs } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            const response = await api.get('/audit?limit=10');
            return response.data.logs || [];
        },
        refetchInterval: 10000 // Refresh every 10 seconds for "live" feel
    });

    const getActivityIcon = (action: string) => {
        if (action.toLowerCase().includes('assign')) return UserPlus;
        if (action.toLowerCase().includes('violation')) return Shield;
        if (action.toLowerCase().includes('resolved') || action.toLowerCase().includes('close')) return CheckCircle2;
        if (action.toLowerCase().includes('sla')) return Clock;
        if (action.toLowerCase().includes('ml') || action.toLowerCase().includes('ai')) return TrendingUp;
        return Activity;
    };

    const getActivityColor = (action: string) => {
        if (action.toLowerCase().includes('violation')) return 'text-red-600 bg-red-50';
        if (action.toLowerCase().includes('resolved') || action.toLowerCase().includes('close')) return 'text-green-600 bg-green-50';
        if (action.toLowerCase().includes('assign')) return 'text-blue-600 bg-blue-50';
        if (action.toLowerCase().includes('ml') || action.toLowerCase().includes('ai')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="activity-feed bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Live Activity Stream</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Real-time governance monitoring
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Live</span>
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log: any, index: number) => {
                        const Icon = getActivityIcon(log.action);
                        const colorClass = getActivityColor(log.action);

                        return (
                            <div
                                key={log.id || index}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                            >
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {log.userName || 'System'} • Case #{log.entityId || 'N/A'}
                                    </p>
                                    {log.details && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {log.details}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {formatTime(log.timestamp || log.createdAt)}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>
                        Powered by <strong>Immutable Audit Ledger</strong> • 100% Traceability Guaranteed
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
