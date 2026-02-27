# Code Review Prompt — Story 13.6: Idle Timeout with Warning Modal

## Review Context

| Field | Value |
|-------|-------|
| **Story** | 13.6 — Idle Timeout with Warning Modal |
| **Branch** | `sprint-13/sso-session-management` |
| **Commit** | `0e30c8a feat(story-13.6): idle timeout with warning modal` |
| **Baseline** | `65cec91` (Story 13.5 accepted) |
| **Frontend Tests** | 77 files — **791 tests pass** (0 failures) |
| **Stack** | React 18 + Vite + Vitest + shadcn/ui + Radix Dialog + Zustand |

## Summary of Changes

Implements idle timeout auto-logout with a 5-minute warning modal. After 30 minutes of inactivity, users are automatically logged out and redirected to `/login?reason=idle_timeout`. A non-dismissable warning modal appears at the 5-minute mark with a live countdown and "Continue Working" button.

**Key design decisions:**
- Single `<IdleTimeoutProvider>` in `App.tsx` (not inside `ProtectedRoute`) to avoid multiple competing timer instances
- 1-second `setInterval` tick checking `Date.now() - lastActivityTime` for countdown accuracy
- `onTimeoutRef` pattern for stable callback without re-registering effects
- Throttled activity handler (1s minimum between resets) to avoid `mousemove` perf drain
- `visibilitychange` handler for tab-switch edge case (immediate check on tab re-focus)

## Files Changed

| File | Type | Lines |
|------|------|-------|
| `src/config/session.ts` | **New** | 11 |
| `src/hooks/useIdleTimeout.ts` | **New** | 134 |
| `src/components/session/IdleWarningModal.tsx` | **New** | 58 |
| `src/components/session/IdleTimeoutProvider.tsx` | **New** | 35 |
| `src/App.tsx` | Modified | +2 |
| `src/pages/LoginPage.tsx` | Modified | +26/−8 |
| `src/lib/apiFetch.ts` | Modified | +4/−4 |
| `src/hooks/useIdleTimeout.test.ts` | **New test** | 218 |
| `src/components/session/IdleWarningModal.test.tsx` | **New test** | 43 |
| `src/components/session/IdleTimeoutProvider.test.tsx` | **New test** | 69 |

---

## Production Code

### 1. `src/config/session.ts` (new — 11 lines)

```ts
/**
 * Session configuration constants - Story 13.6
 */
export const SESSION_CONFIG = {
  /** Total idle timeout before auto-logout (ms) */
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  /** Warning appears this many ms before timeout */
  IDLE_WARNING_MS: 5 * 60 * 1000, // 5 minute warning
  /** Throttle interval for activity event listeners (ms) */
  ACTIVITY_THROTTLE_MS: 1_000, // 1 second
} as const;
```

### 2. `src/hooks/useIdleTimeout.ts` (new — 134 lines)

```ts
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

  // Keep onTimeout ref current to avoid re-registering effects
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    lastActivityTime.current = Date.now();
    setIsWarning(false);
    setSecondsRemaining(0);
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
        if (elapsed >= timeout) {
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
        onTimeoutRef.current();
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
```

### 3. `src/components/session/IdleWarningModal.tsx` (new — 58 lines)

```tsx
/**
 * Idle Warning Modal - Story 13.6
 *
 * Non-dismissable dialog that warns user of imminent session expiry.
 * Uses shadcn Dialog with no close button and onInteractOutside prevented.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface IdleWarningModalProps {
  open: boolean;
  secondsRemaining: number;
  onContinue: () => void;
}

export function IdleWarningModal({ open, secondsRemaining, onContinue }: IdleWarningModalProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-700">⚠ Session Expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className="font-mono font-bold text-amber-700">{timeDisplay}</span> due to
            inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="text-4xl font-mono font-bold text-amber-700" aria-live="polite">
            {timeDisplay}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onContinue} className="w-full" size="lg">
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. `src/components/session/IdleTimeoutProvider.tsx` (new — 35 lines)

```tsx
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
```

### 5. `src/App.tsx` (modified — +2 lines)

```diff
 import { ProtectedRoute } from '@/components/ProtectedRoute';
 import { Layout } from '@/components/layout/Layout';
 import { queryClient } from '@/lib/queryClient';
+import { IdleTimeoutProvider } from '@/components/session/IdleTimeoutProvider';
 ...
       <BrowserRouter>
