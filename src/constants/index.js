/**
 * Backend Constants Barrel Export
 * 
 * Re-exports all shared constants for easy importing.
 * Requirements: 8.4
 */

// Status constants
export {
  TICKET_STATUSES,
  VALID_STATUSES,
  isTerminalStatus,
} from './statuses.js';

// Priority constants
export {
  TICKET_PRIORITIES,
  SLA_HOURS,
  VALID_PRIORITIES,
  DEFAULT_PRIORITY,
} from './priorities.js';

// Category constants
export {
  TICKET_CATEGORIES,
  VALID_CATEGORIES,
  DEFAULT_CATEGORY,
  CATEGORY_KEYWORDS,
} from './categories.js';
