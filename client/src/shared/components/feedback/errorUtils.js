/**
 * Error Display Utility Functions
 * 
 * Utility functions for formatting and processing error messages.
 * Separated from components to maintain fast-refresh compatibility.
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { getErrorMessage, formatRetryTime } from '../../utils';

/**
 * Toast-friendly error message formatter
 * Returns a string suitable for toast notifications
 * 
 * @param {Error|ApiError|string} error - The error to format
 * @returns {string} Formatted error message
 */
export function getToastErrorMessage(error) {
  const message = getErrorMessage(error);
  
  // Add rate limit info if applicable
  if (error?.isRateLimited && error?.retryAfter) {
    return `${message} (retry in ${formatRetryTime(error.retryAfter)})`;
  }
  
  return message;
}
