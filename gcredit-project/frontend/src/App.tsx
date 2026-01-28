import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimelineView } from '@/components/TimelineView/TimelineView';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <TimelineView />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
