/**
 * useFormGuard — Dirty-form navigation guard
 * Story 15.12: Dirty-Form Guard
 *
 * Prevents accidental navigation away from forms with unsaved changes.
 * Uses `beforeunload` for browser close/refresh and intercepts
 * `popstate` + `pushState`/`replaceState` for client-side navigation.
 *
 * Compatible with `<BrowserRouter>` (no data router required).
 */

import { useEffect, useCallback, useState, useRef } from 'react';

interface UseFormGuardOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Optional custom message (not used by modern browsers for beforeunload, but used by dialog) */
  message?: string;
}

interface UseFormGuardReturn {
  /** Whether the blocker is currently active (dialog should be shown) */
  isBlocked: boolean;
  /** Call to proceed with navigation (user clicked "Leave") */
  proceed: () => void;
  /** Call to cancel navigation (user clicked "Stay") */
  reset: () => void;
}

export function useFormGuard({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseFormGuardOptions): UseFormGuardReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);
  const proceedingRef = useRef(false);

  // Browser close/refresh protection
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // Intercept client-side navigation (pushState/replaceState + popstate)
  useEffect(() => {
    if (!isDirty) {
      // Clear any pending block when form becomes clean
      setIsBlocked(false);
      pendingNavRef.current = null;
      return;
    }

    // Save originals
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    // Override pushState to intercept programmatic navigation
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      setIsBlocked(true);
      pendingNavRef.current = () => originalPushState(...args);
    };

    // Override replaceState to intercept replace navigation
    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      setIsBlocked(true);
      pendingNavRef.current = () => originalReplaceState(...args);
    };

    // Intercept popstate (back/forward button)
    const handlePopState = () => {
      if (proceedingRef.current) return;
      // Push the current state back to prevent navigation
      originalPushState(history.state, '', window.location.href);
      setIsBlocked(true);
      pendingNavRef.current = () => history.back();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);

  const proceed = useCallback(() => {
    setIsBlocked(false);
    const fn = pendingNavRef.current;
    pendingNavRef.current = null;
    if (fn) {
      proceedingRef.current = true;
      fn();
      // Notify React Router about the URL change so it re-renders
      window.dispatchEvent(new PopStateEvent('popstate'));
      proceedingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setIsBlocked(false);
    pendingNavRef.current = null;
  }, []);

  return {
    isBlocked,
    proceed,
    reset,
  };
}
