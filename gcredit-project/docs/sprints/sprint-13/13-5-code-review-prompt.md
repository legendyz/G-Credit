# Code Review: Story 13.5 — Global 401 Interceptor + Token Refresh Queue

**Story:** 13.5 — Global 401 Interceptor + Token Refresh Queue  
**Sprint:** 13  
**Commit:** `0a00b33` (feat(story-13.5): global 401 interceptor + token refresh queue)  
**Base:** `6d7049b` (13.4 docs)  
**Branch:** `sprint-13/sso-session-management`  
**Frontend Test Results:** 772 passed, 0 failures (74 suites)  
**New Tests:** 15 (apiFetch interceptor 7 + refreshQueue 5 + queryClient 3)

---

## Summary of Changes

Story 13.5 adds transparent 401 interception to the existing `apiFetch()` wrapper. When any API call receives a 401 (access token expired), the interceptor automatically refreshes the token and retries the original request — all invisible to the caller. A refresh queue ensures concurrent 401s only trigger a single `POST /api/auth/refresh`.

1. **refreshQueue.ts** (new) — Module-level singleton with Promise-based queue. First caller creates the refresh, subsequent callers piggyback on the same Promise.
2. **apiFetch.ts** (modified) — 401 interception after `fetch()` call. Checks excluded paths + `_retried` flag → enqueues refresh → retries or forces logout.
3. **queryClient.ts** (modified) — Default retry config updated: skip 401 errors (interceptor handles those), retry other errors up to 3 times.

---

## Files Changed (3 production + 3 test + 3 docs)

| File | Type | Changes |
|------|------|---------|
| `src/lib/refreshQueue.ts` | New Module | +45 lines |
| `src/lib/apiFetch.ts` | Modified | +41/−8 lines |
| `src/lib/queryClient.ts` | Modified | +18/−1 lines |
| `src/lib/__tests__/apiFetch.test.ts` | New Test | +134 lines |
| `src/lib/__tests__/refreshQueue.test.ts` | New Test | +89 lines |
| `src/lib/__tests__/queryClient.test.ts` | New Test | +33 lines |
| `docs/sprints/sprint-13/13-5-401-interceptor-refresh-queue.md` | Doc | Story updated |
| `docs/sprints/sprint-13/13-5-dev-prompt.md` | Doc | Dev prompt (new) |
| `docs/sprints/sprint-status.yaml` | Doc | Status update |

---

## Production Code: `refreshQueue.ts` (new, 45 lines)

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

---

## Production Code Diff: `apiFetch.ts` (modified)

```diff
 import { API_BASE_URL } from './apiConfig';
+import { enqueueRefresh } from './refreshQueue';
+
+/** Paths excluded from 401 interception (avoid circular refresh) */
+const EXCLUDED_PATHS = ['/auth/refresh', '/auth/logout'];
+
+function isExcluded(path: string): boolean {
+  return EXCLUDED_PATHS.some((p) => path.includes(p));
+}

 /**
  * Fetch wrapper that includes credentials (httpOnly cookies) automatically.
  * All API calls should go through this wrapper instead of raw fetch().
  *
+ * Story 13.5: Enhanced with 401 interceptor → auto-refresh → retry.
  * @see ADR-010: JWT Token Transport Migration
  */
-export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
+export async function apiFetch(
+  path: string,
+  options: RequestInit & { _retried?: boolean } = {}
+): Promise<Response> {
   const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

-  const { headers: customHeaders, ...rest } = options;
+  const { headers: customHeaders, _retried, ...rest } = options;

   // Don't set Content-Type for FormData (browser sets boundary automatically)
   const isFormData = options.body instanceof FormData;
   const defaultHeaders: Record<string, string> = isFormData
     ? {}
     : { 'Content-Type': 'application/json' };

-  return fetch(url, {
+  const response = await fetch(url, {
     ...rest,
     credentials: 'include',
     headers: {
       ...defaultHeaders,
       ...customHeaders,
     },
   });
+
+  // 401 Interception — Story 13.5
+  if (response.status === 401 && !isExcluded(path) && !_retried) {
+    const refreshed = await enqueueRefresh();
+
+    if (refreshed) {
+      // Retry with fresh cookies — mark as retried to prevent infinite loop
+      return apiFetch(path, { ...options, _retried: true });
+    }
+
+    // Refresh failed → force logout
+    // Dynamic import to avoid circular dependency (apiFetch ← authStore → apiFetch)
+    const { useAuthStore } = await import('../stores/authStore');
+    const logout = useAuthStore.getState().logout;
+    await logout();
+
+    // Redirect to login with reason
+    if (typeof window !== 'undefined') {
+      window.location.href = '/login?reason=session_expired';
+    }
+  }
+
+  return response;
 }

 // apiFetchJson() unchanged — calls apiFetch() so it gets interception for free
```

