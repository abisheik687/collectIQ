import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Clock, AlertTriangle, LayoutDashboard, UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function DashboardPage() {
    const queryClient = useQueryClient();
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<any>(null);
    const [selectedDca, setSelectedDca] = useState('');

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

    const assignMutation = useMutation({
        mutationFn: async ({ caseId, dcaId, dcaName }: any) => {
            const response = await api.post(`/cases/${caseId}/assign`, { dcaId, dcaName });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            toast.success('Case assigned successfully!');
            setAssignModalOpen(false);
            setSelectedCase(null);
            setSelectedDca('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign case');
        },
    });

    const handleAssignClick = (caseItem: any) => {
        setSelectedCase(caseItem);
        setAssignModalOpen(true);
    };

    const handleAssignSubmit = () => {
        if (!selectedDca) {
            toast.error('Please select a DCA');
            return;
        }

        const dcaOptions: any = {
            '2': 'Premium Recovery Solutions',
            '3': 'Elite Collections Inc',
        };

        assignMutation.mutate({
            caseId: selectedCase.id,
            dcaId: parseInt(selectedDca),
            dcaName: dcaOptions[selectedDca],
        });
    };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Enterprise Dashboard</h1>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
                    className="btn btn-secondary"
                    title="Refresh Dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Clock size={16} style={{ marginRight: '0.5rem' }} />
                    Refresh Data
                </button>
            </div>

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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases?.slice(0, 10).map((caseItem: any) => (
                                <tr
                                    key={caseItem.id}
                                    style={
                                        ['resolved', 'closed'].includes(caseItem.status)
                                            ? { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e' }
                                            : {}
                                    }
                                >
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
                                        <span className="badge" style={
                                            ['resolved', 'closed'].includes(caseItem.status)
                                                ? { backgroundColor: '#22c55e', color: 'white' }
                                                : {}
                                        }>
                                            {caseItem.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{caseItem.assignedDcaName || '-'}</td>
                                    <td>
                                        {!caseItem.assignedDcaId && (
                                            <button
                                                onClick={() => handleAssignClick(caseItem)}
                                                className="btn btn-sm btn-primary"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                            >
                                                <UserPlus size={14} style={{ marginRight: '0.25rem' }} />
                                                Assign
                                            </button>
                                        )}
                                        {caseItem.assignedDcaId && (
                                            <button
                                                onClick={() => handleAssignClick(caseItem)}
                                                className="btn btn-sm btn-secondary"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                            >
                                                Reassign
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Modal */}
            {assignModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Assign Case to DCA</h3>

                        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><strong>Case:</strong> {selectedCase?.caseNumber}</p>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><strong>Customer:</strong> {selectedCase?.customerName}</p>
                            <p style={{ fontSize: '0.875rem' }}><strong>Amount:</strong> ${selectedCase?.amount.toLocaleString()}</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select DCA Collector</label>
                            <select
                                className="form-input"
                                value={selectedDca}
                                onChange={(e) => setSelectedDca(e.target.value)}
                            >
                                <option value="">-- Select DCA --</option>
                                <option value="2">Premium Recovery Solutions (DCA 1)</option>
                                <option value="3">Elite Collections Inc (DCA 2)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={handleAssignSubmit}
                                className="btn btn-primary"
                                disabled={assignMutation.isPending}
                                style={{ flex: 1 }}
                            >
                                {assignMutation.isPending ? 'Assigning...' : 'Assign Case'}
                            </button>
                            <button
                                onClick={() => {
                                    setAssignModalOpen(false);
                                    setSelectedCase(null);
                                    setSelectedDca('');
                                }}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
