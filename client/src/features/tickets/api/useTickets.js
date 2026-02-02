import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ticketsApi } from './ticketsApi';
import { getToastErrorMessage } from '../../../shared/utils/errorUtils';

/**
 * Query keys for tickets
 */
export const ticketQueryKeys = {
  tickets: (filter) => ['tickets', filter || {}],
  ticket: (id) => ['ticket', id],
};

/**
 * Hook to fetch list of tickets with optional filters
 * @param {Object} filter - Filter parameters
 * @param {Object} options - Additional options
 * @returns {UseQueryResult}
 */
export const useTickets = (filter = {}, options = {}) => {
  return useQuery({
    queryKey: ticketQueryKeys.tickets(filter),
    queryFn: () => ticketsApi.list(filter),
    staleTime: 5000,
    refetchInterval: options.refetchInterval ?? 30000,
    refetchIntervalInBackground: false,
  });
};

/**
 * Hook to fetch a single ticket by ID
 * @param {string} id - Ticket ID
 * @param {Object} options - Additional options
 * @returns {UseQueryResult}
 */
export const useTicket = (id, options = {}) => {
  return useQuery({
    queryKey: ticketQueryKeys.ticket(id),
    queryFn: () => ticketsApi.get(id),
    enabled: !!id,
    staleTime: 2000,
    refetchInterval: options.refetchInterval ?? 10000,
    refetchIntervalInBackground: false,
  });
};

/**
 * Hook to create a new ticket
 * @returns {UseMutationResult}
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Ticket created!');
      return data;
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};

/**
 * Hook to send a message on a ticket
 * @param {string} ticketId - Ticket ID
 * @returns {UseMutationResult}
 */
export const useSendMessage = (ticketId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (message) => ticketsApi.sendMessage(ticketId, message),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: ticketQueryKeys.ticket(ticketId) });
      
      const previousTicket = queryClient.getQueryData(ticketQueryKeys.ticket(ticketId));
      
      if (previousTicket?.ticket) {
        queryClient.setQueryData(ticketQueryKeys.ticket(ticketId), {
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
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err, _, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketQueryKeys.ticket(ticketId), context.previousTicket);
      }
      toast.error(getToastErrorMessage(err));
    },
  });
};

/**
 * Hook to update ticket status
 * @param {string} ticketId - Ticket ID
 * @returns {UseMutationResult}
 */
export const useUpdateTicketStatus = (ticketId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (status) => ticketsApi.updateStatus(ticketId, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Ticket ${status}`);
    },
    onError: (err) => {
      toast.error(getToastErrorMessage(err));
    },
  });
};
