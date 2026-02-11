import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi, agentQueryKeys } from './agentApi';
import toast from 'react-hot-toast';
import { getToastErrorMessage } from '../../../shared/utils/errorUtils';

/**
 * Hook to fetch agent tickets with optional filters
 */
export const useAgentTickets = (filter = {}, options = {}) => {
  return useQuery({
    queryKey: agentQueryKeys.tickets(filter),
    queryFn: () => agentApi.getTickets(filter),
    staleTime: 5000,
    refetchInterval: options.refetchInterval ?? 30000,
    refetchIntervalInBackground: false,
  });
};

/**
 * Hook to fetch a single ticket by ID
 */
export const useAgentTicket = (id, options = {}) => {
  return useQuery({
    queryKey: agentQueryKeys.ticket(id),
    queryFn: () => agentApi.getTicket(id),
    enabled: !!id,
    staleTime: 2000,
    refetchInterval: options.refetchInterval ?? 10000,
    refetchIntervalInBackground: false,
  });
};

/**
 * Hook to fetch agent statistics
 */
export const useAgentStats = (options = {}) => {
  return useQuery({
    queryKey: agentQueryKeys.stats,
    queryFn: agentApi.getStats,
    refetchInterval: options.refetchInterval ?? 30000,
  });
};

/**
 * Hook to fetch available agents
 */
export const useAgents = () => {
  return useQuery({
    queryKey: agentQueryKeys.agents,
    queryFn: agentApi.getAgents,
    staleTime: 60000,
  });
};

/**
 * Hook to reply to a ticket
 */
export const useAgentReply = (ticketId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, useAI }) => agentApi.replyTicket(ticketId, message, useAI),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.ticket(ticketId) });
      toast.success('Reply sent');
    },
    onError: (err) => {
      console.error('Reply mutation error:', err);
      toast.error(getToastErrorMessage(err));
    },
    onSettled: () => {
      // Ensure loading state is reset regardless of success/error
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.ticket(ticketId) });
    },
  });
};

/**
 * Hook to update ticket properties
 */
export const useAgentUpdateTicket = (ticketId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => agentApi.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      toast.success('Ticket updated');
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};

/**
 * Hook to reassign a ticket to another agent
 */
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
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      
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

/**
 * Hook to bulk update multiple tickets
 */
export const useBulkUpdateTickets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketIds, updates }) => {
      const promises = ticketIds.map(id => agentApi.updateTicket(id, updates));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Tickets updated successfully');
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};
