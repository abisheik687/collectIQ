import { Ticket, TicketMessage, Case, User } from '../models';
import { Op } from 'sequelize';

export class TicketService {
    /**
     * Create a new ticket
     */
    async createTicket(ticketData: {
        caseId: number;
        ticketType: 'payment_received' | 'discount_request' | 'promise_to_pay' | 'customer_refused' | 'general_inquiry';
        createdBy: number;
        subject: string;
        description: string;
        priority?: 'urgent' | 'high' | 'medium' | 'low';
    }) {
        // Validate case exists
        const caseRecord = await Case.findByPk(ticketData.caseId);
        if (!caseRecord) {
            throw new Error('Case not found');
        }

        // Calculate SLA due date based on priority
        const dueDate = this.calculateDueDate(ticketData.priority || 'medium');

        const ticket = await Ticket.create({
            ...ticketData,
            priority: ticketData.priority || 'medium',
            status: 'open',
            dueDate,
        });

        return ticket;
    }

    /**
     * Calculate SLA due date based on priority
     */
    private calculateDueDate(priority: string): Date {
        const now = new Date();
        let hoursToAdd = 72; // Default: 72 hours for medium

        switch (priority) {
            case 'urgent':
                hoursToAdd = 4;
                break;
            case 'high':
                hoursToAdd = 24;
                break;
            case 'medium':
                hoursToAdd = 72;
                break;
            case 'low':
                hoursToAdd = 168; // 1 week
                break;
        }

        return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    }

    /**
     * Get tickets with filters
     */
    async getTickets(filters?: {
        caseId?: number;
        status?: string;
        ticketType?: string;
        assignedTo?: number;
        createdBy?: number;
    }) {
        const where: any = {};

        if (filters?.caseId) where.caseId = filters.caseId;
        if (filters?.status) where.status = filters.status;
        if (filters?.ticketType) where.ticketType = filters.ticketType;
        if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
        if (filters?.createdBy) where.createdBy = filters.createdBy;

        return await Ticket.findAll({
            where,
            include: [
                { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'accountNumber'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Get ticket by ID with messages
     */
    async getTicketById(id: number) {
        return await Ticket.findByPk(id, {
            include: [
                { model: Case, as: 'case' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
                {
                    model: TicketMessage,
                    as: 'messages',
                    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
                    separate: true,
                    order: [['createdAt', 'ASC']],
                },
            ],
        });
    }

    /**
     * Add message to ticket
     */
    async addMessage(ticketId: number, authorId: number, message: string, attachments?: any[]) {
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        const ticketMessage = await TicketMessage.create({
            ticketId,
            authorId,
            message,
            attachments: attachments || [],
        });

        // Update ticket status to in_progress if it was open
        if (ticket.status === 'open') {
            await ticket.update({ status: 'in_progress' });
        }

        return ticketMessage;
    }

    /**
     * Update ticket status
     */
    async updateTicket(id: number, updateData: {
        status?: 'open' | 'in_progress' | 'resolved' | 'closed';
        priority?: 'urgent' | 'high' | 'medium' | 'low';
        assignedTo?: number;
    }) {
        const ticket = await Ticket.findByPk(id);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // If marking as resolved/closed, set resolvedAt
        if ((updateData.status === 'resolved' || updateData.status === 'closed') && ticket.status !== 'resolved' && ticket.status !== 'closed') {
            await ticket.update({
                ...updateData,
                resolvedAt: new Date(),
            });
        } else {
            await ticket.update(updateData);
        }

        return ticket;
    }

    /**
     * Close ticket
     */
    async closeTicket(id: number) {
        return await this.updateTicket(id, { status: 'closed' });
    }

    /**
     * Get overdue tickets (SLA breached)
     */
    async getOverdueTickets() {
        return await Ticket.findAll({
            where: {
                status: { [Op.notIn]: ['resolved', 'closed'] },
                dueDate: { [Op.lt]: new Date() },
            },
            include: [
                { model: Case, as: 'case' },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            ],
        });
    }
}

export default new TicketService();
