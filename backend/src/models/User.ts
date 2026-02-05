import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'fedex_admin' | 'fedex_user' | 'dca_admin' | 'dca_collector' | 'audit';
    dcaVendorId?: number;
    permissions: string[];
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public password!: string;
    public name!: string;
    public role!: 'fedex_admin' | 'fedex_user' | 'dca_admin' | 'dca_collector' | 'audit';
    public dcaVendorId?: number;
    public permissions!: string[];
    public isActive!: boolean;
    public lastLogin?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('fedex_admin', 'fedex_user', 'dca_admin', 'dca_collector', 'audit'),
            allowNull: false,
            defaultValue: 'dca_collector',
        },
        dcaVendorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'dca_vendors',
                key: 'id',
            },
            comment: 'Only for DCA users',
        },
        permissions: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Array of permission strings for granular RBAC',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        modelName: 'User',
    }
);

export default User;
