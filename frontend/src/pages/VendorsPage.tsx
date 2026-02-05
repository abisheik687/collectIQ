import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import './VendorsPage.css';

const API_BASE = 'http://localhost:5000/api/v1';

const VendorsPage: React.FC = () => {
    const { token } = useAuthStore();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        vendorName: '',
        contactPerson: '',
        email: '',
        phone: '',
        region: 'MENA',
    });

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/vendors`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVendors(response.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const createVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/vendors`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Vendor created successfully!');
            setFormData({ vendorName: '', contactPerson: '', email: '', phone: '', region: 'MENA' });
            setShowForm(false);
            fetchVendors();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create vendor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    return (
        <div className="vendors-page">
            <div className="page-header">
                <h1>DCA Vendor Management</h1>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Vendor'}
                </button>
            </div>

            {showForm && (
                <div className="vendor-form-card">
                    <h3>Create New Vendor</h3>
                    <form onSubmit={createVendor}>
                        <div className="form-grid">
                            <input
                                type="text"
                                placeholder="Vendor Name *"
                                value={formData.vendorName}
                                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Contact Person *"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email *"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone *"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            >
                                <option value="MENA">MENA</option>
                                <option value="India">India</option>
                                <option value="Africa">Africa</option>
                                <option value="Europe">Europe</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Vendor'}
                        </button>
                    </form>
                </div>
            )}

            <div className="vendors-grid">
                {loading && <p>Loading vendors...</p>}
                {vendors.map((vendor) => (
                    <div key={vendor.id} className="vendor-card">
                        <div className="vendor-header">
                            <h3>{vendor.vendorName}</h3>
                            <span className={`status ${vendor.isActive ? 'active' : 'inactive'}`}>
                                {vendor.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="vendor-details">
                            <p><strong>Contact:</strong> {vendor.contactPerson}</p>
                            <p><strong>Email:</strong> {vendor.email}</p>
                            <p><strong>Region:</strong> {vendor.region}</p>
                        </div>
                        <div className="vendor-metrics">
                            <div className="metric">
                                <span className="label">Success Rate</span>
                                <span className="value">{vendor.successRate}%</span>
                            </div>
                            <div className="metric">
                                <span className="label">Total Collected</span>
                                <span className="value">${vendor.totalCollected.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                                <span className="label">Cases Assigned</span>
                                <span className="value">{vendor.totalCasesAssigned}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VendorsPage;
