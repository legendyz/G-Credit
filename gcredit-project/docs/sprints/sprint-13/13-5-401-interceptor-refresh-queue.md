# Story 13.5: Global 401 Interceptor + Token Refresh Queue

Status: review

## Story

As a **user with an active session**,
I want the app to automatically refresh my session when it expires mid-use,
So that I don't lose my work or get unexpectedly logged out while working.

## Context

- Current `apiFetch()` wrapper handles `credentials: 'include'` for httpOnly cookies
- No 401 interceptor exists — expired access tokens cause silent failures
- FEAT-007 items #1 (Global 401 Interceptor) and #4 (Token Refresh Queue)
- Access token: 15 min TTL, refresh token: 7 day TTL
- Backend `POST /api/auth/refresh` endpoint already exists

## Acceptance Criteria

1. [x] `apiFetch()` enhanced with 401 response interceptor:
   - On 401 → automatically call `POST /api/auth/refresh`
   - On refresh success → retry the original request with new cookies
   - On refresh failure → call `authStore.logout()` + redirect to `/login`
2. [x] Token refresh queue implemented:
   - If 3+ concurrent API calls all receive 401, only 1 refresh request is sent
   - Other calls wait (queued) for the refresh to complete
   - After refresh completes, all queued calls are retried
   - If refresh fails, all queued calls are rejected
3. [x] Infinite retry loop prevention: max 1 retry per request (don't retry a retried request)
4. [x] `POST /api/auth/refresh` and `POST /api/auth/logout` are excluded from interception (avoid circular refresh)
5. [x] React Query `queryClient` default `retry` config updated to work with interceptor (avoid double-retry)
6. [x] Tests: single 401 → refresh → retry, concurrent 401s → single refresh → all retry, refresh failure → logout, no infinite loop, excluded paths

## Tasks / Subtasks

- [ ] Task 1: Design refresh queue mechanism (AC: #2)
  - [ ] Create `refreshQueue.ts` module with Promise-based queue
  - [ ] State machine: `idle` → `refreshing` → `idle`
  - [ ] First 401 caller sets state to `refreshing`, initiates `POST /api/auth/refresh`
  - [ ] Subsequent 401 callers get a Promise that resolves when refresh completes
  - [ ] On success: all queued Promises resolve, callers retry
  - [ ] On failure: all queued Promises reject, callers propagate error
- [ ] Task 2: Enhance `apiFetch()` with 401 interception (AC: #1, #3, #4)
  - [ ] After `fetch()` completes, check `response.status === 401`
  - [ ] Check if URL is excluded (`/api/auth/refresh`, `/api/auth/logout`)
  - [ ] Check `_retried` flag to prevent infinite loops
  - [ ] If eligible: enqueue in refresh queue, await result, retry with `_retried: true`
  - [ ] If not eligible (already retried or excluded path): throw/return 401
- [ ] Task 3: Auth store integration (AC: #1)
  - [ ] On refresh failure in interceptor, call `authStore.getState().logout()`
  - [ ] `logout()` clears client state + calls `POST /api/auth/logout`
  - [ ] Redirect to `/login?reason=session_expired`
  - [ ] Show toast: "Your session has expired. Please log in again."
- [ ] Task 4: React Query config (AC: #5)
  - [ ] Update `queryClient` defaults: `retry: false` or `retry: (failureCount, error) => ...`
  - [ ] Ensure React Query doesn't retry 401s (interceptor handles that)
  - [ ] Document interaction between React Query retry and 401 interceptor
- [ ] Task 5: Tests (AC: #6)
  - [ ] Unit: single 401 → refresh called → original request retried
  - [ ] Unit: 5 concurrent 401s → only 1 refresh call made → all 5 retried
  - [ ] Unit: refresh fails → `logout()` called → redirect to `/login`
  - [ ] Unit: retried request gets 401 → no infinite loop, immediate failure
  - [ ] Unit: `/api/auth/refresh` 401 → not intercepted, immediate failure
  - [ ] Unit: React Query doesn't double-retry 401s
  - [ ] Integration: simulated expired session → 401 → refresh → seamless retry

## Dev Notes

### Architecture Pattern
```
apiFetch(url) → fetch(url) → 401?
  ├─ NO → return response
  └─ YES → is excluded path?
        ├─ YES → return 401
        └─ NO → is retried?
              ├─ YES → return 401 (prevent loop)
              └─ NO → refreshQueue.enqueue()
                    ├─ SUCCESS → retry fetch(url, {_retried: true})
                    └─ FAILURE → logout() + redirect
```

### Refresh Queue Implementation
- Module-level singleton (not a class, just closures)
- `let refreshPromise: Promise<void> | null = null`
- First caller creates Promise, subsequent callers await same Promise
- After resolve/reject, clear `refreshPromise = null`

### Key References
- `src/lib/apiFetch.ts` — current API client wrapper
- `src/stores/authStore.ts` — `logout()`, `validateSession()`
- Backend `POST /api/auth/refresh` — refresh endpoint
- Lesson 43: API contract changes break E2E — ensure backward compatibility
