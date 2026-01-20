import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';

/**
 * Hook for fetching admin dashboard stats
 */
export const useAdminStats = (options = {}) => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    ...options,
  });
};

/**
 * Hook for fetching admin tickets with filters
 */
export const useAdminTickets = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['admin-tickets', params],
    queryFn: () => adminApi.getTickets(params),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    ...options,
  });
};

/**
 * Hook for fetching admin agents
 */
export const useAdminAgents = (options = {}) => {
  return useQuery({
    queryKey: ['admin-agents'],
    queryFn: adminApi.getAgents,
    ...options,
  });
};

/**
 * Hook for creating an agent
 */
export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
    },
  });
};

/**
 * Hook for updating an agent
 */
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
    },
  });
};

/**
 * Hook for deleting an agent
 */
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
    },
  });
};

/**
 * Hook for fetching admin users with filters
 */
export const useAdminUsers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminApi.getUsers(params),
    ...options,
  });
};

/**
 * Hook for updating a user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

/**
 * Hook for fetching audit logs with filters
 */
export const useAdminAuditLogs = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
    ...options,
  });
};
