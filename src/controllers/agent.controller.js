import * as agentService from "../services/agent/agent-panel.service.js";
import { isValidObjectId, sanitizeString, schemas } from "../services/validator.js";

const VALID_STATUSES = ["open", "in-progress", "resolved", "closed"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_CATEGORIES = ["account", "billing", "technical", "gameplay", "security", "general"];

export const getTickets = async (req, res, next) => {
  try {
    const { status, category, priority, needsManualReview, assignedToMe, page = 1, limit = 20 } = req.query;
    const validation = schemas.listAgentTickets({ status, category, priority, needsManualReview, assignedToMe, page, limit });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }
    const result = await agentService.getTickets({
      status,
      category,
      priority,
      needsManualReview: needsManualReview === "true",
      assignedToMe: assignedToMe === "true",
      agentId: req.user.agentId,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const result = await agentService.getTicketById(id);
    
    if (!result) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, useAI = false } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!message?.trim() && !useAI) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message && message.length > 5000) {
      return res.status(400).json({ error: "Message too long (max 5000 characters)" });
    }

    const result = await agentService.replyToTicket({
      ticketId: id,
      message,
      useAI,
      agentEmail: req.user.email,
    }, req);

    res.json(result);
  } catch (err) {
    if (err.message === "Ticket not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === "Cannot reply to a closed ticket") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, category, assignedTo, remark } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    // Validate inputs
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }
    if (assignedTo && !isValidObjectId(assignedTo)) {
      return res.status(400).json({ error: "Invalid agent ID" });
    }

    const result = await agentService.updateTicket({
      ticketId: id,
      status,
      priority,
      category,
      assignedTo,
      remark,
      agentEmail: req.user.email,
    }, req.user, req);

    res.json(result);
  } catch (err) {
    if (err.message === "Ticket not found" || err.message === "Agent not found") {
      return res.status(404).json({ error: err.message });
    }
    if (
      err.message === "Cannot assign to inactive agent" ||
      err.message === "No valid changes provided" ||
      err.message === "Remark is required for ticket updates" ||
      err.message === "Remark must be 500 characters or less" ||
      err.message === "Cannot reassign a resolved or closed ticket"
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const getAgents = async (req, res, next) => {
  try {
    const result = await agentService.getAvailableAgents();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const result = await agentService.getAgentStats(req.user.agentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
