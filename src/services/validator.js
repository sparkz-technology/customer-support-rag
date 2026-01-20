/**
 * Validation Service - Centralized validation for all API inputs
 */

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

// Number validation
export const isValidNumber = (num, { min, max, required = true } = {}) => {
  if (num === undefined || num === null) return !required;
  const n = Number(num);
  if (isNaN(n)) return false;
  if (min !== undefined && n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
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
  isValidNumber,
  isValidArray,
  sanitizeString,
  schemas,
  validate,
};
