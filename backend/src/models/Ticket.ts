import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TicketAttributes {
    id: number;
    caseId: number;
    ticketType: 'payment_received' | 'discount_request' | 'promise_to_pay' | 'customer_refused' | 'general_inquiry';
    createdBy: number;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: Date;
    assignedTo?: number;
    resolvedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'status' | 'priority'> { }

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
    public id!: number;
    public caseId!: number;
    public ticketType!: 'payment_received' | 'discount_request' | 'promise_to_pay' | 'customer_refused' | 'general_inquiry';
    public createdBy!: number;
    public subject!: string;
    public description!: string;
    public status!: 'open' | 'in_progress' | 'resolved' | 'closed';
    public priority!: 'urgent' | 'high' | 'medium' | 'low';
    public dueDate?: Date;
    public assignedTo?: number;
    public resolvedAt?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Ticket.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cases',
                key: 'id',
            },
        },
        ticketType: {
            type: DataTypes.ENUM('payment_received', 'discount_request', 'promise_to_pay', 'customer_refused', 'general_inquiry'),
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        subject: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
            allowNull: false,
            defaultValue: 'open',
        },
        priority: {
            type: DataTypes.ENUM('urgent', 'high', 'medium', 'low'),
            allowNull: false,
            defaultValue: 'medium',
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'SLA deadline for ticket resolution',
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'tickets',
        modelName: 'Ticket',
        indexes: [
            {
                fields: ['caseId'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['ticketType'],
            },
            {
                fields: ['assignedTo'],
            },
        ],
    }
);

export default Ticket;
