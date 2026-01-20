import { lazy } from 'react';

// Lazy-loaded feature pages
// User/Customer pages
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const TicketsPage = lazy(() => import('../features/tickets/pages/TicketsPage'));
const TicketDetailPage = lazy(() => import('../features/tickets/pages/TicketDetailPage'));
const AIChat = lazy(() => import('../pages/AIChat'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));

// Agent pages
const AgentDashboardPage = lazy(() => import('../features/agent/pages/AgentDashboardPage'));
const AgentTicketsPage = lazy(() => import('../features/agent/pages/AgentTicketsPage'));
const AgentChatPage = lazy(() => import('../features/agent/pages/AgentChatPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const AdminTicketsPage = lazy(() => import('../features/admin/pages/AdminTicketsPage'));
const AdminAgentsPage = lazy(() => import('../features/admin/pages/AdminAgentsPage'));
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage'));
const AdminAuditLogPage = lazy(() => import('../features/admin/pages/AdminAuditLogPage'));

/**
 * User/Customer routes - accessible by authenticated users
 */
export const userRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/chat', element: <AIChat /> },
  { path: '/tickets', element: <TicketsPage /> },
  { path: '/tickets/:id', element: <TicketDetailPage /> },
];

/**
 * Agent routes - accessible by users with agent role
 */
export const agentRoutes = [
  { path: '/agent', element: <AgentDashboardPage /> },
  { path: '/agent/tickets', element: <AgentTicketsPage /> },
  { path: '/agent/tickets/:id', element: <AgentChatPage /> },
];

/**
 * Admin routes - accessible by users with admin role
 */
export const adminRoutes = [
  { path: '/admin', element: <AdminDashboardPage /> },
  { path: '/admin/tickets', element: <AdminTicketsPage /> },
  { path: '/admin/agents', element: <AdminAgentsPage /> },
  { path: '/admin/users', element: <AdminUsersPage /> },
  { path: '/admin/audit-log', element: <AdminAuditLogPage /> },
];

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes = [
  { path: '/login', element: <LoginPage /> },
];

// Export lazy components for direct use if needed
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
};
