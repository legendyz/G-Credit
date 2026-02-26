# Dev Prompt: Story 13.6 — Idle Timeout with Warning Modal

**Story:** 13.6 — Idle Timeout with Warning Modal  
**Sprint:** 13 — Azure AD SSO + Session Management  
**Branch:** `sprint-13/sso-session-management`  
**Base Commit:** `65cec91` (latest on branch after 13.5 acceptance)  
**Commit Prefix:** `feat(story-13.6):`

---

## Objective

Implement a 30-minute idle timeout system with a 5-minute warning modal. When the user is inactive for 25 minutes a non-dismissable warning dialog appears with a live countdown. If the user clicks "Continue Working" the timer resets. If the countdown reaches zero, auto-logout occurs and the user is redirected to `/login?reason=idle_timeout`.

---

## Acceptance Criteria (8 ACs)

1. Idle detection tracks: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`, `visibilitychange`
2. Any tracked activity resets the 30-minute idle timer
3. At 25 min idle → warning modal with countdown (5:00 → 0:00) + "Continue Working" button
4. At 30 min idle → auto logout + redirect to `/login?reason=idle_timeout`
5. Timer pauses when tab is hidden but total hidden time still counts toward idle
6. Only active when `isAuthenticated === true`
7. Configurable timeout values via constants
8. Tests covering all scenarios

---

## Files to Create

### 1. `src/config/session.ts` (NEW — ~10 lines)

```typescript
/**
 * Session configuration constants - Story 13.6
 */
