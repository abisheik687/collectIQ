import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api/v1';

const PaymentsPage: React.FC = () => {
    const { token } = useAuthStore();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPayments(response.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            submitted: 'bg-yellow-100 text-yellow-800',
            matched: 'bg-blue-100 text-blue-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            applied: 'bg-purple-100 text-purple-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Payment Management</h1>
                <button
                    onClick={fetchPayments}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <p className="text-center">Loading payments...</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTR Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{payment.id}</td>
                                    <td className="px-6 py-4">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                            {payment.utrReference}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 font-semibold">${payment.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">{payment.bankName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(payment.submittedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;
