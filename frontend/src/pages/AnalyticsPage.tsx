import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isRefreshing ? '#6B7280' : '#7C3AED',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isRefreshing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!isRefreshing) {
                            e.currentTarget.style.backgroundColor = '#6D28D9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isRefreshing) {
                            e.currentTarget.style.backgroundColor = '#7C3AED';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }
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

            <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Status Distribution</h3>
                    <div style={{ height: '300px' }}>
                        <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Aging Buckets</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={agingChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>DCA Performance</h3>
                <div style={{ height: '300px' }}>
                    <Bar data={dcaChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                </div>
            </div>
        </div>
    );
}
