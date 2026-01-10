import { Outlet, NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, BarChart3, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
    const { user, logout } = useAuthStore();

    const navItems = user?.role === 'enterprise'
        ? [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/analytics', icon: BarChart3, label: 'Analytics' },
            { to: '/audit', icon: FileText, label: 'Audit Trail' },
        ]
        : [
            { to: '/dca-portal', icon: Users, label: 'My Cases' },
        ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: '250px',
                backgroundColor: 'var(--gray-900)',
                color: 'white',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: 'white', fontSize: '1.5rem' }}>CollectIQ</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                        {user?.role === 'enterprise' ? 'Enterprise' : user?.agency}
                    </p>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius)',
                                marginBottom: '0.5rem',
                                color: isActive ? 'white' : 'var(--gray-400)',
                                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'var(--transition)',
                            })}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--gray-700)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{user?.email}</p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius)',
                            color: 'var(--gray-400)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'var(--transition)',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gray-800)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--gray-400)';
                        }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ padding: '2rem' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
