import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout pageTitle="Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Page Not Found</h2>
        <p className="text-neutral-500 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}
