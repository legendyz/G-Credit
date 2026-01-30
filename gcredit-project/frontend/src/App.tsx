import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TimelineView } from '@/components/TimelineView/TimelineView';
import { VerifyBadgePage } from '@/pages/VerifyBadgePage';
import BadgeEmbedPage from '@/pages/BadgeEmbedPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-7xl mx-auto">
                  <TimelineView />
                </div>
              </div>
            } 
          />
          <Route path="/verify/:verificationId" element={<VerifyBadgePage />} />
          <Route path="/badges/:badgeId/embed" element={<BadgeEmbedPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
