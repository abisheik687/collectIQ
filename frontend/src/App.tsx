import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DCAPortalPage from './pages/DCAPortalPage';
import CaseDetailsPage from './pages/CaseDetailsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditPage from './pages/AuditPage';
import ComplianceDecisionPage from './pages/ComplianceDecisionPage';
import AdminGovernancePage from './pages/AdminGovernancePage';
import EnterpriseTest from './pages/EnterpriseTest';
import VendorsPage from './pages/VendorsPage';
import PaymentsPage from './pages/PaymentsPage';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
    const { user } = useAuthStore();

    return (
        <>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={
                        (user?.role === 'fedex_admin' || user?.role === 'fedex_user') ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Navigate to="/dca-portal" replace />
                        )
                    } />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="dca-portal" element={<DCAPortalPage />} />
                    <Route path="cases/:id" element={<CaseDetailsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="audit" element={<AuditPage />} />
                    <Route path="compliance" element={<ComplianceDecisionPage />} />
                    <Route path="governance" element={<AdminGovernancePage />} />
                    <Route path="enterprise-test" element={<EnterpriseTest />} />
                    <Route path="vendors" element={<VendorsPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                </Route>
            </Routes>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1F2937',
                        color: '#fff',
                        fontSize: '0.875rem',
                        maxWidth: '500px',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                    success: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 5000,
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </>
    );
}

export default App;
