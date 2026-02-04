import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user.login', 'user.logout', 'user.created', 'user.updated', 'user.deleted',
      'ticket.created', 'ticket.updated', 'ticket.assigned', 'ticket.resolved', 'ticket.closed',
      'ticket.message', 'ticket.message_added', 'ticket.agent_replied',
      'ticket.reopened', 'ticket.reassigned', 'ticket.sla_breached', 'ticket.sla_recalculated',
      'agent.created', 'agent.updated', 'agent.deleted', 'agent.activated', 'agent.deactivated',
      'admin.role_changed', 'admin.settings_updated',
      'system.error', 'system.startup', 'system.shutdown'
    ],
    index: true,
  },
  category: {
    type: String,
    enum: ['user', 'ticket', 'agent', 'admin', 'system'],
    required: true,
    index: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userEmail: String,
  userName: String,
  targetType: { type: String, enum: ['user', 'ticket', 'agent', 'system'] },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetName: String,
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
