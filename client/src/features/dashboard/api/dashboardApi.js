import { apiClient } from '../../../api/client';

/**
 * Dashboard API client functions
 * Provides methods for fetching dashboard metrics and SLA alerts
 */
export const dashboardApi = {
  /**
   * Get dashboard metrics including ticket overview, SLA stats, and agent workload
   * @returns {Promise<Object>} Dashboard metrics data
   */
  getMetrics: () => apiClient('GET', '/dashboard/metrics'),

  /**
   * Get SLA alerts for tickets at risk or breached
   * @returns {Promise<Object>} SLA alerts data with atRisk and breached arrays
   */
  getSlaAlerts: () => apiClient('GET', '/dashboard/sla-alerts'),
};
