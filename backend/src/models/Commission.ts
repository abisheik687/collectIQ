import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CommissionAttributes {
    id: number;
    dcaVendorId: number;
    periodStart: Date;
    periodEnd: Date;
    totalCollected: number;
    commissionRate: number;
    commissionAmount: number;
    status: 'calculated' | 'approved' | 'paid';
    payoutDate?: Date;
    calculationDetails: {
        breakdown: Array<{
            tier: string;
            paymentsCount: number;
            amount: number;
            rate: number;
            commission: number;
        }>;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

interface CommissionCreationAttributes extends Optional<CommissionAttributes, 'id' | 'status' | 'calculationDetails'> { }

class Commission extends Model<CommissionAttributes, CommissionCreationAttributes> implements CommissionAttributes {
    public id!: number;
    public dcaVendorId!: number;
    public periodStart!: Date;
    public periodEnd!: Date;
    public totalCollected!: number;
    public commissionRate!: number;
    public commissionAmount!: number;
    public status!: 'calculated' | 'approved' | 'paid';
    public payoutDate?: Date;
    public calculationDetails!: {
        breakdown: Array<{
            tier: string;
            paymentsCount: number;
            amount: number;
            rate: number;
            commission: number;
        }>;
    };

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Commission.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        dcaVendorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'dca_vendors',
                key: 'id',
            },
        },
        periodStart: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        periodEnd: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        totalCollected: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        commissionRate: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: false,
            comment: 'Blended commission rate',
        },
        commissionAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('calculated', 'approved', 'paid'),
            allowNull: false,
            defaultValue: 'calculated',
        },
        payoutDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        calculationDetails: {
            type: DataTypes.JSONB,
            defaultValue: { breakdown: [] },
        },
    },
    {
        sequelize,
        tableName: 'commissions',
        modelName: 'Commission',
        indexes: [
            {
                fields: ['dcaVendorId'],
            },
            {
                fields: ['periodStart', 'periodEnd'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

export default Commission;
