/**
 * SLA Display Utility Functions
 * 
 * Utility functions for SLA time formatting and status calculation.
 * Separated from components to maintain fast-refresh compatibility.
 */

/**
 * Formats the SLA time remaining or overdue duration
 * @param {Date|string} slaDueAt - The SLA due date
 * @returns {string} Human-readable time string
 */
export const formatSLATime = (slaDueAt) => {
  if (!slaDueAt) return '';
  
  const now = new Date();
  const dueDate = new Date(slaDueAt);
  const diffMs = dueDate - now;
  const absDiffMs = Math.abs(diffMs);
  
  const minutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  
  let timeStr;
  if (days > 0) {
    timeStr = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    timeStr = `${hours}h ${minutes % 60}m`;
  } else {
    timeStr = `${minutes}m`;
  }
  
  return diffMs < 0 ? `${timeStr} overdue` : `${timeStr} remaining`;
};

/**
 * Determines the SLA status based on due date and breach flag
 * @param {Date|string} slaDueAt - The SLA due date
 * @param {boolean} slaBreached - Whether SLA has been breached
 * @returns {'on-track'|'at-risk'|'breached'} SLA status
 */
export const getSLAStatus = (slaDueAt, slaBreached) => {
  if (slaBreached) return 'breached';
  
  if (!slaDueAt) return 'on-track';
  
  const now = new Date();
  const dueDate = new Date(slaDueAt);
  const diffMs = dueDate - now;
  const fourHoursMs = 4 * 60 * 60 * 1000;
  
  if (diffMs <= 0) return 'breached';
  if (diffMs <= fourHoursMs) return 'at-risk';
  return 'on-track';
};
