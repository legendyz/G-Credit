import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Lazy-load all page components (TD-013: route-based code splitting)
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const TimelineView = lazy(() =>
  import('@/components/TimelineView/TimelineView').then((m) => ({
    default: m.TimelineView,
  }))
);
const VerifyBadgePage = lazy(() =>
  import('@/pages/VerifyBadgePage').then((m) => ({
    default: m.VerifyBadgePage,
  }))
);
const BadgeEmbedPage = lazy(() => import('@/pages/BadgeEmbedPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/AdminAnalyticsPage'));
const BadgeManagementPage = lazy(() => import('@/pages/admin/BadgeManagementPage'));
const AdminUserManagementPage = lazy(() => import('@/pages/AdminUserManagementPage'));
const BulkIssuancePage = lazy(() => import('@/pages/BulkIssuancePage'));
const BulkPreviewPage = lazy(() => import('@/components/BulkIssuance/BulkPreviewPage'));
const IssueBadgePage = lazy(() =>
  import('@/pages/IssueBadgePage').then((m) => ({ default: m.IssueBadgePage }))
);
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * Loading fallback for lazy-loaded routes (TD-013)
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify/:verificationId" element={<VerifyBadgePage />} />
            <Route path="/badges/:badgeId/embed" element={<BadgeEmbedPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout pageTitle="Dashboard">
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Layout pageTitle="My Badge Wallet">
                    <TimelineView />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                  <Layout pageTitle="Analytics Dashboard">
                    <AdminAnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/badges"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                  <Layout pageTitle="Badge Management">
                    <BadgeManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/badges/issue"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                  <Layout pageTitle="Issue Badge">
                    <IssueBadgePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bulk-issuance"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                  <Layout pageTitle="Bulk Badge Issuance">
                    <BulkIssuancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bulk-issuance/preview/:sessionId"
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                  <Layout pageTitle="Bulk Issuance Preview">
                    <BulkPreviewPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <Layout pageTitle="User Management">
                    <AdminUserManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all: 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
