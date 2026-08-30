import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { FiMessageCircle } from 'react-icons/fi';
import './index.css';

// Lazy load route pages for ultra-fast initial bundle loading
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));

function LoadingScreen({ text = 'KIKU' }: { text?: string }) {
  return (
    <div className="loading-screen" aria-live="polite">
      <div className="loading-logo">
        <FiMessageCircle size={28} />
      </div>
      <h2>{text}</h2>
      <div className="loading-bar" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return <LoadingScreen text="Admin Portal" />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route
                path="/auth"
                element={
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/join/:token"
                element={
                  <ProtectedRoute>
                    <JoinPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />

              {/* Admin Routes */}
              <Route
                path="/admin/login"
                element={
                  <AdminAuthProvider>
                    <AdminLogin />
                  </AdminAuthProvider>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminAuthProvider>
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  </AdminAuthProvider>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
