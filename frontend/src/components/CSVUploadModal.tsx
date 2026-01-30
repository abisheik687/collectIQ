import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface CSVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CSVRow {
    customerName: string;
    customerEmail: string;
    amount: string;
    dueDate: string;
    priority?: string;
    assignedDCA?: string;
}

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<CSVRow[]>([]);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setFile(selectedFile);
        setErrors([]);

        // Parse CSV for preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                setErrors(['CSV file is empty or has no data rows']);
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['customername', 'customeremail', 'amount', 'duedate'];

            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
                return;
            }

            // Parse first 5 rows for preview
            const previewRows: CSVRow[] = [];
            for (let i = 1; i < Math.min(6, lines.length); i++) {
                const values = lines[i].split(',').map(v => v.trim());
                previewRows.push({
                    customerName: values[headers.indexOf('customername')] || '',
                    customerEmail: values[headers.indexOf('customeremail')] || '',
                    amount: values[headers.indexOf('amount')] || '',
                    dueDate: values[headers.indexOf('duedate')] || '',
                    priority: values[headers.indexOf('priority')] || 'medium',
                    assignedDCA: values[headers.indexOf('assigneddca')] || ''
                });
            }

            setPreview(previewRows);
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/cases/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success(`Successfully created ${res.data.created} cases!`);
                if (res.data.errors && res.data.errors.length > 0) {
                    toast.error(`${res.data.errors.length} rows had errors`);
                    setErrors(res.data.errors);
                }
                onSuccess();
                handleClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview([]);
        setErrors([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="flex justify-between items-center p-6 border-b border-subtle">
                    <div>
                        <h2 className="uppercase" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Bulk Upload Cases
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Upload a CSV file to create multiple cases at once
                        </p>
                    </div>
                    <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Upload Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                            border: '2px dashed var(--border-default)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-8)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: 'var(--bg-tertiary)',
                            marginBottom: 'var(--space-6)',
                            transition: 'all var(--transition-normal)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                    >
                        <Upload size={48} style={{ margin: '0 auto var(--space-4)', color: 'var(--accent)' }} />
                        <p className="font-medium" style={{ marginBottom: '0.5rem' }}>
                            {file ? file.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            CSV file with headers: customerName, customerEmail, amount, dueDate
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div style={{
                            backgroundColor: 'var(--danger-bg)',
                            border: '2px solid var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-6)'
                        }}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={20} color="var(--danger)" />
                                <h4 className="font-bold uppercase text-sm" style={{ color: 'var(--danger)', letterSpacing: '0.05em' }}>
                                    Validation Errors
                                </h4>
                            </div>
                            <ul className="text-sm" style={{ color: 'var(--danger)', paddingLeft: '1.5rem' }}>
                                {errors.slice(0, 5).map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet size={20} color="var(--success)" />
                                <h4 className="font-bold uppercase text-sm" style={{ letterSpacing: '0.05em' }}>
                                    Preview (First 5 Rows)
                                </h4>
                            </div>
                            <div className="table-container" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Email</th>
                                            <th>Amount</th>
                                            <th>Due Date</th>
                                            <th>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="font-medium">{row.customerName}</td>
                                                <td className="font-mono text-sm">{row.customerEmail}</td>
                                                <td className="font-mono">${row.amount}</td>
                                                <td className="font-mono text-sm">{row.dueDate}</td>
                                                <td>
                                                    <span className={`badge badge-${row.priority || 'neutral'}`}>
                                                        {row.priority || 'medium'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-subtle">
                    <button onClick={handleClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        className="btn btn-accent"
                        disabled={!file || errors.length > 0 || uploading}
                    >
                        {uploading ? (
                            <>Uploading...</>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Upload {preview.length > 0 && `(${preview.length}+ cases)`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
