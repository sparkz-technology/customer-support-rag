import { Navigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '../../store/authStore';

/**
 * Route guard that requires admin role.
 * Redirects to home if user is not an admin.
 */
export default function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!isAdmin(user)) return <Navigate to="/" replace />;
  return children;
}
