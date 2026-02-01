import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TimelineView } from '@/components/TimelineView/TimelineView';
import { VerifyBadgePage } from '@/pages/VerifyBadgePage';
import BadgeEmbedPage from '@/pages/BadgeEmbedPage';
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import BadgeManagementPage from '@/pages/admin/BadgeManagementPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';

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
                <div className="min-h-screen bg-slate-50">
                  <Navbar />
                  <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                      <TimelineView />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                <div className="min-h-screen bg-slate-50">
                  <Navbar />
                  <AdminAnalyticsPage />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/badges" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
                <div className="min-h-screen bg-slate-50">
                  <Navbar />
                  <BadgeManagementPage />
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
