import { Navigate } from 'react-router-dom';
import { useAuthStore, isUser } from '../../store/authStore';

/**
 * Route guard that requires a plain user role.
 * Redirects to role-based dashboard if not a user.
 */
export default function UserRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!isUser(user)) return <Navigate to="/" replace />;
  return children;
}
