import { Router, Request, Response } from 'express';
import ticketService from '../services/ticketService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/tickets
 * Create a new ticket
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { caseId, ticketType, subject, description, priority } = req.body;

        if (!caseId || !ticketType || !subject || !description) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: caseId, ticketType, subject, description',
            });
        }

        const ticket = await ticketService.createTicket({
            caseId,
            ticketType,
            createdBy: userId,
            subject,
            description,
            priority,
        });

        res.status(201).json({
            success: true,
            data: ticket,
            message: 'Ticket created successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/tickets
 * Get all tickets with filters
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { caseId, status, ticketType, assignedTo, createdBy } = req.query;

        const tickets = await ticketService.getTickets({
            caseId: caseId ? parseInt(caseId as string) : undefined,
            status: status as string,
            ticketType: ticketType as string,
            assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
            createdBy: createdBy ? parseInt(createdBy as string) : undefined,
        });

        res.json({ success: true, data: tickets, count: tickets.length });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/tickets/:id
 * Get ticket by ID with messages
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const ticket = await ticketService.getTicketById(parseInt(req.params.id));
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        res.json({ success: true, data: ticket });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/tickets/:id/messages
 * Add message to ticket
 */
router.post('/:id/messages', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { message, attachments } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const ticketMessage = await ticketService.addMessage(
            parseInt(req.params.id),
            userId,
            message,
            attachments
        );

        res.status(201).json({
            success: true,
            data: ticketMessage,
            message: 'Message added successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/v1/tickets/:id
 * Update ticket
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { status, priority, assignedTo } = req.body;

        const ticket = await ticketService.updateTicket(parseInt(req.params.id), {
            status,
            priority,
            assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
        });

        res.json({
            success: true,
            data: ticket,
            message: 'Ticket updated successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/tickets/:id/close
 * Close ticket
 */
router.post('/:id/close', authMiddleware, async (req: Request, res: Response) => {
    try {
        const ticket = await ticketService.closeTicket(parseInt(req.params.id));

        res.json({
            success: true,
            data: ticket,
            message: 'Ticket closed successfully',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/tickets/overdue/list
 * Get overdue tickets
 */
router.get('/overdue/list', authMiddleware, async (req: Request, res: Response) => {
    try {
        const tickets = await ticketService.getOverdueTickets();

        res.json({
            success: true,
            data: tickets,
            count: tickets.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
