import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Send } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

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
            toast.success('Status updated');
            refetch();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>DCA Collaboration Portal</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Welcome, {user?.name} - {user?.agency}
            </p>

            <div className="grid grid-cols-2">
                {/* Cases List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>My Assigned Cases</h3>
                        <button
                            onClick={() => refetch()}
                            className="btn btn-sm btn-secondary"
                            title="Refresh List"
                        >
                            Refresh
                        </button>
                    </div>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {cases?.map((caseItem: any) => (
                            <div
                                key={caseItem.id}
                                onClick={() => setSelectedCase(caseItem)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius)',
                                    border: `2px solid ${selectedCase?.id === caseItem.id ? 'var(--primary)' : 'var(--border)'}`,
                                    marginBottom: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'var(--transition)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <code style={{ fontWeight: 600 }}>{caseItem.caseNumber}</code>
                                    <span className={`badge badge-${caseItem.priority}`}>{caseItem.priority}</span>
                                </div>
                                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{caseItem.customerName}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    ${caseItem.amount.toLocaleString()} • {caseItem.overdueDays} days overdue
                                </p>
                                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
                                    <span className="badge">{caseItem.status.replace('_', ' ')}</span>
                                    {caseItem.paymentProbability && (
                                        <span style={{ marginLeft: '0.5rem', color: 'var(--success)' }}>
                                            {caseItem.paymentProbability.toFixed(0)}% recovery probability
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {!cases?.length && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                No cases assigned yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Case Details & Actions */}
                <div className="card">
                    {selectedCase ? (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Case Details</h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Case Number</p>
                                    <code>{selectedCase.caseNumber}</code>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Customer</p>
                                    <p style={{ fontWeight: 600 }}>{selectedCase.customerName}</p>
                                </div>
                                <div className="grid grid-cols-2" style={{ marginBottom: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount</p>
                                        <p style={{ fontWeight: 600 }}>${selectedCase.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overdue Days</p>
                                        <p style={{ fontWeight: 600 }}>{selectedCase.overdueDays}</p>
                                    </div>
                                </div>

                                {/* AI Recommendations */}
                                {selectedCase.paymentProbability && (
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--gray-50)',
                                        borderRadius: 'var(--radius)',
                                        marginBottom: '1rem'
                                    }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            🤖 AI Recommendations
                                        </p>
                                        <p style={{ fontSize: '0.875rem' }}>
                                            Payment Probability: <strong>{selectedCase.paymentProbability.toFixed(0)}%</strong>
                                        </p>
                                        <p style={{ fontSize: '0.875rem' }}>
                                            Risk Score: <strong>{selectedCase.riskScore.toFixed(0)}</strong>
                                        </p>
                                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                            {selectedCase.priority === 'high'
                                                ? '💡 High priority case - prioritize contact attempts'
                                                : selectedCase.priority === 'medium'
                                                    ? '💡 Medium priority - maintain regular follow-up'
                                                    : '💡 Low priority - standard collection process'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Update Status */}
                            <div style={{ marginBottom: '2rem' }}>
                                <label className="form-label">Update Status</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedCase.id, 'in_progress')}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        In Progress
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedCase.id, 'follow_up')}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        Follow Up
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedCase.id, 'resolved')}
                                        className="btn btn-sm btn-success"
                                    >
                                        Resolved
                                    </button>
                                </div>
                            </div>

                            {/* Add Note */}
                            <div>
                                <label className="form-label">Add Note</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Enter case notes..."
                                    style={{ resize: 'vertical' }}
                                />
                                <button
                                    onClick={() => handleAddNote(selectedCase.id)}
                                    className="btn btn-primary"
                                    style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Send size={16} />
                                    Add Note
                                </button>
                            </div>

                            {/* Notes History */}
                            {selectedCase.notes && (
                                <div style={{ marginTop: '2rem' }}>
                                    <label className="form-label">Notes History</label>
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--gray-50)',
                                        borderRadius: 'var(--radius)',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8125rem',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {selectedCase.notes}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>Select a case to view details and take action</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
