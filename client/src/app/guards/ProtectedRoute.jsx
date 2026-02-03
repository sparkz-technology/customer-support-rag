import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Route guard that requires authentication.
 * Redirects to login if user is not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
