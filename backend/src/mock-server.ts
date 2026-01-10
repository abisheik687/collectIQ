import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Mock Data
const MOCK_USER = {
    id: 1,
    email: 'admin@enterprise.com',
    name: 'Enterprise Admin',
    role: 'enterprise',
    token: 'mock-jwt-token-12345'
};

const MOCK_DASHBOARD = {
    totalCases: 1250,
    activeCases: 845,
    resolvedCases: 405,
    totalRecovered: 1540000,
    recoveryRate: 32.4,
    recoveryTrend: +5.2,
    activeTrend: -2.1,
    resolvedTrend: +8.5
};

// Routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email} with password length ${password?.length}`);

    // Accept any password for mock demo
    if (email === 'admin@enterprise.com' || email === 'dca@agency.com') {
        res.json({
            success: true,
            user: { ...MOCK_USER, email, role: email.includes('admin') ? 'enterprise' : 'dca' },
            token: MOCK_USER.token
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/analytics/dashboard', (_req, res) => {
    res.json(MOCK_DASHBOARD);
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', mode: 'simulation' });
});

app.listen(PORT, () => {
    console.log(`🚀 CollectIQ Simulation Server running on http://localhost:${PORT}`);
    console.log('✅ Auth & Dashboard endpoints active');
});
