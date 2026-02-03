/**
 * Validation Service - Centralized validation for all API inputs
 */
import { VALID_STATUSES } from "../constants/statuses.js";
import { VALID_CATEGORIES } from "../constants/categories.js";
import { VALID_PRIORITIES } from "../constants/priorities.js";

// Email validation
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim().toLowerCase());
};

// OTP validation (6 digits)
export const isValidOTP = (otp) => {
  if (!otp || typeof otp !== 'string') return false;
  return /^\d{6}$/.test(otp.trim());
};

// MongoDB ObjectId validation
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

// String validation with length constraints
export const isValidString = (str, { minLength = 1, maxLength = 1000, required = true } = {}) => {
  if (!str || typeof str !== 'string') return !required;
  const trimmed = str.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// Enum validation
export const isValidEnum = (value, allowedValues, { required = true } = {}) => {
  if (!value) return !required;
  return allowedValues.includes(value);
};

// Boolean validation (supports true/false or "true"/"false")
export const isValidBoolean = (value, { required = true } = {}) => {
  if (value === undefined || value === null || value === '') return !required;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'string') return value === 'true' || value === 'false';
  return false;
};

// Number validation
export const isValidNumber = (num, { min, max, required = true } = {}) => {
  if (num === undefined || num === null) return !required;
  const n = Number(num);
  if (isNaN(n)) return false;
  if (min !== undefined && n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
};

// Date validation (ISO string or Date-compatible)
export const isValidDateString = (value, { required = true } = {}) => {
  if (!value) return !required;
  const d = new Date(value);
  return !isNaN(d.getTime());
};

// Array validation
export const isValidArray = (arr, { minLength = 0, maxLength = 100, allowedValues, required = true } = {}) => {
  if (!arr) return !required;
  if (!Array.isArray(arr)) return false;
  if (arr.length < minLength || arr.length > maxLength) return false;
  if (allowedValues) {
    return arr.every(item => allowedValues.includes(item));
  }
  return true;
};

// Sanitize string (trim and escape basic HTML)
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Validation schemas for different entities
export const schemas = {
  // Ticket creation
  createTicket: (data) => {
    const errors = [];
    
    if (!isValidString(data.description, { minLength: 10, maxLength: 5000 })) {
      errors.push('Description must be between 10 and 5000 characters');
    }
    
    if (data.subject && !isValidString(data.subject, { minLength: 3, maxLength: 200, required: false })) {
      errors.push('Subject must be between 3 and 200 characters');
    }
    
    if (data.priority && !isValidEnum(data.priority, ['low', 'medium', 'high', 'urgent'])) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Ticket message
  ticketMessage: (data) => {
    const errors = [];
    
    if (!isValidString(data.message, { minLength: 1, maxLength: 5000 })) {
      errors.push('Message must be between 1 and 5000 characters');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Ticket status update
  ticketStatus: (data) => {
    const errors = [];
    
    if (!isValidEnum(data.status, ['open', 'in-progress', 'resolved', 'closed'])) {
      errors.push('Status must be one of: open, in-progress, resolved, closed');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Agent creation
  createAgent: (data) => {
    const errors = [];
    
    if (!isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!isValidString(data.name, { minLength: 2, maxLength: 100 })) {
      errors.push('Name must be between 2 and 100 characters');
    }
    
    if (data.categories && !isValidArray(data.categories, { 
      allowedValues: ['account', 'billing', 'technical', 'gameplay', 'security', 'general'],
      maxLength: 6 
    })) {
      errors.push('Categories must be valid category names');
    }
    
    if (data.maxLoad && !isValidNumber(data.maxLoad, { min: 1, max: 100 })) {
      errors.push('Max load must be between 1 and 100');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Agent update
  updateAgent: (data) => {
    const errors = [];
    
    if (data.name && !isValidString(data.name, { minLength: 2, maxLength: 100, required: false })) {
      errors.push('Name must be between 2 and 100 characters');
    }
    
    if (data.categories && !isValidArray(data.categories, { 
      allowedValues: ['account', 'billing', 'technical', 'gameplay', 'security', 'general'],
      maxLength: 6,
      required: false 
    })) {
      errors.push('Categories must be valid category names');
    }
    
    if (data.maxLoad !== undefined && !isValidNumber(data.maxLoad, { min: 1, max: 100, required: false })) {
      errors.push('Max load must be between 1 and 100');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // User role update
  updateUserRole: (data) => {
    const errors = [];
    
    if (!isValidEnum(data.role, ['user', 'agent', 'admin'])) {
      errors.push('Role must be one of: user, agent, admin');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Ticket list filters (user/admin)
  listTickets: (data) => {
    const errors = [];

    if (data.status && !isValidEnum(data.status, VALID_STATUSES)) {
      errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    if (data.category && !isValidEnum(data.category, VALID_CATEGORIES)) {
      errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    if (data.priority && !isValidEnum(data.priority, VALID_PRIORITIES)) {
      errors.push(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`);
    }
    if (data.page && !isValidNumber(data.page, { min: 1, max: 10000 })) {
      errors.push('Page must be a positive number');
    }
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 100 })) {
      errors.push('Limit must be between 1 and 100');
    }

    return { valid: errors.length === 0, errors };
  },

  // Agent ticket list filters
  listAgentTickets: (data) => {
    const errors = [];
    const base = schemas.listTickets(data);
    if (!base.valid) errors.push(...base.errors);

    if (data.needsManualReview !== undefined && !isValidBoolean(data.needsManualReview, { required: false })) {
      errors.push('needsManualReview must be true or false');
    }
    if (data.assignedToMe !== undefined && !isValidBoolean(data.assignedToMe, { required: false })) {
      errors.push('assignedToMe must be true or false');
    }

    return { valid: errors.length === 0, errors };
  },

  // User list filters (admin)
  listUsers: (data) => {
    const errors = [];

    if (data.role && !isValidEnum(data.role, ['user', 'agent', 'admin'])) {
      errors.push('Role must be one of: user, agent, admin');
    }
    if (data.page && !isValidNumber(data.page, { min: 1, max: 10000 })) {
      errors.push('Page must be a positive number');
    }
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 100 })) {
      errors.push('Limit must be between 1 and 100');
    }

    return { valid: errors.length === 0, errors };
  },

  // Customer list filters (admin)
  listCustomers: (data) => {
    const errors = [];

    if (data.page && !isValidNumber(data.page, { min: 1, max: 10000 })) {
      errors.push('Page must be a positive number');
    }
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 100 })) {
      errors.push('Limit must be between 1 and 100');
    }

    return { valid: errors.length === 0, errors };
  },

  // Audit log filters (admin)
  listAuditLogs: (data) => {
    const errors = [];

    if (data.category && !isValidEnum(data.category, ['user', 'ticket', 'agent', 'admin', 'system'])) {
      errors.push('Category must be one of: user, ticket, agent, admin, system');
    }
    if (data.severity && !isValidEnum(data.severity, ['info', 'warning', 'error', 'critical'])) {
      errors.push('Severity must be one of: info, warning, error, critical');
    }
    if (data.action && !isValidString(data.action, { minLength: 3, maxLength: 120, required: false })) {
      errors.push('Action must be between 3 and 120 characters');
    }
    if (data.search && !isValidString(data.search, { minLength: 2, maxLength: 200, required: false })) {
      errors.push('Search must be between 2 and 200 characters');
    }
    if (data.startDate && !isValidDateString(data.startDate, { required: false })) {
      errors.push('Start date must be a valid date');
    }
    if (data.endDate && !isValidDateString(data.endDate, { required: false })) {
      errors.push('End date must be a valid date');
    }
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (!isNaN(start) && !isNaN(end) && start > end) {
        errors.push('Start date must be before end date');
      }
    }
    if (data.page && !isValidNumber(data.page, { min: 1, max: 10000 })) {
      errors.push('Page must be a positive number');
    }
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 100 })) {
      errors.push('Limit must be between 1 and 100');
    }

    return { valid: errors.length === 0, errors };
  },

  // Auth - send OTP
  sendOTP: (data) => {
    const errors = [];
    
    if (!isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Auth - verify OTP
  verifyOTP: (data) => {
    const errors = [];
    
    if (!isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!isValidOTP(data.otp)) {
      errors.push('OTP must be 6 digits');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Triage
  triage: (data) => {
    const errors = [];

    if (!isValidString(data.description, { minLength: 1, maxLength: 5000 })) {
      errors.push('Message must be between 1 and 5000 characters');
    }

    return { valid: errors.length === 0, errors };
  },

  // Knowledge base search
  knowledgeSearch: (data) => {
    const errors = [];

    if (!isValidString(data.q, { minLength: 1, maxLength: 200 })) {
      errors.push('Query must be between 1 and 200 characters');
    }
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 50 })) {
      errors.push('Limit must be between 1 and 50');
    }

    return { valid: errors.length === 0, errors };
  },

  // Knowledge upload metadata
  knowledgeUpload: (data) => {
    const errors = [];

    if (data.category && !isValidEnum(data.category, VALID_CATEGORIES)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    if (data.topic && !isValidString(data.topic, { minLength: 1, maxLength: 50, required: false })) {
      errors.push('Topic must be between 1 and 50 characters');
    }

    return { valid: errors.length === 0, errors };
  },

  // Knowledge documents payload
  knowledgeDocuments: (data) => {
    const errors = [];

    if (!Array.isArray(data.documents) || data.documents.length === 0) {
      errors.push('Documents array required');
      return { valid: false, errors };
    }

    if (data.documents.length > 100) {
      errors.push('Documents array cannot exceed 100 items');
    }

    data.documents.forEach((doc, index) => {
      if (!doc || typeof doc !== 'object') {
        errors.push(`Document #${index + 1} must be an object`);
        return;
      }
      if (!isValidString(doc.content, { minLength: 1, maxLength: 10000 })) {
        errors.push(`Document #${index + 1} content must be between 1 and 10000 characters`);
      }
      if (doc.metadata && typeof doc.metadata !== 'object') {
        errors.push(`Document #${index + 1} metadata must be an object`);
      }
      if (doc.metadata?.category && !isValidEnum(doc.metadata.category, VALID_CATEGORIES)) {
        errors.push(`Document #${index + 1} category must be one of: ${VALID_CATEGORIES.join(", ")}`);
      }
      if (doc.metadata?.topic && !isValidString(doc.metadata.topic, { minLength: 1, maxLength: 50, required: false })) {
        errors.push(`Document #${index + 1} topic must be between 1 and 50 characters`);
      }
    });

    return { valid: errors.length === 0, errors };
  },

  // Webhook payload
  webhookTicketEvent: (data) => {
    const errors = [];

    if (!isValidString(data.event, { minLength: 3, maxLength: 100 })) {
      errors.push('Event must be between 3 and 100 characters');
    }
    if (!data.ticket || typeof data.ticket !== 'object') {
      errors.push('Ticket payload is required');
    }

    return { valid: errors.length === 0, errors };
  },

  // Customer update
  updateCustomer: (data) => {
    const errors = [];

    if (data.plan && !isValidEnum(data.plan, ['basic', 'premium', 'enterprise'])) {
      errors.push('Plan must be one of: basic, premium, enterprise');
    }
    if (data.name && !isValidString(data.name, { minLength: 2, maxLength: 100, required: false })) {
      errors.push('Name must be between 2 and 100 characters');
    }

    return { valid: errors.length === 0, errors };
  },

  // Pagination
  pagination: (data) => {
    const errors = [];
    
    if (data.page && !isValidNumber(data.page, { min: 1, max: 10000 })) {
      errors.push('Page must be a positive number');
    }
    
    if (data.limit && !isValidNumber(data.limit, { min: 1, max: 100 })) {
      errors.push('Limit must be between 1 and 100');
    }
    
    return { valid: errors.length === 0, errors };
  },
};

// Middleware factory for validation
export const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) {
    return next(new Error(`Unknown validation schema: ${schemaName}`));
  }
  
  const data = { ...req.body, ...req.query, ...req.params };
  const result = schema(data);
  
  if (!result.valid) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: result.errors 
    });
  }
  
  next();
};

export default {
  isValidEmail,
  isValidOTP,
  isValidObjectId,
  isValidString,
  isValidEnum,
  isValidBoolean,
  isValidNumber,
  isValidDateString,
  isValidArray,
  sanitizeString,
  schemas,
  validate,
};
