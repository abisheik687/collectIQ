import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ReconciliationAttributes {
    id: number;
    reconciliationPeriod: Date;
    processedBy: number;
    matchedCount: number;
    exceptionCount: number;
    totalMatchedAmount: number;
    exceptionDetails: Array<{
        paymentId: number;
        issue: string;
        expected?: number;
        actual?: number;
    }>;
    status: 'in_progress' | 'completed' | 'failed';
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ReconciliationCreationAttributes extends Optional<ReconciliationAttributes, 'id' | 'matchedCount' | 'exceptionCount' | 'totalMatchedAmount' | 'exceptionDetails' | 'status'> { }

class Reconciliation extends Model<ReconciliationAttributes, ReconciliationCreationAttributes> implements ReconciliationAttributes {
    public id!: number;
    public reconciliationPeriod!: Date;
    public processedBy!: number;
    public matchedCount!: number;
    public exceptionCount!: number;
    public totalMatchedAmount!: number;
    public exceptionDetails!: Array<{
        paymentId: number;
        issue: string;
        expected?: number;
        actual?: number;
    }>;
    public status!: 'in_progress' | 'completed' | 'failed';
    public completedAt?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Reconciliation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        reconciliationPeriod: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'End date of the reconciliation period (e.g., 2026-01-31)',
        },
        processedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        matchedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        exceptionCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalMatchedAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
        },
        exceptionDetails: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
        status: {
            type: DataTypes.ENUM('in_progress', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'in_progress',
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'reconciliations',
        modelName: 'Reconciliation',
        indexes: [
            {
                fields: ['reconciliationPeriod'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

export default Reconciliation;
