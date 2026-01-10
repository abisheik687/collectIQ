import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
    const { data: agingBuckets } = useQuery({
        queryKey: ['analytics-aging'],
        queryFn: async () => {
            const response = await api.get('/analytics/aging-buckets');
            return response.data.buckets;
        },
    });

    const { data: statusDist } = useQuery({
        queryKey: ['analytics-status'],
        queryFn: async () => {
            const response = await api.get('/analytics/status-distribution');
            return response.data.distribution;
        },
    });

    const { data: dcaPerformance } = useQuery({
        queryKey: ['analytics-dca'],
        queryFn: async () => {
            const response = await api.get('/analytics/dca-performance');
            return response.data.performance;
        },
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
            <h1 style={{ marginBottom: '2rem' }}>Analytics Dashboard</h1>

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
