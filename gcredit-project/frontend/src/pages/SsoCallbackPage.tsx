/**
 * SSO Callback Page - Story 13.4: Login Page Dual Entry
 *
 * Handles the redirect back from Azure AD via the backend.
 * Flow:
 * 1. Backend redirects to /sso/callback?success=true (cookies already set)
 * 2. This page shows "Signing you in..." loading state
 * 3. Calls authStore.loginViaSSO() to validate cookies and fetch user profile
 * 4. On success → navigate to '/' (dashboard)
 * 5. On failure → navigate to '/login?error=sso_failed'
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const SSO_TIMEOUT_MS = 10_000;

export function SsoCallbackPage() {
  const navigate = useNavigate();
  const loginViaSSO = useAuthStore((s) => s.loginViaSSO);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const timeoutId = setTimeout(() => {
      navigate('/login?error=sso_failed', { replace: true });
    }, SSO_TIMEOUT_MS);

    loginViaSSO()
      .then((success) => {
        clearTimeout(timeoutId);
        if (success) {
          navigate('/', { replace: true });
        } else {
          navigate('/login?error=sso_failed', { replace: true });
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        navigate('/login?error=sso_failed', { replace: true });
      });

    return () => clearTimeout(timeoutId);
  }, [loginViaSSO, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg
            className="animate-spin h-12 w-12 text-brand-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Signing you in…</h1>
        <p className="text-neutral-500 mt-2">Please wait while we verify your account.</p>
      </div>
    </main>
  );
}

export default SsoCallbackPage;
