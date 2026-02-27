# Story 13.6: Idle Timeout with Warning Modal

Status: done

## Story

As a **security-conscious organization**,
I want user sessions to automatically log out after 30 minutes of inactivity,
So that unattended workstations don't pose a security risk.

## Context

- FEAT-007 item #3 (Idle Timeout Auto Logout)
- Currently no idle detection — sessions persist until refresh token expires (7 days)
- Idle timeout is a security requirement for enterprise pilot deployment
- Timer should reset on any user interaction (mouse, keyboard, touch, scroll)

## Acceptance Criteria

1. [x] Idle detection tracks: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`, `visibilitychange`
2. [x] Any tracked activity resets the 30-minute idle timer
3. [x] At 25 minutes idle (5 min remaining), warning modal appears:
   - "Your session will expire in 5 minutes due to inactivity"
   - "Continue Working" button resets timer
   - Countdown display (5:00 → 0:00)
4. [x] At 30 minutes idle → auto logout + redirect to `/login` with message "Session expired due to inactivity"
5. [x] Timer pauses when tab is hidden (`document.hidden`), resumes when tab becomes visible — but total hidden time still counts
6. [x] Idle timeout only active when user is authenticated (`isAuthenticated === true`)
7. [x] Configurable timeout values via constants (easy to change for different environments)
8. [x] Tests: idle timer fires at 30 min, activity resets timer, warning shows at 25 min, continue button resets, auto-logout at 30 min, unauthenticated users unaffected

## Tasks / Subtasks

- [ ] Task 1: Create `useIdleTimeout` custom hook (AC: #1, #2, #6, #7)
  - [ ] Accept config: `{ timeout: number, warningBefore: number, onTimeout: () => void, onWarning: () => void, enabled: boolean }`
  - [ ] Default values: `timeout = 30 * 60 * 1000`, `warningBefore = 5 * 60 * 1000`
  - [ ] Register event listeners: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
  - [ ] Throttle event handlers (e.g., once per second) to avoid performance impact
  - [ ] Only active when `enabled = true` (maps to `isAuthenticated`)
  - [ ] Cleanup: remove listeners on unmount
- [ ] Task 2: Timer management (AC: #2, #5)
  - [ ] Use `setInterval` (1s tick) for countdown accuracy
  - [ ] Track `lastActivityTime` — on each tick, check `Date.now() - lastActivityTime`
  - [ ] `visibilitychange` handler:
    - Tab hidden → record hidden timestamp
    - Tab visible → calculate elapsed hidden time, add to idle time
  - [ ] Activity event → reset `lastActivityTime = Date.now()`
- [ ] Task 3: Warning modal component (AC: #3)
  - [ ] Create `IdleWarningModal` using shadcn Dialog component
  - [ ] Display: "Your session will expire in {MM:SS} due to inactivity"
  - [ ] Live countdown from 5:00 → 0:00
  - [ ] "Continue Working" button → dismiss modal + reset idle timer
  - [ ] Modal is non-dismissable (no X button, no click-outside close) — only "Continue Working" works
  - [ ] Yellow/amber warning styling consistent with app design
- [ ] Task 4: Auto logout integration (AC: #4)
  - [ ] On timeout: call `authStore.logout()`
  - [ ] Redirect to `/login?reason=idle_timeout`
  - [ ] Login page checks `reason` param → show toast: "Session expired due to inactivity"
  - [ ] Ensure logout clears cookies via `POST /api/auth/logout`
- [ ] Task 5: Wire into app layout (AC: #6)
  - [ ] Add `useIdleTimeout()` to `ProtectedRoute` or `AppLayout` component
  - [ ] Pass `enabled={isAuthenticated}` from auth store
  - [ ] Render `<IdleWarningModal />` conditionally based on hook state
- [ ] Task 6: Constants and configuration (AC: #7)
  - [ ] Create `src/config/session.ts`:
    ```typescript
    export const SESSION_CONFIG = {
      IDLE_TIMEOUT_MS: 30 * 60 * 1000,       // 30 minutes
      IDLE_WARNING_MS: 5 * 60 * 1000,        // 5 minute warning
      ACTIVITY_THROTTLE_MS: 1000,             // Throttle listener
    } as const;
    ```
  - [ ] Import in `useIdleTimeout` hook
- [ ] Task 7: Tests (AC: #8)
  - [ ] Unit: `useIdleTimeout` fires warning callback at `timeout - warningBefore`
  - [ ] Unit: `useIdleTimeout` fires timeout callback at `timeout`
  - [ ] Unit: Activity event resets timer (use `vi.useFakeTimers`)
  - [ ] Unit: `enabled=false` → no timer started
  - [ ] Unit: `IdleWarningModal` renders countdown
  - [ ] Unit: "Continue Working" button resets timer and dismisses modal
  - [ ] Integration: full idle flow → warning → continue → reset

## Dev Notes

### Performance
- Throttle event listeners to max 1 update/second — avoid performance drain from `mousemove`
- Use `requestAnimationFrame` or `throttle()` for smooth countdown animation
- Event listeners attached to `document` (not individual elements)

### Edge Cases
- Multiple tabs: each tab has independent idle timer (no cross-tab sync for MVP)
- API auto-refresh (Story 13.5) should NOT count as "activity" — only user-initiated events
- Long-running API calls (e.g., bulk issuance) — consider adding `apiFetch` activity tracking

### Key References
- `src/stores/authStore.ts` — `logout()` action
- `src/components/ui/dialog.tsx` — shadcn Dialog for modal
- FEAT-007 requirements doc

---

## Code Review Sync (2026-02-26)

- Final code review verdict: **Approved**
- Re-review fix commit verified: `d7c5a37` (`fix(story-13.6): code review fixes  idempotent timeout guard + reason toast tests`)
- Closed items:
  - Added one-shot timeout guard in `useIdleTimeout` to prevent duplicate timeout callback firing.
  - Added `LoginPage` tests for `reason=session_expired` and `reason=idle_timeout` info-toast behavior.
- Validation evidence:
  - `npx vitest run src/hooks/useIdleTimeout.test.ts src/components/session/IdleWarningModal.test.tsx src/components/session/IdleTimeoutProvider.test.tsx` → 3 files, 16 tests, 0 failed
  - `npx vitest run src/hooks/useIdleTimeout.test.ts src/pages/LoginPage.test.tsx` → 2 files, 22 tests, 0 failed
