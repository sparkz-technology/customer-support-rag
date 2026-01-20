/**
 * Ticket Category Constants
 * 
 * Centralized category configurations used across the application.
 * Requirements: 8.1, 8.3
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

// Category configuration
export const CATEGORY_CONFIG = {
  [TICKET_CATEGORIES.ACCOUNT]: { label: 'Account' },
  [TICKET_CATEGORIES.BILLING]: { label: 'Billing' },
  [TICKET_CATEGORIES.TECHNICAL]: { label: 'Technical' },
  [TICKET_CATEGORIES.GAMEPLAY]: { label: 'Gameplay' },
  [TICKET_CATEGORIES.SECURITY]: { label: 'Security' },
  [TICKET_CATEGORIES.GENERAL]: { label: 'General' },
};

// Category options for filter dropdowns
export const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: TICKET_CATEGORIES.ACCOUNT, label: 'Account' },
  { value: TICKET_CATEGORIES.BILLING, label: 'Billing' },
  { value: TICKET_CATEGORIES.TECHNICAL, label: 'Technical' },
  { value: TICKET_CATEGORIES.GAMEPLAY, label: 'Gameplay' },
  { value: TICKET_CATEGORIES.SECURITY, label: 'Security' },
  { value: TICKET_CATEGORIES.GENERAL, label: 'General' },
];

// Category options for form selects (without "All" option)
export const CATEGORY_FORM_OPTIONS = [
  { value: TICKET_CATEGORIES.ACCOUNT, label: 'Account' },
  { value: TICKET_CATEGORIES.BILLING, label: 'Billing' },
  { value: TICKET_CATEGORIES.TECHNICAL, label: 'Technical' },
  { value: TICKET_CATEGORIES.GAMEPLAY, label: 'Gameplay' },
  { value: TICKET_CATEGORIES.SECURITY, label: 'Security' },
  { value: TICKET_CATEGORIES.GENERAL, label: 'General' },
];

// Valid categories array for validation
export const VALID_CATEGORIES = Object.values(TICKET_CATEGORIES);
