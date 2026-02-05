import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Clock, AlertTriangle, LayoutDashboard, UserPlus, ArrowUpRight, ArrowDownRight, CheckCircle2, Upload, Zap, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Download } from 'lucide-react';
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

    // Sorting and Filtering state
    const [sortColumn, setSortColumn] = useState<'amount' | 'overdueDays' | 'priority' | 'status' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Handle CSV Export
    const handleExport = () => {
        if (filteredCases.length === 0) {
            toast.error('No cases to export');
            return;
        }

        const headers = ['Case ID', 'Customer', 'Amount', 'Status', 'Risk Score', 'Assigned DCA', 'Priority'];
        const csvContent = [
            headers.join(','),
            ...filteredCases.map((c: any) => [
                c.id,
                `"${c.customerName}"`,
                c.amount,
                c.status,
                c.mlRiskScore,
                `"${c.assignedDcaName || 'Unassigned'}"`,
                calculatePriority(c)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cases_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Cases exported successfully');
    };

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

    // Calculate intelligent priority based on case metrics
    const calculatePriority = (caseItem: any): 'critical' | 'high' | 'medium' | 'low' => {
        const amount = parseFloat(caseItem.amount || 0);
        const overdueDays = caseItem.overdueDays || 0;
        const riskScore = caseItem.mlRiskScore || 50; // 0-100, higher = more risk

        // Calculate priority score (0-100)
        let priorityScore = 0;

        // Amount contribution (0-45 points) - Higher weight for larger debts
        if (amount >= 50000) priorityScore += 45;
        else if (amount >= 20000) priorityScore += 35;
        else if (amount >= 10000) priorityScore += 25;
        else if (amount >= 5000) priorityScore += 15;
        else if (amount >= 2000) priorityScore += 8;

        // Overdue days contribution (0-35 points) - Higher weight for longer delays
        if (overdueDays >= 180) priorityScore += 35;
        else if (overdueDays >= 120) priorityScore += 30;
        else if (overdueDays >= 90) priorityScore += 22;
        else if (overdueDays >= 60) priorityScore += 15;
        else if (overdueDays >= 30) priorityScore += 8;

        // Risk score contribution (0-20 points)
        // Higher ML risk = higher priority
        if (riskScore >= 80) priorityScore += 20;
        else if (riskScore >= 60) priorityScore += 15;
        else if (riskScore >= 40) priorityScore += 10;
        else if (riskScore >= 20) priorityScore += 5;

        // Determine priority level - Adjusted thresholds for realistic results
        if (priorityScore >= 70) return 'critical';
        if (priorityScore >= 45) return 'high';      // $15K + 120 days = 55pts = HIGH ✓
        if (priorityScore >= 20) return 'medium';
        return 'low';
    };

    // Handle column sorting
    const handleSort = (column: 'amount' | 'overdueDays' | 'priority' | 'status') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get filtered and sorted cases
    const getFilteredAndSortedCases = () => {
        if (!cases) return [];

        let filtered = [...cases];

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.customerName?.toLowerCase().includes(query) ||
                c.customerEmail?.toLowerCase().includes(query) ||
                c.id.toString().includes(query) ||
                c.assignedDcaName?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        if (sortColumn) {
            filtered.sort((a, b) => {
                let aVal, bVal;

                if (sortColumn === 'amount') {
                    aVal = parseFloat(a.amount);
                    bVal = parseFloat(b.amount);
                } else if (sortColumn === 'overdueDays') {
                    aVal = a.overdueDays;
                    bVal = b.overdueDays;
                } else if (sortColumn === 'priority') {
                    const priorityOrder: any = { critical: 4, high: 3, medium: 2, low: 1 };
                    aVal = priorityOrder[calculatePriority(a)] || 0;
                    bVal = priorityOrder[calculatePriority(b)] || 0;
                } else if (sortColumn === 'status') {
                    const statusOrder: any = {
                        new: 1, assigned: 2, in_progress: 3, contacted: 4,
                        follow_up: 5, promise_to_pay: 6, refused: 7, resolved: 8, closed: 9
                    };
                    aVal = statusOrder[a.status] || 0;
                    bVal = statusOrder[b.status] || 0;
                }

                if (sortDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        return filtered;
    };

    const filteredCases = getFilteredAndSortedCases();

    // Status filter options with counts
    const statusFilters = [
        { value: 'all', label: 'All Cases', count: cases?.length || 0 },
        { value: 'assigned', label: 'Assigned', count: cases?.filter(c => c.status === 'assigned').length || 0 },
        { value: 'in_progress', label: 'In Progress', count: cases?.filter(c => c.status === 'in_progress').length || 0 },
        { value: 'promise_to_pay', label: 'Promised to Pay', count: cases?.filter(c => c.status === 'promise_to_pay').length || 0 },
        { value: 'refused', label: 'Refused', count: cases?.filter(c => c.status === 'refused').length || 0 },
        { value: 'resolved', label: 'Resolved', count: cases?.filter(c => c.status === 'resolved' || c.status === 'closed').length || 0 },
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
                <div className="card-header" style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <LayoutDashboard size={20} className="text-primary" />
                                Case Management
                            </h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                {filteredCases.length} active cases found
                            </p>
                        </div>

                        <div className="relative w-full md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={20} className="text-gray-500" strokeWidth={2} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search cases..."
                                className="form-input pl-10 pr-4 py-2 w-full text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    paddingLeft: '2.5rem' // Ensure text doesn't overlap larger icon
                                }}
                            />
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:overflow-visible">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2 border ${statusFilter === filter.value
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-transparent text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {filter.label}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${statusFilter === filter.value
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Case #</th>
                                <th>Customer</th>
                                <th
                                    onClick={() => handleSort('amount')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    className="hover-highlight"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        Amount
                                        {sortColumn === 'amount' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('overdueDays')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    className="hover-highlight"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        Overdue
                                        {sortColumn === 'overdueDays' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('priority')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    className="hover-highlight"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        Priority
                                        {sortColumn === 'priority' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    className="hover-highlight"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        Status
                                        {sortColumn === 'status' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                                        )}
                                    </div>
                                </th>
                                <th>Assigned DCA</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((caseItem: any) => (
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
                                        <span className={`badge badge-${calculatePriority(caseItem)}`}>
                                            {calculatePriority(caseItem)}
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
