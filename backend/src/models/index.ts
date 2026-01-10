import User from './User';
import Case from './Case';
import AuditLog from './AuditLog';
import Communication from './Communication';
import Workflow from './Workflow';

// Define associations
User.hasMany(Case, { foreignKey: 'createdBy', as: 'cases' });
Case.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Case.hasMany(Communication, { foreignKey: 'caseId', as: 'communications' });
Communication.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });

Case.hasOne(Workflow, { foreignKey: 'caseId', as: 'workflow' });
Workflow.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });

export {
    User,
    Case,
    AuditLog,
    Communication,
    Workflow,
};
