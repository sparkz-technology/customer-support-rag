import { lazy } from 'react';

// Lazy-loaded feature pages
// User/Customer pages
export const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
export const TicketsPage = lazy(() => import('../features/tickets/pages/TicketsPage'));
export const TicketDetailPage = lazy(() => import('../features/tickets/pages/TicketDetailPage'));
export const AIChat = lazy(() => import('../pages/AIChat'));
export const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));

// Agent pages
export const AgentDashboardPage = lazy(() => import('../features/agent/pages/AgentDashboardPage'));
export const AgentTicketsPage = lazy(() => import('../features/agent/pages/AgentTicketsPage'));
export const AgentChatPage = lazy(() => import('../features/agent/pages/AgentChatPage'));

// Admin pages
export const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
export const AdminTicketsPage = lazy(() => import('../features/admin/pages/AdminTicketsPage'));
export const AdminAgentsPage = lazy(() => import('../features/admin/pages/AdminAgentsPage'));
export const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage'));
export const AdminAuditLogPage = lazy(() => import('../features/admin/pages/AdminAuditLogPage'));
