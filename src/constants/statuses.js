/**
 * Ticket Status Constants
 * 
 * Centralized status configurations used across the backend.
 * Requirements: 8.4
 */

// Status values
export const TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Valid statuses array for validation
export const VALID_STATUSES = Object.values(TICKET_STATUSES);

/**
 * Check if a status is terminal (resolved or closed)
 * @param {string} status - The status to check
 * @returns {boolean} True if the status is terminal
 */
export const isTerminalStatus = (status) => {
  return status === TICKET_STATUSES.RESOLVED || status === TICKET_STATUSES.CLOSED;
};
