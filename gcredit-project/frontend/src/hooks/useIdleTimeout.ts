/**
 * useIdleTimeout - Story 13.6: Idle Timeout with Warning Modal
 *
 * Tracks user activity via document-level event listeners.
 * Fires warning callback at (timeout - warningBefore) and
 * timeout callback at the full timeout.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { SESSION_CONFIG } from '../config/session';

const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart',
];

interface UseIdleTimeoutOptions {
  /** Total idle timeout (ms). Default: SESSION_CONFIG.IDLE_TIMEOUT_MS */
  timeout?: number;
  /** Warning fires this many ms before timeout. Default: SESSION_CONFIG.IDLE_WARNING_MS */
  warningBefore?: number;
  /** Called when timeout reached (auto-logout) */
  onTimeout: () => void;
  /** Only track when true (maps to isAuthenticated) */
  enabled: boolean;
}

interface UseIdleTimeoutReturn {
  /** Whether warning modal should be shown */
  isWarning: boolean;
  /** Seconds remaining until timeout (valid when isWarning=true) */
  secondsRemaining: number;
  /** Call to dismiss warning and reset the timer */
  resetTimer: () => void;
}

export function useIdleTimeout({
  timeout = SESSION_CONFIG.IDLE_TIMEOUT_MS,
  warningBefore = SESSION_CONFIG.IDLE_WARNING_MS,
  onTimeout,
  enabled,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const lastActivityTime = useRef<number>(0);
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const onTimeoutRef = useRef(onTimeout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // One-shot guard: prevent duplicate onTimeout calls (nit from code review)
  const hasTimedOutRef = useRef(false);

  // Keep onTimeout ref current to avoid re-registering effects
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    lastActivityTime.current = Date.now();
    setIsWarning(false);
    setSecondsRemaining(0);
    hasTimedOutRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize lastActivityTime when the effect activates
    lastActivityTime.current = Date.now();

    const warningThreshold = timeout - warningBefore;

    // Activity handler — throttled via lastEventTime comparison
    let lastEventTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime < SESSION_CONFIG.ACTIVITY_THROTTLE_MS) return;
      lastEventTime = now;
      lastActivityTime.current = now;
      // If in warning state, user activity dismisses the warning
      setIsWarning(false);
      setSecondsRemaining(0);
    };

    // visibilitychange handler — check elapsed time when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityTime.current;
        if (elapsed >= timeout && !hasTimedOutRef.current) {
          hasTimedOutRef.current = true;
          onTimeoutRef.current();
        } else if (elapsed >= warningThreshold) {
          setIsWarning(true);
          setSecondsRemaining(Math.max(0, Math.ceil((timeout - elapsed) / 1000)));
        }
      }
    };

    // Register event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibility);

    // Timer tick — every second, check elapsed time
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityTime.current;
      if (elapsed >= timeout) {
        if (!hasTimedOutRef.current) {
          hasTimedOutRef.current = true;
          onTimeoutRef.current();
        }
        return;
      }
      if (elapsed >= warningThreshold) {
        setIsWarning(true);
        setSecondsRemaining(Math.max(0, Math.ceil((timeout - elapsed) / 1000)));
      }
    }, 1000);

    return () => {
      // Cleanup
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, timeout, warningBefore]);

  if (!enabled) {
    return { isWarning: false, secondsRemaining: 0, resetTimer: () => {} };
  }

  return { isWarning, secondsRemaining, resetTimer };
}
