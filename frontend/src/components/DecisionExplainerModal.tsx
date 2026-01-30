interface DecisionExplainerModalProps {
    decision: any;
    onClose: () => void;
}

export default function DecisionExplainerModal({ decision, onClose }: DecisionExplainerModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-enter" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Decision Explanation</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {/* Decision Summary */}
                    <section className="mb-6">
                        <h3 className="text-lg text-primary mb-2">Decision Summary</h3>
                        <div className="bg-tertiary p-4 rounded-lg font-mono text-sm">
                            {decision.explanation.decision_summary}
                        </div>
                    </section>

                    {/* Why This Action */}
                    {decision.explanation.why_this_action && (
                        <section className="mb-6">
                            <h3 className="text-lg text-primary mb-2">Why This Action?</h3>
                            <div className="text-gray-700 leading-relaxed">
                                {decision.explanation.why_this_action}
                            </div>
                        </section>
                    )}

                    {/* Why Blocked */}
                    {decision.explanation.why_blocked && (
                        <section className="mb-6">
                            <h3 className="text-lg text-danger mb-2">Why Blocked?</h3>
                            <div>
                                {decision.explanation.why_blocked.map((reason: string, idx: number) => (
                                    <div key={idx} className="violation-card">
                                        {reason}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Why Not Alternatives */}
                    {decision.explanation.why_not_alternatives && (
                        <section className="mb-6">
                            <h3 className="text-lg text-primary mb-2">Why Not Alternatives?</h3>
                            <div>
                                {Array.isArray(decision.explanation.why_not_alternatives) ? (
                                    decision.explanation.why_not_alternatives.map((alt: any, idx: number) => (
                                        <div key={idx} className="mb-4 bg-tertiary p-3 rounded border border-subtle">
                                            <div className="flex justify-between mb-1">
                                                <strong>{alt.action}</strong>
                                                <span className="badge badge-neutral bg-white">{alt.status}</span>
                                            </div>
                                            <p className="text-sm text-secondary">{alt.rationale}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary">{decision.explanation.why_not_alternatives}</p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Guiding Principles */}
                    {decision.explanation.principles_applied && (
                        <section className="mb-6">
                            <h3 className="text-lg text-info mb-2">Guiding Principles Applied</h3>
                            <div className="flex flex-wrap gap-2">
                                {decision.explanation.principles_applied.map((principle: string, idx: number) => (
                                    <span key={idx} className="badge badge-info bg-white border border-info-subtle">
                                        {principle}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Legal Justification */}
                    {decision.explanation.legal_justification && (
                        <section className="mb-6">
                            <h3 className="text-lg text-primary mb-2">Legal Justification</h3>
                            <div className="bg-warning-bg p-4 rounded border border-warning text-sm text-warning-dark">
                                {decision.explanation.legal_justification}
                            </div>
                        </section>
                    )}

                    {/* Expected Outcome */}
                    {decision.explanation.expected_outcome && (
                        <section className="mb-6">
                            <h3 className="text-lg text-success mb-2">Expected Outcome</h3>
                            <p className="text-secondary">{decision.explanation.expected_outcome}</p>
                        </section>
                    )}
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Close Report</button>
                </div>
            </div>
        </div>
    );
}
