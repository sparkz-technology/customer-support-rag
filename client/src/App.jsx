import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/authStore';
import Layout from './shared/components/layout/Layout';

// Import route guards from app/guards
import {
  ProtectedRoute,
  AgentRoute,
  AdminRoute,
  RoleBasedRedirect,
} from './app/guards';

// Import route configurations
import {
  userRoutes,
  agentRoutes,
  adminRoutes,
} from './app/routes';

// Import LoginPage directly for the public route (lazy loaded from routes)
import { LoginPage } from './app/routes';

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
                <Layout variant="user" />
              </ProtectedRoute>
            }
          >
            {userRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
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
            {agentRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
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
            {adminRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
