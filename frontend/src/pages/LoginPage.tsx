import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            login(user, token);
            toast.success('Login successful!');

            if (user.role === 'enterprise') {
                navigate('/dashboard');
            } else {
                navigate('/dca-portal');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const demoLogin = (role: 'enterprise' | 'dca') => {
        if (role === 'enterprise') {
            setEmail('admin@enterprise.com');
            setPassword('admin123');
        } else {
            setEmail('dca@agency.com');
            setPassword('dca123');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>CollectIQ</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>AI-Powered DCA Management</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                    <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Demo Accounts:</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => demoLogin('enterprise')}
                            className="btn btn-secondary btn-sm"
                            type="button"
                        >
                            Enterprise
                        </button>
                        <button
                            onClick={() => demoLogin('dca')}
                            className="btn btn-secondary btn-sm"
                            type="button"
                        >
                            DCA Collector
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
