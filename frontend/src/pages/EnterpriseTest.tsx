import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EnterpriseTest.css';

const API_BASE = 'http://localhost:5000/api/v1';

// Mock auth token for testing
const AUTH_TOKEN = 'test-token';

const EnterpriseTest: React.FC = () => {
    const [activeTab, setActiveTab] = useState('vendors');
    const [vendors, setVendors] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [reconciliations, setReconciliations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Vendor form state
    const [vendorForm, setVendorForm] = useState({
        vendorName: '',
        contactPerson: '',
        email: '',
        phone: '',
        region: 'MENA',
    });

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        caseId: '',
        utrReference: '',
        amount: '',
        currency: 'USD',
        paymentDate: new Date().toISOString().split('T')[0],
        bankName: '',
    });

    const axiosConfig = {
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
        },
    };

    // Fetch vendors
    const fetchVendors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE}/vendors`, axiosConfig);
            setVendors(response.data.data || []);
            setSuccess('Vendors loaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create vendor
    const createVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE}/vendors`, vendorForm, axiosConfig);
            setSuccess(`Vendor "${response.data.data.vendorName}" created successfully!`);
            setVendorForm({
                vendorName: '',
                contactPerson: '',
                email: '',
                phone: '',
                region: 'MENA',
            });
            fetchVendors();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch payments
    const fetchPayments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE}/payments`, axiosConfig);
            setPayments(response.data.data || []);
            setSuccess('Payments loaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Submit payment
    const submitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...paymentForm,
                caseId: parseInt(paymentForm.caseId),
                amount: parseFloat(paymentForm.amount),
            };
            const response = await axios.post(`${API_BASE}/payments`, payload, axiosConfig);
            setSuccess(`Payment ${response.data.data.utrReference} submitted successfully!`);
            setPaymentForm({
                caseId: '',
                utrReference: '',
                amount: '',
                currency: 'USD',
                paymentDate: new Date().toISOString().split('T')[0],
                bankName: '',
            });
            fetchPayments();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch commissions
    const fetchCommissions = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE}/commission`, axiosConfig);
            setCommissions(response.data.data || []);
            setSuccess('Commissions loaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch tickets
    const fetchTickets = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE}/tickets`, axiosConfig);
            setTickets(response.data.data || []);
            setSuccess('Tickets loaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch reconciliations
    const fetchReconciliations = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE}/reconciliation`, axiosConfig);
            setReconciliations(response.data.data || []);
            setSuccess('Reconciliations loaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            setSuccess('');
            setError('');
        }, 5000);
    }, [success, error]);

    return (
        <div className="enterprise-test">
            <h1>🚀 CollectIQ Enterprise API Test Dashboard</h1>

            {error && <div className="alert alert-error">❌ {error}</div>}
            {success && <div className="alert alert-success">✅ {success}</div>}

            <div className="tabs">
                <button
                    className={activeTab === 'vendors' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('vendors')}
                >
                    Vendors
                </button>
                <button
                    className={activeTab === 'payments' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('payments')}
                >
                    Payments
                </button>
                <button
                    className={activeTab === 'commissions' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('commissions')}
                >
                    Commissions
                </button>
                <button
                    className={activeTab === 'tickets' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('tickets')}
                >
                    Tickets
                </button>
                <button
                    className={activeTab === 'reconciliation' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('reconciliation')}
                >
                    Reconciliation
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'vendors' && (
                    <div className="vendor-panel">
                        <h2>DCA Vendor Management</h2>

                        <div className="form-section">
                            <h3>Create New Vendor</h3>
                            <form onSubmit={createVendor}>
                                <input
                                    type="text"
                                    placeholder="Vendor Name"
                                    value={vendorForm.vendorName}
                                    onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Contact Person"
                                    value={vendorForm.contactPerson}
                                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={vendorForm.email}
                                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={vendorForm.phone}
                                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                                    required
                                />
                                <select
                                    value={vendorForm.region}
                                    onChange={(e) => setVendorForm({ ...vendorForm, region: e.target.value })}
                                >
                                    <option value="MENA">MENA</option>
                                    <option value="India">India</option>
                                    <option value="Africa">Africa</option>
                                    <option value="Europe">Europe</option>
                                </select>
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Vendor'}
                                </button>
                            </form>
                        </div>

                        <div className="data-section">
                            <div className="section-header">
                                <h3>Existing Vendors ({vendors.length})</h3>
                                <button onClick={fetchVendors} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Vendor Name</th>
                                            <th>Contact</th>
                                            <th>Region</th>
                                            <th>Success Rate</th>
                                            <th>Total Collected</th>
                                            <th>Cases</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendors.map((vendor) => (
                                            <tr key={vendor.id}>
                                                <td>{vendor.id}</td>
                                                <td><strong>{vendor.vendorName}</strong></td>
                                                <td>{vendor.contactPerson}</td>
                                                <td>{vendor.region}</td>
                                                <td>{vendor.successRate}%</td>
                                                <td>${vendor.totalCollected.toLocaleString()}</td>
                                                <td>{vendor.totalCasesAssigned}</td>
                                                <td>
                                                    <span className={vendor.isActive ? 'badge active' : 'badge inactive'}>
                                                        {vendor.isActive ? 'Active' : 'Inactive'}
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

                {activeTab === 'payments' && (
                    <div className="payment-panel">
                        <h2>Payment Management</h2>

                        <div className="form-section">
                            <h3>Submit New Payment</h3>
                            <form onSubmit={submitPayment}>
                                <input
                                    type="number"
                                    placeholder="Case ID"
                                    value={paymentForm.caseId}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, caseId: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="UTR Reference"
                                    value={paymentForm.utrReference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, utrReference: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    value={paymentForm.paymentDate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Bank Name"
                                    value={paymentForm.bankName}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                                    required
                                />
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Payment'}
                                </button>
                            </form>
                        </div>

                        <div className="data-section">
                            <div className="section-header">
                                <h3>Recent Payments ({payments.length})</h3>
                                <button onClick={fetchPayments} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>UTR</th>
                                            <th>Amount</th>
                                            <th>Payment Date</th>
                                            <th>Bank</th>
                                            <th>Status</th>
                                            <th>Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{payment.id}</td>
                                                <td><code>{payment.utrReference}</code></td>
                                                <td><strong>${payment.amount}</strong></td>
                                                <td>{payment.paymentDate}</td>
                                                <td>{payment.bankName}</td>
                                                <td>
                                                    <span className={`badge status-${payment.status}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(payment.submittedAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'commissions' && (
                    <div className="commission-panel">
                        <h2>Commission Tracking</h2>
                        <div className="data-section">
                            <div className="section-header">
                                <h3>Commission Records ({commissions.length})</h3>
                                <button onClick={fetchCommissions} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Vendor</th>
                                            <th>Period</th>
                                            <th>Total Collected</th>
                                            <th>Commission Rate</th>
                                            <th>Commission Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissions.map((commission) => (
                                            <tr key={commission.id}>
                                                <td>{commission.id}</td>
                                                <td>{commission.dcaVendor?.vendorName || 'N/A'}</td>
                                                <td>{commission.periodStart} - {commission.periodEnd}</td>
                                                <td>${commission.totalCollected.toLocaleString()}</td>
                                                <td>{(commission.commissionRate * 100).toFixed(2)}%</td>
                                                <td><strong>${commission.commissionAmount.toLocaleString()}</strong></td>
                                                <td>
                                                    <span className={`badge status-${commission.status}`}>
                                                        {commission.status}
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

                {activeTab === 'tickets' && (
                    <div className="ticket-panel">
                        <h2>Ticket System</h2>
                        <div className="data-section">
                            <div className="section-header">
                                <h3>Support Tickets ({tickets.length})</h3>
                                <button onClick={fetchTickets} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Subject</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td>{ticket.id}</td>
                                                <td>{ticket.subject}</td>
                                                <td>{ticket.ticketType}</td>
                                                <td>
                                                    <span className={`badge status-${ticket.status}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge priority-${ticket.priority}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reconciliation' && (
                    <div className="reconciliation-panel">
                        <h2>Reconciliation</h2>
                        <div className="data-section">
                            <div className="section-header">
                                <h3>Reconciliation History ({reconciliations.length})</h3>
                                <button onClick={fetchReconciliations} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Period</th>
                                            <th>Matched</th>
                                            <th>Exceptions</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Completed At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reconciliations.map((recon) => (
                                            <tr key={recon.id}>
                                                <td>{recon.id}</td>
                                                <td>{recon.reconciliationPeriod}</td>
                                                <td className="success-text">{recon.matchedCount}</td>
                                                <td className="error-text">{recon.exceptionCount}</td>
                                                <td>${recon.totalMatchedAmount.toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge status-${recon.status}`}>
                                                        {recon.status}
                                                    </span>
                                                </td>
                                                <td>{recon.completedAt ? new Date(recon.completedAt).toLocaleString() : 'In Progress'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnterpriseTest;
