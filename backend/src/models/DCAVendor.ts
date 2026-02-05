import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface DCAVendorAttributes {
    id: number;
    vendorName: string;
    contactPerson: string;
    email: string;
    phone: string;
    region: string;
    commissionRules: {
        tiers: Array<{
            min: number;
            max: number | null;
            rate: number;
        }>;
    };
    successRate: number;
    totalCasesAssigned: number;
    totalCollected: number;
    isActive: boolean;
    onboardedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface DCAVendorCreationAttributes extends Optional<DCAVendorAttributes, 'id' | 'successRate' | 'totalCasesAssigned' | 'totalCollected' | 'isActive'> { }

class DCAVendor extends Model<DCAVendorAttributes, DCAVendorCreationAttributes> implements DCAVendorAttributes {
    public id!: number;
    public vendorName!: string;
    public contactPerson!: string;
    public email!: string;
    public phone!: string;
    public region!: string;
    public commissionRules!: {
        tiers: Array<{
            min: number;
            max: number | null;
            rate: number;
        }>;
    };
    public successRate!: number;
    public totalCasesAssigned!: number;
    public totalCollected!: number;
    public isActive!: boolean;
    public onboardedAt!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DCAVendor.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vendorName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        contactPerson: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        region: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'MENA, India, Africa, etc.',
        },
        commissionRules: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {
                tiers: [
                    { min: 0, max: 10000, rate: 0.15 },
                    { min: 10000, max: 50000, rate: 0.12 },
                    { min: 50000, max: null, rate: 0.10 }
                ]
            },
        },
        successRate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00,
            comment: 'Historical collection success rate percentage',
        },
        totalCasesAssigned: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalCollected: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.00,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        onboardedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'dca_vendors',
        modelName: 'DCAVendor',
        indexes: [
            {
                fields: ['region'],
            },
            {
                fields: ['isActive'],
            },
        ],
    }
);

export default DCAVendor;
