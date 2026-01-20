/**
 * Shared Constants Barrel Export
 * 
 * Re-exports all shared constants for easy importing.
 * Requirements: 8.1, 8.3
 */

// Status constants
export {
  TICKET_STATUSES,
  STATUS_CONFIG,
  STATUS_OPTIONS,
  VALID_STATUSES,
  isTerminalStatus,
} from './statuses';

// Priority constants
export {
  TICKET_PRIORITIES,
  PRIORITY_CONFIG,
  PRIORITY_OPTIONS,
  PRIORITY_FORM_OPTIONS,
  VALID_PRIORITIES,
} from './priorities';

// Category constants
export {
  TICKET_CATEGORIES,
  CATEGORY_CONFIG,
  CATEGORY_OPTIONS,
  CATEGORY_FORM_OPTIONS,
  VALID_CATEGORIES,
} from './categories';
