import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ReconciliationItemAttributes {
    id: number;
    reconciliationId: number;
    paymentId: number;
    sapDocumentNumber?: string;
    matchStatus: 'matched' | 'amount_mismatch' | 'date_mismatch' | 'not_found';
    mismatchDetails?: {
        expectedAmount?: number;
        actualAmount?: number;
        expectedDate?: string;
        actualDate?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

interface ReconciliationItemCreationAttributes extends Optional<ReconciliationItemAttributes, 'id'> { }

class ReconciliationItem extends Model<ReconciliationItemAttributes, ReconciliationItemCreationAttributes> implements ReconciliationItemAttributes {
    public id!: number;
    public reconciliationId!: number;
    public paymentId!: number;
    public sapDocumentNumber?: string;
    public matchStatus!: 'matched' | 'amount_mismatch' | 'date_mismatch' | 'not_found';
    public mismatchDetails?: {
        expectedAmount?: number;
        actualAmount?: number;
        expectedDate?: string;
        actualDate?: string;
    };

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ReconciliationItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        reconciliationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'reconciliations',
                key: 'id',
            },
        },
        paymentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'payments',
                key: 'id',
            },
        },
        sapDocumentNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        matchStatus: {
            type: DataTypes.ENUM('matched', 'amount_mismatch', 'date_mismatch', 'not_found'),
            allowNull: false,
        },
        mismatchDetails: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'reconciliation_items',
        modelName: 'ReconciliationItem',
        indexes: [
            {
                fields: ['reconciliationId'],
            },
            {
                fields: ['paymentId'],
            },
            {
                fields: ['matchStatus'],
            },
        ],
    }
);

export default ReconciliationItem;
