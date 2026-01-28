import bcrypt from 'bcryptjs';
import User from '../models/User';
import Case from '../models/Case';
import Workflow from '../models/Workflow';
import MLService from '../services/MLService';
import WorkflowEngine from '../services/WorkflowEngine';
import { logger } from '../utils/logger';

export async function initializeDatabase(): Promise<void> {
    try {
        // Check if we already have users
        const userCount = await User.count();
        if (userCount > 0) {
            logger.info('Database already initialized');
            return;
        }

        logger.info('Initializing database with seed data...');

        // Create demo users
        const adminPassword = await bcrypt.hash('admin123', 10);
        const dcaPassword = await bcrypt.hash('dca123', 10);

        await User.bulkCreate([
            {
                email: 'admin@enterprise.com',
                password: adminPassword,
                name: 'Enterprise Admin',
                role: 'enterprise',
                isActive: true,
            },
            {
                email: 'dca@agency.com',
                password: dcaPassword,
                name: 'DCA Collector 1',
                role: 'dca',
                agency: 'Premium Recovery Solutions',
                isActive: true,
            },
            {
                email: 'dca2@agency.com',
                password: dcaPassword,
                name: 'DCA Collector 2',
                role: 'dca',
                agency: 'Elite Collections Inc',
                isActive: true,
            },
        ]);

        logger.info('Demo users created');

        // Create sample cases
        const admin = await User.findOne({ where: { email: 'admin@enterprise.com' } });
        if (!admin) return;

        const sampleCases = [
            { accountNumber: 'ACC-001', customerName: 'John Smith', amount: 5000, overdueDays: 45, historicalPayments: 3 },
            { accountNumber: 'ACC-002', customerName: 'Jane Doe', amount: 12000, overdueDays: 90, historicalPayments: 1 },
            { accountNumber: 'ACC-003', customerName: 'Bob Johnson', amount: 3500, overdueDays: 30, historicalPayments: 5 },
            { accountNumber: 'ACC-004', customerName: 'Alice Williams', amount: 8000, overdueDays: 60, historicalPayments: 2 },
            { accountNumber: 'ACC-005', customerName: 'Charlie Brown', amount: 15000, overdueDays: 120, historicalPayments: 0 },
            { accountNumber: 'ACC-006', customerName: 'Diana Prince', amount: 4200, overdueDays: 25, historicalPayments: 6 },
            { accountNumber: 'ACC-007', customerName: 'Frank Castle', amount: 9500, overdueDays: 75, historicalPayments: 2 },
            { accountNumber: 'ACC-008', customerName: 'Grace Hopper', amount: 6800, overdueDays: 40, historicalPayments: 4 },
        ];

        for (const caseData of sampleCases) {
            const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Get ML prediction
            const prediction = await MLService.predictPaymentProbability({
                overdueDays: caseData.overdueDays,
                amount: caseData.amount,
                historicalPayments: caseData.historicalPayments,
                contactFrequency: 0,
            });

            // Assign some cases to DCAs for demo purposes
            let assignedDcaId = undefined;
            let assignedDcaName = undefined;
            let status: 'new' | 'assigned' = 'new';

            // Assign first 2 cases to DCA 1
            if (caseData.accountNumber === 'ACC-001' || caseData.accountNumber === 'ACC-002') {
                const dca1 = await User.findOne({ where: { email: 'dca@agency.com' } });
                if (dca1) {
                    assignedDcaId = dca1.id;
                    assignedDcaName = dca1.agency; // Use agency name as dcaName
                    status = 'assigned';
                }
            }
            // Assign next 2 cases to DCA 2
            else if (caseData.accountNumber === 'ACC-003' || caseData.accountNumber === 'ACC-004') {
                const dca2 = await User.findOne({ where: { email: 'dca2@agency.com' } });
                if (dca2) {
                    assignedDcaId = dca2.id;
                    assignedDcaName = dca2.agency;
                    status = 'assigned';
                }
            }

            // Create case
            const newCase = await Case.create({
                caseNumber,
                accountNumber: caseData.accountNumber,
                customerName: caseData.customerName,
                amount: caseData.amount,
                overdueDays: caseData.overdueDays,
                status: status,
                priority: prediction.priority,
                riskScore: prediction.riskScore,
                paymentProbability: prediction.paymentProbability,
                contactCount: 0,
                createdBy: admin.id,
                assignedDcaId,
                assignedDcaName,
            });

            // Initialize workflow
            await WorkflowEngine.initializeWorkflow(newCase.id);
        }

        logger.info(`Created ${sampleCases.length} sample cases with ML scoring`);
        logger.info('Database initialization complete');
    } catch (error) {
        logger.error('Failed to initialize database:', error);
        throw error;
    }
}
