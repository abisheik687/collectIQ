import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Shield, Filter, Calendar } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

export default function AuditPage() {
    const [filters, setFilters] = useState({
        entityType: '',
        startDate: '',
        endDate: '',
    });

    const { data } = useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/audit?${params}`);
            return response.data;
        },
    });

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/audit/export?${params}`, {
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            // toast.error('Failed to export audit log'); // Removed to avoid toast spam if user didn't request
        }
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Audit Trail & Compliance Log"
                subtitle="Complete audit history with secure tracking, IP logging, and regulatory compliance"
            />

            {/* Filters Card */}
            <div className="card mb-6">
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} />
                    Filter Audit Logs
                </div>
                <div className="card-padding">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label">Entity Type</label>
                            <select
                                className="form-input"
                                value={filters.entityType}
                                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                            >
                                <option value="">All Types</option>
                                <option value="Case">Case</option>
                                <option value="User">User</option>
                                <option value="Communication">Communication</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                Start Date
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                End Date
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                        <button
                            onClick={handleExport}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={16} />
                            Export to CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} />
                    Audit Log Entries
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        fontWeight: 500,
                        fontFamily: 'JetBrains Mono, monospace'
                    }}>
                        {data?.logs?.length || 0} entries
                    </span>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>User</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.logs?.map((log: any) => (
                                <tr key={log.id}>
                                    <td>
                                        <span className="font-mono" style={{ fontSize: '0.8125rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500 }}>
                                            {log.entityType}
                                        </span>
                                        {' '}
                                        <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                                            #{log.entityId}
                                        </span>
                                    </td>
                                    <td>{log.userName}</td>
                                    <td>
                                        <span className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            {log.ipAddress || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!data?.logs?.length && (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--space-8)',
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid var(--border-subtle)'
                    }}>
                        <Shield size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-3)' }} />
                        <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No audit logs found</p>
                        <p style={{ fontSize: '0.8125rem', marginTop: 'var(--space-2)' }}>
                            Try adjusting your filters or date range
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
