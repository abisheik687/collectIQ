import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CaseAttributes {
    id: number;
    caseNumber: string;
    accountNumber: string;
    customerName: string;
    amount: number;
    overdueDays: number;
    status: 'new' | 'assigned' | 'in_progress' | 'follow_up' | 'escalated' | 'resolved' | 'closed';
    priority: 'high' | 'medium' | 'low';
    riskScore?: number;
    paymentProbability?: number;
    assignedDcaId?: number;
    assignedDcaName?: string;
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
    public overdueDays!: number;
    public status!: 'new' | 'assigned' | 'in_progress' | 'follow_up' | 'escalated' | 'resolved' | 'closed';
    public priority!: 'high' | 'medium' | 'low';
    public riskScore?: number;
    public paymentProbability?: number;
    public assignedDcaId?: number;
    public assignedDcaName?: string;
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
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        overdueDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('new', 'assigned', 'in_progress', 'follow_up', 'escalated', 'resolved', 'closed'),
            allowNull: false,
            defaultValue: 'new',
        },
        priority: {
            type: DataTypes.ENUM('high', 'medium', 'low'),
            allowNull: false,
            defaultValue: 'medium',
        },
        riskScore: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        paymentProbability: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        assignedDcaId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        assignedDcaName: {
            type: DataTypes.STRING,
            allowNull: true,
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
