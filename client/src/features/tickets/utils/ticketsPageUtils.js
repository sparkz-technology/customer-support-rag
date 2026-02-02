/**
 * Tickets Page Utility Functions
 * 
 * Utility functions for the tickets page.
 * Separated from components to maintain fast-refresh compatibility.
 */

/**
 * Formats the first response time for display
 * @param {Date|string|null} firstResponseAt - The first response timestamp
 * @param {string} status - The ticket status
 * @returns {string} Formatted display string
 */
export const formatFirstResponseTime = (firstResponseAt, status) => {
  if (firstResponseAt) {
    const date = new Date(firstResponseAt);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Show "Awaiting Response" only for non-resolved/closed tickets
  if (status !== 'resolved' && status !== 'closed') {
    return 'Awaiting Response';
  }
  
  return '-';
};
