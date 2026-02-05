import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Clock, AlertTriangle, LayoutDashboard, UserPlus, ArrowUpRight, ArrowDownRight, CheckCircle2, Upload, Zap, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import CSVUploadModal from '../components/CSVUploadModal';
import CommunicationModal from '../components/CommunicationModal';

export default function DashboardPage() {
    const queryClient = useQueryClient();
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [csvUploadOpen, setCSVUploadOpen] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [commModalOpen, setCommModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<any>(null);
    const [selectedDca, setSelectedDca] = useState('');

    const { data: cases } = useQuery({
        queryKey: ['cases'],
        queryFn: async () => {
            const response = await api.get('/cases');
            return response.data.cases;
        },
        refetchInterval: 5000, // Auto-refresh every 5 seconds
    });

    const { data: analytics } = useQuery({
        queryKey: ['analytics-recovery'],
        queryFn: async () => {
            const response = await api.get('/analytics/recovery-rate');
            return response.data;
        },
        refetchInterval: 10000, // Auto-refresh every 10 seconds
    });

    const { data: sla } = useQuery({
        queryKey: ['analytics-sla'],
        queryFn: async () => {
            const response = await api.get('/analytics/sla-compliance');
            return response.data;
        },
        refetchInterval: 10000, // Auto-refresh every 10 seconds
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

    const handleAutoAssign = async () => {
        setAutoAssigning(true);
        try {
            const res = await api.post('/admin/auto-assign');
            const { assigned, assignments } = res.data;

            // Count unique DCAs
            const uniqueDCAs = new Set(assignments.map((a: any) => a.dcaName)).size;

            toast.success(`Auto-assigned ${assigned} cases across ${uniqueDCAs} DCAs`, {
                duration: 4000,
            });

            // Refresh cases
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Auto-assignment failed');
        } finally {
            setAutoAssigning(false);
        }
    };

    const stats = [
        {
            label: 'Total Cases',
            value: analytics?.totalCases || 0,
            icon: LayoutDashboard,
            color: 'var(--primary)',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Recovery Rate',
            value: `${analytics?.recoveryRate || 0}%`,
            icon: TrendingUp,
            color: 'var(--success)',
            trend: '+3.2%',
            trendUp: true
        },
        {
            label: 'SLA Compliance',
            value: `${sla?.complianceRate || 0}%`,
            icon: Clock,
            color: 'var(--info)',
            trend: '-0.5%',
            trendUp: false
        },
        {
            label: 'SLA Breaches',
            value: sla?.breached || 0,
            icon: AlertTriangle,
            color: 'var(--danger)',
            trend: '0',
            trendUp: true
        },
    ];

    return (
        <div className="page-container">
            <PageHeader
                title="Enterprise Dashboard"
                subtitle="Overview of collection performance and compliance metrics"
                action={
                    <div className="flex gap-3">
                        <button
                            onClick={handleAutoAssign}
                            className="btn btn-accent"
                            disabled={autoAssigning}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Zap size={16} />
                            {autoAssigning ? 'Auto-Assigning...' : 'AI Auto-Assign'}
                        </button>
                        <button
                            onClick={() => setCSVUploadOpen(true)}
                            className="btn btn-secondary"
                        >
                            <Upload size={16} />
                            Bulk Upload
                        </button>
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
                            className="btn btn-secondary"
                            title="Refresh Dashboard"
                        >
                            <Clock size={16} />
                            Refresh
                        </button>
                    </div>
                }
            />

            {/* Stats Grid - Bootstrap Responsive */}
            <div className="row g-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card card-padding">
                            <div className="flex justify-between items-start mb-3">
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    backgroundColor: `${stat.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: stat.color,
                                    border: `2px solid ${stat.color}40`
                                }}>
                                    <stat.icon size={22} strokeWidth={2.5} />
                                </div>
                                {stat.trend && (
                                    <div className={`badge ${stat.trendUp ? 'badge-success' : 'badge-danger'}`}>
                                        {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {stat.trend}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    {stat.label}
                                </p>
                                <h3 className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: stat.color }}>
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Cases */}
            <div className="card">
                <div className="card-header">
                    Recent Cases
                </div>
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
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases?.slice(0, 10).map((caseItem: any) => (
                                <tr key={caseItem.id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                            {caseItem.caseNumber}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{caseItem.customerName}</td>
                                    <td>${caseItem.amount.toLocaleString()}</td>
                                    <td>{caseItem.overdueDays} days</td>
                                    <td>
                                        <span className={`badge badge-${caseItem.priority}`}>
                                            {caseItem.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${['resolved', 'closed'].includes(caseItem.status) ? 'badge-success' : 'badge-neutral'}`}>
                                            {['resolved', 'closed'].includes(caseItem.status) && <CheckCircle2 size={14} />}
                                            {caseItem.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="text-muted">{caseItem.assignedDcaName || '-'}</td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {caseItem.assignedDcaId && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCase(caseItem);
                                                        setCommModalOpen(true);
                                                    }}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Send Message"
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                            )}
                                            {!caseItem.assignedDcaId ? (
                                                <button
                                                    onClick={() => handleAssignClick(caseItem)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <UserPlus size={14} />
                                                    Assign
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAssignClick(caseItem)}
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    Reassign
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CSV Upload Modal */}
            <CSVUploadModal
                isOpen={csvUploadOpen}
                onClose={() => setCSVUploadOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
            />

            {/* Assign Modal */}
            {assignModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div className="card card-padding" style={{ width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)' }}>
                        <h3 className="mb-4">Assign Case to DCA</h3>

                        <div className="bg-tertiary p-4 rounded-lg mb-6 border border-subtle">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-small">Case</p>
                                    <p className="font-semibold">{selectedCase?.caseNumber}</p>
                                </div>
                                <div>
                                    <p className="text-small">Amount</p>
                                    <p className="font-semibold">${selectedCase?.amount.toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-small">Customer</p>
                                    <p className="font-semibold">{selectedCase?.customerName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Collection Agency</label>
                            <select
                                className="form-input"
                                value={selectedDca}
                                onChange={(e) => setSelectedDca(e.target.value)}
                            >
                                <option value="">Select a DCA...</option>
                                <option value="2">Premium Recovery Solutions</option>
                                <option value="3">Elite Collections Inc</option>
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <button
                                onClick={() => {
                                    setAssignModalOpen(false);
                                    setSelectedCase(null);
                                    setSelectedDca('');
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignSubmit}
                                className="btn btn-primary"
                                disabled={assignMutation.isPending}
                            >
                                {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Communication Modal */}
            <CommunicationModal
                isOpen={commModalOpen}
                onClose={() => {
                    setCommModalOpen(false);
                    setSelectedCase(null);
                }}
                caseData={selectedCase}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
            />
        </div>
    );
}
