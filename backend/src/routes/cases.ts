import { Router, Response } from 'express';
import { Op } from 'sequelize';
import Case from '../models/Case';
import Workflow from '../models/Workflow';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import AuditService from '../services/AuditService';
import WorkflowEngine from '../services/WorkflowEngine';
import MLService from '../services/MLService';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List cases
router.get('/', async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            status,
            priority,
            assignedDcaId,
            search,
            page = '1',
            limit = '20',
        } = req.query;

        const where: any = {};

        // DCA users can only see their assigned cases
        if (req.user!.role === 'dca') {
            where.assignedDcaId = req.user!.id;
        }

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedDcaId) where.assignedDcaId = assignedDcaId;

        if (search) {
            where[Op.or] = [
                { caseNumber: { [Op.iLike]: `%${search}%` } },
                { accountNumber: { [Op.iLike]: `%${search}%` } },
                { customerName: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows } = await Case.findAndCountAll({
            where,
            limit: parseInt(limit as string),
            offset,
            order: [['createdAt', 'DESC']],
            include: [{ model: Workflow, as: 'workflow' }],
        });

        res.json({
            cases: rows,
            pagination: {
                total: count,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                pages: Math.ceil(count / parseInt(limit as string)),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get case by ID
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const caseRecord = await Case.findByPk(req.params.id, {
            include: [{ model: Workflow, as: 'workflow' }],
        });

        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        // DCA users can only view their assigned cases
        if (req.user!.role === 'dca' && caseRecord.assignedDcaId !== req.user!.id) {
            throw new AppError('Access denied', 403);
        }

        res.json({ case: caseRecord });
    } catch (error) {
        next(error);
    }
});

// Create case (Enterprise only)
router.post('/', authorize('enterprise'), async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            accountNumber,
            customerName,
            amount,
            overdueDays,
            historicalPayments = 0,
            contactFrequency = 0,
        } = req.body;

        // Generate case number
        const caseNumber = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Get ML predictions
        const prediction = await MLService.predictPaymentProbability({
            overdueDays,
            amount,
            historicalPayments,
            contactFrequency,
        });

        // Create case
        const caseRecord = await Case.create({
            caseNumber,
            accountNumber,
            customerName,
            amount,
            overdueDays,
            status: 'new',
            priority: prediction.priority,
            riskScore: prediction.riskScore,
            paymentProbability: prediction.paymentProbability,
            contactCount: 0,
            createdBy: req.user!.id,
        });

        // Initialize workflow
        await WorkflowEngine.initializeWorkflow(caseRecord.id);

        // Audit log
        await AuditService.log({
            action: 'CREATE_CASE',
            entityType: 'Case',
            entityId: caseRecord.id,
            userId: req.user!.id,
            userName: req.user!.name,
            afterState: caseRecord.toJSON(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.status(201).json({ case: caseRecord });
    } catch (error) {
        next(error);
    }
});

// Update case
router.put('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const caseRecord = await Case.findByPk(req.params.id);

        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        // DCA users can only update their assigned cases
        if (req.user!.role === 'dca' && caseRecord.assignedDcaId !== req.user!.id) {
            throw new AppError('Access denied', 403);
        }

        const beforeState = caseRecord.toJSON();

        const { notes, status, resolution } = req.body;
        const updates: any = {};

        if (notes) updates.notes = notes;
        if (status) updates.status = status;
        if (resolution) updates.resolution = resolution;

        await caseRecord.update(updates);

        const afterState = caseRecord.toJSON();

        // Audit log
        await AuditService.log({
            action: 'UPDATE_CASE',
            entityType: 'Case',
            entityId: caseRecord.id,
            userId: req.user!.id,
            userName: req.user!.name,
            beforeState,
            afterState,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({ case: caseRecord });
    } catch (error) {
        next(error);
    }
});

// Assign case to DCA (Enterprise only)
router.post('/:id/assign', authorize('enterprise'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { dcaId, dcaName } = req.body;

        const caseRecord = await Case.findByPk(req.params.id);

        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        const beforeState = caseRecord.toJSON();

        await caseRecord.update({
            assignedDcaId: dcaId,
            assignedDcaName: dcaName,
            status: 'assigned',
        });

        // Transition workflow
        await WorkflowEngine.transitionStage(caseRecord.id, 'contact');

        const afterState = caseRecord.toJSON();

        // Audit log
        await AuditService.log({
            action: 'ASSIGN_CASE',
            entityType: 'Case',
            entityId: caseRecord.id,
            userId: req.user!.id,
            userName: req.user!.name,
            beforeState,
            afterState,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({ case: caseRecord });
    } catch (error) {
        next(error);
    }
});

// Add note to case
router.post('/:id/notes', async (req: AuthRequest, res: Response, next) => {
    try {
        const { note } = req.body;

        const caseRecord = await Case.findByPk(req.params.id);

        if (!caseRecord) {
            throw new AppError('Case not found', 404);
        }

        if (req.user!.role === 'dca' && caseRecord.assignedDcaId !== req.user!.id) {
            throw new AppError('Access denied', 403);
        }

        const beforeState = caseRecord.notes;
        const newNotes = caseRecord.notes
            ? `${caseRecord.notes}\n\n[${new Date().toISOString()}] ${req.user!.name}: ${note}`
            : `[${new Date().toISOString()}] ${req.user!.name}: ${note}`;

        await caseRecord.update({ notes: newNotes });

        // Audit log
        await AuditService.log({
            action: 'ADD_NOTE',
            entityType: 'Case',
            entityId: caseRecord.id,
            userId: req.user!.id,
            userName: req.user!.name,
            beforeState: { notes: beforeState },
            afterState: { notes: newNotes },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({ case: caseRecord });
    } catch (error) {
        next(error);
    }
});

// Get workflow status
router.get('/:id/workflow', async (req: AuthRequest, res: Response, next) => {
    try {
        const workflow = await WorkflowEngine.getWorkflowStatus(parseInt(req.params.id));
        res.json({ workflow });
    } catch (error) {
        next(error);
    }
});

export default router;
