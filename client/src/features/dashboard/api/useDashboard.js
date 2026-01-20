import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboardApi';

/**
 * Query keys for dashboard-related queries
 */
export const dashboardQueryKeys = {
  metrics: ['dashboard'],
  slaAlerts: ['slaAlerts'],
};

/**
 * Hook to fetch dashboard metrics
 * Auto-refreshes every 30 seconds with 10 second stale time
 * @param {Object} options - React Query options
 * @returns {Object} React Query result with dashboard metrics
 */
export const useDashboardMetrics = (options = {}) => {
  return useQuery({
    queryKey: dashboardQueryKeys.metrics,
    queryFn: dashboardApi.getMetrics,
    refetchInterval: options.refetchInterval ?? 30000,
    staleTime: options.staleTime ?? 10000,
    ...options,
  });
};

/**
 * Hook to fetch SLA alerts (at-risk and breached tickets)
 * Auto-refreshes every 60 seconds with 30 second stale time
 * @param {Object} options - React Query options
 * @returns {Object} React Query result with SLA alerts
 */
export const useSlaAlerts = (options = {}) => {
  return useQuery({
    queryKey: dashboardQueryKeys.slaAlerts,
    queryFn: dashboardApi.getSlaAlerts,
    refetchInterval: options.refetchInterval ?? 60000,
    staleTime: options.staleTime ?? 30000,
    ...options,
  });
};
