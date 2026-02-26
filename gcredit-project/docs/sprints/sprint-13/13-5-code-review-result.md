# Code Review Result: Story 13.5 — Global 401 Interceptor + Token Refresh Queue

## 1) Verdict

**Approved**

Re-review confirms previously reported findings are addressed in commit `e49243e` and targeted Story 13.5 tests pass.

---

## Re-review Update (2026-02-26)

- Fix commit reviewed: `e49243e` (`fix(story-13.5): code review fixes — ApiError class + strict path matching`)
- Verified closures:
   1. React Query 401 detection now uses structured `ApiError.status` instead of message matching.
   2. Excluded auth paths now use strict equality match instead of substring includes.
   3. Added retry-shape test for POST method/body/headers preservation.
   4. Added `apiFetchJson()` interceptor-inheritance test and `ApiError` assertion test.
- Re-run result:
   - Command: `npx vitest run src/lib/__tests__/apiFetch.test.ts src/lib/__tests__/refreshQueue.test.ts src/lib/__tests__/queryClient.test.ts`
   - Result: **3 files passed, 18 tests passed, 0 failed**.

---

## 2) Findings

### CRITICAL

- None.

### MAJOR

- None.

### MINOR

None.

### NIT

None.

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
   - Result: **3 files passed, 18 tests passed, 0 failed**

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

- Applied by dev (verified in re-review): `e49243e`
- Reviewer did not modify source code.