/**
 * Formatting Utilities
 * 
 * Provides date/time and other formatting functions used across the application.
 * Requirements: 3.3
 */

/**
 * Format a date for display with short month, day, hour, and minute
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatShortDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date for full display
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatFullDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString();
}

/**
 * Format a date with date and time parts
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateWithTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatShortDateTime(date);
  }
}

/**
 * Format a duration in milliseconds to human readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours > 0) {
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
