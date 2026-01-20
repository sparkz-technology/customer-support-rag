import { Navigate } from 'react-router-dom';
import { useAuthStore, isAgent } from '../../store/authStore';

/**
 * Route guard that requires agent role.
 * Redirects to home if user is not an agent.
 */
export default function AgentRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!isAgent(user)) return <Navigate to="/" replace />;
  return children;
}