export const SESSION_CONFIG = {
  /** Total idle timeout before auto-logout (ms) */
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,       // 30 minutes
  /** Warning appears this many ms before timeout */
  IDLE_WARNING_MS: 5 * 60 * 1000,        // 5 minute warning
  /** Throttle interval for activity event listeners (ms) */
  ACTIVITY_THROTTLE_MS: 1_000,            // 1 second
} as const;
```

---

### 2. `src/hooks/useIdleTimeout.ts` (NEW — ~100 lines)

Custom hook that manages the idle timer lifecycle.

```typescript
/**
 * useIdleTimeout - Story 13.6: Idle Timeout with Warning Modal
 *
 * Tracks user activity via document-level event listeners.
 * Fires warning callback at (timeout - warningBefore) and
 * timeout callback at the full timeout.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { SESSION_CONFIG } from '../config/session';

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
  // ...implementation below
}
```

**Implementation details:**

1. **State:**
   - `lastActivityTime` (ref) — `Date.now()` updated on user activity
   - `isWarning` (state) — whether the warning modal is shown
   - `secondsRemaining` (state) — live countdown (300 → 0)

2. **Activity tracking (AC #1, #2):**
   - Attach listeners to `document` for: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
   - Throttle handler: ignore calls within `ACTIVITY_THROTTLE_MS` of last update
   - On activity: `lastActivityTime.current = Date.now()`; if `isWarning`, dismiss warning
   - `visibilitychange` (AC #5): when tab becomes visible, check `Date.now() - lastActivityTime` — if over threshold, trigger warning or timeout immediately

3. **Timer tick (AC #3, #4):**
   - Use `setInterval(1000)` — every second, calculate `elapsed = Date.now() - lastActivityTime.current`
   - If `elapsed >= timeout` → call `onTimeout()`
   - If `elapsed >= timeout - warningBefore` and `!isWarning` → set `isWarning = true`
   - When `isWarning`, compute `secondsRemaining = Math.max(0, Math.ceil((timeout - elapsed) / 1000))`

4. **`resetTimer()` (AC #3):**
   - Sets `lastActivityTime.current = Date.now()`
   - Sets `isWarning = false`

5. **Cleanup:**
   - Remove all event listeners on unmount
   - Clear interval on unmount
   - If `enabled` changes to `false`, clear interval and remove listeners

6. **`enabled` guard (AC #6):**
   - If `!enabled`, skip setting up listeners and interval entirely
   - Return `{ isWarning: false, secondsRemaining: 0, resetTimer: noop }`

---

### 3. `src/components/session/IdleWarningModal.tsx` (NEW — ~60 lines)

```typescript
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
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the default shadcn X close button
        // Override by not rendering DialogClose or hiding it
      >
        <DialogHeader>
          <DialogTitle className="text-amber-700">
            ⚠ Session Expiring
          </DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className="font-mono font-bold text-amber-700">{timeDisplay}</span>{' '}
            due to inactivity.
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

**Key design decisions:**
- `onOpenChange={() => {}}` — prevents Dialog from closing via Radix default behavior
- `onInteractOutside={(e) => e.preventDefault()}` — blocks click-outside dismiss
- `onEscapeKeyDown={(e) => e.preventDefault()}` — blocks Escape key dismiss
- Only "Continue Working" button can dismiss the modal → calls `resetTimer()`
- **Hide the default X close button:** The shadcn DialogContent has a built-in `<DialogPrimitive.Close>` with an X icon. You need to hide it. Options:
  - Pass a custom `className` on `DialogContent` that hides the close button: add `[&>button:last-child]:hidden` to className
  - OR create a variant of `DialogContent` without the close button

---

### 4. `src/hooks/useIdleTimeout.test.ts` (NEW — ~180 lines)

### 5. `src/components/session/IdleWarningModal.test.tsx` (NEW — ~80 lines)

---

## Files to Modify

### 6. `src/components/ProtectedRoute.tsx` (MODIFY — ~15 lines added)

This is where the idle timeout hook should be wired in. Every protected route already wraps through `<ProtectedRoute>`.

```typescript
// Add imports
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { IdleWarningModal } from './session/IdleWarningModal';

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, sessionValidated, validateSession } = useAuthStore();
  const location = useLocation();

  // Idle timeout — Story 13.6
  const handleTimeout = useCallback(async () => {
    const { useAuthStore: store } = await import('../stores/authStore');
    await store.getState().logout();
    window.location.href = '/login?reason=idle_timeout';
  }, []);

  const { isWarning, secondsRemaining, resetTimer } = useIdleTimeout({
    onTimeout: handleTimeout,
    enabled: isAuthenticated && sessionValidated,
  });

  // ... existing session validation + auth check + role check ...

  return (
    <>
      {children}
      <IdleWarningModal
        open={isWarning}
        secondsRemaining={secondsRemaining}
        onContinue={resetTimer}
      />
    </>
  );
}
```

**Note:** Use `useCallback` for `handleTimeout` to ensure stable reference. The `enabled` flag uses `isAuthenticated && sessionValidated` — this ensures the timer only starts after session validation is complete.

**IMPORTANT:** Since multiple `<ProtectedRoute>` instances exist in the route tree (each route wraps independently), the hook will run in each. To avoid multiple competing timers, add a deduplication mechanism:
- Option A: Lift the hook to a single `<IdleTimeoutProvider>` rendered once inside `<BrowserRouter>` (preferred)
- Option B: Use a module-level flag so only the first `useIdleTimeout` instance registers listeners
- **Recommend Option A** — create a tiny wrapper component:

```typescript
// In App.tsx, inside <BrowserRouter>:
<IdleTimeoutProvider />
```

Where `IdleTimeoutProvider` is:
```typescript
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

This avoids the multiple-timer problem entirely. Place it inside `<BrowserRouter>` but outside `<Routes>`.

---

### 7. `src/pages/LoginPage.tsx` (MODIFY — ~10 lines added)

Add handling for `reason` URL param (both `session_expired` from 13.5 and `idle_timeout` from 13.6):

```typescript
// Add to the SSO_ERROR_MESSAGES or create a separate REASON_MESSAGES map
const REASON_MESSAGES: Record<string, string> = {
  session_expired: 'Your session has expired. Please log in again.',
  idle_timeout: 'Session expired due to inactivity. Please log in again.',
};

// In the component, after capturing ssoError:
const [reasonMessage] = useState(() => {
  const reason = searchParams.get('reason');
  return reason ? REASON_MESSAGES[reason] || null : null;
});

// Clear reason param like error param:
useEffect(() => {
  if (searchParams.has('error') || searchParams.has('reason')) {
    setSearchParams({}, { replace: true });
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Show reason message via toast on mount:
useEffect(() => {
  if (reasonMessage) {
    toast.info(reasonMessage);
  }
}, [reasonMessage]);
```

**Design decision:** Show `reason` messages as info toasts (not inline errors) since they're informational, not error states. The `error` param continues showing in the error alert for SSO failures.

---

## Existing Code Reference

### `src/components/ProtectedRoute.tsx` (current, 55 lines)
```typescript
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE'>;
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, sessionValidated, validateSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!sessionValidated) { validateSession(); }
  }, [sessionValidated, validateSession]);

  if (!sessionValidated) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search;
    return <Navigate to="/login" state={{ from: fullPath }} replace />;
  }

  if (requiredRoles?.length && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
```

### `src/App.tsx` — route structure (relevant section)
```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sso/callback" element={<SsoCallbackPage />} />
            <Route path="/" element={<ProtectedRoute><Layout pageTitle="Dashboard"><DashboardPage /></Layout></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Layout ...><TimelineView /></Layout></ProtectedRoute>} />
            {/* ...more protected routes, each wrapped individually in <ProtectedRoute> */}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### shadcn `Dialog` exports (from `src/components/ui/dialog.tsx`)
