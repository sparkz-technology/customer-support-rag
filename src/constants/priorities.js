/**
 * Ticket Priority Constants
 * 
 * Centralized priority configurations used across the backend.
 * Requirements: 8.4
 */

// Priority values
export const TICKET_PRIORITIES = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// SLA hours by priority
export const SLA_HOURS = {
  [TICKET_PRIORITIES.LOW]: 72,
  [TICKET_PRIORITIES.MEDIUM]: 48,
  [TICKET_PRIORITIES.HIGH]: 24,
  [TICKET_PRIORITIES.URGENT]: 8,
};

// Valid priorities array for validation
export const VALID_PRIORITIES = Object.values(TICKET_PRIORITIES);

// Default priority for new tickets
export const DEFAULT_PRIORITY = TICKET_PRIORITIES.MEDIUM;
