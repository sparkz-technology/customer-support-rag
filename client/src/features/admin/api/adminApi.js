import { apiClient } from '../../../api/client';

/**
 * Admin API module
 * Contains all admin-related API calls
 */
export const adminApi = {
  // Dashboard stats
  getStats: () => apiClient('GET', '/admin/stats'),

  // Tickets management
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/tickets${query ? `?${query}` : ''}`);
  },

  // Agents management
  getAgents: () => apiClient('GET', '/admin/agents'),
  createAgent: (data) => apiClient('POST', '/admin/agents', data),
  updateAgent: (id, data) => apiClient('PATCH', `/admin/agents/${id}`, data),
  deleteAgent: (id) => apiClient('DELETE', `/admin/agents/${id}`),

  // Users management
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/users${query ? `?${query}` : ''}`);
  },
  updateUser: (id, data) => apiClient('PATCH', `/admin/users/${id}`, data),

  // Customers management
  getCustomers: () => apiClient('GET', '/admin/customers'),
  updateCustomer: (id, data) => apiClient('PATCH', `/admin/customers/${id}`, data),

  // Audit logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  getAuditLogActions: () => apiClient('GET', '/admin/audit-logs/actions'),
};
