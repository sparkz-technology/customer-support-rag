import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/client';
import Layout from './shared/components/layout/Layout';

// Import route guards from app/guards
import {
  ProtectedRoute,
  AgentRoute,
  UserRoute,
  AdminRoute,
  RoleBasedRedirect,
} from './app/guards';

// Import lazy-loaded components
import {
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
} from './app/routes';

/**
 * Loading fallback component for Suspense boundaries
 */
function LoadingFallback() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f0f',
    }}>
      <Spin size="large" />
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!hasHydrated) return;
    if (token && !user) {
      authApi.getMe()
        .then((res) => {
          if (res?.user) {
            setSession(res.user);
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [hasHydrated, token, user, setSession, logout]);

  if (!hasHydrated) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public route - Login */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />} 
          />
          
          {/* Root redirect based on role */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } 
          />

          {/* User routes */}
          <Route
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Layout variant="user" />
                </UserRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Route>
          
          {/* Agent routes */}
          <Route
            element={
              <ProtectedRoute>
                <AgentRoute>
                  <Layout variant="agent" />
                </AgentRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/agent" element={<AgentDashboardPage />} />
            <Route path="/agent/tickets" element={<AgentTicketsPage />} />
            <Route path="/agent/tickets/:id" element={<AgentChatPage />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Layout variant="admin" />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/tickets/:id" element={<AgentChatPage backPath="/admin/tickets" />} />
          <Route path="/admin/agents" element={<AdminAgentsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit-log" element={<AdminAuditLogPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
