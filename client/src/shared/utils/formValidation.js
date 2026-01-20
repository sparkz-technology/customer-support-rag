/**
 * Form Validation Utilities
 * 
 * Provides field-level validation and error highlighting utilities.
 * 
 * Requirements: 3.3
 */

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value, fieldName = 'This field') => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },
};

/**
 * Validate a single field against multiple rules
 * @param {any} value - The value to validate
 * @param {Array<Function>} rules - Array of validation functions
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} Error message or null if valid
 */
export function validateField(value, rules, fieldName) {
  for (const rule of rules) {
    const error = rule(value, fieldName);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validate an entire form
 * @param {Object} values - Form values object
 * @param {Object} schema - Validation schema { fieldName: { rules: [], label: '' } }
 * @returns {Object} Object with field errors { fieldName: errorMessage }
 */
export function validateForm(values, schema) {
  const errors = {};
  
  for (const [fieldName, config] of Object.entries(schema)) {
    const value = values[fieldName];
    const rules = config.rules || [];
    const label = config.label || fieldName;
    
    const error = validateField(value, rules, label);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return errors;
}

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object from validateForm
 * @returns {boolean} True if there are errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Get field validation status for Ant Design Form.Item
 * @param {string|null} error - Error message for the field
 * @returns {Object} Props for Form.Item { validateStatus, help }
 */
export function getFieldStatus(error) {
  if (!error) {
    return { validateStatus: '', help: '' };
  }
  return {
    validateStatus: 'error',
    help: error
  };
}

/**
 * Merge server validation errors with client errors
 * @param {Object} clientErrors - Client-side validation errors
 * @param {Object} serverErrors - Server-side validation errors
 * @returns {Object} Merged errors object
 */
export function mergeErrors(clientErrors, serverErrors) {
  if (!serverErrors) return clientErrors;
  return { ...clientErrors, ...serverErrors };
}

/**
 * Create a field error handler for API errors
 * @param {Function} setErrors - State setter for errors
 * @returns {Function} Error handler function
 */
export function createFieldErrorHandler(setErrors) {
  return (error) => {
    if (error?.validationErrors) {
      setErrors(prev => ({ ...prev, ...error.validationErrors }));
      return true;
    }
    return false;
  };
}
