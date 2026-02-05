import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AuditLogAttributes {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    userId: number;
    userName: string;
    beforeState?: any;
    afterState?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: number;
    public action!: string;
    public entityType!: string;
    public entityId!: string | number; // Support both
    public userId?: number; // Optional
    public userName!: string;
    public beforeState?: any;
    public afterState?: any;
    public ipAddress?: string;
    public userAgent?: string;
    public timestamp!: Date;

    public readonly createdAt!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entityType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entityId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        beforeState: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        afterState: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userAgent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'audit_logs',
        modelName: 'AuditLog',
        timestamps: false,
        indexes: [
            {
                fields: ['entityType', 'entityId'],
            },
            {
                fields: ['userId'],
            },
            {
                fields: ['timestamp'],
            },
        ],
    }
);

export default AuditLog;
