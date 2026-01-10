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

        // Disable FK checks for SQLite init
        await sequelize.query('PRAGMA foreign_keys = OFF;');

        // Sync database models (standard sync for in-memory)
        try {
            await sequelize.sync();
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

startServer();

export default app;
