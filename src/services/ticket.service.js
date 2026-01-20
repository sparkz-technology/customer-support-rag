import { Ticket } from "../models/index.js";
import { runAgent } from "./agent.js";
import { autoAssignTicket, detectCategory, releaseAgentLoad } from "./ticketAssignment.js";
import { sendTicketCreatedEmail, sendTicketUpdatedEmail } from "./email.js";
import { notifyWithRetry } from "./webhooks.js";
import { auditLogger } from "./admin/audit-log.js";
import { sanitizeString } from "./validator.js";

const SLA_HOURS = { low: 72, medium: 48, high: 24, urgent: 8 };

/**
 * Reopens a resolved ticket with proper state reset
 * - Sets status to "open"
 * - Calculates new SLA based on current priority
 * - Clears slaBreached flag if new SLA is in future
 * - Clears resolvedAt timestamp
 * - Increments reopenCount
 * - Sets reopenedAt timestamp
 * @param {Object} ticket - The ticket document to reopen
 * @returns {Object} - The updated ticket
 */
export const reopenTicket = async (ticket) => {
  const now = new Date();
  const newSlaDueAt = new Date(now.getTime() + (SLA_HOURS[ticket.priority] || 48) * 60 * 60 * 1000);
  
  ticket.status = "open";
  ticket.slaDueAt = newSlaDueAt;
  ticket.resolvedAt = null;
  ticket.reopenedAt = now;
  ticket.reopenCount = (ticket.reopenCount || 0) + 1;
  
  // Clear slaBreached flag if new SLA is in the future
  if (newSlaDueAt > now) {
    ticket.slaBreached = false;
  }
  
  return ticket;
};

export const createTicket = async ({ subject, description, priority, user }, req) => {
  const sanitizedSubject = sanitizeString(subject) || "Support Request";
  const sanitizedDescription = sanitizeString(description);
  const category = detectCategory(sanitizedDescription);
  const slaDueAt = new Date(Date.now() + (SLA_HOURS[priority] || 48) * 60 * 60 * 1000);

  const ticket = new Ticket({
    customerId: user.customerId,
    customerEmail: user.email,
    subject: sanitizedSubject,
    description: sanitizedDescription,
    category,
    priority,
    slaDueAt,
    conversation: [{
      role: "customer",
      content: sanitizedDescription,
      timestamp: new Date(),
    }],
  });

  const assignedAgent = await autoAssignTicket(ticket);
  await ticket.save();

  // Get initial AI response
  try {
    const aiResponse = await runAgent(
      sanitizedDescription,
      { email: user.email, customerId: user.customerId },
      []
    );

    ticket.conversation.push({
      role: "agent",
      content: aiResponse,
      timestamp: new Date(),
    });
    ticket.firstResponseAt = new Date();
    ticket.status = "in-progress";
    await ticket.save();
  } catch (aiError) {
    console.error("Initial AI response failed:", aiError.message);
    
    // Mark ticket for manual review on AI failure
    ticket.needsManualReview = true;
    ticket.conversation.push({
      role: "system",
      content: "AI response unavailable. This ticket has been marked for manual review by a support agent.",
      timestamp: new Date(),
    });
    await ticket.save();
  }

  // Notifications (non-blocking)
  notifyWithRetry("ticket.created", { ticket: ticket.toObject() }).catch(console.error);
  sendTicketCreatedEmail(user.email, ticket).catch(console.error);
  auditLogger.ticketCreated(ticket, user, req).catch(console.error);

  return {
    success: true,
    ticket: {
      id: ticket._id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: assignedAgent?.name || "Unassigned",
      slaDueAt: ticket.slaDueAt,
    },
  };
};

