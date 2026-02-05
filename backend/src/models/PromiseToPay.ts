import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PromiseToPayAttributes {
    id: number;
    caseId: number;
    promisedAmount: number;
    promisedDate: Date;
    status: 'pending' | 'fulfilled' | 'broken' | 'partial';
    createdBy: number;
    customerRemarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface PromiseToPayCreationAttributes extends Optional<PromiseToPayAttributes, 'id' | 'status'> { }

class PromiseToPay extends Model<PromiseToPayAttributes, PromiseToPayCreationAttributes> implements PromiseToPayAttributes {
    public id!: number;
    public caseId!: number;
    public promisedAmount!: number;
    public promisedDate!: Date;
    public status!: 'pending' | 'fulfilled' | 'broken' | 'partial';
    public createdBy!: number;
    public customerRemarks?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

PromiseToPay.init(
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
        promisedAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        promisedDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'fulfilled', 'broken', 'partial'),
            allowNull: false,
            defaultValue: 'pending',
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        customerRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'promises_to_pay',
        modelName: 'PromiseToPay',
        indexes: [
            {
                fields: ['caseId'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['promisedDate'],
            },
        ],
    }
);

export default PromiseToPay;
