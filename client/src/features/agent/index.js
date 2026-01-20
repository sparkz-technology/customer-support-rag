// Agent feature barrel export

// Pages
export { default as AgentDashboardPage } from './pages/AgentDashboardPage';
export { default as AgentTicketsPage } from './pages/AgentTicketsPage';
export { default as AgentChatPage } from './pages/AgentChatPage';

// API
export { agentApi, agentQueryKeys } from './api/agentApi';

// Hooks
export {
  useAgentTickets,
  useAgentTicket,
  useAgentStats,
  useAgents,
  useAgentReply,
  useAgentUpdateTicket,
  useReassignTicket,
  useBulkUpdateTickets,
} from './api/useAgent';
