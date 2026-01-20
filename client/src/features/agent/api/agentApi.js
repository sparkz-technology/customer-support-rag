import { apiClient } from '../../../api/client';

/**
 * Agent API module
 * Contains all API functions for agent-related operations
 */
export const agentApi = {
  /**
   * Get all tickets for agent view with optional filters
   */
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/agent/tickets${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single ticket by ID
   */
  getTicket: (id) => apiClient('GET', `/agent/tickets/${id}`),

  /**
   * Reply to a ticket (manual or AI-assisted)
   */
  replyTicket: (id, message, useAI = false) => 
    apiClient('POST', `/agent/tickets/${id}/reply`, { message, useAI }),

  /**
   * Update ticket properties (status, priority, category, assignment)
   */
  updateTicket: (id, data) => apiClient('PATCH', `/agent/tickets/${id}`, data),

  /**
   * Get list of available agents
   */
  getAgents: () => apiClient('GET', '/agent/agents'),

  /**
   * Get agent dashboard statistics
   */
  getStats: () => apiClient('GET', '/agent/stats'),
};

// Query keys for agent-related queries
export const agentQueryKeys = {
  tickets: (filter) => ['agent-tickets', filter || {}],
  ticket: (id) => ['agent-ticket', id],
  agents: ['agents'],
  stats: ['agent-stats'],
};
