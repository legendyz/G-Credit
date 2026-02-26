/**
 * Login Page - Story 0.2a / Story 13.4: Dual Entry (SSO + Email/Password)
 * Story 8.3: WCAG 2.1 AA Accessibility
 *
 * Features:
 * - "Sign in with Microsoft" SSO button (primary CTA)
 * - Email/password form with shadcn/ui components (P2-6 fix)
 * - SSO error display from URL params
 * - Redirect on success, sonner toasts, full accessibility
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { MicrosoftSsoButton } from '../components/auth/MicrosoftSsoButton';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

/** SSO error codes → user-friendly messages */
const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_cancelled: 'Sign-in was cancelled. Please try again.',
  sso_failed: 'Microsoft sign-in failed. Please try again or use email login.',
  account_disabled: 'Your account has been deactivated. Contact your administrator.',
  sso_invalid_token: 'Authentication error. Please try again.',
  sso_no_account: 'No account found. Contact your administrator.',
};

/** Redirect reason codes → informational messages (Story 13.5 + 13.6) */
const REASON_MESSAGES: Record<string, string> = {
  session_expired: 'Your session has expired. Please log in again.',
  idle_timeout: 'Session expired due to inactivity. Please log in again.',
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  // SSO error from URL params — capture once on mount, then clear URL
  const [ssoError] = useState(() => {
    const errorCode = searchParams.get('error');
    return errorCode
      ? SSO_ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.'
      : null;
  });

  // Redirect reason from URL params (session_expired, idle_timeout) — Story 13.5/13.6
  const [reasonMessage] = useState(() => {
    const reason = searchParams.get('reason');
    return reason ? REASON_MESSAGES[reason] || null : null;
  });

  // Clear URL error/reason params after capturing (avoid sticky errors on refresh).
  // Intentionally empty deps: run-once cleanup — ssoError/reasonMessage already captured above via
  // useState initializer, so re-running on searchParams change is unnecessary.
  useEffect(() => {
    if (searchParams.has('error') || searchParams.has('reason')) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show reason message as info toast on mount (Story 13.6)
  useEffect(() => {
    if (reasonMessage) {
      toast.info(reasonMessage);
    }
  }, [reasonMessage]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const displayError = ssoError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      toast.success('Login successful', {
        description: 'Welcome back!',
      });

      // Navigate to intended destination or home
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Login failed', {
        description: err instanceof Error ? err.message : 'Please check your credentials',
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">G-Credit</h1>
          <p className="text-neutral-600 mt-2">Badge Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-elevation-4 p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Sign In</h2>

          {/* Error Alert - SSO errors + form errors */}
          {displayError && (
            <div
              id="login-error"
              className="mb-4 p-3 bg-error-light border border-red-200 rounded-md text-error text-sm"
              role="alert"
              aria-live="assertive"
            >
              {displayError}
            </div>
          )}

          {/* Primary CTA: Microsoft SSO */}
          <MicrosoftSsoButton disabled={isLoading} />

          {/* Visual Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">or sign in with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-describedby={displayError ? 'login-error' : undefined}
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-neutral-500">
            Contact your administrator if you need access
          </p>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-neutral-500">
          © 2026 G-Credit. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
