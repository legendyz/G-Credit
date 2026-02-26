/**
 * IdleTimeoutProvider - Story 13.6
 *
 * Single instance component rendered in App.tsx inside <BrowserRouter>.
 * Wires useIdleTimeout hook to authStore and renders the warning modal.
 * Avoids multiple competing timers by NOT placing hook in ProtectedRoute.
 */
import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleWarningModal } from './IdleWarningModal';

export function IdleTimeoutProvider() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionValidated = useAuthStore((s) => s.sessionValidated);

  const handleTimeout = useCallback(async () => {
    const store = useAuthStore.getState();
    await store.logout();
    window.location.href = '/login?reason=idle_timeout';
  }, []);

  const { isWarning, secondsRemaining, resetTimer } = useIdleTimeout({
    onTimeout: handleTimeout,
    enabled: isAuthenticated && sessionValidated,
  });

  return (
    <IdleWarningModal
      open={isWarning}
      secondsRemaining={secondsRemaining}
      onContinue={resetTimer}
    />
  );
}
