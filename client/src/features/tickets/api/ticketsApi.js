import { apiClient } from '../../../api/client';

/**
 * Tickets API module
 * Contains all API functions for ticket operations
 */
export const ticketsApi = {
  /**
   * List tickets with optional filters
   * @param {Object} params - Filter parameters
   * @param {string} [params.status] - Filter by status
   * @param {string} [params.category] - Filter by category
   * @returns {Promise<{tickets: Array}>}
   */
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    const queryStr = query.toString();
    return apiClient('GET', `/tickets${queryStr ? `?${queryStr}` : ''}`);
  },

  /**
   * Get a single ticket by ID
   * @param {string} id - Ticket ID
   * @returns {Promise<{ticket: Object}>}
   */
  get: (id) => apiClient('GET', `/tickets/${id}`),

  /**
   * Create a new ticket
   * @param {Object} data - Ticket data
   * @param {string} data.subject - Ticket subject
   * @param {string} data.description - Ticket description
   * @param {string} [data.priority] - Ticket priority
   * @returns {Promise<{ticket: Object}>}
   */
  create: (data) => apiClient('POST', '/tickets', data),

  /**
   * Send a message on a ticket
   * @param {string} id - Ticket ID
   * @param {string} message - Message content
   * @returns {Promise<Object>}
   */
  sendMessage: (id, message) => apiClient('POST', `/tickets/${id}/messages`, { message }),

  /**
   * Update ticket status
   * @param {string} id - Ticket ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  updateStatus: (id, status) => apiClient('PATCH', `/tickets/${id}/status`, { status }),
};

export default ticketsApi;
