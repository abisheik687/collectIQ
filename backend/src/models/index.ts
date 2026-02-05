import User from './User';
import DCAVendor from './DCAVendor';
import Case from './Case';
import Payment from './Payment';
import Ticket from './Ticket';
import TicketMessage from './TicketMessage';
import PromiseToPay from './PromiseToPay';
import Reconciliation from './Reconciliation';
import ReconciliationItem from './ReconciliationItem';
import Commission from './Commission';
import AuditLog from './AuditLog';
import Communication from './Communication';
import Workflow from './Workflow';

// ============================================
// Define Model Associations
// ============================================

// DCAVendor Associations
DCAVendor.hasMany(User, {
    foreignKey: 'dcaVendorId',
    as: 'users',
});

DCAVendor.hasMany(Case, {
    foreignKey: 'dcaVendorId',
    as: 'cases',
});

DCAVendor.hasMany(Commission, {
    foreignKey: 'dcaVendorId',
    as: 'commissions',
});

// User Associations
User.belongsTo(DCAVendor, {
    foreignKey: 'dcaVendorId',
    as: 'dcaVendor',
});

User.hasMany(Case, {
    foreignKey: 'assignedToUser',
    as: 'assignedCases',
});

User.hasMany(Case, {
    foreignKey: 'createdBy',
    as: 'createdCases',
});

User.hasMany(Payment, {
    foreignKey: 'submittedBy',
    as: 'submittedPayments',
});

User.hasMany(Payment, {
    foreignKey: 'verifiedBy',
    as: 'verifiedPayments',
});

User.hasMany(Ticket, {
    foreignKey: 'createdBy',
    as: 'createdTickets',
});

User.hasMany(Ticket, {
    foreignKey: 'assignedTo',
    as: 'assignedTickets',
});

// Case Associations
Case.belongsTo(DCAVendor, {
    foreignKey: 'dcaVendorId',
    as: 'dcaVendor',
});

Case.belongsTo(User, {
    foreignKey: 'assignedToUser',
    as: 'assignedUser',
});

Case.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
});

Case.hasMany(Payment, {
    foreignKey: 'caseId',
    as: 'payments',
});

Case.hasMany(Ticket, {
    foreignKey: 'caseId',
    as: 'tickets',
});

Case.hasMany(PromiseToPay, {
    foreignKey: 'caseId',
    as: 'promisesToPay',
});

// Payment Associations
Payment.belongsTo(Case, {
    foreignKey: 'caseId',
    as: 'case',
});

Payment.belongsTo(User, {
    foreignKey: 'submittedBy',
    as: 'submitter',
});

Payment.belongsTo(User, {
    foreignKey: 'verifiedBy',
    as: 'verifier',
});

Payment.hasMany(ReconciliationItem, {
    foreignKey: 'paymentId',
    as: 'reconciliationItems',
});

// Ticket Associations
Ticket.belongsTo(Case, {
    foreignKey: 'caseId',
    as: 'case',
});

Ticket.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
});

Ticket.belongsTo(User, {
    foreignKey: 'assignedTo',
    as: 'assignee',
});

Ticket.hasMany(TicketMessage, {
    foreignKey: 'ticketId',
    as: 'messages',
});

// TicketMessage Associations
TicketMessage.belongsTo(Ticket, {
    foreignKey: 'ticketId',
    as: 'ticket',
});

TicketMessage.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
});

// PromiseToPay Associations
PromiseToPay.belongsTo(Case, {
    foreignKey: 'caseId',
    as: 'case',
});

PromiseToPay.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
});

// Reconciliation Associations
Reconciliation.belongsTo(User, {
    foreignKey: 'processedBy',
    as: 'processor',
});

Reconciliation.hasMany(ReconciliationItem, {
    foreignKey: 'reconciliationId',
    as: 'items',
});

// ReconciliationItem Associations
ReconciliationItem.belongsTo(Reconciliation, {
    foreignKey: 'reconciliationId',
    as: 'reconciliation',
});

ReconciliationItem.belongsTo(Payment, {
    foreignKey: 'paymentId',
    as: 'payment',
});

// Commission Associations
Commission.belongsTo(DCAVendor, {
    foreignKey: 'dcaVendorId',
    as: 'dcaVendor',
});

// AuditLog Associations
AuditLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// Communication Associations
Communication.belongsTo(Case, {
    foreignKey: 'caseId',
    as: 'case',
});

// Workflow Associations
Workflow.belongsTo(Case, {
    foreignKey: 'caseId',
    as: 'case',
});

Case.hasMany(Communication, { foreignKey: 'caseId', as: 'communications' });
Case.hasOne(Workflow, { foreignKey: 'caseId', as: 'workflow' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });


// Export all models
export {
    User,
    DCAVendor,
    Case,
    Payment,
    Ticket,
    TicketMessage,
    PromiseToPay,
    Reconciliation,
    ReconciliationItem,
    Commission,
    AuditLog,
    Communication,
    Workflow,
};
