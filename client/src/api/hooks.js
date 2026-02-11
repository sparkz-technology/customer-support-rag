import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, agentApi, adminApi, a2aApi, knowledgeApi } from './client';
import toast from 'react-hot-toast';
import { getToastErrorMessage } from '../shared/utils/errorUtils';

// Dashboard Hooks - Re-exported from feature module for backward compatibility
export { useDashboardMetrics, useSlaAlerts, dashboardQueryKeys } from '../features/dashboard/api';

// Import dashboard query keys for use in invalidation
import { dashboardQueryKeys } from '../features/dashboard/api';

// Query Keys
export const queryKeys = {
  tickets: (filter) => ['tickets', filter || {}],
  ticket: (id) => ['ticket', id],
  agentTickets: (filter) => ['agent-tickets', filter || {}],
  agentTicket: (id) => ['agent-ticket', id],
  adminTickets: (filter) => ['admin-tickets', filter || {}],
  dashboard: dashboardQueryKeys.metrics,
  slaAlerts: dashboardQueryKeys.slaAlerts,
  a2aTask: (id) => ['a2a-task', id],
  knowledgeSearch: (q) => ['knowledge-search', q],
};

// Tickets Hooks
export const useTickets = (filter = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.tickets(filter),
    queryFn: () => ticketsApi.list(filter),
    staleTime: 5000,
    refetchInterval: options.refetchInterval ?? 30000, // Auto-refresh every 30 seconds by default
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
};

export const useTicket = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.ticket(id),
    queryFn: () => ticketsApi.get(id),
    enabled: !!id,
    staleTime: 2000,
    refetchInterval: options.refetchInterval ?? 10000, // Auto-refresh every 10 seconds by default
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Ticket created!');
      return data;
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};

export const useSendMessage = (ticketId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (message) => ticketsApi.sendMessage(ticketId, message),
    onMutate: async (message) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.ticket(ticketId) });
      
      // Snapshot previous value
      const previousTicket = queryClient.getQueryData(queryKeys.ticket(ticketId));
      
      // Optimistically update
      if (previousTicket?.ticket) {
        queryClient.setQueryData(queryKeys.ticket(ticketId), {
          ...previousTicket,
          ticket: {
            ...previousTicket.ticket,
            conversation: [
              ...previousTicket.ticket.conversation,
              { role: 'customer', content: message, timestamp: new Date().toISOString() },
            ],
          },
        });
      }
      
      return { previousTicket };
    },
    onSuccess: () => {
      // Update with actual response
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousTicket) {
        queryClient.setQueryData(queryKeys.ticket(ticketId), context.previousTicket);
      }
      toast.error(getToastErrorMessage(err));
    },
  });
};

export const useUpdateTicketStatus = (ticketId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ status, remark }) => ticketsApi.updateStatus(ticketId, status, remark),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success(`Ticket ${status}`);
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};


// Agent Tickets Hooks
export const useAgentTickets = (filter = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.agentTickets(filter),
    queryFn: () => agentApi.getTickets(filter),
    staleTime: 5000,
    refetchInterval: options.refetchInterval ?? 30000, // Auto-refresh every 30 seconds by default
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
};

export const useAgentTicket = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.agentTicket(id),
    queryFn: () => agentApi.getTicket(id),
    enabled: !!id,
    staleTime: 2000,
    refetchInterval: options.refetchInterval ?? 10000, // Auto-refresh every 10 seconds by default
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
};

// Admin Tickets Hooks
export const useAdminTickets = (filter = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.adminTickets(filter),
    queryFn: () => adminApi.getTickets(filter),
    staleTime: 5000,
    refetchInterval: options.refetchInterval ?? 30000, // Auto-refresh every 30 seconds by default
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
};

// Reassign Ticket Mutation
export const useReassignTicket = (ticketId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload) => {
      if (typeof payload === 'string') {
        return agentApi.updateTicket(ticketId, { assignedTo: payload });
      }
      return agentApi.updateTicket(ticketId, { assignedTo: payload.agentId, remark: payload.remark });
    },
    onSuccess: (data) => {
      // Invalidate all ticket-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agentTicket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      
      const newAgentName = data?.ticket?.assignedTo || 'new agent';
      toast.success(`Ticket reassigned to ${newAgentName}`);
    },
    onError: (err) => {
      if (err.message?.includes('capacity')) {
        toast.error('Reassignment failed: Agent has reached maximum capacity');
      } else {
        toast.error(getToastErrorMessage(err));
      }
    },
  });
};

// Bulk Update Tickets Mutation
export const useBulkUpdateTickets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketIds, updates }) => {
      // Update tickets one by one (backend may not support bulk)
      const promises = ticketIds.map(id => 
        agentApi.updateTicket(id, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate all ticket-related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Tickets updated successfully');
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};

// ── A2A Hooks ──────────────────────────────────────────────

/**
 * Poll a single A2A task by ID.
 * Polls every 2 seconds while the task state is "working" or "submitted".
 */
export const useA2ATask = (taskId) => {
  return useQuery({
    queryKey: queryKeys.a2aTask(taskId),
    queryFn: () => a2aApi.getTask(taskId, 10),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const state = query?.state?.data?.status?.state;
      return state === 'working' || state === 'submitted' ? 2000 : false;
    },
    staleTime: 1000,
    retry: 2,
  });
};

/**
 * Mutation to apply AI-proposed updates to a ticket via A2A.
 */
export const useApplyAIUpdates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, updates, remark }) =>
      a2aApi.applyTicketUpdates(ticketId, updates, remark),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agentTicket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('AI updates applied');
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};

// ── Knowledge Base Hook ────────────────────────────────────

/**
 * Search the Pinecone knowledge base.
 * Only fires when query is non-empty.
 */
export const useKnowledgeSearch = (query) => {
  return useQuery({
    queryKey: queryKeys.knowledgeSearch(query),
    queryFn: () => knowledgeApi.search(query),
    enabled: !!query?.trim(),
    staleTime: 30_000,
    retry: 1,
  });
};
