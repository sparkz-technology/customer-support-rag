/**
 * Ticket Priority Constants
 * 
 * Centralized priority configurations used across the application.
 * Requirements: 8.1, 8.3
 */

// Priority values
export const TICKET_PRIORITIES = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Priority configuration with colors
export const PRIORITY_CONFIG = {
  [TICKET_PRIORITIES.URGENT]: { 
    color: 'red', 
    label: 'Urgent',
    slaHours: 8
  },
  [TICKET_PRIORITIES.HIGH]: { 
    color: 'orange', 
    label: 'High',
    slaHours: 24
  },
  [TICKET_PRIORITIES.MEDIUM]: { 
    color: 'gold', 
    label: 'Medium',
    slaHours: 48
  },
  [TICKET_PRIORITIES.LOW]: { 
    color: 'green', 
    label: 'Low',
    slaHours: 72
  },
};

// Priority options for filter dropdowns
export const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: TICKET_PRIORITIES.URGENT, label: 'Urgent' },
  { value: TICKET_PRIORITIES.HIGH, label: 'High' },
  { value: TICKET_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: TICKET_PRIORITIES.LOW, label: 'Low' },
];

// Priority options for form selects (without "All" option)
export const PRIORITY_FORM_OPTIONS = [
  { value: TICKET_PRIORITIES.LOW, label: 'Low' },
  { value: TICKET_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: TICKET_PRIORITIES.HIGH, label: 'High' },
  { value: TICKET_PRIORITIES.URGENT, label: 'Urgent' },
];

// Valid priorities array for validation
export const VALID_PRIORITIES = Object.values(TICKET_PRIORITIES);
