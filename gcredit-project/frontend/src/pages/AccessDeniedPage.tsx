/**
 * 403 Access Denied Page - Story 11.19
 *
 * Shown when an authenticated user tries to access a page
 * their role does not have permission for.
 */

import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role ?? 'Unknown';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Layout pageTitle="Access Denied">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <svg
          className="h-16 w-16 text-neutral-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
          />
        </svg>
        <h1 className="text-5xl md:text-6xl font-bold text-neutral-300 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Access Denied</h2>
        <p className="text-neutral-500 mb-8 max-w-md">
          You don't have permission to access this page. Your current role ({roleName}) does not
          have access to this resource.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors min-h-[44px]"
          >
            ← Go Back
          </button>
          <a
            href={`mailto:admin@company.com?subject=Access Request: ${window.location.pathname}`}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Contact Admin
          </a>
        </div>
      </div>
    </Layout>
  );
}