```typescript
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,  // Has built-in X close button — needs hiding/override
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

### `src/stores/authStore.ts` — logout() (lines 126-144)
```typescript
logout: async () => {
  set({ user: null, isAuthenticated: false, sessionValidated: false, error: null });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  queryClient.clear();
  queryClient.clear();  // duplicate — pre-existing
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch { /* best-effort */ }
},
```

---

## Test Plan

### File: `src/hooks/useIdleTimeout.test.ts` (~180 lines)

Uses `vi.useFakeTimers()` + `renderHook()` + `act()` — same pattern as existing `useDebounce.test.ts`.

| # | Test Name | Setup | Assert |
|---|-----------|-------|--------|
| 1 | `does not start when enabled=false` | `enabled: false` | No interval set, no event listeners |
| 2 | `starts timer when enabled=true` | `enabled: true` | `isWarning=false`, `secondsRemaining=0` initially |
| 3 | `fires warning at timeout - warningBefore` | advance 25min | `isWarning=true`, `secondsRemaining=300` |
| 4 | `countdown decrements every second after warning` | advance 25min + 1s | `secondsRemaining=299` |
| 5 | `fires onTimeout at full timeout` | advance 30min | `onTimeout` called |
| 6 | `activity event resets the timer` | advance 20min, fire mousemove, advance 20min | no warning (total < 25min since activity) |
| 7 | `resetTimer() dismisses warning and resets` | advance 25min, call `resetTimer()` | `isWarning=false` |
| 8 | `cleanup removes listeners on unmount` | unmount | `removeEventListener` called |
| 9 | `cleanup removes listeners when enabled changes to false` | enabled: true → false | interval cleared |

**Timer shortcut:** Use short timeouts in tests (e.g., `timeout: 10_000`, `warningBefore: 3_000`) for faster test runs.

### File: `src/components/session/IdleWarningModal.test.tsx` (~80 lines)

| # | Test Name | Assert |
|---|-----------|--------|
| 1 | `renders when open=true` | "Session Expiring" title visible |
| 2 | `displays formatted countdown` | `secondsRemaining=125` → "2:05" shown |
| 3 | `Continue Working button calls onContinue` | click → callback called |
| 4 | `not rendered when open=false` | no dialog in DOM |
| 5 | `countdown at 0:00` | `secondsRemaining=0` → "0:00" shown |

### File: `src/components/session/IdleTimeoutProvider.test.tsx` (~50 lines)

| # | Test Name | Assert |
|---|-----------|--------|
| 1 | `does not render modal when not authenticated` | no dialog |
| 2 | `renders modal when warning fires (authenticated)` | dialog appears after idle |

---

## Implementation Order

1. **Create `src/config/session.ts`** — constants module
2. **Create `src/hooks/useIdleTimeout.ts`** — core hook
3. **Create `src/hooks/useIdleTimeout.test.ts`** — test hook in isolation
4. **Create `src/components/session/IdleWarningModal.tsx`** — warning dialog
5. **Create `src/components/session/IdleWarningModal.test.tsx`** — test dialog
6. **Create `src/components/session/IdleTimeoutProvider.tsx`** — wiring component
7. **Modify `src/App.tsx`** — add `<IdleTimeoutProvider />` inside `<BrowserRouter>`
8. **Modify `src/pages/LoginPage.tsx`** — handle `?reason=` param (toast messages)
9. **Create `src/components/session/IdleTimeoutProvider.test.tsx`** — integration test
10. **Run full frontend test suite** — `npx vitest run` — expect 775+ pass

---

## Edge Cases & Warnings

1. **Multiple ProtectedRoute instances:** Do NOT put the hook in `ProtectedRoute`. Use single `<IdleTimeoutProvider>` in `App.tsx` to avoid multiple timers.
2. **shadcn Dialog X button:** `DialogContent` renders a built-in close button. Hide it with `[&>button:last-child]:hidden` in className, or create a variant `DialogContent` without it.
3. **`onTimeout` stable reference:** Wrap `handleTimeout` in `useCallback` to prevent the hook from re-registering on every render.
4. **Tab visibility (AC #5):** "Timer pauses when tab is hidden but total hidden time still counts" — means the `setInterval` might not fire reliably when hidden, but `Date.now() - lastActivityTime` calculation catches up when tab becomes visible. No special pause/resume logic needed.
5. **Event throttling:** Use a simple `lastEventTime` ref comparison, NOT lodash `throttle`. Keep it lightweight.
6. **`window.location.href` for logout redirect:** Same pattern as 13.5 — forces full page reload to clear all in-memory state.
7. **Reason messages as toasts, not inline errors:** The `?reason=idle_timeout` and `?reason=session_expired` should show as `toast.info()` (informational), while `?error=sso_*` continues showing inline (error state). Don't mix them.
8. **Story 13.5 `session_expired` already redirects to `/login?reason=session_expired`:** This story adds the LoginPage handler for both `reason` params.

---

## Commit Message

```
feat(story-13.6): idle timeout with warning modal

- Add session.ts config: 30min timeout, 5min warning, 1s throttle
- Add useIdleTimeout hook: activity tracking, warning state, countdown
- Add IdleWarningModal: non-dismissable shadcn Dialog with live countdown
- Add IdleTimeoutProvider: single instance wired into App.tsx
- LoginPage handles ?reason= param for session_expired + idle_timeout toasts
- Add tests: useIdleTimeout (9), IdleWarningModal (5), IdleTimeoutProvider (2)
```

---

## Verification Commands

```bash
cd gcredit-project/frontend

# Run new tests only
npx vitest run src/hooks/useIdleTimeout.test.ts src/components/session/IdleWarningModal.test.tsx src/components/session/IdleTimeoutProvider.test.tsx

# Run all frontend tests (expect 775+)
npx vitest run
```
