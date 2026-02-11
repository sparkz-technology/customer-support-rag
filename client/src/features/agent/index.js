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

export { useKnowledgeSearch, knowledgeQueryKeys } from './api/useKnowledgeSearch';
export { useA2ATasks, useA2ATask, a2aQueryKeys } from './api/useA2ATasks';

// Components
export { default as KnowledgeSearchPanel } from './components/KnowledgeSearchPanel';
export { default as A2ATaskDrawer } from './components/A2ATaskDrawer';
