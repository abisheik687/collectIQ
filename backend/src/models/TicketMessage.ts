import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TicketMessageAttributes {
    id: number;
    ticketId: number;
    authorId: number;
    message: string;
    attachments: Array<{
        fileName: string;
        fileUrl: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

interface TicketMessageCreationAttributes extends Optional<TicketMessageAttributes, 'id' | 'attachments'> { }

class TicketMessage extends Model<TicketMessageAttributes, TicketMessageCreationAttributes> implements TicketMessageAttributes {
    public id!: number;
    public ticketId!: number;
    public authorId!: number;
    public message!: string;
    public attachments!: Array<{
        fileName: string;
        fileUrl: string;
    }>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

TicketMessage.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tickets',
                key: 'id',
            },
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        attachments: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
    },
    {
        sequelize,
        tableName: 'ticket_messages',
        modelName: 'TicketMessage',
        indexes: [
            {
                fields: ['ticketId'],
            },
            {
                fields: ['createdAt'],
            },
        ],
    }
);

export default TicketMessage;
