import { AuditLog } from '../../models/AuditLog.js';

const requestMeta = (req) => {
  if (!req) return {};
  const ipAddress = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
  let userAgent;
  if (typeof req.get === 'function') {
    userAgent = req.get('user-agent');
  } else if (typeof req.header === 'function') {
    userAgent = req.header('user-agent');
  } else {
    userAgent = req.headers?.['user-agent'];
  }
  return { ipAddress, userAgent };
};

export const auditLogger = {
  async log({ action, userId, userEmail, userName, targetType, targetId, targetName, description, metadata, ipAddress, userAgent, severity = 'info' }) {
    const category = action.split('.')[0];
    try {
      await AuditLog.create({
        action, category, userId, userEmail, userName,
        targetType, targetId, targetName, description,
        metadata, ipAddress, userAgent, severity,
      });
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  },

  // User actions
  async userLogin(user, req) {
    await this.log({
      action: 'user.login', userId: user._id, userEmail: user.email, userName: user.name,
      description: `User ${user.email} logged in`,
      ...requestMeta(req),
    });
  },

  async userLogout(user, req) {
    await this.log({
      action: 'user.logout', userId: user._id, userEmail: user.email, userName: user.name,
      description: `User ${user.email} logged out`,
      ...requestMeta(req),
    });
  },

  async userCreated(user, createdBy, req) {
    await this.log({
      action: 'user.created', userId: createdBy?._id, userEmail: createdBy?.email, userName: createdBy?.name,
      targetType: 'user', targetId: user._id, targetName: user.email,
      description: `User ${user.email} was created`,
      ...requestMeta(req),
    });
  },

  async userUpdated(user, changes, updatedBy, req) {
    await this.log({
      action: 'user.updated', userId: updatedBy?._id, userEmail: updatedBy?.email, userName: updatedBy?.name,
      targetType: 'user', targetId: user._id, targetName: user.email,
      description: `User ${user.email} was updated`, metadata: { changes },
      ...requestMeta(req),
    });
  },

  async roleChanged(user, oldRole, newRole, changedBy, req) {
    await this.log({
      action: 'admin.role_changed', userId: changedBy?._id, userEmail: changedBy?.email, userName: changedBy?.name,
      targetType: 'user', targetId: user._id, targetName: user.email,
      description: `Role changed for ${user.email}: ${oldRole} → ${newRole}`,
      metadata: { oldRole, newRole }, severity: 'warning',
      ...requestMeta(req),
    });
  },

  // Ticket actions
  async ticketCreated(ticket, user, req) {
    await this.log({
      action: 'ticket.created', userId: user?._id, userEmail: user?.email || ticket.customerEmail, userName: user?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket created: ${ticket.subject}`,
      ...requestMeta(req),
    });
  },

  async ticketUpdated(ticket, changes, updatedBy, req) {
    await this.log({
      action: 'ticket.updated', userId: updatedBy?._id, userEmail: updatedBy?.email, userName: updatedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket updated: ${ticket.subject}`, metadata: { changes },
      ...requestMeta(req),
    });
  },

  async ticketAssigned(ticket, agent, assignedBy, req) {
    await this.log({
      action: 'ticket.assigned', userId: assignedBy?._id, userEmail: assignedBy?.email, userName: assignedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket assigned to ${agent.name}: ${ticket.subject}`,
      metadata: { agentId: agent._id, agentName: agent.name },
      ...requestMeta(req),
    });
  },

  async ticketResolved(ticket, resolvedBy, req) {
    await this.log({
      action: 'ticket.resolved', userId: resolvedBy?._id, userEmail: resolvedBy?.email, userName: resolvedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket resolved: ${ticket.subject}`,
      ...requestMeta(req),
    });
  },

  async ticketMessageAdded(ticket, message, user, req) {
    await this.log({
      action: 'ticket.message_added',
      userId: user?._id, userEmail: user?.email, userName: user?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Customer added message to ticket: ${ticket.subject}`,
      metadata: {
        messageLength: message?.length,
        ticketStatus: ticket.status,
      },
      ...requestMeta(req),
    });
  },

  async agentReplied(ticket, message, agent, useAI, req) {
    await this.log({
      action: 'ticket.agent_replied',
      userId: agent?._id, userEmail: agent?.email, userName: agent?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Agent replied to ticket: ${ticket.subject}`,
      metadata: {
        agentEmail: agent?.email,
        agentName: agent?.name,
        messageLength: message?.length,
        useAI: useAI || false,
        ticketStatus: ticket.status,
      },
      ...requestMeta(req),
    });
  },

  async ticketSlaBreached(ticket) {
    await this.log({
      action: 'ticket.sla_breached',
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `SLA breached for ticket: ${ticket.subject}`,
      severity: 'warning',
    });
  },

  async ticketReopened(ticket, reopenedBy, req) {
    await this.log({
      action: 'ticket.reopened',
      userId: reopenedBy?._id, userEmail: reopenedBy?.email, userName: reopenedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket reopened: ${ticket.subject}`,
      metadata: { 
        reopenCount: ticket.reopenCount,
        newSlaDueAt: ticket.slaDueAt,
        priority: ticket.priority
      },
      ...requestMeta(req),
    });
  },

  async slaRecalculated(ticket, oldPriority, newPriority, oldSlaDueAt, newSlaDueAt, slaBreachedCleared, changedBy, req) {
    await this.log({
      action: 'ticket.sla_recalculated',
      userId: changedBy?._id, userEmail: changedBy?.email, userName: changedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `SLA recalculated for ticket: ${ticket.subject}`,
      metadata: { 
        oldPriority,
        newPriority,
        oldSlaDueAt,
        newSlaDueAt,
        slaBreachedCleared
      },
      ...requestMeta(req),
    });
  },

  // Agent actions
  async agentCreated(agent, createdBy, req) {
    await this.log({
      action: 'agent.created', userId: createdBy?._id, userEmail: createdBy?.email, userName: createdBy?.name,
      targetType: 'agent', targetId: agent._id, targetName: agent.name,
      description: `Agent created: ${agent.name} (${agent.email})`,
      ...requestMeta(req),
    });
  },

  async agentUpdated(agent, changes, updatedBy, req) {
    await this.log({
      action: 'agent.updated', userId: updatedBy?._id, userEmail: updatedBy?.email, userName: updatedBy?.name,
      targetType: 'agent', targetId: agent._id, targetName: agent.name,
      description: `Agent updated: ${agent.name}`, metadata: { changes },
      ...requestMeta(req),
    });
  },

  async agentDeleted(agent, deletedBy, req) {
    await this.log({
      action: 'agent.deleted', userId: deletedBy?._id, userEmail: deletedBy?.email, userName: deletedBy?.name,
      targetType: 'agent', targetId: agent._id, targetName: agent.name,
      description: `Agent deleted: ${agent.name}`, severity: 'warning',
      ...requestMeta(req),
    });
  },

  async agentStatusChanged(agent, isActive, changedBy, req) {
    await this.log({
      action: isActive ? 'agent.activated' : 'agent.deactivated',
      userId: changedBy?._id, userEmail: changedBy?.email, userName: changedBy?.name,
      targetType: 'agent', targetId: agent._id, targetName: agent.name,
      description: `Agent ${isActive ? 'activated' : 'deactivated'}: ${agent.name}`,
      ...requestMeta(req),
    });
  },

  async ticketReassigned(ticket, oldAgentId, newAgent, reason, reassignedBy, req) {
    await this.log({
      action: 'ticket.reassigned',
      userId: reassignedBy?._id, userEmail: reassignedBy?.email, userName: reassignedBy?.name,
      targetType: 'ticket', targetId: ticket._id, targetName: ticket.subject,
      description: `Ticket reassigned to ${newAgent ? newAgent.name : 'unassigned'}: ${ticket.subject}`,
      metadata: { 
        oldAgentId, 
        newAgentId: newAgent?._id, 
        newAgentName: newAgent?.name,
        reason 
      },
      ...requestMeta(req),
    });
  },

  // System actions
  async systemError(error, context) {
    await this.log({
      action: 'system.error',
      description: error.message || 'System error occurred',
      metadata: { stack: error.stack, context }, severity: 'error',
    });
  },
};
