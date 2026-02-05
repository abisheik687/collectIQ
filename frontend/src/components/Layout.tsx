import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, BarChart3, FileText, Shield, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = (user?.role === 'fedex_admin' || user?.role === 'fedex_user')
        ? [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/analytics', icon: BarChart3, label: 'Analytics' },
            { to: '/compliance', icon: Shield, label: 'AI Compliance' },
            { to: '/governance', icon: Building2, label: 'Governance' },
            { to: '/audit', icon: FileText, label: 'Audit Trail' },
        ]
        : [
            { to: '/dca-portal', icon: Users, label: 'My Cases' },
        ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Enterprise Sidebar */}
            <aside className="sidebar">
                <div style={{ padding: '2rem 1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white',
                            fontWeight: 900,
                            fontSize: '1.5rem',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>IQ</div>
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                background: 'linear-gradient(135deg, white 0%, #e2e8f0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '-4px'
                            }}>Collect<span style={{ color: 'var(--accent)' }}>IQ</span></h2>
                            <p style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--text-tertiary)',
                                fontWeight: 600
                            }}>Logistics Prime</p>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', paddingLeft: '3rem' }}>
                        {(user?.role === 'fedex_admin' || user?.role === 'fedex_user') ? 'FedEx Edition' : user?.name}
                    </p>
                </div>

                <nav style={{ flex: 1, padding: '0 0.75rem' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} style={{ opacity: 0.9 }} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{user?.email}</p>
                        <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.6875rem',
                            color: '#16a34a',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#16a34a',
                                animation: 'pulse 2s ease-in-out infinite'
                            }}></div>
                            System Operational
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link"
                        style={{ width: '100%', margin: 0, justifyContent: 'flex-start', color: '#f97316' }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflow: 'auto' }}>
                <div className="animate-enter" style={{ minHeight: '100%' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
