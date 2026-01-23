import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">🎓 G-Credit</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">Internal Digital Credentialing System</p>
          <p className="text-sm text-slate-500">Sprint 0 - Infrastructure Setup in Progress</p>
          <Button className="w-full">Coming Soon</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
