import { Ticket, Agent, User, Customer, AuditLog } from "../../models/index.js";
import { auditLogger } from "./audit-log.js";
import { sanitizeString } from "../validator.js";
import { reassignAgentTickets } from "../ticket/ticket-assignment.js";

const VALID_STATUSES = ["open", "in-progress", "resolved", "closed"];
const VALID_CATEGORIES = ["account", "billing", "technical", "gameplay", "security", "general"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

export const getSystemStats = async () => {
  const [
    totalTickets, openTickets, resolvedTickets, breachedTickets,
    totalUsers, totalAgents, activeAgents,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: { $in: ["open", "in-progress"] } }),
    Ticket.countDocuments({ status: "resolved" }),
    Ticket.countDocuments({ slaBreached: true }),
    User.countDocuments({ role: "user" }),
    Agent.countDocuments(),
    Agent.countDocuments({ isActive: true }),
  ]);

  const ticketsByCategory = await Ticket.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const ticketsByPriority = await Ticket.aggregate([
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);

  const agentWorkloads = await Agent.find({ isActive: true })
    .select("name email currentLoad maxLoad categories")
    .lean();

  return {
    success: true,
    stats: {
      tickets: { total: totalTickets, open: openTickets, resolved: resolvedTickets, breached: breachedTickets },
      users: { total: totalUsers },
      agents: { total: totalAgents, active: activeAgents },
      ticketsByCategory: Object.fromEntries(ticketsByCategory.map(c => [c._id || 'unknown', c.count])),
      ticketsByPriority: Object.fromEntries(ticketsByPriority.map(p => [p._id || 'unknown', p.count])),
      agentWorkloads,
    },
  };
};

export const getAllTickets = async ({ status, category, priority, page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  
  const query = {};
  if (status && VALID_STATUSES.includes(status)) query.status = status;
  if (category && VALID_CATEGORIES.includes(category)) query.category = category;
  if (priority && VALID_PRIORITIES.includes(priority)) query.priority = priority;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Ticket.countDocuments(query),
  ]);

  return {
    success: true,
    tickets: tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      customerEmail: t.customerEmail,
      category: t.category,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo?.name || "Unassigned",
      slaBreached: t.slaBreached,
      createdAt: t.createdAt,
      resolvedAt: t.resolvedAt,
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

export const getAgents = async () => {
  const agents = await Agent.find().sort({ createdAt: -1 }).lean();
  return { success: true, agents };
};

export const createAgent = async ({ email, name, categories, maxLoad }, adminUser, req) => {
  const normalizedEmail = email.trim().toLowerCase();
  
  const existingAgent = await Agent.findOne({ email: normalizedEmail });
  if (existingAgent) {
    throw new Error("Agent with this email already exists");
  }

  const agent = await Agent.create({ 
    email: normalizedEmail, 
    name: sanitizeString(name), 
    categories: categories || ['general'], 
    maxLoad: Math.min(100, Math.max(1, parseInt(maxLoad) || 10)),
    isActive: true,
  });
  
  await User.findOneAndUpdate(
    { email: normalizedEmail }, 
    { role: "agent", agentId: agent._id, name: sanitizeString(name) },
    { upsert: true }
  );

  await auditLogger.agentCreated(agent, adminUser, req);

  return { success: true, agent };
};

export const updateAgent = async (agentId, { name, categories, isActive, maxLoad }, adminUser, req) => {
  const oldAgent = await Agent.findById(agentId);
  if (!oldAgent) {
    throw new Error("Agent not found");
  }

  const update = {};
  if (name) update.name = sanitizeString(name);
  if (categories) update.categories = categories;
  if (typeof isActive === "boolean") update.isActive = isActive;
  if (maxLoad !== undefined) update.maxLoad = Math.min(100, Math.max(1, parseInt(maxLoad) || 10));

  const agent = await Agent.findByIdAndUpdate(agentId, update, { new: true });

  // Handle agent deactivation - reassign all open tickets
  if (typeof isActive === "boolean" && oldAgent.isActive === true && isActive === false) {
    const reassignmentResults = await reassignAgentTickets(agentId);
    
    // Log audit for each reassignment
    for (const reassignment of reassignmentResults.reassigned) {
      const ticket = await Ticket.findById(reassignment.ticketId);
      if (ticket) {
        await auditLogger.ticketReassigned(
          ticket,
          agentId,
          { _id: reassignment.newAgentId, name: reassignment.newAgentName },
          'agent_deactivation',
          adminUser,
          req
        );
      }
    }
    
    // Log audit for tickets marked as unassigned
    for (const unassigned of reassignmentResults.unassigned) {
      const ticket = await Ticket.findById(unassigned.ticketId);
      if (ticket) {
        await auditLogger.ticketReassigned(
          ticket,
          agentId,
          null,
          'agent_deactivation_no_available_agent',
          adminUser,
          req
        );
      }
    }
    
    await auditLogger.agentStatusChanged(agent, isActive, adminUser, req);
  } else if (typeof isActive === "boolean" && oldAgent.isActive !== isActive) {
    await auditLogger.agentStatusChanged(agent, isActive, adminUser, req);
  } else if (Object.keys(update).length > 0) {
    await auditLogger.agentUpdated(agent, update, adminUser, req);
  }

  return { success: true, agent };
};

export const deleteAgent = async (agentId, adminUser, req) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new Error("Agent not found");
  }

  const openTickets = await Ticket.countDocuments({ 
    assignedTo: agentId, 
    status: { $in: ["open", "in-progress"] } 
  });
  
  if (openTickets > 0) {
    throw new Error(`Cannot delete agent with ${openTickets} open ticket(s). Reassign or close them first.`);
  }

  await Agent.findByIdAndDelete(agentId);
  await User.findOneAndUpdate({ email: agent.email }, { role: "user", agentId: null });
  await auditLogger.agentDeleted(agent, adminUser, req);

  return { success: true, message: "Agent deleted" };
};

