import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TimelineView } from '@/components/TimelineView/TimelineView';
import { VerifyBadgePage } from '@/pages/VerifyBadgePage';
import BadgeEmbedPage from '@/pages/BadgeEmbedPage';
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import BadgeManagementPage from '@/pages/admin/BadgeManagementPage';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
