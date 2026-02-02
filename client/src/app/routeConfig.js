/**
 * Route configuration - paths only, no JSX
 * This file contains the route path definitions
 */

export const routePaths = {
  // User routes
  dashboard: '/dashboard',
  chat: '/chat',
  tickets: '/tickets',
  ticketDetail: '/tickets/:id',
  
  // Agent routes
  agent: '/agent',
  agentTickets: '/agent/tickets',
  agentTicketDetail: '/agent/tickets/:id',
  
  // Admin routes
  admin: '/admin',
  adminTickets: '/admin/tickets',
  adminAgents: '/admin/agents',
  adminUsers: '/admin/users',
  adminAuditLog: '/admin/audit-log',
  
  // Public routes
  login: '/login',
};
