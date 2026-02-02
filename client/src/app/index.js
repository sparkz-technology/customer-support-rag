// Application shell barrel export

// Lazy-loaded page components
export {
  DashboardPage,
  TicketsPage,
  TicketDetailPage,
  AIChat,
  LoginPage,
  AgentDashboardPage,
  AgentTicketsPage,
  AgentChatPage,
  AdminDashboardPage,
  AdminTicketsPage,
  AdminAgentsPage,
  AdminUsersPage,
  AdminAuditLogPage,
} from './routes';

// Route path constants
export { routePaths } from './routeConfig';

// Route guards
export {
  ProtectedRoute,
  AgentRoute,
  AdminRoute,
  RoleBasedRedirect,
} from './guards';
