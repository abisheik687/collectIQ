import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CommunicationAttributes {
    id: number;
    caseId: number;
    channel: 'sms' | 'email' | 'portal';
    templateId?: string;
    subject?: string;
    content: string;
    recipientEmail?: string;
    recipientPhone?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: Date;
    deliveredAt?: Date;
    errorMessage?: string;
    createdBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CommunicationCreationAttributes extends Optional<CommunicationAttributes, 'id' | 'status'> { }

class Communication extends Model<CommunicationAttributes, CommunicationCreationAttributes> implements CommunicationAttributes {
    public id!: number;
    public caseId!: number;
    public channel!: 'sms' | 'email' | 'portal';
    public templateId?: string;
    public subject?: string;
    public content!: string;
    public recipientEmail?: string;
    public recipientPhone?: string;
    public status!: 'pending' | 'sent' | 'delivered' | 'failed';
    public sentAt?: Date;
    public deliveredAt?: Date;
    public errorMessage?: string;
    public createdBy!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Communication.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        channel: {
            type: DataTypes.ENUM('sms', 'email', 'portal'),
            allowNull: false,
        },
        templateId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        recipientEmail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        recipientPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'communications',
        modelName: 'Communication',
    }
);

export default Communication;
