import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download } from 'lucide-react';
import api from '../services/api';

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

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        window.open(`${api.defaults.baseURL}/audit/export?${params}`, '_blank');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Audit Trail</h1>
                <button onClick={handleExport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="grid grid-cols-3">
                    <div className="form-group">
                        <label className="form-label">Entity Type</label>
                        <select
                            className="form-input"
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                        >
                            <option value="">All</option>
                            <option value="Case">Case</option>
                            <option value="User">User</option>
                            <option value="Communication">Communication</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="card">
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
                                        <span style={{ fontSize: '0.8125rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <code>{log.action}</code>
                                    </td>
                                    <td>
                                        {log.entityType} #{log.entityId}
                                    </td>
                                    <td>{log.userName}</td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                            {log.ipAddress || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!data?.logs?.length && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No audit logs found
                    </p>
                )}
            </div>
        </div>
    );
}
