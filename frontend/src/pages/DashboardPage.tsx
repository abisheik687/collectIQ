import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
    const { data: cases } = useQuery({
        queryKey: ['cases'],
        queryFn: async () => {
            const response = await api.get('/cases');
            return response.data.cases;
        },
    });

    const { data: analytics } = useQuery({
        queryKey: ['analytics-recovery'],
        queryFn: async () => {
            const response = await api.get('/analytics/recovery-rate');
            return response.data;
        },
    });

    const { data: sla } = useQuery({
        queryKey: ['analytics-sla'],
        queryFn: async () => {
            const response = await api.get('/analytics/sla-compliance');
            return response.data;
        },
    });

    const stats = [
        {
            label: 'Total Cases',
            value: analytics?.totalCases || 0,
            icon: LayoutDashboard,
            color: 'var(--primary)',
        },
        {
            label: 'Recovery Rate',
            value: `${analytics?.recoveryRate || 0}%`,
            icon: TrendingUp,
            color: 'var(--success)',
        },
        {
            label: 'SLA Compliance',
            value: `${sla?.complianceRate || 0}%`,
            icon: Clock,
            color: 'var(--info)',
        },
        {
            label: 'SLA Breaches',
            value: sla?.breached || 0,
            icon: AlertTriangle,
            color: 'var(--danger)',
        },
    ];

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Enterprise Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: `${stat.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                        }}>
                            <stat.icon size={24} style={{ color: stat.color }} />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent Cases */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Recent Cases</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Case #</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Overdue</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Assigned DCA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases?.slice(0, 10).map((caseItem: any) => (
                                <tr key={caseItem.id}>
                                    <td><code>{caseItem.caseNumber}</code></td>
                                    <td>{caseItem.customerName}</td>
                                    <td>${caseItem.amount.toLocaleString()}</td>
                                    <td>{caseItem.overdueDays} days</td>
                                    <td>
                                        <span className={`badge badge-${caseItem.priority}`}>
                                            {caseItem.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge">{caseItem.status.replace('_', ' ')}</span>
                                    </td>
                                    <td>{caseItem.assignedDcaName || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Import LayoutDashboard from lucide-react at the top
import { LayoutDashboard } from 'lucide-react';
