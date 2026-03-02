/**
 * Claim Badge Page
 *
 * Handles badge claiming via email link: /claim?token=xxx
 * Flow:
 *  1. User clicks "Claim Your Badge" in email → lands here
 *  2. If not logged in → ProtectedRoute redirects to /login, then back here after login
 *  3. Reads ?token= from URL, calls POST /api/badges/claim
 *  4. On success → redirects to /wallet with success toast
 *  5. On error → shows inline error with retry / go-to-wallet options
 */

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, PartyPopper, XCircle } from 'lucide-react';
import { claimBadgeByToken } from '../lib/badgesApi';

type ClaimState = 'claiming' | 'success' | 'error' | 'no-token';

export default function ClaimBadgePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<ClaimState>(token ? 'claiming' : 'no-token');
  const [errorMessage, setErrorMessage] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!token || claimAttempted.current) return;
    claimAttempted.current = true;

    const claimBadge = async () => {
      setState('claiming');
      try {
        const data = await claimBadgeByToken({ claimToken: token });
        const name = data.badge?.name || data.template?.name || data.badgeName || 'Badge';
        setBadgeName(name);
        setState('success');

        toast.success('Badge Claimed!', {
          description: `You've successfully claimed "${name}". Redirecting to your wallet...`,
          duration: 4000,
        });

        // Redirect to wallet after brief delay
        setTimeout(() => navigate('/wallet', { replace: true }), 2000);
      } catch (err) {
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unable to claim badge');
      }
    };

    claimBadge();
  }, [token, navigate]);

  const handleRetry = () => {
    claimAttempted.current = false;
    setState('claiming');
    // Trigger re-run by forcing re-render
    window.location.reload();
  };

  // ─── No token ──────────────────────────────────────
  if (state === 'no-token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle size={64} className="text-amber-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Missing Claim Token</h1>
          <p className="text-gray-600">
            No claim token found in the URL. Please use the link from your badge notification email.
          </p>
          <button
            onClick={() => navigate('/wallet', { replace: true })}
            className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go to My Wallet
          </button>
        </div>
      </div>
    );
  }

  // ─── Claiming (loading) ────────────────────────────
  if (state === 'claiming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-brand-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Claiming Your Badge...</h1>
          <p className="text-gray-600">Please wait while we process your badge claim.</p>
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <PartyPopper size={64} className="text-brand-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Badge Claimed!</h1>
          <p className="text-gray-600">
            You&apos;ve successfully claimed{' '}
            <span className="font-semibold">&ldquo;{badgeName}&rdquo;</span>. Redirecting to your
            wallet...
          </p>
          <button
            onClick={() => navigate('/wallet', { replace: true })}
            className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go to My Wallet
          </button>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <XCircle size={64} className="text-red-500" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-900">Claim Failed</h1>
        <p className="text-red-600">{errorMessage}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/wallet', { replace: true })}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
