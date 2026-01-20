import { Ticket, Agent } from "../../models/index.js";
import { runAgent } from "../agent.js";
import { notifyWithRetry } from "../webhooks.js";
import { sendTicketUpdatedEmail } from "../auth/email.js";
import { auditLogger } from "../admin/audit-log.js";
import { releaseAgentLoad, manualReassign, incrementAgentLoad } from "../ticket/ticket-assignment.js";
import { sanitizeString } from "../validator.js";

const SLA_HOURS = { low: 72, medium: 48, high: 24, urgent: 8 };
const VALID_STATUSES = ["open", "in-progress", "resolved", "closed"];
const VALID_CATEGORIES = ["account", "billing", "technical", "gameplay", "security", "general"];

export const getTickets = async ({ status, category, assignedToMe, agentId, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  const query = {};
  if (status && VALID_STATUSES.includes(status)) query.status = status;
  if (category && VALID_CATEGORIES.includes(category)) query.category = category;
  if (assignedToMe && agentId) query.assignedTo = agentId;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("assignedTo", "name email")
      .sort({ priority: -1, createdAt: -1 })
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
      description: t.description?.slice(0, 100),
      customerEmail: t.customerEmail,
      category: t.category,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo?.name || "Unassigned",
      assignedToId: t.assignedTo?._id,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t.conversation?.length || 0,
      slaBreached: t.slaBreached,
      slaDueAt: t.slaDueAt,
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

export const getTicketById = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate("assignedTo", "name email")
    .lean();

  if (!ticket) return null;

  return {
    success: true,
    ticket: {
      id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      customerEmail: ticket.customerEmail,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo?.name || "Unassigned",
      assignedToId: ticket.assignedTo?._id,
      slaDueAt: ticket.slaDueAt,
      slaBreached: ticket.slaBreached,
      firstResponseAt: ticket.firstResponseAt,
      resolvedAt: ticket.resolvedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      conversation: ticket.conversation || [],
    },
  };
};

export const replyToTicket = async ({ ticketId, message, useAI, agentEmail }, req) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status === "closed") {
    throw new Error("Cannot reply to a closed ticket");
  }

  let responseContent = message ? sanitizeString(message) : "";

  if (useAI) {
    const lastCustomerMsg = [...ticket.conversation].reverse().find(m => m.role === "customer");
    responseContent = await runAgent(
      lastCustomerMsg?.content || ticket.description,
      { email: ticket.customerEmail },
      ticket.conversation.slice(-8)
    );
  }

  ticket.conversation.push({
    role: "agent",
    content: responseContent,
    timestamp: new Date(),
    agentEmail,
  });

  if (!ticket.firstResponseAt) {
    ticket.firstResponseAt = new Date();
  }

  ticket.status = "in-progress";
  await ticket.save();

  // Audit log for agent reply
  auditLogger.agentReplied(ticket, responseContent, { email: agentEmail }, useAI, req).catch(console.error);

  notifyWithRetry("ticket.agent-reply", { ticket: ticket.toObject() }).catch(console.error);
  sendTicketUpdatedEmail(ticket.customerEmail, ticket, "reply").catch(console.error);

  return {
    success: true,
    message: responseContent,
    ticket: { id: ticket._id, status: ticket.status, messageCount: ticket.conversation.length },
  };
};

