# Dev Prompt: Story 13.5 — Global 401 Interceptor + Token Refresh Queue

**Story:** 13.5 — Global 401 Interceptor + Token Refresh Queue  
**Sprint:** 13 — Azure AD SSO + Session Management  
**Branch:** `sprint-13/sso-session-management`  
**Base Commit:** `6d7049b` (latest on branch after 13.4 acceptance)  
**Commit Prefix:** `feat(story-13.5):`

---

## Objective

Enhance `apiFetch()` with a transparent 401 interceptor that automatically refreshes expired access tokens and retries failed requests. Implement a refresh queue so concurrent 401s trigger only a single `POST /api/auth/refresh` call. On refresh failure, force logout and redirect to `/login`.

---

## Acceptance Criteria (6 ACs)

1. `apiFetch()` enhanced with 401 response interceptor → auto-refresh → retry original request → on failure → logout + redirect
2. Token refresh queue: concurrent 401s → single refresh → all queued calls retried → on failure all rejected
3. Infinite retry loop prevention: max 1 retry per request
4. `/auth/refresh` and `/auth/logout` excluded from interception
5. React Query `queryClient` default `retry` updated to skip 401s (interceptor handles those)
6. Tests: single 401→refresh→retry, concurrent 401s→single refresh, refresh failure→logout, no infinite loop, excluded paths

---

## Architecture

```
apiFetch(url, options) → fetch(url) → response.status?
  ├─ NOT 401 → return response (unchanged behavior)
  └─ 401 →
        ├─ excluded path? (/auth/refresh, /auth/logout) → return 401 as-is
        ├─ already retried? (_retried flag) → return 401 as-is (prevent loop)
        └─ eligible → enqueue in refreshQueue
              ├─ refreshQueue SUCCESS → retry fetch(url) with _retried mark → return retried response
              └─ refreshQueue FAILURE → logout() + redirect → throw/return 401
```

---

## Files to Create

### 1. `src/lib/refreshQueue.ts` (NEW — ~40 lines)

Module-level singleton using closures (not a class). Manages a single in-flight refresh Promise.

```typescript
/**
 * Token Refresh Queue - Story 13.5
 *
 * Ensures only one refresh request is in-flight at a time.
 * Concurrent 401s all await the same Promise.
 */
import { API_BASE_URL } from './apiConfig';

let refreshPromise: Promise<boolean> | null = null;

/**
 * Enqueue a token refresh. If one is already in-flight, piggyback on it.
 * Returns true on success, false on failure.
 */
export function enqueueRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Reset queue state (for testing only).
 */
export function _resetRefreshQueue(): void {
  refreshPromise = null;
}
```

**Key design decisions:**
- Use raw `fetch()`, NOT `apiFetch()` — to avoid circular interception
- `doRefresh()` calls `POST /api/auth/refresh` with `credentials: 'include'` (refresh cookie sent automatically)
- `finally` clears `refreshPromise` so next 401 can start a new refresh
- `_resetRefreshQueue()` exported for test cleanup only

---

### 2. `src/lib/__tests__/apiFetch.test.ts` (NEW — ~200 lines)

Test suite for the 401 interceptor behavior.

---

## Files to Modify

### 3. `src/lib/apiFetch.ts` (MODIFY — the core change)

**Current code (41 lines):** Simple `fetch()` wrapper with `credentials: 'include'`.

**Target:** Add 401 interception after `fetch()` call. Must preserve the existing `apiFetchJson()` behavior (it calls `apiFetch()` internally, so it gets interception for free).

```typescript
import { API_BASE_URL } from './apiConfig';
import { enqueueRefresh } from './refreshQueue';

/** Paths excluded from 401 interception (avoid circular refresh) */
const EXCLUDED_PATHS = ['/auth/refresh', '/auth/logout'];

function isExcluded(path: string): boolean {
  return EXCLUDED_PATHS.some((p) => path.includes(p));
}

export async function apiFetch(
  path: string,
  options: RequestInit & { _retried?: boolean } = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const { headers: customHeaders, _retried, ...rest } = options;

  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const response = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...customHeaders,
    },
  });

  // 401 Interception — Story 13.5
  if (response.status === 401 && !isExcluded(path) && !_retried) {
    const refreshed = await enqueueRefresh();

    if (refreshed) {
      // Retry with fresh cookies — mark as retried to prevent infinite loop
      return apiFetch(path, { ...options, _retried: true });
    }

    // Refresh failed → force logout
    // Dynamic import to avoid circular dependency (apiFetch ← authStore → apiFetch)
    const { useAuthStore } = await import('../stores/authStore');
    const logout = useAuthStore.getState().logout;
    await logout();

    // Redirect to login with reason
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired';
    }
  }

  return response;
}

// apiFetchJson() stays unchanged — it calls apiFetch() so it gets interception automatically
```

