import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';
import communicationRoutes from './routes/communication';
import emailRoutes from './routes/email';
import adminRoutes from './routes/admin';
import complianceRoutes from './routes/compliance';
import workflowRoutes from './routes/workflow';
import vendorRoutes from './routes/vendors';
import paymentRoutes from './routes/payments';
import commissionRoutes from './routes/commission';
import ticketRoutes from './routes/tickets';
import reconciliationRoutes from './routes/reconciliation';
import promiseToPayRoutes from './routes/promiseToPay';
import { errorHandler } from './middleware/errorHandler';
import { initializeDatabase } from './scripts/init-db';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Root route - API information
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'CollectIQ API',
        version: '1.0.0',
        status: 'running',
        description: 'AI-Powered DCA Management Platform',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/login',
            cases: '/api/cases',
            analytics: '/api/analytics',
            compliance: '/api/compliance',
            admin: '/api/admin'
        },
        documentation: 'See README.md for complete API documentation'
    });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/workflow', workflowRoutes);

// Enterprise Routes (v1)
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/commission', commissionRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/promise-to-pay', promiseToPayRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Disable FK checks for SQLite init (not needed for PostgreSQL)
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = OFF;');
        }

        // Sync database models (standard sync for in-memory)
        try {
            await sequelize.sync({ alter: true });
            logger.info('Database models synchronized');
        } catch (syncError) {
            logger.error('Sync failed:', syncError);
            throw syncError;
        }

        // Initialize database with sample data (REQUIRED for in-memory DB)
        try {
            await initializeDatabase();
            logger.info('Sample data initialized');
        } catch (err) {
            logger.error('Failed to seed database:', err);
        }

        // Initialize scheduled jobs
        try {
            const { initializeJobs } = require('./jobs');
            initializeJobs();
            logger.info('Scheduled jobs initialized successfully');
        } catch (err) {
            logger.error('Failed to initialize scheduled jobs:', err);
        }

        // Start server
        app.listen(PORT, () => {
            logger.info(`🚀 CollectIQ Backend Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
});

// Only start server if run directly (not imported)
if (require.main === module) {
    startServer();
}

export default app;
