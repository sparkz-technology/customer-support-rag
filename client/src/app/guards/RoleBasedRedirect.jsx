import { Navigate } from 'react-router-dom';
import { useAuthStore, isAgent, isAdmin } from '../../store/authStore';

/**
 * Redirects user to appropriate dashboard based on their role.
 * - Admin -> /admin
 * - Agent -> /agent
 * - User -> /dashboard
 */
export default function RoleBasedRedirect() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;
  if (token && !user) return null;
  if (isAdmin(user)) return <Navigate to="/admin" replace />;
  if (isAgent(user)) return <Navigate to="/agent" replace />;
  return <Navigate to="/dashboard" replace />;
}
