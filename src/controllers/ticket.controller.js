import * as ticketService from "../services/ticket/ticket.service.js";
import { schemas, isValidObjectId } from "../services/validator.js";

export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority = "medium" } = req.body;

    const validation = schemas.createTicket({ subject, description, priority });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    const result = await ticketService.createTicket({
      subject,
      description,
      priority,
      user: req.user,
    }, req);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const validation = schemas.listTickets({ status, category, page, limit });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }
    const result = await ticketService.getUserTickets({
      email: req.user.email,
      status,
      category,
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

    const result = await ticketService.getTicketById(id, req.user.email);
    
    if (!result) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const addMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const validation = schemas.ticketMessage({ message });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    const result = await ticketService.addMessage({
      ticketId: id,
      message,
      user: req.user,
    });

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

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!["resolved", "closed"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'resolved' or 'closed'" });
    }

    const result = await ticketService.updateTicketStatus({
      ticketId: id,
      status,
      user: req.user,
    }, req);

    res.json(result);
  } catch (err) {
    if (err.message === "Ticket not found") {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
};