---

## Production Code Diff: `queryClient.ts` (modified)

```diff
-import { QueryClient } from '@tanstack/react-query';
+import { QueryClient } from '@tanstack/react-query';

-export const queryClient = new QueryClient();
+export const queryClient = new QueryClient({
+  defaultOptions: {
+    queries: {
+      retry: (failureCount, error) => {
+        // Don't retry 401s — the apiFetch interceptor handles token refresh
+        if (error instanceof Error && error.message.includes('401')) return false;
+        // Default: retry up to 3 times for other errors
+        return failureCount < 3;
+      },
+    },
+    mutations: {
+      retry: false,
+    },
+  },
+});
```

---

## Test Code: `apiFetch.test.ts` (new, 134 lines, 7 tests)

| Test | What it verifies |
|------|------------------|
| `returns response normally on 200` | No interception for success responses |
| `returns response normally on 404` | No interception for non-401 errors |
| `single 401 → refresh success → retries original request` | fetch called 2×, enqueueRefresh 1×, retry returns 200 |
| `single 401 → refresh failure → calls logout + redirects` | logout() called, redirect to `/login?reason=session_expired` |
| `retried request gets 401 → no infinite loop` | `_retried: true` → no enqueueRefresh, 401 returned |
| `excluded path /auth/refresh → 401 returned as-is` | No interception on refresh endpoint |
| `excluded path /auth/logout → 401 returned as-is` | No interception on logout endpoint |

## Test Code: `refreshQueue.test.ts` (new, 89 lines, 5 tests)

| Test | What it verifies |
|------|------------------|
| `single refresh call → POST /auth/refresh` | Correct URL, method, credentials |
| `concurrent calls → only 1 fetch` | 5 concurrent → fetch called 1×, all resolve true |
| `refresh failure → returns false` | 401 from refresh → returns false |
| `network error → returns false` | TypeError → returns false |
| `after failure, next call creates new refresh` | Promise cleared after failure, new refresh works |

## Test Code: `queryClient.test.ts` (new, 33 lines, 3 tests)

| Test | What it verifies |
|------|------------------|
| `queries retry is configured as a function` | Custom retry function set |
| `401 errors are not retried` | retry returns false for '401' errors |
| `other errors are retried up to 3 times` | retry returns true for failureCount < 3 |

---

## Acceptance Criteria Coverage

| AC | Description | Implementation | Test Coverage |
|----|-------------|----------------|---------------|
| 1 | 401 → auto-refresh → retry → on failure → logout + redirect | `apiFetch.ts` interceptor + dynamic import logout | ✓ tests 3, 4 |
| 2 | Refresh queue: concurrent 401s → single refresh → all retry | `refreshQueue.ts` Promise singleton | ✓ concurrent test (5 callers, 1 fetch) |
| 3 | Infinite retry prevention (max 1 retry) | `_retried` flag on options | ✓ infinite loop test |
| 4 | `/auth/refresh` + `/auth/logout` excluded | `EXCLUDED_PATHS` + `isExcluded()` | ✓ excluded path tests (2) |
| 5 | React Query retry updated to skip 401s | `queryClient.ts` custom retry function | ✓ queryClient tests (3) |
| 6 | Tests: 15 covering all scenarios | 3 test suites, 15 tests | ✓ 15 pass |

---

## Review Checklist

