// Admin feature barrel export

// Pages
export { default as AdminDashboardPage } from './pages/AdminDashboardPage';
export { default as AdminTicketsPage } from './pages/AdminTicketsPage';
export { default as AdminAgentsPage } from './pages/AdminAgentsPage';
export { default as AdminUsersPage } from './pages/AdminUsersPage';
export { default as AdminAuditLogPage } from './pages/AdminAuditLogPage';

// API
export { adminApi } from './api/adminApi';
export { 
  useAdminStats, 
  useAdminTickets, 
  useAdminAgents, 
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useAdminUsers, 
  useUpdateUser,
  useAdminAuditLogs 
} from './api/useAdmin';
