// Application shell barrel export

// Route configuration
export {
  userRoutes,
  agentRoutes,
  adminRoutes,
  publicRoutes,
} from './routes';

// Route guards
export {
  ProtectedRoute,
  AgentRoute,
  AdminRoute,
  RoleBasedRedirect,
} from './guards';
