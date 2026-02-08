import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout pageTitle="Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}
