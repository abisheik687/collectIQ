import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface CommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseData: any;
    onSuccess: () => void;
}

export default function CommunicationModal({ isOpen, onClose, caseData, onSuccess }: CommunicationModalProps) {
    const [type, setType] = useState<'email' | 'sms'>('email');
    const [template, setTemplate] = useState('');
    const [templates, setTemplates] = useState<any>({ email: [], sms: [] });
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    useEffect(() => {
        if (template && caseData) {
            generatePreview();
        }
    }, [template, type]);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/communication/templates');
            setTemplates(res.data.templates);
            if (res.data.templates.email.length > 0) {
                setTemplate(res.data.templates.email[0].id);
            }
        } catch (error) {
            toast.error('Failed to load templates');
        }
    };

    const generatePreview = () => {
        const variables = {
            customerName: caseData.customerName,
            accountNumber: caseData.accountNumber,
            caseNumber: caseData.caseNumber,
            amount: caseData.amount?.toLocaleString() || '0',
            overdueDays: caseData.overdueDays || '0',
            dcaName: caseData.assignedDcaName || 'CollectIQ',
        };

        let previewText = template;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            previewText = previewText.replace(regex, value as string);
        });

        setPreview(previewText);
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            await api.post(`/cases/${caseData.id}/communicate`, {
                type,
                template,
                recipient: type === 'email' ? caseData.customerEmail : caseData.customerPhone,
            });

            toast.success(`${type === 'email' ? 'Email' : 'SMS'} sent successfully!`);
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send communication');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTemplate('');
        setPreview('');
        onClose();
    };

    if (!isOpen) return null;

    const currentTemplates = type === 'email' ? templates.email : templates.sms;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '700px' }}
            >
                <div className="flex justify-between items-center p-6 border-b border-subtle">
                    <div>
                        <h2 className="uppercase" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Send Communication
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Case: {caseData?.caseNumber} - {caseData?.customerName}
                        </p>
                    </div>
                    <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Type Selector */}
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>
                            Communication Type
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setType('email');
                                    setTemplate(templates.email[0]?.id || '');
                                }}
                                className={`btn ${type === 'email' ? 'btn-accent' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                <Mail size={16} />
                                Email
                            </button>
                            <button
                                onClick={() => {
                                    setType('sms');
                                    setTemplate(templates.sms[0]?.id || '');
                                }}
                                className={`btn ${type === 'sms' ? 'btn-accent' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                <MessageSquare size={16} />
                                SMS
                            </button>
                        </div>
                    </div>

                    {/* Template Selector */}
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <label className="form-label" htmlFor="template">
                            Template
                        </label>
                        <select
                            id="template"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            className="form-input"
                        >
                            {currentTemplates.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recipient */}
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <label className="form-label">Recipient</label>
                        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {type === 'email' ? caseData?.customerEmail || 'No email on file' : caseData?.customerPhone || 'No phone on file'}
                        </p>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div>
                            <label className="form-label">Preview</label>
                            <div
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-4)',
                                    fontFamily: type === 'sms' ? 'monospace' : 'inherit',
                                    fontSize: type === 'sms' ? '0.875rem' : '1rem',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                }}
                            >
                                {preview}
                            </div>
                            {type === 'sms' && (
                                <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    {preview.length} / 160 characters
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-subtle">
                    <button onClick={handleClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        className="btn btn-accent"
                        disabled={loading || !template || (!caseData?.customerEmail && type === 'email') || (!caseData?.customerPhone && type === 'sms')}
                    >
                        {loading ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send size={16} />
                                Send {type === 'email' ? ' Email' : 'SMS'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
