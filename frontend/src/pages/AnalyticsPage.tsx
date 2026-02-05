import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { RefreshCw, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['analytics-aging'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics-status'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics-dca'] });
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const { data: agingBuckets } = useQuery({
        queryKey: ['analytics-aging'],
        queryFn: async () => {
            const response = await api.get('/analytics/aging-buckets');
            return response.data.buckets;
        },
        refetchInterval: 15000, // Auto-refresh every 15 seconds
    });

    const { data: statusDist } = useQuery({
        queryKey: ['analytics-status'],
        queryFn: async () => {
            const response = await api.get('/analytics/status-distribution');
            return response.data.distribution;
        },
        refetchInterval: 15000, // Auto-refresh every 15 seconds
    });

    const { data: dcaPerformance } = useQuery({
        queryKey: ['analytics-dca'],
        queryFn: async () => {
            const response = await api.get('/analytics/dca-performance');
            return response.data.performance;
        },
        refetchInterval: 15000, // Auto-refresh every 15 seconds
    });

    const agingChartData = {
        labels: agingBuckets?.map((b: any) => b.bucket) || [],
        datasets: [
            {
                label: 'Cases by Aging',
                data: agingBuckets?.map((b: any) => b.count) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
        ],
    };

    const statusChartData = {
        labels: statusDist?.map((s: any) => s.status.replace('_', ' ')) || [],
        datasets: [
            {
                label: 'Cases',
                data: statusDist?.map((s: any) => s.count) || [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(245, 158, 11, 0.5)',
                    'rgba(239, 68, 68, 0.5)',
                    'rgba(139, 92, 246, 0.5)',
                ],
            },
        ],
    };

    const dcaChartData = {
        labels: dcaPerformance?.map((d: any) => d.dca_name) || [],
        datasets: [
            {
                label: 'Total Cases',
                data: dcaPerformance?.map((d: any) => d.total_cases) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
            {
                label: 'Resolved Cases',
                data: dcaPerformance?.map((d: any) => d.resolved_cases) || [],
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
            },
        ],
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Analytics & Insights"
                subtitle="Real-time case metrics, trends, and performance analytics with auto-refresh"
            />

            {/* Refresh Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <RefreshCw
                        size={16}
                        style={{
                            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                        }}
                    />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Status Distribution */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart size={18} />
                        Status Distribution
                    </div>
                    <div className="card-padding">
                        <div style={{ height: '300px' }}>
                            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>

                {/* Aging Buckets */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={18} />
                        Aging Buckets
                    </div>
                    <div className="card-padding">
                        <div style={{ height: '300px' }}>
                            <Bar data={agingChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* DCA Performance */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} />
                    DCA Performance Comparison
                </div>
                <div className="card-padding">
                    <div style={{ height: '350px' }}>
                        <Bar data={dcaChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