export const getUsers = async ({ role, page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  
  const query = {};
  if (role && ["user", "agent", "admin"].includes(role)) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("customerId", "plan")
      .populate("agentId", "name")
      .select("-otp -otpExpires -sessionToken")
      .sort({ lastSeen: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    success: true,
    users: users.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.customerId?.plan,
      agentName: u.agentId?.name,
      lastSeen: u.lastSeen,
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

export const updateUser = async (userId, { role, name }, adminUser, req) => {
  const oldUser = await User.findById(userId);
  if (!oldUser) {
    throw new Error("User not found");
  }

  const update = {};
  if (role) update.role = role;
  if (name) update.name = sanitizeString(name);

  if (Object.keys(update).length === 0) {
    throw new Error("No valid fields to update");
  }

  if (oldUser.role === "admin" && role && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new Error("Cannot remove the last admin");
    }
  }

  if (role === "agent" && oldUser.role !== "agent") {
    const agent = await Agent.findOne({ email: oldUser.email });
    if (agent) update.agentId = agent._id;
  }
  
  if (oldUser.role === "agent" && role && role !== "agent") {
    update.agentId = null;
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true })
    .select("-otp -otpExpires -sessionToken");

  if (role && oldUser.role !== role) {
    await auditLogger.roleChanged(user, oldUser.role, role, adminUser, req);
  } else if (Object.keys(update).length > 0) {
    await auditLogger.userUpdated(user, update, adminUser, req);
  }

  return { 
    success: true, 
    user: { id: user._id, email: user.email, name: user.name, role: user.role }
  };
};

export const getCustomers = async ({ page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

  const [customers, total] = await Promise.all([
    Customer.find().sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Customer.countDocuments(),
  ]);

  return { 
    success: true, 
    customers,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

export const updateCustomer = async (customerId, { plan, name }) => {
  const update = {};
  if (plan && ["basic", "premium", "enterprise"].includes(plan)) update.plan = plan;
  if (name) update.name = sanitizeString(name);

  if (Object.keys(update).length === 0) {
    throw new Error("No valid fields to update");
  }

  const customer = await Customer.findByIdAndUpdate(customerId, update, { new: true });
  if (!customer) {
    throw new Error("Customer not found");
  }

  return { success: true, customer };
};

export const getAuditLogs = async ({ category, action, severity, search, startDate, endDate, page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  
  const query = {};
  if (category && ["user", "ticket", "agent", "admin", "system"].includes(category)) query.category = category;
  if (action) query.action = sanitizeString(action);
  if (severity && ["info", "warning", "error", "critical"].includes(severity)) query.severity = severity;
  
  if (search) {
    const sanitizedSearch = sanitizeString(search);
    query.$or = [
      { description: { $regex: sanitizedSearch, $options: 'i' } },
      { userEmail: { $regex: sanitizedSearch, $options: 'i' } },
      { targetName: { $regex: sanitizedSearch, $options: 'i' } },
    ];
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start)) query.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end)) query.createdAt.$lte = end;
    }
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    AuditLog.countDocuments(query),
  ]);

  const stats = await AuditLog.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);

  return {
    success: true,
    logs: logs.map(l => ({
      id: l._id,
      action: l.action,
      category: l.category,
      description: l.description,
      userEmail: l.userEmail,
      userName: l.userName,
      targetType: l.targetType,
      targetName: l.targetName,
      severity: l.severity,
      metadata: l.metadata,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
    stats: Object.fromEntries(stats.map(s => [s._id || 'unknown', s.count])),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

export const getAuditLogActions = async () => {
  const actions = await AuditLog.distinct('action');
  return { success: true, actions };
};