export const updateTicket = async ({ ticketId, status, priority, category, assignedTo, agentEmail }, user, req) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const changes = [];

  if (status) {
    changes.push(`Status: ${ticket.status} → ${status}`);
    ticket.status = status;
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date();
    }
  }

  if (priority) {
    changes.push(`Priority: ${ticket.priority} → ${priority}`);
    const oldPriority = ticket.priority;
    const oldSlaDueAt = ticket.slaDueAt;
    ticket.priority = priority;
    
    if (oldPriority !== priority && ticket.status !== "resolved" && ticket.status !== "closed") {
      const newSlaDueAt = new Date(Date.now() + (SLA_HOURS[priority] || 48) * 60 * 60 * 1000);
      ticket.slaDueAt = newSlaDueAt;
      
      // Clear slaBreached flag if new SLA is in the future
      let slaBreachedCleared = false;
      if (ticket.slaBreached && newSlaDueAt > new Date()) {
        ticket.slaBreached = false;
        slaBreachedCleared = true;
        changes.push(`SLA breach cleared`);
      }
      
      changes.push(`SLA recalculated`);
      
      // Log SLA recalculation
      auditLogger.slaRecalculated(
        ticket, 
        oldPriority, 
        priority, 
        oldSlaDueAt, 
        newSlaDueAt, 
        slaBreachedCleared, 
        user, 
        req
      ).catch(console.error);
    }
  }

  if (category) {
    changes.push(`Category: ${ticket.category} → ${category}`);
    ticket.category = category;
  }

  if (assignedTo) {
    const agent = await Agent.findById(assignedTo);
    if (!agent) {
      throw new Error("Agent not found");
    }
    if (!agent.isActive) {
      throw new Error("Cannot assign to inactive agent");
    }
    
    const oldAgentId = ticket.assignedTo;
    
    // If ticket already has an assigned agent, use manualReassign to handle load updates
    if (oldAgentId && oldAgentId.toString() !== assignedTo.toString()) {
      const oldAgent = await Agent.findById(oldAgentId);
      const reassignResult = await manualReassign(ticketId, oldAgentId, assignedTo);
      changes.push(`Reassigned from ${oldAgent?.name || 'Unknown'} to ${agent.name}`);
      
      // Log the reassignment
      auditLogger.ticketReassigned(
        ticket, 
        oldAgentId, 
        agent, 
        'Manual reassignment by agent', 
        user, 
        req
      ).catch(console.error);
      
      // Ticket was already saved by manualReassign, reload it
      const updatedTicket = await Ticket.findById(ticketId);
      Object.assign(ticket, updatedTicket.toObject());
    } else if (!oldAgentId) {
      // First assignment - just set the agent and increment load
      changes.push(`Assigned to: ${agent.name}`);
      ticket.assignedTo = agent._id;
      
      // Increment the new agent's load for first assignment
      await incrementAgentLoad(assignedTo);
      
      // Log the assignment
      auditLogger.ticketAssigned(ticket, agent, user, req).catch(console.error);
    }
  }

  if (changes.length === 0) {
    throw new Error("No valid changes provided");
  }

  ticket.conversation.push({
    role: "system",
    content: `Agent ${agentEmail} updated: ${changes.join(", ")}`,
    timestamp: new Date(),
  });

  if ((status === "resolved" || status === "closed") && ticket.assignedTo) {
    await releaseAgentLoad(ticket);
  }

  await ticket.save();

  notifyWithRetry("ticket.updated", { ticket: ticket.toObject() }).catch(console.error);
  
  if (status === "resolved") {
    auditLogger.ticketResolved(ticket, user, req).catch(console.error);
  } else {
    auditLogger.ticketUpdated(ticket, changes, user, req).catch(console.error);
  }

  return {
    success: true,
    ticket: {
      id: ticket._id,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
    },
  };
};

export const getAvailableAgents = async () => {
  const agents = await Agent.find({ isActive: true })
    .select("name email categories currentLoad maxLoad")
    .sort({ currentLoad: 1 })
    .lean();

  return { success: true, agents };
};

export const getAgentStats = async (agentId) => {
  const [total, open, inProgress, resolved, breached] = await Promise.all([
    Ticket.countDocuments({}),
    Ticket.countDocuments({ status: "open" }),
    Ticket.countDocuments({ status: "in-progress" }),
    Ticket.countDocuments({ status: "resolved" }),
    Ticket.countDocuments({ slaBreached: true, status: { $nin: ["resolved", "closed"] } }),
  ]);

  let myStats = { total: 0, open: 0, inProgress: 0, resolved: 0 };
  if (agentId) {
    const [myTotal, myOpen, myInProgress, myResolved] = await Promise.all([
      Ticket.countDocuments({ assignedTo: agentId }),
      Ticket.countDocuments({ assignedTo: agentId, status: "open" }),
      Ticket.countDocuments({ assignedTo: agentId, status: "in-progress" }),
      Ticket.countDocuments({ assignedTo: agentId, status: "resolved" }),
    ]);
    myStats = { total: myTotal, open: myOpen, inProgress: myInProgress, resolved: myResolved };
  }

  return {
    success: true,
    stats: { total, open, inProgress, resolved, breached },
    myStats,
  };
};
