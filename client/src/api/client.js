import { useAuthStore } from '../store/authStore';
import { 
  ApiError, 
  getErrorMessage, 
  parseValidationErrors, 
  getRetryAfter 
} from '../shared/utils';

const API_BASE = '/api';

let refreshPromise = null;

// Re-export ApiError for backward compatibility
export { ApiError };

const refreshSession = async () => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    throw new ApiError('Session expired', 401, 'No refresh token', null, null);
  }

  if (!refreshPromise) {
    refreshPromise = fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new ApiError(
            getErrorMessage(data.error, res.status),
            res.status,
            data.error || null,
            null,
            null
          );
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiClient = async (method, path, body = null) => {
  const token = useAuthStore.getState().token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (networkError) {
    // Handle network errors (no connection, DNS failure, etc.)
    const userMessage = getErrorMessage(networkError);
    throw new ApiError(userMessage, 0, networkError.message, null, null);
  }

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && !path.startsWith('/auth/refresh') && !path.startsWith('/auth/send-otp') && !path.startsWith('/auth/verify-otp')) {
      try {
        const refreshed = await refreshSession();
        if (refreshed?.accessToken && refreshed?.refreshToken && refreshed?.user) {
          useAuthStore.getState().login(refreshed.accessToken, refreshed.refreshToken, refreshed.user);
        }

        const retryToken = useAuthStore.getState().token;
        const retryHeaders = { 'Content-Type': 'application/json' };
        if (retryToken) retryHeaders['Authorization'] = `Bearer ${retryToken}`;

        const retryRes = await fetch(API_BASE + path, {
          method,
          headers: retryHeaders,
          body: body ? JSON.stringify(body) : null,
        });
        const retryData = await retryRes.json().catch(() => ({}));
        if (retryRes.ok) {
          return retryData;
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
      }
    }
    
    // Parse validation errors if present
    const validationErrors = parseValidationErrors(data);
    
    // Get retry-after for rate limiting
    const retryAfter = res.status === 429 ? getRetryAfter(res) : null;
    
    // Get user-friendly error message
    const userMessage = data.error 
      ? getErrorMessage(data.error, res.status)
      : getErrorMessage(null, res.status);
    
    throw new ApiError(
      userMessage, 
      res.status, 
      data.error || null, 
      retryAfter, 
      validationErrors
    );
  }
  
  return data;
};

// Auth API
export const authApi = {
  sendOtp: (email) => apiClient('POST', '/auth/send-otp', { email }),
  verifyOtp: (email, otp) => apiClient('POST', '/auth/verify-otp', { email, otp }),
  refresh: (refreshToken) => apiClient('POST', '/auth/refresh', { refreshToken }),
  getMe: () => apiClient('GET', '/auth/me'),
  logout: () => apiClient('POST', '/auth/logout'),
};

// Tickets API (for users)
export const ticketsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    const queryStr = query.toString();
    return apiClient('GET', `/tickets${queryStr ? `?${queryStr}` : ''}`);
  },
  get: (id) => apiClient('GET', `/tickets/${id}`),
  create: (data) => apiClient('POST', '/tickets', data),
  sendMessage: (id, message) => apiClient('POST', `/tickets/${id}/messages`, { message }),
  updateStatus: (id, status) => apiClient('PATCH', `/tickets/${id}/status`, { status }),
};

// Dashboard API
export const dashboardApi = {
  getMetrics: () => apiClient('GET', '/dashboard/metrics'),
  getSlaAlerts: () => apiClient('GET', '/dashboard/sla-alerts'),
};

// Knowledge API
export const knowledgeApi = {
  search: (q) => apiClient('GET', `/knowledge/search?q=${encodeURIComponent(q)}`),
};

// Triage API
export const triageApi = {
  analyze: (description) => apiClient('POST', '/triage', { description }),
};

// Agent API (for customer care)
export const agentApi = {
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/agent/tickets${query ? `?${query}` : ''}`);
  },
  getTicket: (id) => apiClient('GET', `/agent/tickets/${id}`),
  replyTicket: (id, message, useAI = false) => apiClient('POST', `/agent/tickets/${id}/reply`, { message, useAI }),
  updateTicket: (id, data) => apiClient('PATCH', `/agent/tickets/${id}`, data),
  getAgents: () => apiClient('GET', '/agent/agents'),
  getStats: () => apiClient('GET', '/agent/stats'),
};

// Admin API
export const adminApi = {
  getStats: () => apiClient('GET', '/admin/stats'),
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/tickets${query ? `?${query}` : ''}`);
  },
  getAgents: () => apiClient('GET', '/admin/agents'),
  createAgent: (data) => apiClient('POST', '/admin/agents', data),
  updateAgent: (id, data) => apiClient('PATCH', `/admin/agents/${id}`, data),
  deleteAgent: (id) => apiClient('DELETE', `/admin/agents/${id}`),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/users${query ? `?${query}` : ''}`);
  },
  updateUser: (id, data) => apiClient('PATCH', `/admin/users/${id}`, data),
  getCustomers: () => apiClient('GET', '/admin/customers'),
  updateCustomer: (id, data) => apiClient('PATCH', `/admin/customers/${id}`, data),
  // Audit logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient('GET', `/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  getAuditLogActions: () => apiClient('GET', '/admin/audit-logs/actions'),
};
