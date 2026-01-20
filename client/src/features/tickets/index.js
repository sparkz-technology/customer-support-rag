// Tickets feature barrel export

// Pages
export { default as TicketsPage } from './pages/TicketsPage';
export { default as TicketDetailPage } from './pages/TicketDetailPage';
export { formatFirstResponseTime } from './pages/TicketsPage';

// Components
export { 
  SLADisplay, 
  formatSLATime, 
  getSLAStatus 
} from './components/SLADisplay';
export { 
  TicketBadges, 
  ManualReviewBadge, 
  ReopenBadge, 
  FirstResponseBadge 
} from './components/TicketBadges';
export { 
  AgentSelect, 
  filterAgentsByCapacity, 
  sortAgentsByCategory, 
  processAgentsForDropdown 
} from './components/AgentSelect';

// API and Hooks
export { ticketsApi } from './api/ticketsApi';
export {
  ticketQueryKeys,
  useTickets,
  useTicket,
  useCreateTicket,
  useSendMessage,
  useUpdateTicketStatus,
} from './api/useTickets';