export const getUserTickets = async ({ email, status, category, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  const query = { customerEmail: email };
  if (status && ["open", "in-progress", "resolved", "closed"].includes(status)) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("assignedTo", "name email")
      .sort({ updatedAt: -1 })
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
      category: t.category,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo?.name || "Unassigned",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t.conversation?.length || 0,
      slaBreached: t.slaBreached,
      slaDueAt: t.slaDueAt,
      firstResponseAt: t.firstResponseAt,
      reopenCount: t.reopenCount || 0,
    })),
    pagination: { 
      page: pageNum, 
      limit: limitNum, 
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

export const getTicketById = async (ticketId, customerEmail) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    customerEmail,
  }).populate("assignedTo", "name email").lean();

  if (!ticket) return null;

  const slaBreached = ticket.slaDueAt && 
    ticket.status !== "resolved" && 
    ticket.status !== "closed" && 
    new Date(ticket.slaDueAt) < new Date();

  return {
    success: true,
    ticket: {
      id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo?.name || "Unassigned",
      slaDueAt: ticket.slaDueAt,
      slaBreached,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      conversation: ticket.conversation || [],
    },
  };
};

export const addMessage = async ({ ticketId, message, user }, req) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    customerEmail: user.email,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status === "closed") {
    throw new Error("Cannot reply to a closed ticket");
  }

  const sanitizedMessage = sanitizeString(message);

  ticket.conversation.push({
    role: "customer",
    content: sanitizedMessage,
    timestamp: new Date(),
  });

  // Audit log for customer message
  auditLogger.ticketMessageAdded(ticket, sanitizedMessage, user, req).catch(console.error);

  // Reopen ticket if it was resolved
  if (ticket.status === "resolved") {
    await reopenTicket(ticket);
    
    // Add system message about reopening
    ticket.conversation.push({
      role: "system",
      content: "Ticket reopened due to customer reply",
      timestamp: new Date(),
    });
    
    // Audit log for reopening
    auditLogger.ticketReopened(ticket, user, req).catch(console.error);
  }

  // Get AI response
  try {
    const aiResponse = await runAgent(
      sanitizedMessage,
      { email: user.email, customerId: user.customerId },
      ticket.conversation.slice(-8)
    );

    ticket.conversation.push({
      role: "agent",
      content: aiResponse,
      timestamp: new Date(),
    });

    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    ticket.status = "in-progress";
    await ticket.save();

    notifyWithRetry("ticket.reply", { ticket: ticket.toObject() }).catch(console.error);

    return {
      success: true,
      response: aiResponse,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        messageCount: ticket.conversation.length,
      },
    };
  } catch (aiError) {
    console.error("AI response failed in addMessage:", aiError.message);
    
    // Mark ticket for manual review on AI failure
    ticket.needsManualReview = true;
    ticket.conversation.push({
      role: "system",
      content: "AI response unavailable. This ticket has been marked for manual review by a support agent.",
      timestamp: new Date(),
    });
    
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }
    
    ticket.status = "in-progress";
    await ticket.save();

    notifyWithRetry("ticket.reply", { ticket: ticket.toObject() }).catch(console.error);

    return {
      success: true,
      response: null,
      needsManualReview: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        messageCount: ticket.conversation.length,
      },
    };
  }
};

export const updateTicketStatus = async ({ ticketId, status, user }, req) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    customerEmail: user.email,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const previousStatus = ticket.status;
  ticket.status = status;
  
  // Set resolvedAt timestamp only when ticket is resolved or closed
  if (status === "resolved" || status === "closed") {
    ticket.resolvedAt = new Date();
    await releaseAgentLoad(ticket);
  }

  ticket.conversation.push({
    role: "system",
    content: `Ticket marked as ${status} by customer`,
    timestamp: new Date(),
  });

  await ticket.save();

  notifyWithRetry(`ticket.${status}`, { ticket: ticket.toObject() }).catch(console.error);
  sendTicketUpdatedEmail(user.email, ticket, status).catch(console.error);
  
  if (status === "resolved") {
    auditLogger.ticketResolved(ticket, user, req).catch(console.error);
  }

  return { 
    success: true, 
    ticket: {
      id: ticket._id,
      status: ticket.status,
      previousStatus,
      resolvedAt: ticket.resolvedAt,
    },
  };
};
