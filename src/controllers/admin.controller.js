import * as adminService from "../services/admin/admin.service.js";
import { schemas, isValidObjectId } from "../services/validator.js";

// Stats
export const getStats = async (req, res, next) => {
  try {
    const result = await adminService.getSystemStats();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Tickets
export const getTickets = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 50 } = req.query;
    const result = await adminService.getAllTickets({ status, category, priority, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Agents
export const getAgents = async (req, res, next) => {
  try {
    const result = await adminService.getAgents();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createAgent = async (req, res, next) => {
  try {
    const { email, name, categories, maxLoad = 10 } = req.body;
    
    const validation = schemas.createAgent({ email, name, categories, maxLoad });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    const result = await adminService.createAgent({ email, name, categories, maxLoad }, req.user, req);
    res.status(201).json(result);
  } catch (err) {
    if (err.message === "Agent with this email already exists") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid agent ID" });
    }

    const { name, categories, isActive, maxLoad } = req.body;
    
    const validation = schemas.updateAgent({ name, categories, maxLoad });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], details: validation.errors });
    }

    const result = await adminService.updateAgent(id, { name, categories, isActive, maxLoad }, req.user, req);
    res.json(result);
  } catch (err) {
    if (err.message === "Agent not found") {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
};

export const deleteAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid agent ID" });
    }

    const result = await adminService.deleteAgent(id, req.user, req);
    res.json(result);
  } catch (err) {
    if (err.message === "Agent not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("Cannot delete agent")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Users
export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const result = await adminService.getUsers({ role, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { role, name } = req.body;
    
    if (role) {
      const validation = schemas.updateUserRole({ role });
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors[0] });
      }
    }

    const result = await adminService.updateUser(id, { role, name }, req.user, req);
    res.json(result);
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === "Cannot remove the last admin" || err.message === "No valid fields to update") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Customers
export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await adminService.getCustomers({ page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const { plan, name } = req.body;
    const result = await adminService.updateCustomer(id, { plan, name });
    res.json(result);
  } catch (err) {
    if (err.message === "Customer not found" || err.message === "No valid fields to update") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Audit Logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const { category, action, severity, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const result = await adminService.getAuditLogs({ 
      category, action, severity, search, startDate, endDate, page, limit 
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogActions = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogActions();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
