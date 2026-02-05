import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PaymentAttributes {
    id: number;
    caseId: number;
    utrReference: string;
    amount: number;
    currency: string;
    paymentDate: Date;
    bankName: string;
    status: 'submitted' | 'matched' | 'verified' | 'applied' | 'rejected';
    submittedBy: number;
    verifiedBy?: number;
    submittedAt: Date;
    verifiedAt?: Date;
    supportingDocs: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
    }>;
    sapDocumentNumber?: string;
    rejectionReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'supportingDocs'> { }

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: number;
    public caseId!: number;
    public utrReference!: string;
    public amount!: number;
    public currency!: string;
    public paymentDate!: Date;
    public bankName!: string;
    public status!: 'submitted' | 'matched' | 'verified' | 'applied' | 'rejected';
    public submittedBy!: number;
    public verifiedBy?: number;
    public submittedAt!: Date;
    public verifiedAt?: Date;
    public supportingDocs!: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
    }>;
    public sapDocumentNumber?: string;
    public rejectionReason?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Payment.init(
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
        utrReference: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Unique Transaction Reference',
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        bankName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('submitted', 'matched', 'verified', 'applied', 'rejected'),
            allowNull: false,
            defaultValue: 'submitted',
        },
        submittedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        verifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        supportingDocs: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Array of document URLs from S3/storage',
        },
        sapDocumentNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'SAP finance ledger reference',
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'payments',
        modelName: 'Payment',
        indexes: [
            {
                fields: ['caseId'],
            },
            {
                fields: ['utrReference'],
                unique: true,
            },
            {
                fields: ['status'],
            },
            {
                fields: ['paymentDate'],
            },
        ],
    }
);

export default Payment;
