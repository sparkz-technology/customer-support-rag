/**
 * Error Handling Utilities
 * 
 * Provides user-friendly error messages and error handling utilities
 * for the support ticket system.
 * 
 * Requirements: 3.3
 */

// Error message mapping for common HTTP status codes
export const ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  422: 'The provided data is invalid. Please check your input.',
  429: 'Too many requests. Please wait before trying again.',
  500: 'An unexpected server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is currently unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

// Specific error message mapping for known error types
export const SPECIFIC_ERROR_MESSAGES = {
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'ECONNREFUSED': 'Unable to connect to the server. Please try again later.',
  'ETIMEDOUT': 'The request timed out. Please try again.',
  'ENOTFOUND': 'Unable to reach the server. Please check your internet connection.',
  'ticket_not_found': 'The ticket you are looking for does not exist or has been deleted.',
  'agent_not_found': 'The agent you selected is no longer available.',
  'agent_at_capacity': 'This agent is currently at full capacity. Please select another agent.',
  'invalid_status_transition': 'This status change is not allowed for the current ticket state.',
  'ticket_closed': 'This ticket is closed and cannot be modified.',
  'unauthorized': 'You are not authorized to perform this action.',
  'validation_error': 'Please check your input and correct any errors.',
  'rate_limit_exceeded': 'You have made too many requests. Please wait before trying again.',
};

/**
 * Extended API Error class with additional metadata
 */
export class ApiError extends Error {
  constructor(message, status, originalError = null, retryAfter = null, validationErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalError = originalError;
    this.retryAfter = retryAfter; // For rate limiting (in seconds)
    this.validationErrors = validationErrors; // For field-level validation errors
    this.isNetworkError = status === 0 || !status;
    this.isRateLimited = status === 429;
    this.isServerError = status >= 500;
    this.isClientError = status >= 400 && status < 500;
  }
}

/**
 * Get a user-friendly error message based on the error
 * @param {Error|ApiError|string} error - The error to get a message for
 * @param {number} status - HTTP status code (optional)
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, status = null) {
  // Handle string errors
  if (typeof error === 'string') {
    return SPECIFIC_ERROR_MESSAGES[error] || error;
  }

  // Handle ApiError instances
  if (error instanceof ApiError) {
    // Check for specific error messages first
    if (error.originalError && SPECIFIC_ERROR_MESSAGES[error.originalError]) {
      return SPECIFIC_ERROR_MESSAGES[error.originalError];
    }
    
    // Check for status-based messages
    if (error.status && ERROR_MESSAGES[error.status]) {
      return ERROR_MESSAGES[error.status];
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message && SPECIFIC_ERROR_MESSAGES[error.message]) {
      return SPECIFIC_ERROR_MESSAGES[error.message];
    }
    
    // Check for TypeError (usually network issues)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return SPECIFIC_ERROR_MESSAGES['Failed to fetch'];
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  // Handle status code only
  if (status && ERROR_MESSAGES[status]) {
    return ERROR_MESSAGES[status];
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Parse validation errors from API response
 * @param {Object} errorData - Error data from API response
 * @returns {Object|null} Object mapping field names to error messages
 */
export function parseValidationErrors(errorData) {
  if (!errorData) return null;
  
  // Handle array of validation errors
  if (Array.isArray(errorData.errors)) {
    const fieldErrors = {};
    errorData.errors.forEach(err => {
      if (err.field) {
        fieldErrors[err.field] = err.message || 'Invalid value';
      }
    });
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
  }
  
  // Handle object with field errors
  if (errorData.fieldErrors) {
    return errorData.fieldErrors;
  }
  
  // Handle single field error
  if (errorData.field && errorData.message) {
    return { [errorData.field]: errorData.message };
  }
  
  return null;
}

/**
 * Check if an error is retryable (network error or server error)
 * @param {Error|ApiError} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof ApiError) {
    return error.isNetworkError || error.isServerError;
  }
  
  // Check for network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  return false;
}

/**
 * Format retry time for display
 * @param {number} seconds - Number of seconds until retry
 * @returns {string} Formatted time string
 */
export function formatRetryTime(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Extract retry-after value from response headers or error
 * @param {Response|Object} response - Fetch response or error object
 * @returns {number|null} Retry after in seconds, or null if not available
 */
export function getRetryAfter(response) {
  if (!response) return null;
  
  // Check headers if available
  if (response.headers && typeof response.headers.get === 'function') {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      // Could be seconds or a date
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds;
      }
      // Try parsing as date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
      }
    }
  }
  
  // Check for retryAfter in error data
  if (response.retryAfter) {
    return response.retryAfter;
  }
  
  // Default retry time for rate limiting
  return 60;
}