### Correctness
- [ ] `apiFetch`: `_retried` is destructured out of options before passing to `fetch()` — verify `_retried` doesn't leak into the fetch call
- [ ] `apiFetch`: When retry happens via `apiFetch(path, { ...options, _retried: true })`, does `options` still contain the original body/headers/method? Could spreading `options` re-introduce `_retried: undefined` from original call?
- [ ] `apiFetch`: After refresh success, the retry calls `apiFetch()` recursively — what if the retried request returns a non-401 error (e.g., 403)? Is it returned correctly?
- [ ] `apiFetch`: On refresh failure, `logout()` is awaited, then `window.location.href` is set — but the function still returns `response` (the original 401). Could the caller act on this response before navigation occurs?
- [ ] `refreshQueue`: `doRefresh()` uses raw `fetch()` not `apiFetch()` — correct to avoid circular interception?
- [ ] `refreshQueue`: `finally(() => { refreshPromise = null })` — if `finally` runs before all `.then()` handlers of piggybacking callers, could a new caller create a second refresh? (Review Promise resolution ordering)
- [ ] `queryClient`: Retry function checks `error.message.includes('401')` — what if a non-auth error message happens to contain '401'? Is this robust enough?
- [ ] `queryClient`: `mutations: { retry: false }` — was this previously the default? Any behavior change for mutations?

### Security
- [ ] `refreshQueue`: Uses `credentials: 'include'` — refresh cookie sent automatically. No token in body or URL — correct?
- [ ] `apiFetch`: Dynamic `import('../stores/authStore')` in the 401 path — could this be exploited to inject a different module? (No — static import path)
- [ ] Logout redirect uses `window.location.href = '/login?reason=session_expired'` — relative path, no open redirect risk
- [ ] Is there a risk of the refresh token being used after it's been revoked on the server (race condition)?

### Performance
- [ ] `apiFetch`: Dynamic `import()` on every refresh failure — is this cached by the module system or does it re-evaluate each time?
- [ ] `refreshQueue`: Module-level `let refreshPromise` — any memory leak concern if the Promise is never resolved? (Review `finally` cleanup)
- [ ] 401 interception adds an `await` to every `apiFetch` call (the `const response = await fetch(...)` replaces `return fetch(...)`) — is this a meaningful performance change for non-401 responses?

### Edge Cases
- [ ] What happens if `apiFetch` is called from a Web Worker or SSR context (no `window`)? The `typeof window !== 'undefined'` guard handles redirect, but `logout()` still runs.
- [ ] What if the user is on the login page and a stale API call returns 401? The interceptor would try refresh → fail → redirect to `/login` — acceptable?
- [ ] `authStore.logout()` internally calls `apiFetch('/auth/logout')` — this is an excluded path. Confirmed no circular 401 → refresh → logout → refresh loop?
- [ ] What if `enqueueRefresh()` is called but `refreshPromise` was not properly nullified from a previous call (edge: `finally` not yet executed)? Could this result in stale Promise being returned?

### Testing
- [ ] `apiFetch.test.ts`: Mock uses `vi.mock('../../stores/authStore')` — does this correctly mock the dynamic `import()` path?
- [ ] `refreshQueue.test.ts`: Uses `{ ok: true }` as mock response — should it use `new Response()` for consistency?
- [ ] Is there a test for `apiFetchJson()` receiving a 401? (It calls `apiFetch()` internally — interception should work, but worth a test?)
- [ ] Is there a test verifying that the retry preserves the original request method (POST/PUT/DELETE)?
- [ ] Is there a test for FormData requests getting 401 + retry?
- [ ] Concurrent 401 test only verifies 5 callers resolve true — should also verify the callers' original requests are retried?

### Code Quality
- [ ] `_retried` convention (underscore prefix) — is this consistent with project patterns, or should it be a different naming approach?
- [ ] `_resetRefreshQueue()` exported for testing — acceptable, or should tests use module mocking instead?
- [ ] `EXCLUDED_PATHS` uses `path.includes()` — what if a user-facing API path contains `/auth/refresh` as a substring? (Unlikely but worth noting)
- [ ] Duplicate `queryClient.clear()` in `authStore.logout()` (lines 138-139) — pre-existing issue, not from this story, but worth noting

---

## How to Review

```bash
# See the full diff
cd gcredit-project
git diff 6d7049b 0a00b33

# Run only 13.5 tests
cd frontend
npx vitest run src/lib/__tests__/apiFetch.test.ts src/lib/__tests__/refreshQueue.test.ts src/lib/__tests__/queryClient.test.ts

# Run all frontend tests
npx vitest run
```

---

## Output Format

Please produce your review as `13-5-code-review-result.md` with:
1. **Verdict**: Approved / Approved with Notes / Changes Requested
2. **Findings**: Each finding with severity (CRITICAL / MAJOR / MINOR / NIT) and file:line reference
3. **Fixes Applied**: If you fix anything, list the commit SHA