**Critical details:**
- `_retried` is a custom property on `RequestInit` — use intersection type `RequestInit & { _retried?: boolean }`
- `_retried` must be destructured out before passing to `fetch()` (fetch doesn't know about it)
- Use `await import(...)` for authStore to avoid circular dependency: `apiFetch.ts ← authStore.ts → apiFetch.ts`
- `isExcluded()` checks the original `path` parameter, not the constructed `url`
- After logout, `window.location.href` forces full navigation (not React Router) — this clears all in-memory state

---

### 4. `src/lib/queryClient.ts` (MODIFY — ~5 lines added)

Update default options so React Query doesn't double-retry 401s:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 401s — the apiFetch interceptor handles token refresh
        if (error instanceof Error && error.message.includes('401')) return false;
        // Default: retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
```

**Note:** The `apiFetchJson()` helper throws `new Error(error.message || 'HTTP 401')` on non-ok responses. React Query catches this. The retry function checks for '401' in the message. This is robust enough for our needs — we're not using raw `apiFetch()` in React Query hooks (hooks use `apiFetchJson()` or custom wrappers).

---

## Test Plan

### File: `src/lib/__tests__/apiFetch.test.ts`

Mock `global.fetch` at module level. Mock `refreshQueue.enqueueRefresh` via `vi.mock`.

| # | Test Name | Setup | Assert |
|---|-----------|-------|--------|
| 1 | `returns response normally on 200` | fetch → 200 | response returned, no refresh called |
| 2 | `returns response normally on 404` | fetch → 404 | response returned, no refresh called |
| 3 | `single 401 → refresh success → retries original request` | fetch → 401, then 200; enqueueRefresh → true | fetch called 2×, enqueueRefresh called 1× |
| 4 | `single 401 → refresh failure → calls logout + redirects` | fetch → 401; enqueueRefresh → false | logout() called, window.location.href = '/login?reason=session_expired' |
| 5 | `retried request gets 401 → no infinite loop` | apiFetch with _retried:true, fetch → 401 | fetch called 1×, enqueueRefresh NOT called, 401 returned |
| 6 | `excluded path /auth/refresh → 401 returned as-is` | apiFetch('/auth/refresh'), fetch → 401 | enqueueRefresh NOT called |
| 7 | `excluded path /auth/logout → 401 returned as-is` | apiFetch('/auth/logout'), fetch → 401 | enqueueRefresh NOT called |

### File: `src/lib/__tests__/refreshQueue.test.ts`

Mock `global.fetch` directly (refreshQueue uses raw fetch).

| # | Test Name | Setup | Assert |
|---|-----------|-------|--------|
| 1 | `single refresh call → POST /auth/refresh` | fetch → 200 | fetch called 1× with correct URL/method |
| 2 | `concurrent calls → only 1 fetch` | 5× enqueueRefresh() simultaneously | fetch called 1×, all 5 Promises resolve true |
| 3 | `refresh failure → returns false` | fetch → 401 | enqueueRefresh() returns false |
| 4 | `network error → returns false` | fetch throws TypeError | enqueueRefresh() returns false |
| 5 | `after failure, next call creates new refresh` | fetch → 401, then fetch → 200 | first returns false, second returns true, fetch called 2× |

### File: `src/lib/__tests__/queryClient.test.ts`

| # | Test Name | Assert |
|---|-----------|--------|
| 1 | `queries retry is configured` | `queryClient.getDefaultOptions().queries?.retry` is a function |
| 2 | `401 errors are not retried` | retry function returns false for error containing '401' |
| 3 | `other errors are retried up to 3 times` | retry function returns true for failureCount < 3 |

---

## Implementation Order

1. **Create `refreshQueue.ts`** — standalone module, no dependencies on other changes
2. **Create `refreshQueue.test.ts`** — verify queue behavior in isolation
3. **Modify `apiFetch.ts`** — add 401 interception using refreshQueue
4. **Create `apiFetch.test.ts`** — verify interception logic
5. **Modify `queryClient.ts`** — update default retry to skip 401s
6. **Create `queryClient.test.ts`** — verify retry config
7. **Run full frontend test suite** — `npx vitest run` — ensure 757+ tests pass, no regressions

---

## Existing Code Reference

### `src/lib/apiFetch.ts` (current, 41 lines)
```typescript
import { API_BASE_URL } from './apiConfig';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const { headers: customHeaders, ...rest } = options;
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {} : { 'Content-Type': 'application/json' };
  return fetch(url, {
    ...rest,
    credentials: 'include',
    headers: { ...defaultHeaders, ...customHeaders },
  });
}

