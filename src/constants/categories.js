/**
 * Ticket Category Constants
 * 
 * Centralized category configurations used across the backend.
 * Requirements: 8.4
 */

// Category values
export const TICKET_CATEGORIES = {
  ACCOUNT: 'account',
  BILLING: 'billing',
  TECHNICAL: 'technical',
  GAMEPLAY: 'gameplay',
  SECURITY: 'security',
  GENERAL: 'general',
};

// Valid categories array for validation
export const VALID_CATEGORIES = Object.values(TICKET_CATEGORIES);

// Default category for new tickets
export const DEFAULT_CATEGORY = TICKET_CATEGORIES.GENERAL;

// Category keywords for auto-detection
export const CATEGORY_KEYWORDS = {
  [TICKET_CATEGORIES.ACCOUNT]: ['account', 'login', 'password', 'profile', 'username', 'email', 'sign'],
  [TICKET_CATEGORIES.BILLING]: ['billing', 'payment', 'charge', 'refund', 'subscription', 'invoice', 'price'],
  [TICKET_CATEGORIES.TECHNICAL]: ['bug', 'error', 'crash', 'freeze', 'lag', 'performance', 'loading'],
  [TICKET_CATEGORIES.GAMEPLAY]: ['game', 'level', 'character', 'item', 'quest', 'mission', 'play'],
  [TICKET_CATEGORIES.SECURITY]: ['hack', 'stolen', 'unauthorized', 'suspicious', 'breach', 'compromised'],
  [TICKET_CATEGORIES.GENERAL]: ['help', 'question', 'support', 'other', 'general'],
};
