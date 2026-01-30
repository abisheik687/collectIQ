import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommunicationAttributes {
    id: number;
    caseId: number;
    type: 'email' | 'sms';
    template: string;
    recipient: string;
    subject?: string;
    message: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    errorMessage?: string;
    sentBy: number;
    sentByName: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CommunicationCreationAttributes
    extends Optional<CommunicationAttributes, 'id' | 'subject' | 'sentAt' | 'deliveredAt' | 'openedAt' | 'errorMessage' | 'createdAt' | 'updatedAt'> { }

class Communication extends Model<CommunicationAttributes, CommunicationCreationAttributes> implements CommunicationAttributes {
    public id!: number;
    public caseId!: number;
    public type!: 'email' | 'sms';
    public template!: string;
    public recipient!: string;
    public subject?: string;
    public message!: string;
    public status!: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
    public sentAt?: Date;
    public deliveredAt?: Date;
    public openedAt?: Date;
    public errorMessage?: string;
    public sentBy!: number;
    public sentByName!: string;
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
            references: {
                model: 'cases',
                key: 'id',
            },
        },
        type: {
            type: DataTypes.ENUM('email', 'sms'),
            allowNull: false,
        },
        template: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        recipient: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'opened'),
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
        openedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sentBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sentByName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'communications',
        timestamps: true,
    }
);

export default Communication;
