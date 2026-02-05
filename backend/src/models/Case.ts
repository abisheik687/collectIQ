import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CaseAttributes {
    id: number;
    caseNumber: string;
    accountNumber: string;
    customerName: string;
    amount: number;
    currency: string;
    overdueDays: number;
    invoiceDate: Date;
    status: 'new' | 'assigned' | 'contacted' | 'promise_to_pay' | 'partial_paid' | 'in_progress' | 'follow_up' | 'escalated' | 'resolved' | 'refused' | 'closed';
    priority: 'high' | 'medium' | 'low';
    dcaVendorId?: number;
    assignedToUser?: number;
    assignedDcaId?: number;
    assignedDcaName?: string;
    mlPaymentProbability?: number;
    mlRiskScore?: 'high' | 'medium' | 'low';
    customerDetails: {
        email?: string;
        phone?: string;
        address?: string;
        companyName?: string;
    };
    slaDueDate?: Date;
    slaStatus?: 'on_track' | 'warning' | 'breached';
    contactCount: number;
    lastContactDate?: Date;
    notes?: string;
    resolution?: string;
    createdBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CaseCreationAttributes extends Optional<CaseAttributes, 'id' | 'contactCount' | 'status' | 'priority'> { }

class Case extends Model<CaseAttributes, CaseCreationAttributes> implements CaseAttributes {
    public id!: number;
    public caseNumber!: string;
    public accountNumber!: string;
    public customerName!: string;
    public amount!: number;
    public currency!: string;
    public overdueDays!: number;
    public invoiceDate!: Date;
    public status!: 'new' | 'assigned' | 'contacted' | 'promise_to_pay' | 'partial_paid' | 'in_progress' | 'follow_up' | 'escalated' | 'resolved' | 'refused' | 'closed';
    public priority!: 'high' | 'medium' | 'low';
    public dcaVendorId?: number;
    public assignedToUser?: number;
    public assignedDcaId?: number;
    public assignedDcaName?: string;
    public mlPaymentProbability?: number;
    public mlRiskScore?: 'high' | 'medium' | 'low';
    public customerDetails!: {
        email?: string;
        phone?: string;
        address?: string;
        companyName?: string;
    };
    public slaDueDate?: Date;
    public slaStatus?: 'on_track' | 'warning' | 'breached';
    public contactCount!: number;
    public lastContactDate?: Date;
    public notes?: string;
    public resolution?: string;
    public createdBy!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Case.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        caseNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customerName: {
            type: DataTypes.STRING,
            allowNull: false,
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
        overdueDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Days since invoice date',
        },
        invoiceDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('new', 'assigned', 'contacted', 'promise_to_pay', 'partial_paid', 'in_progress', 'follow_up', 'escalated', 'resolved', 'refused', 'closed'),
            allowNull: false,
            defaultValue: 'new',
        },
        priority: {
            type: DataTypes.ENUM('high', 'medium', 'low'),
            allowNull: false,
            defaultValue: 'medium',
        },
        dcaVendorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'dca_vendors',
                key: 'id',
            },
        },
        assignedToUser: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        assignedDcaId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID of the assigned DCA user',
        },
        assignedDcaName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Name of the assigned DCA agency',
        },
        mlPaymentProbability: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: true,
            comment: 'ML prediction score 0-1',
        },
        mlRiskScore: {
            type: DataTypes.ENUM('high', 'medium', 'low'),
            allowNull: true,
        },
        customerDetails: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        slaDueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        slaStatus: {
            type: DataTypes.ENUM('on_track', 'warning', 'breached'),
            allowNull: true,
        },
        contactCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastContactDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resolution: {
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
        tableName: 'cases',
        modelName: 'Case',
    }
);

export default Case;
