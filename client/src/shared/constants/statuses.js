/**
 * Ticket Status Constants
 * 
 * Centralized status configurations used across the application.
 * Requirements: 8.1, 8.3
 */

// Status values
export const TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Status configuration with colors and icons
export const STATUS_CONFIG = {
  [TICKET_STATUSES.OPEN]: { 
    color: 'orange', 
    label: 'Open',
    iconType: 'ClockCircleOutlined'
  },
  [TICKET_STATUSES.IN_PROGRESS]: { 
    color: 'blue', 
    label: 'In Progress',
    iconType: 'ExclamationCircleOutlined'
  },
  [TICKET_STATUSES.RESOLVED]: { 
    color: 'green', 
    label: 'Resolved',
    iconType: 'CheckCircleOutlined'
  },
  [TICKET_STATUSES.CLOSED]: { 
    color: 'default', 
    label: 'Closed',
    iconType: 'CheckCircleOutlined'
  },
};

// Status options for filter dropdowns
export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: TICKET_STATUSES.OPEN, label: 'Open' },
  { value: TICKET_STATUSES.IN_PROGRESS, label: 'In Progress' },
  { value: TICKET_STATUSES.RESOLVED, label: 'Resolved' },
  { value: TICKET_STATUSES.CLOSED, label: 'Closed' },
];

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