export async function apiFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}
```

### `src/stores/authStore.ts` — logout() (lines 126-144)
```typescript
logout: async () => {
  set({
    user: null,
    isAuthenticated: false,
    sessionValidated: false,
    error: null,
  });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  queryClient.clear();
  queryClient.clear();  // Note: duplicate call — consider removing one
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort
  }
},
```

### `src/lib/queryClient.ts` (current, 11 lines)
```typescript
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient();
```

### Backend: `POST /api/auth/refresh` (auth.controller.ts L86-102)
- Reads `refresh_token` from cookie (preferred) or body
- On success: sets new `access_token` + `refresh_token` cookies, returns `{ message: 'Token refreshed' }`
- On failure: throws 401 Unauthorized

### Backend: `POST /api/auth/logout` (auth.controller.ts L106-119)
- Reads `refresh_token` from cookie or body
- Clears both cookies, invalidates refresh token in DB

---

## Files Importing apiFetch (14 consumers — all get interception for free)

| File | Import |
|------|--------|
| `stores/authStore.ts` | `apiFetch` |
| `lib/analyticsApi.ts` | `apiFetch` |
| `lib/badgesApi.ts` | `apiFetch` |
| `lib/badgeShareApi.ts` | `apiFetch` |
| `lib/badgeTemplatesApi.ts` | `apiFetch` |
| `lib/adminUsersApi.ts` | `apiFetch` |
| `lib/evidenceApi.ts` | `apiFetch` |
| `lib/m365SyncApi.ts` | `apiFetchJson` |
| `lib/milestonesApi.ts` | `apiFetchJson` |
| `hooks/useDashboard.ts` | `apiFetchJson` |
| `hooks/useSkillCategories.ts` | `apiFetch` + `apiFetchJson` |
| `hooks/useSkills.ts` | `apiFetch` |
| `hooks/useSkillMutations.ts` | `apiFetchJson` |
| `hooks/useWallet.ts` | `apiFetch` |

No consumer needs to change — interception is transparent at `apiFetch()` level.

---

## Edge Cases & Warnings

1. **Circular import**: `apiFetch.ts` ↔ `authStore.ts` — use `await import(...)` in the logout path to break the cycle
2. **authStore.logout() calls apiFetch('/auth/logout')**: This path is excluded from interception → safe, no circular 401 loop
3. **authStore.validateSession() does its own refresh**: After 13.5, `validateSession()` still works standalone on app startup. The 401 interceptor complements it for in-flight API calls during normal usage.
4. **SSO loginViaSSO() calls apiFetch('/auth/profile')**: If that 401s, it's a fresh SSO callback — interceptor will try refresh, which should fail (no valid refresh cookie yet), then logout. This is acceptable since the SsoCallbackPage already handles failure by redirecting to `/login?error=sso_failed`.
5. **FormData requests**: `_retried` flag handling must not interfere with FormData body detection — `_retried` is on the options object, not the body.
6. **`window.location.href` redirect**: Uses full navigation instead of React Router `navigate()` — intentional to clear all in-memory state on session expiry.

---

## Commit Message

```
feat(story-13.5): global 401 interceptor + token refresh queue

- Add refreshQueue.ts: single-flight refresh with Promise-based queue
- Enhance apiFetch() with 401 interception → auto-refresh → retry
- Prevent infinite loops via _retried flag
- Exclude /auth/refresh and /auth/logout from interception
- Force logout + redirect on refresh failure
- Update queryClient defaults: skip 401 retry (interceptor handles it)
- Add 15 tests: apiFetch interceptor (7) + refreshQueue (5) + queryClient (3)
```

---

## Verification Commands

```bash
cd gcredit-project/frontend

# Run new tests only
npx vitest run src/lib/__tests__/apiFetch.test.ts src/lib/__tests__/refreshQueue.test.ts src/lib/__tests__/queryClient.test.ts

# Run full suite (expect 757+ pass)
npx vitest run
```
