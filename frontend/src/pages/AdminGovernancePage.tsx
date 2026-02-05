import { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, TrendingUp, AlertTriangle, Users, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

interface WorkloadSummary {
    totalActiveDCAs: number;
    totalAssignedCases: number;
    averageCasesPerDCA: number;
    caseRange: { min: number; max: number };
    totalAmount: number;
    workloadBalance: 'balanced' | 'imbalanced' | 'critical';
}

interface DCAWorkload {
    dcaId: number;
    dcaName: string;
    caseCount: number;
    totalAmount: number;
    averageCaseAge: number;
    slaRisk: 'low' | 'medium' | 'high';
    capacityStatus: 'idle' | 'balanced' | 'near_capacity' | 'overloaded';
    capacityColor: 'blue' | 'green' | 'yellow' | 'red';
}

interface BPIRanking {
    dcaId: number;
    dcaName: string;
    bpi: number;
    rank: number;
    percentile: number;
    components: {
        recoveryScore: number;
        complianceScore: number;
        slaScore: number;
        complaintPenalty: number;
    };
    caseCount: number;
    eligible: boolean;
}

export default function AdminGovernancePage() {
    const [activeTab, setActiveTab] = useState<'workload' | 'performance' | 'reports'>('workload');
    const [workloadSummary, setWorkloadSummary] = useState<WorkloadSummary | null>(null);
    const [dcaWorkloads, setDCAWorkloads] = useState<DCAWorkload[]>([]);
    const [bpiRankings, setBPIRankings] = useState<BPIRanking[]>([]);
    const [, setLoading] = useState(true);

    // Report export state
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'docx'>('csv');
    const [exportType, setExportType] = useState<'operational_summary' | 'dca_performance' | 'compliance_audit'>('operational_summary');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Real-time BPI polling (every 10 seconds when on performance tab)
    useEffect(() => {
        if (activeTab !== 'performance') return;

        const interval = setInterval(() => {
            fetchData(); // Refetch BPI data
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [activeTab, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'workload') {
                const [summaryRes, workloadsRes] = await Promise.all([
                    api.get('/admin/workload/summary'),
                    api.get('/admin/workload/dcas')
                ]);
                setWorkloadSummary(summaryRes.data.summary);
                setDCAWorkloads(workloadsRes.data.workloads);
            } else if (activeTab === 'performance') {
                const res = await api.get('/admin/performance/bpi', {
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                        topN: 5
                    }
                });
                setBPIRankings(res.data.rankings);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.post('/admin/reports/export', {
                reportType: exportType,
                format: exportFormat,
                dateRange: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                },
                includeDetails: true
            });

            if (res.data.success) {
                toast.success(`Report generated successfully!`);

                // Download the generated file with auth headers
                const downloadRes = await api.get(res.data.downloadUrl, {
                    responseType: 'blob'
                });

                // Create blob link
                const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
                const link = document.createElement('a');
                link.href = url;
                // Extract filename from the download URL or use a default
                const filename = res.data.downloadUrl.split('/').pop() || `report.${exportFormat}`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to generate report');
        }
    };

    const getCapacityBadge = (status: string) => {
        switch (status) {
            case 'overloaded': return 'badge-danger';
            case 'near_capacity': return 'badge-warning';
            case 'balanced': return 'badge-success';
            case 'idle': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    const getSLARiskBadge = (risk: string) => {
        switch (risk) {
            case 'high': return 'badge-danger';
            case 'medium': return 'badge-warning';
            case 'low': return 'badge-success';
            default: return 'badge-neutral';
        }
    };

    const getRankBgColor = (index: number) => {
        if (index === 0) return '#f59e0b'; // Gold
        if (index === 1) return '#9ca3af'; // Silver
        if (index === 2) return '#ea580c'; // Bronze
        return '#2563eb'; // Blue
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Admin Governance & Analytics"
                subtitle="Enterprise-grade oversight, workload fairness, and performance insights"
            />

            {/* Tabs */}
            <div style={{ borderBottom: '2px solid var(--border-default)', marginBottom: 'var(--space-6)' }}>
                <nav style={{ display: 'flex', gap: 'var(--space-8)' }}>
                    <button
                        onClick={() => setActiveTab('workload')}
                        className={`flex items-center gap-2 py-4 font-medium text-sm uppercase ${activeTab === 'workload'
                            ? 'border-b-4 font-bold'
                            : 'border-transparent'
                            }`}
                        style={{
                            borderBottomColor: activeTab === 'workload' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'workload' ? 'var(--accent)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'workload' ? '4px solid var(--accent)' : '4px solid transparent',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <Users size={16} />
                        Workload Distribution
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`flex items-center gap-2 py-4 font-medium text-sm uppercase ${activeTab === 'performance'
                            ? 'border-b-4 font-bold'
                            : 'border-transparent'
                            }`}
                        style={{
                            borderBottomColor: activeTab === 'performance' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'performance' ? 'var(--accent)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'performance' ? '4px solid var(--accent)' : '4px solid transparent',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <TrendingUp size={16} />
                        Performance (BPI)
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 py-4 font-medium text-sm uppercase ${activeTab === 'reports'
                            ? 'border-b-4 font-bold'
                            : 'border-transparent'
                            }`}
                        style={{
                            borderBottomColor: activeTab === 'reports' ? 'var(--accent)' : 'transparent',
                            color: activeTab === 'reports' ? 'var(--accent)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'reports' ? '4px solid var(--accent)' : '4px solid transparent',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <FileText size={16} />
                        Export Reports
                    </button>
                </nav>
            </div>

            {/* Workload Tab */}
            {activeTab === 'workload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* Summary Cards */}
                    {workloadSummary && (
                        <div className="grid grid-cols-4 gap-4">
                            <div className="card card-padding">
                                <div className="flex justify-between items-start mb-3">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--secondary)20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--secondary)40'
                                    }}>
                                        <Users size={22} strokeWidth={2.5} color="var(--secondary)" />
                                    </div>
                                </div>
                                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Total Active DCAs
                                </p>
                                <h3 className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--secondary)' }}>
                                    {workloadSummary.totalActiveDCAs}
                                </h3>
                            </div>
                            <div className="card card-padding">
                                <div className="flex justify-between items-start mb-3">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--success)20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--success)40'
                                    }}>
                                        <FileText size={22} strokeWidth={2.5} color="var(--success)" />
                                    </div>
                                </div>
                                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Active Cases
                                </p>
                                <h3 className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--success)' }}>
                                    {workloadSummary.totalAssignedCases}
                                </h3>
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                    Assigned + In Progress + Follow-up
                                </p>
                            </div>
                            <div className="card card-padding">
                                <div className="flex justify-between items-start mb-3">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--primary)20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--primary)40'
                                    }}>
                                        <BarChart size={22} strokeWidth={2.5} color="var(--primary)" />
                                    </div>
                                </div>
                                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Avg Cases/DCA
                                </p>
                                <h3 className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: 'var(--primary)' }}>
                                    {workloadSummary.averageCasesPerDCA}
                                </h3>
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                    Range: {workloadSummary.caseRange.min}-{workloadSummary.caseRange.max}
                                </p>
                            </div>
                            <div className="card card-padding">
                                <div className="flex justify-between items-start mb-3">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '8px',
                                        backgroundColor: workloadSummary.workloadBalance === 'balanced' ? 'var(--success)20' :
                                            workloadSummary.workloadBalance === 'imbalanced' ? 'var(--warning)20' : 'var(--danger)20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px solid ${workloadSummary.workloadBalance === 'balanced' ? 'var(--success)40' :
                                            workloadSummary.workloadBalance === 'imbalanced' ? 'var(--warning)40' : 'var(--danger)40'}`
                                    }}>
                                        <AlertTriangle size={22} strokeWidth={2.5} color={
                                            workloadSummary.workloadBalance === 'balanced' ? 'var(--success)' :
                                                workloadSummary.workloadBalance === 'imbalanced' ? 'var(--warning)' : 'var(--danger)'
                                        } />
                                    </div>
                                </div>
                                <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    Workload Balance
                                </p>
                                <h3 className="font-mono uppercase" style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    color: workloadSummary.workloadBalance === 'balanced' ? 'var(--success)' :
                                        workloadSummary.workloadBalance === 'imbalanced' ? 'var(--warning)' : 'var(--danger)'
                                }}>
                                    {workloadSummary.workloadBalance}
                                </h3>
                            </div>
                        </div>
                    )}

                    {/* DCA Workload Table */}
                    <div className="card">
                        <div className="card-header">
                            DCA Workload Distribution
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>DCA NAME</th>
                                        <th>CASES</th>
                                        <th>AMOUNT</th>
                                        <th>AVG AGE</th>
                                        <th>SLA RISK</th>
                                        <th>CAPACITY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dcaWorkloads.map((dca) => (
                                        <tr key={dca.dcaId}>
                                            <td className="font-medium">{dca.dcaName}</td>
                                            <td className="font-mono">{dca.caseCount}</td>
                                            <td className="font-mono">${dca.totalAmount.toLocaleString()}</td>
                                            <td className="font-mono">{dca.averageCaseAge} days</td>
                                            <td>
                                                <span className={`badge ${getSLARiskBadge(dca.slaRisk)}`}>
                                                    {dca.slaRisk}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getCapacityBadge(dca.capacityStatus)}`}>
                                                    {dca.capacityStatus.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* BPI Explanation */}
                    <div style={{
                        backgroundColor: 'var(--info-bg)',
                        border: '2px solid var(--info)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)'
                    }}>
                        <h3 className="text-sm font-bold uppercase" style={{ color: 'var(--info)', marginBottom: 'var(--space-2)', letterSpacing: '0.05em' }}>
                            Balanced Performance Index (BPI)
                        </h3>
                        <p className="font-mono text-xs" style={{ color: 'var(--info)' }}>
                            BPI = (Recovery × 40%) + (Compliance × 30%) + (SLA × 20%) - (Complaints × 10%)
                        </p>
                        <p className="text-xs" style={{ color: 'var(--info)', marginTop: 'var(--space-2)' }}>
                            ⚠️ Any compliance violation automatically caps BPI at 0. Only top 5 performers shown for privacy.
                        </p>
                    </div>

                    {/* Top Performers */}
                    <div className="card">
                        <div className="card-header">
                            Top Performers (Top 5) • {dateRange.startDate} to {dateRange.endDate}
                        </div>
                        <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {bpiRankings.map((dca, index) => (
                                <div key={dca.dcaId} className="card" style={{ padding: 'var(--space-4)' }}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '1.25rem',
                                                fontFamily: 'JetBrains Mono, monospace',
                                                backgroundColor: getRankBgColor(index)
                                            }}>
                                                {dca.rank}
                                            </div>
                                            <div>
                                                <h3 className="font-bold" style={{ fontSize: '1rem' }}>{dca.dcaName}</h3>
                                                <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{dca.caseCount} cases</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{dca.bpi}</p>
                                            <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>BPI Score</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 text-sm">
                                        <div style={{ backgroundColor: 'var(--success-bg)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                                            <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Recovery</p>
                                            <p className="font-mono font-bold" style={{ color: 'var(--success)' }}>{dca.components.recoveryScore.toFixed(1)}</p>
                                        </div>
                                        <div style={{ backgroundColor: 'var(--info-bg)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                                            <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Compliance</p>
                                            <p className="font-mono font-bold" style={{ color: 'var(--info)' }}>{dca.components.complianceScore.toFixed(1)}</p>
                                        </div>
                                        <div style={{ backgroundColor: 'var(--secondary-subtle)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                                            <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>SLA</p>
                                            <p className="font-mono font-bold" style={{ color: 'var(--secondary)' }}>{dca.components.slaScore.toFixed(1)}</p>
                                        </div>
                                        <div style={{ backgroundColor: 'var(--danger-bg)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                                            <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Penalty</p>
                                            <p className="font-mono font-bold" style={{ color: 'var(--danger)' }}>-{dca.components.complaintPenalty.toFixed(1)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="card card-padding">
                    <h2 className="uppercase" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-6)', letterSpacing: '0.05em' }}>
                        Generate Multi-Format Report
                    </h2>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Report Type */}
                        <div className="form-group">
                            <label className="form-label">Report Type</label>
                            <select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value as any)}
                                className="form-input"
                            >
                                <option value="operational_summary">Operational Summary</option>
                                <option value="dca_performance">DCA Performance</option>
                                <option value="compliance_audit">Compliance Audit</option>
                            </select>
                        </div>

                        {/* Format */}
                        <div className="form-group">
                            <label className="form-label">Export Format</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setExportFormat('csv')}
                                    className={`btn ${exportFormat === 'csv' ? 'btn-accent' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    <FileSpreadsheet size={16} />
                                    CSV
                                </button>
                                <button
                                    onClick={() => setExportFormat('pdf')}
                                    className={`btn ${exportFormat === 'pdf' ? 'btn-accent' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    <FileText size={16} />
                                    PDF
                                </button>
                                <button
                                    onClick={() => setExportFormat('docx')}
                                    className={`btn ${exportFormat === 'docx' ? 'btn-accent' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    <FileText size={16} />
                                    Word
                                </button>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="btn btn-accent"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <Download size={20} />
                        Generate Report
                    </button>

                    {/* Format Description */}
                    <div style={{
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <h4 className="text-sm uppercase font-bold mb-2" style={{ letterSpacing: '0.05em' }}>Format Guide:</h4>
                        <ul className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <li><strong>CSV:</strong> Analytics, BI tools, ML pipelines</li>
                            <li><strong>PDF:</strong> Executive summaries, audit submissions</li>
                            <li><strong>Word:</strong> Policy review, collaborative editing</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