+        <IdleTimeoutProvider />
         <Suspense fallback={<LoadingFallback />}>
```

### 6. `src/pages/LoginPage.tsx` (modified — +26/−8 lines)

```diff
+/** Redirect reason codes → informational messages (Story 13.5 + 13.6) */
+const REASON_MESSAGES: Record<string, string> = {
+  session_expired: 'Your session has expired. Please log in again.',
+  idle_timeout: 'Session expired due to inactivity. Please log in again.',
+};
+
 export function LoginPage() {
   ...
-  // SSO error from URL params (backend redirects to /login?error=<code>)
   // SSO error from URL params — capture once on mount, then clear URL
   const [ssoError] = useState(() => { ... });

+  // Redirect reason from URL params (session_expired, idle_timeout) — Story 13.5/13.6
+  const [reasonMessage] = useState(() => {
+    const reason = searchParams.get('reason');
+    return reason ? REASON_MESSAGES[reason] || null : null;
+  });
+
-  // Clear URL error params after capturing (avoid sticky errors on refresh).
+  // Clear URL error/reason params after capturing (avoid sticky errors on refresh).
   useEffect(() => {
-    if (searchParams.has('error')) {
+    if (searchParams.has('error') || searchParams.has('reason')) {
       setSearchParams({}, { replace: true });
     }
   }, []);

+  // Show reason message as info toast on mount (Story 13.6)
+  useEffect(() => {
+    if (reasonMessage) {
+      toast.info(reasonMessage);
+    }
+  }, [reasonMessage]);
```

### 7. `src/lib/apiFetch.ts` (modified — +4/−4 lines)

```diff
 export class ApiError extends Error {
-  constructor(
-    message: string,
-    public readonly status: number
-  ) {
+  readonly status: number;
+
+  constructor(message: string, status: number) {
     super(message);
     this.name = 'ApiError';
+    this.status = status;
   }
 }
```

Minor refactor: moves `status` from parameter property shorthand to explicit assignment — ensures `this.status` is set **after** `super()` call for correct initialization order.

---

## Test Code

### 8. `src/hooks/useIdleTimeout.test.ts` (new — 218 lines, 10 tests)

| # | Test | Verifies |
|---|------|----------|
| 1 | `does not start when enabled=false` | No activity listeners registered |
| 2 | `starts timer when enabled=true` | Initial state: isWarning=false, secondsRemaining=0 |
| 3 | `fires warning at timeout - warningBefore` | At 7s/10s: isWarning=true, secondsRemaining=3 |
| 4 | `countdown decrements every second after warning` | At 8s/10s: secondsRemaining=2 |
| 5 | `fires onTimeout at full timeout` | At 10s/10s: onTimeout called once |
| 6 | `activity event resets the timer` | mousemove at 5s → no warning at 10s |
| 7 | `resetTimer() dismisses warning and resets` | Warning dismissed, timer restarts from new baseline |
| 8 | `cleanup removes listeners on unmount` | All 6 event types removed |
| 9 | `cleanup removes listeners when enabled changes to false` | Rerender with enabled=false removes listeners |

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from './useIdleTimeout';

describe('useIdleTimeout', () => {
  const onTimeout = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onTimeout.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start when enabled=false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');

    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: false,
      })
    );

    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
    const activityCalls = addSpy.mock.calls.filter(([event]) =>
      ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].includes(event as string)
    );
    expect(activityCalls).toHaveLength(0);
    addSpy.mockRestore();
  });

  it('starts timer when enabled=true', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it('fires warning at timeout - warningBefore', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => { vi.advanceTimersByTime(7_000); });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(3);
  });

  it('countdown decrements every second after warning', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => { vi.advanceTimersByTime(8_000); });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(2);
  });

  it('fires onTimeout at full timeout', () => {
    renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => { vi.advanceTimersByTime(10_000); });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('activity event resets the timer', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => { vi.advanceTimersByTime(5_000); });
    act(() => { document.dispatchEvent(new Event('mousemove')); });
    act(() => { vi.advanceTimersByTime(5_000); });

    expect(result.current.isWarning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('resetTimer() dismisses warning and resets', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => { vi.advanceTimersByTime(7_000); });
    expect(result.current.isWarning).toBe(true);

    act(() => { result.current.resetTimer(); });
    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);

    act(() => { vi.advanceTimersByTime(7_000); });
    expect(result.current.isWarning).toBe(true);
  });

  it('cleanup removes listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    unmount();

    const removedEvents = removeSpy.mock.calls.map(([event]) => event);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('keydown');
    expect(removedEvents).toContain('click');
    expect(removedEvents).toContain('scroll');
    expect(removedEvents).toContain('touchstart');
    expect(removedEvents).toContain('visibilitychange');
    removeSpy.mockRestore();
  });

  it('cleanup removes listeners when enabled changes to false', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useIdleTimeout({
          timeout: 10_000,
          warningBefore: 3_000,
          onTimeout,
          enabled,
        }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });

    const removedEvents = removeSpy.mock.calls.map(([event]) => event);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('visibilitychange');
    removeSpy.mockRestore();
  });
});
```

### 9. `src/components/session/IdleWarningModal.test.tsx` (new — 43 lines, 5 tests)

| # | Test | Verifies |
|---|------|----------|
| 1 | `renders when open=true` | Dialog present with title |
| 2 | `displays formatted countdown` | 125s → "2:05" |
| 3 | `Continue Working button calls onContinue` | Click handler fires |
| 4 | `not rendered when open=false` | Dialog absent |
| 5 | `countdown at 0:00` | Edge case boundary |

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdleWarningModal } from './IdleWarningModal';

describe('IdleWarningModal', () => {
  it('renders when open=true', () => {
    render(<IdleWarningModal open={true} secondsRemaining={300} onContinue={() => {}} />);
    expect(screen.getByText(/Session Expiring/)).toBeInTheDocument();
  });

  it('displays formatted countdown', () => {
    render(<IdleWarningModal open={true} secondsRemaining={125} onContinue={() => {}} />);
    const matches = screen.getAllByText('2:05', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('Continue Working button calls onContinue', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(<IdleWarningModal open={true} secondsRemaining={60} onContinue={onContinue} />);
    await user.click(screen.getByRole('button', { name: /Continue Working/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('not rendered when open=false', () => {
    render(<IdleWarningModal open={false} secondsRemaining={300} onContinue={() => {}} />);
    expect(screen.queryByText(/Session Expiring/)).not.toBeInTheDocument();
  });

  it('countdown at 0:00', () => {
    render(<IdleWarningModal open={true} secondsRemaining={0} onContinue={() => {}} />);
    const matches = screen.getAllByText('0:00', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
```

### 10. `src/components/session/IdleTimeoutProvider.test.tsx` (new — 69 lines, 2 tests)

| # | Test | Verifies |
|---|------|----------|
| 1 | `does not render modal when not authenticated` | enabled=false passed to hook, no modal |
| 2 | `renders modal when warning fires (authenticated)` | enabled=true, modal visible with countdown |

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdleTimeoutProvider } from './IdleTimeoutProvider';

const mockState = {
  isAuthenticated: false,
  sessionValidated: false,
  logout: vi.fn(),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: typeof mockState) => unknown) => selector(mockState),
    { getState: () => mockState }
  ),
}));

const mockUseIdleTimeout = vi.fn().mockReturnValue({
  isWarning: false,
  secondsRemaining: 0,
  resetTimer: vi.fn(),
});

vi.mock('@/hooks/useIdleTimeout', () => ({
  useIdleTimeout: (...args: unknown[]) => mockUseIdleTimeout(...args),
}));

describe('IdleTimeoutProvider', () => {
  beforeEach(() => {
    mockUseIdleTimeout.mockClear();
    mockState.isAuthenticated = false;
    mockState.sessionValidated = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render modal when not authenticated', () => {
    mockUseIdleTimeout.mockReturnValue({
      isWarning: false, secondsRemaining: 0, resetTimer: vi.fn(),
    });
    render(<IdleTimeoutProvider />);
    expect(screen.queryByText(/Session Expiring/)).not.toBeInTheDocument();
    expect(mockUseIdleTimeout).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('renders modal when warning fires (authenticated)', () => {
    mockState.isAuthenticated = true;
    mockState.sessionValidated = true;
    mockUseIdleTimeout.mockReturnValue({
      isWarning: true, secondsRemaining: 120, resetTimer: vi.fn(),
    });
    render(<IdleTimeoutProvider />);
    expect(screen.getByText(/Session Expiring/)).toBeInTheDocument();
    const matches = screen.getAllByText('2:00', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(mockUseIdleTimeout).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });
});
```

---

## Acceptance Criteria Coverage

| AC | Description | How Addressed |
|----|-------------|---------------|
| 1 | Idle detection tracks: mousemove, keydown, click, scroll, touchstart, visibilitychange | `ACTIVITY_EVENTS` array + `visibilitychange` handler in `useIdleTimeout.ts` |
| 2 | Any tracked activity resets 30-min idle timer | `handleActivity()` sets `lastActivityTime = now` + clears warning state |
| 3 | At 25 min idle → warning modal with countdown + "Continue Working" | `warningThreshold = timeout - warningBefore`, `IdleWarningModal` with live countdown |
| 4 | At 30 min idle → auto logout + redirect with message | `onTimeoutRef.current()` → `handleTimeout` calls `logout()` then `window.location.href = '/login?reason=idle_timeout'` |
| 5 | Timer aware of tab visibility (hidden time counts) | `handleVisibility` checks elapsed on `document.visibilityState === 'visible'` |
| 6 | Only active when authenticated | `enabled: isAuthenticated && sessionValidated` guard; early return when false |
| 7 | Configurable timeout values via constants | `SESSION_CONFIG` in `config/session.ts`; hook accepts override params |
| 8 | Tests cover all major scenarios | 16 tests across 3 test files |

---

## Review Checklist

### Correctness
- [ ] `useIdleTimeout` fires warning at exactly `timeout - warningBefore` ms
- [ ] `onTimeout` fires at exactly `timeout` ms with no double-fire
- [ ] `resetTimer()` properly resets both `lastActivityTime` ref and React state
- [ ] Activity events during warning state correctly dismiss warning AND reset timer
- [ ] `visibilitychange` handler correctly handles both timeout-exceeded and warning-threshold cases
- [ ] `handleTimeout` calls `logout()` before redirect — ensure cookie cleanup completes

### Security
- [ ] Modal is truly non-dismissable (Escape blocked, click-outside blocked, no X button)
- [ ] `window.location.href` redirect (full navigation) clears React state — is this preferable to `navigate()`?
- [ ] No sensitive data exposed in URL query param `?reason=idle_timeout`
- [ ] `onTimeoutRef` pattern: does the callback ref update race with the interval tick?

### Performance
- [ ] Throttle logic (`lastEventTime` comparison) correctly prevents excessive `lastActivityTime` updates
- [ ] `setInterval(1000)` — is the 1s tick acceptable perf cost for idle pages?
- [ ] `ACTIVITY_EVENTS` listeners are `{ passive: true }` — correct for all event types
- [ ] No unnecessary re-renders from `setIsWarning(false)` when already false (state same-value bail-out)

### UX / Accessibility
- [ ] `aria-live="polite"` on countdown — is this the right politeness level for expiring sessions?
- [ ] Amber color styling meets WCAG contrast requirements
- [ ] Modal focus trap works correctly (keyboard users can reach "Continue Working" button)
- [ ] Countdown display: `Math.ceil` rounding — does this create a visible "0:01 → skip 0:00 → logout" edge?

### Testing Gaps
- [ ] No test for `visibilitychange` edge case (tab hidden > timeout > tab visible)
- [ ] No test for `handleTimeout` integration (calls `logout()` then redirects)
- [ ] No test for LoginPage `?reason=idle_timeout` toast display
- [ ] No test for throttle timing accuracy (events within 1s window)
- [ ] No negative-seconds defense test (what if `secondsRemaining` goes below 0?)

### Code Quality
- [ ] `apiFetch.ts` ApiError refactor: parameter property → explicit assignment — verify no runtime behavior change
- [ ] LoginPage: two separate `useEffect` for URL cleanup vs. toast — could combine?
- [ ] `IdleTimeoutProvider` uses `window.location.href` for logout redirect — should this use React Router `navigate`?
- [ ] `onOpenChange={() => {}}` on Dialog — is this the correct way to prevent user-close?

---

## How to Review

```bash
# View the commit
git log --oneline 65cec91..0e30c8a

# View all changes
git diff 65cec91 0e30c8a

# Run tests
cd gcredit-project/frontend
npx vitest run

# Run only 13.6-related tests
npx vitest run useIdleTimeout IdleWarningModal IdleTimeoutProvider
```

---

## Expected Output Format

```markdown
## Code Review: Story 13.6 — Idle Timeout with Warning Modal

**Verdict**: Approved | Approved with Required Fixes | Changes Required

### Findings

#### [Critical | Major | Minor | Nit] — <title>
- **File**: `<path>`
- **Issue**: <description>
- **Fix**: <action required or suggestion>

### Summary
<1-2 paragraph summary>
```
