# Code Review Result: Story 13.5 — Global 401 Interceptor + Token Refresh Queue

## 1) Verdict

**Approved with Notes**

Core behavior is implemented correctly for 401 interception, refresh queuing, single-retry protection, excluded auth paths, and React Query integration. Targeted Story 13.5 tests pass.

---

## 2) Findings

### CRITICAL

- None.

### MAJOR

- None.

### MINOR

1. **401 detection in React Query retry policy is message-string based and brittle**  
   - Reference: `frontend/src/lib/queryClient.ts:17`  
   - Current logic uses `error.message.includes('401')`. This can false-match unrelated errors containing `401`, or miss auth errors with different message formatting.  
   - Recommendation: standardize an auth-error shape (e.g., status code on custom error) and inspect status directly.

2. **Excluded-path matching uses substring logic that may over-match**  
   - Reference: `frontend/src/lib/apiFetch.ts:8`  
   - `path.includes('/auth/refresh')` and `path.includes('/auth/logout')` are practical, but can accidentally match longer unrelated paths containing those substrings.  
   - Recommendation: normalize path and use stricter endpoint matching (`===` or pathname-based match).

### NIT

1. **Missing targeted test that retry preserves original request shape for non-GET bodies**  
   - References: `frontend/src/lib/apiFetch.ts:24,47`, `frontend/src/lib/__tests__/apiFetch.test.ts:71-129`  
   - Current tests validate 401 flow well, but there is no explicit coverage for POST/PUT/FormData retry preserving method/body/headers semantics.

2. **No direct `apiFetchJson()` 401-retry path test**  
   - Reference: `frontend/src/lib/apiFetch.ts:68-76`  
   - It should inherit interceptor behavior via `apiFetch()`, but a direct test would lock this contract.

---

## 3) Validation Evidence

- Reviewed implementation:
  - `frontend/src/lib/refreshQueue.ts`
  - `frontend/src/lib/apiFetch.ts`
  - `frontend/src/lib/queryClient.ts`
- Reviewed tests:
  - `frontend/src/lib/__tests__/apiFetch.test.ts`
  - `frontend/src/lib/__tests__/refreshQueue.test.ts`
  - `frontend/src/lib/__tests__/queryClient.test.ts`
- Executed targeted test command:
  - `npx vitest run src/lib/__tests__/apiFetch.test.ts src/lib/__tests__/refreshQueue.test.ts src/lib/__tests__/queryClient.test.ts`
  - Result: **3 files passed, 15 tests passed, 0 failed**

---

## 4) AC Coverage Snapshot

- AC1 ✅ `apiFetch` intercepts 401, refreshes, retries, and handles refresh-failure logout+redirect.
- AC2 ✅ Promise-based singleton queue ensures one in-flight refresh for concurrent callers.
- AC3 ✅ `_retried` guard prevents infinite retry loops.
- AC4 ✅ `/auth/refresh` and `/auth/logout` excluded from interception.
- AC5 ✅ React Query retry customized to avoid 401 retries.
- AC6 ✅ New tests cover required story scenarios.

---

## 5) Fixes Applied

- **None in this review pass.**
- Reviewer did not modify source code.