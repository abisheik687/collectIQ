import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import DecisionExplainerModal from '../components/DecisionExplainerModal';
import PageHeader from '../components/PageHeader';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileText, Activity } from 'lucide-react';

interface ComplianceDecision {
    decision: 'ALLOWED' | 'BLOCKED' | 'REVIEW_REQUIRED';
    compliance_validation: any;
    ethical_risk_assessment: any;
    explanation: any;
    alternative_actions?: any[];
}

export default function ComplianceDecisionPage() {
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [proposedAction, setProposedAction] = useState<string>('');
    const [decision, setDecision] = useState<ComplianceDecision | null>(null);
    const [showExplainer, setShowExplainer] = useState(false);

    const { data: cases } = useQuery({
        queryKey: ['cases'],
        queryFn: async () => {
            const response = await api.get('/cases');
            return response.data.cases;
        }
    });

    const decideMutation = useMutation({
        mutationFn: async () => {
            const selectedCase = cases?.find((c: any) => c.id === parseInt(selectedCaseId));
            if (!selectedCase) throw new Error('Case not found');

            const case_data = {
                case_id: selectedCase.id,
                case_number: selectedCase.caseNumber,
                days_overdue: selectedCase.overdueDays,
                amount_due: selectedCase.amount,
                contact_history: {
                    past_contact_count: selectedCase.contactFrequency || 0,
                    last_contact_channel: null,
                    last_contact_date: null,
                    contacts_last_7_days: []
                },
                response_history: 'no_contact_yet',
                consent_status: 'all',
                vulnerability_flag: false,
                debtor_info: { timezone: 'America/New_York' }
            };

            const response = await api.post('/compliance/decide', {
                case_data,
                proposed_action: proposedAction
            });

            return response.data;
        },
        onSuccess: (data) => {
            setDecision(data);
        }
    });

    const handleGetDecision = () => {
        if (!selectedCaseId || !proposedAction) {
            alert('Please select a case and action');
            return;
        }
        decideMutation.mutate();
    };

    const getDecisionBadge = (decision: string) => {
        if (decision === 'ALLOWED') {
            return (
                <span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <CheckCircle size={16} /> ALLOWED
                </span>
            );
        } else if (decision === 'BLOCKED') {
            return (
                <span className="badge badge-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <XCircle size={16} /> BLOCKED
                </span>
            );
        } else {
            return (
                <span className="badge badge-warning" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} /> REVIEW REQUIRED
                </span>
            );
        }
    };

    const getConfidenceBadge = (score: number) => {
        if (score < 30) return <span className="badge badge-success">High Confidence</span>;
        if (score < 70) return <span className="badge badge-warning">Medium Confidence</span>;
        return <span className="badge badge-danger">Low Confidence (Risk High)</span>;
    };

    return (
        <div className="page-container">
            <PageHeader
                title="AI Compliance Decision System"
                subtitle="Evaluate collection actions against regulatory and ethical frameworks"
            />

            <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                {/* Input Section */}
                <div className="card card-padding" style={{ height: 'fit-content' }}>
                    <h3 className="mb-4">Evaluate Action</h3>

                    <div className="form-group">
                        <label className="form-label">Select Case</label>
                        <select
                            className="form-input"
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                        >
                            <option value="">-- Select a case --</option>
                            {cases?.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.caseNumber} - {c.customerName} (${c.amount})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Proposed Action</label>
                        <select
                            className="form-input"
                            value={proposedAction}
                            onChange={(e) => setProposedAction(e.target.value)}
                        >
                            <option value="">-- Select an action --</option>
                            <option value="send_email">Send Email - Payment Reminder</option>
                            <option value="send_sms">Send SMS - Payment Notice</option>
                            <option value="send_phone_call">Place Phone Call</option>
                            <option value="send_payment_plan_offer">Send Payment Plan Offer</option>
                            <option value="escalate">Escalate Case</option>
                        </select>
                    </div>

                    <button
                        onClick={handleGetDecision}
                        disabled={decideMutation.isPending}
                        className="btn btn-primary w-full mt-4"
                    >
                        <Shield size={18} />
                        {decideMutation.isPending ? 'Analyzing...' : 'Get AI Decision'}
                    </button>
                </div>

                {/* Results Section */}
                <div className="col-span-2">
                    {decision ? (
                        <div className="animate-enter">
                            <div className="card card-padding mb-6 border-l-4" style={{
                                borderLeftColor: decision.decision === 'ALLOWED' ? 'var(--success)' :
                                    decision.decision === 'BLOCKED' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-small uppercase tracking-wider mb-1">Decision Result</p>
                                        <div className="flex items-center gap-3">
                                            {getDecisionBadge(decision.decision)}
                                            {getConfidenceBadge(decision.ethical_risk_assessment.total_score)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowExplainer(true)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <FileText size={16} />
                                        View Full Report
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="flex items-center gap-2 mb-3">
                                            <Shield size={18} className="text-muted" /> Compliance Checks
                                        </h4>
                                        <div className="bg-tertiary rounded-lg p-3">
                                            {Object.entries(decision.compliance_validation.checks_performed || {}).map(([check, status]) => (
                                                <div key={check} className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
                                                    <span className="text-sm text-secondary">
                                                        {check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                    <span className="badge badge-neutral text-xs">{String(status)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="flex items-center gap-2 mb-3">
                                            <Activity size={18} className="text-muted" /> Ethical Risk Score
                                        </h4>
                                        <div className="risk-meter">
                                            <div className="risk-label text-small">Risk Probability</div>
                                            <div className={`risk-score ${decision.ethical_risk_assessment.total_score < 40 ? 'low' : decision.ethical_risk_assessment.total_score < 70 ? 'medium' : 'high'}`}>
                                                {decision.ethical_risk_assessment.total_score}
                                            </div>
                                            <div className="text-xs text-muted">Scored out of 100</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {decision.compliance_validation.violated_rules?.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="mb-3 text-danger flex items-center gap-2">
                                        <AlertTriangle size={18} /> Violations Detected
                                    </h4>
                                    {decision.compliance_validation.violated_rules.map((violation: any, idx: number) => (
                                        <div key={idx} className="violation-card">
                                            <div className="font-semibold text-danger mb-1">{violation.rule}</div>
                                            <p className="text-sm text-gray-700 mb-2">{violation.reason}</p>
                                            <div className="text-xs text-gray-500 bg-white/50 inline-block px-2 py-1 rounded">
                                                Ref: {violation.legal_reference}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {decision.alternative_actions && decision.alternative_actions.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-success flex items-center gap-2">
                                        <CheckCircle size={18} /> Recommended Alternatives
                                    </h4>
                                    {decision.alternative_actions.map((alt: any, idx: number) => (
                                        <div key={idx} className="alternative-card">
                                            <div className="flex justify-between items-start mb-1">
                                                <strong className="text-success-dark">{alt.action}</strong>
                                                <span className="badge badge-success bg-white">{alt.compliance_status || alt.status}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{alt.reason || alt.rationale}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card border-dashed flex flex-col items-center justify-center p-12 text-center h-full">
                            <Shield size={48} className="text-tertiary mb-4" />
                            <h3 className="text-secondary mb-2">Ready to Analyze</h3>
                            <p className="text-muted max-w-md">
                                Select a case and a proposed action to run our AI compliance engine against federal regulations and ethical guidelines.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {decision && showExplainer && (
                <DecisionExplainerModal
                    decision={decision}
                    onClose={() => setShowExplainer(false)}
                />
            )}
        </div>
    );
}
