import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WorkflowAttributes {
    id: number;
    caseId: number;
    currentStage: 'assign' | 'contact' | 'follow_up' | 'escalate' | 'close';
    slaStatus: 'on_track' | 'warning' | 'breached';
    escalationCount: number;
    autoAssigned: boolean;
    lastStageChange?: Date;
    stageHistory?: any[];
    createdAt?: Date;
    updatedAt?: Date;
}

interface WorkflowCreationAttributes extends Optional<WorkflowAttributes, 'id' | 'escalationCount' | 'autoAssigned'> { }

class Workflow extends Model<WorkflowAttributes, WorkflowCreationAttributes> implements WorkflowAttributes {
    public id!: number;
    public caseId!: number;
    public currentStage!: 'assign' | 'contact' | 'follow_up' | 'escalate' | 'close';
    public slaStatus!: 'on_track' | 'warning' | 'breached';
    public escalationCount!: number;
    public autoAssigned!: boolean;
    public lastStageChange?: Date;
    public stageHistory?: any[];

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Workflow.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        caseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        currentStage: {
            type: DataTypes.ENUM('assign', 'contact', 'follow_up', 'escalate', 'close'),
            allowNull: false,
            defaultValue: 'assign',
        },
        slaStatus: {
            type: DataTypes.ENUM('on_track', 'warning', 'breached'),
            allowNull: false,
            defaultValue: 'on_track',
        },
        escalationCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        autoAssigned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        lastStageChange: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        stageHistory: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        sequelize,
        tableName: 'workflows',
        modelName: 'Workflow',
    }
);

export default Workflow;
