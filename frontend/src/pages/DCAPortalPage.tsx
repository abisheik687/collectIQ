import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    FileText,
    Send,
    Briefcase,
    TrendingUp,
    CheckCircle,
    Target,
    Clock,
    DollarSign,
    Calendar,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';

export default function DCAPortalPage() {
    const { user } = useAuthStore();
    const [selectedCase, setSelectedCase] = useState<any>(null);
    const [note, setNote] = useState('');

    const { data: cases, refetch } = useQuery({
        queryKey: ['my-cases'],
        queryFn: async () => {
            const response = await api.get('/cases');
            return response.data.cases;
        },
    });

    const handleAddNote = async (caseId: number) => {
        if (!note.trim()) return;

        try {
            await api.post(`/cases/${caseId}/notes`, { note });
            toast.success('Note added successfully');
            setNote('');
            refetch();
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const handleUpdateStatus = async (caseId: number, newStatus: string) => {
        try {
            await api.put(`/cases/${caseId}`, { status: newStatus });
            toast.success('Status updated successfully!');
            refetch();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Calculate dashboard stats
    const totalCases = cases?.length || 0;
    const inProgress = cases?.filter((c: any) => c.status === 'in_progress' || c.status === 'contacted').length || 0;
    const resolved = cases?.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length || 0;
    const totalAmount = cases?.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0) || 0;

    const stats = [
        {
            label: 'My Cases',
            value: totalCases,
            icon: Briefcase,
            color: 'var(--primary)',
            bg: '#1e1b4b15'
        },
        {
            label: 'In Progress',
            value: inProgress,
            icon: TrendingUp,
            color: 'var(--info)',
            bg: '#0891b215'
        },
        {
            label: 'Resolved',
            value: resolved,
            icon: CheckCircle,
            color: 'var(--success)',
            bg: '#16a34a15'
        },
        {
            label: 'Total Value',
            value: `$${totalAmount.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--accent)',
            bg: '#f9731615'
        },
    ];

    return (
        <div className="page-container">
            {/* Professional Page Header */}
            <PageHeader
                title="Collector Portal"
                subtitle={`Welcome back, ${user?.name} • ${user?.agency || 'Collection Agency'}`}
                action={
                    <button
                        onClick={() => refetch()}
                        className="btn btn-secondary"
                    >
                        <Clock size={16} />
                        Refresh Cases
                    </button>
                }
            />

            {/* Dashboard Stats */}
            <div className="row g-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card card-padding">
                            <div className="flex justify-between items-start mb-3">
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: stat.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: stat.color,
                                    border: `2px solid ${stat.color}30`
                                }}>
                                    <stat.icon size={24} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
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

            {/* Main Content Grid */}
            <div className="row g-4">
                {/* Cases List - Left Column */}
                <div className="col-12 col-lg-5">
                    <div className="card">
                        <div className="card-header">
                            <div className="flex justify-between items-center">
                                <span>My Assigned Cases ({totalCases})</span>
                            </div>
                        </div>
                        <div className="card-padding">
                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {cases?.map((caseItem: any) => (
                                    <div
                                        key={caseItem.id}
                                        onClick={() => setSelectedCase(caseItem)}
                                        className="card"
                                        style={{
                                            padding: '1.25rem',
                                            marginBottom: '0.75rem',
                                            cursor: 'pointer',
                                            border: `2px solid ${selectedCase?.id === caseItem.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                            backgroundColor: selectedCase?.id === caseItem.id ? 'var(--primary)08' : 'white',
                                            transition: 'all var(--transition-normal)',
                                            transform: selectedCase?.id === caseItem.id ? 'translateX(4px)' : 'none'
                                        }}
                                    >
                                        {/* Case Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <code style={{
                                                    fontWeight: 700,
                                                    fontSize: '0.875rem',
                                                    color: 'var(--primary)'
                                                }}>
                                                    {caseItem.caseNumber}
                                                </code>
                                                <p style={{
                                                    fontWeight: 600,
                                                    fontSize: '1.125rem',
                                                    marginTop: '0.25rem',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {caseItem.customerName}
                                                </p>
                                            </div>
                                            <span className={`badge badge-${caseItem.priority}`}>
                                                {caseItem.priority}
                                            </span>
                                        </div>

                                        {/* Amount & Days */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div style={{
                                                padding: '0.75rem',
                                                backgroundColor: 'var(--accent-subtle)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--accent)30'
                                            }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                    Amount Due
                                                </p>
                                                <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.125rem' }}>
                                                    ${caseItem.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{
                                                padding: '0.75rem',
                                                backgroundColor: 'var(--danger-bg)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--danger)30'
                                            }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                    Overdue
                                                </p>
                                                <p style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1.125rem' }}>
                                                    {caseItem.overdueDays} days
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className={`badge ${['resolved', 'closed'].includes(caseItem.status)
                                                ? 'badge-success'
                                                : caseItem.status === 'in_progress'
                                                    ? 'badge-info'
                                                    : 'badge-neutral'
                                                }`}>
                                                {caseItem.status.replace('_', ' ')}
                                            </span>
                                            {caseItem.mlPaymentProbability && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                                                    {Math.round(caseItem.mlPaymentProbability)}% recovery
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {!cases?.length && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p style={{ fontWeight: 500 }}>No cases assigned yet</p>
                                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                            Cases will appear here when assigned by your administrator
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Case Details & Actions - Right Column */}
                <div className="col-12 col-lg-7">
                    <div className="card">
                        <div className="card-header">
                            Case Details & Actions
                        </div>
                        <div className="card-padding">
                            {selectedCase ? (
                                <>
                                    {/* Case Summary Section */}
                                    <div style={{
                                        padding: '1.5rem',
                                        backgroundColor: 'var(--gray-25)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: '2rem',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-small text-muted mb-2">
                                                    <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                    Case Number
                                                </p>
                                                <code style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedCase.caseNumber}</code>
                                            </div>
                                            <div>
                                                <p className="text-small text-muted mb-2">Priority Level</p>
                                                <span className={`badge badge-${selectedCase.priority}`} style={{ fontSize: '0.875rem' }}>
                                                    {selectedCase.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-small text-muted mb-2">Customer Name</p>
                                            <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
                                                {selectedCase.customerName}
                                            </p>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <p className="text-small text-muted mb-1">Amount Due</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent)' }}>
                                                    ${selectedCase.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="col-6">
                                                <p className="text-small text-muted mb-1">Days Overdue</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--danger)' }}>
                                                    {selectedCase.overdueDays}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Recommendations */}
                                    {selectedCase.mlPaymentProbability && (
                                        <div style={{
                                            padding: '1.25rem',
                                            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                                            borderRadius: 'var(--radius-lg)',
                                            marginBottom: '2rem',
                                            border: '2px solid var(--info)40'
                                        }}>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Target size={18} color="var(--info)" />
                                                AI-Powered Recommendations
                                            </p>
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                        Recovery Probability
                                                    </p>
                                                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)' }}>
                                                        {Math.round(selectedCase.mlPaymentProbability)}%
                                                    </p>
                                                </div>
                                                <div className="col-6">
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                        Risk Level
                                                    </p>
                                                    <span className={`badge ${selectedCase.mlRiskScore < 30
                                                            ? 'badge-success'
                                                            : selectedCase.mlRiskScore < 60
                                                                ? 'badge-warning'
                                                                : 'badge-danger'
                                                        }`} style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem', fontWeight: 700 }}>
                                                        {selectedCase.mlRiskScore < 30
                                                            ? 'LOW RISK'
                                                            : selectedCase.mlRiskScore < 60
                                                                ? 'MEDIUM RISK'
                                                                : 'HIGH RISK'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{
                                                marginTop: '0.75rem',
                                                padding: '0.75rem',
                                                backgroundColor: 'white',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.875rem'
                                            }}>
                                                <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--info)' }} />
                                                {selectedCase.priority === 'high'
                                                    ? 'High priority case - prioritize immediate contact attempts'
                                                    : selectedCase.priority === 'medium'
                                                        ? 'Medium priority - maintain regular follow-up schedule'
                                                        : 'Standard priority - proceed with normal collection process'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Update Status Section */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label className="form-label" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                                            Update Case Status
                                        </label>
                                        <div className="row g-2">
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'contacted')}
                                                    className="btn btn-secondary w-100"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <Clock size={16} />
                                                    Contacted
                                                </button>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'in_progress')}
                                                    className="btn btn-secondary w-100"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <TrendingUp size={16} />
                                                    In Progress
                                                </button>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'follow_up')}
                                                    className="btn btn-secondary w-100"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <Calendar size={16} />
                                                    Follow Up
                                                </button>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'promise_to_pay')}
                                                    className="btn btn-secondary w-100"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <DollarSign size={16} />
                                                    Promise to Pay
                                                </button>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'resolved')}
                                                    className="btn w-100"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        backgroundColor: 'var(--success)',
                                                        color: 'white'
                                                    }}
                                                >
                                                    <CheckCircle size={16} />
                                                    Resolved
                                                </button>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCase.id, 'refused')}
                                                    className="btn btn-secondary w-100"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <AlertCircle size={16} />
                                                    Refused
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add Note Section */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label className="form-label" style={{ marginBottom: '0.75rem' }}>
                                            Add Collection Note
                                        </label>
                                        <textarea
                                            className="form-input"
                                            rows={4}
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Record contact attempts, customer responses, payment commitments, or any relevant information..."
                                            style={{ resize: 'vertical', marginBottom: '0.75rem' }}
                                        />
                                        <button
                                            onClick={() => handleAddNote(selectedCase.id)}
                                            className="btn btn-primary"
                                            disabled={!note.trim()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Send size={16} />
                                            Add Note to Case
                                        </button>
                                    </div>

                                    {/* Notes History */}
                                    {selectedCase.notes && (
                                        <div>
                                            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
                                                Case Notes History
                                            </label>
                                            <div style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--gray-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--border-subtle)',
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                                fontFamily: 'monospace',
                                                fontSize: '0.8125rem',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.6
                                            }}>
                                                {selectedCase.notes}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                                    <FileText size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2, display: 'block' }} />
                                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Case Selected</h4>
                                    <p style={{ fontSize: '0.9375rem' }}>
                                        Select a case from the list to view details and take action
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
