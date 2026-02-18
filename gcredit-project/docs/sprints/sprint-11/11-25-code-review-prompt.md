# Code Review Prompt — Story 11.25: Cookie Auth Hardening

## Review Scope

| Item | Value |
|------|-------|
| **Story** | 11.25 — Cookie Auth Hardening (httpOnly cookie migration completion) |
| **Story File** | `gcredit-project/docs/sprints/sprint-11/11-25-cookie-auth-hardening.md` |
| **Dev Prompt** | `gcredit-project/docs/sprints/sprint-11/11-25-dev-prompt.md` |
| **Branch** | `sprint-11/security-quality-hardening` |
| **Commits** | 2 commits: `c5ce6ab` (main implementation) → `0aab578` (E2E fix) |
| **Diff Range** | `76f4f2a..0aab578` (from Story 11.24 closeout to final 11.25 commit) |
| **Files Changed** | 16 files, +733 / −190 lines (excluding dev-prompt.md) |
| **Priority** | 🔴 CRITICAL — security/auth hardening |

---

## Commits Under Review

### Commit 1: `c5ce6ab` — Main Implementation
```
feat(Story-11.25): Cookie Auth Hardening — complete httpOnly migration

Critical:
- C-1: JwtAuthGuard @Public() routes now check cookie token (best-effort user identification)
- C-2: Teams Action Controller switched to @Public() + claim token validation

Medium:
- M-3: clearCookie() parameters match setCookie() (httpOnly, secure, sameSite, path)
- M-4: Login/register/refresh responses no longer leak tokens in body
- M-5: VerifyBadgePage migrated from axios to apiFetch

Low:
- L-6: Removed localStorage token mocks from frontend tests
- L-7: E2E test cookie migration documented as TODO
- L-8: Swagger addCookieAuth() added alongside addBearerAuth()
```

### Commit 2: `0aab578` — E2E Fix
```
fix(Story-11.25): E2E tests extract JWT from Set-Cookie instead of response body

After Story 11.25 Task 3 removed tokens from login/register response bodies,
E2E tests could not extract accessToken for Bearer auth fallback.

Fix: createAndLoginUser() and inline login calls now parse the access_token
from the Set-Cookie header. auth-simple E2E assertions updated to verify
cookie presence instead of body field.
```

---

## Issue-to-AC Mapping (8 issues, 6 tasks)

The reviewer MUST verify each issue from the story file is addressed:

| Issue | Severity | Task | AC Description | Files to Inspect |
|-------|----------|------|---------------|-----------------|
| C-1 | 🔴 Critical | Task 1 | `@Public()` routes check `request.cookies?.access_token` for best-effort auth | `jwt-auth.guard.ts`, `jwt-auth.guard.spec.ts` |
| C-2 | 🔴 Critical | Task 5 | Teams Action Controller uses `@Public()` + `claimToken` validation (no JWT) | `teams-action.controller.ts`, `teams-action.controller.spec.ts`, `claim-badge-action.dto.ts` |
| M-3 | 🟡 Medium | Task 2 | `clearCookie()` attributes match `setCookie()` exactly (`httpOnly`, `secure`, `sameSite`, `path`) | `auth.controller.ts` |
| M-4 | 🟡 Medium | Task 3 | Login/register/refresh responses contain NO `accessToken`/`refreshToken` — tokens only via `Set-Cookie` | `auth.controller.ts` |
| M-5 | 🟡 Medium | Task 4 | `VerifyBadgePage` uses `apiFetch` instead of `axios`; no `axios` import | `VerifyBadgePage.tsx` |
| L-6 | 🟢 Low | Task 6 | `localStorage` token mocks removed from frontend tests | `BulkPreviewPage.test.tsx`, `BulkIssuancePage.test.tsx`, `useAdminUsers.test.tsx`, `useDashboard.test.tsx`, `IssueBadgePage.test.tsx` |
| L-7 | 🟢 Low | Task 6 | E2E `authRequest` helper documents TODO for cookie migration; does NOT refactor all 90+ tests | `test-setup.ts` |
| L-8 | 🟢 Low | Task 6 | Swagger config adds `.addCookieAuth()` alongside existing `.addBearerAuth()` | `main.ts` |

---

## Changed Files Inventory

### Backend — Auth Core (Task 1, 2, 3)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `backend/src/common/guards/jwt-auth.guard.ts` | +11/−2 | Added `cookieToken` check in `isPublic` branch; updated JSDoc |
| `backend/src/common/guards/jwt-auth.guard.spec.ts` | +155 (new) | Full unit test suite: public+cookie, public+bearer, public+no-token, public+invalid-cookie, non-public delegation |
| `backend/src/modules/auth/auth.controller.ts` | +43/−21 | `getCookieOptions()` extracted; `clearCookie()` uses shared options; `login()`/`register()`/`refresh()` return only `{ user }` or `{ message }` (no tokens); removed "Dual-write" comment |

### Backend — Teams (Task 5)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `backend/src/microsoft-graph/teams/teams-action.controller.ts` | +30/−27 | Removed `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`, `@CurrentUser()`; added `@Public()`; switched from `dto.badgeId` + `user.userId` to `dto.claimToken` lookup; clears `claimToken` on claim (one-time use) |
| `backend/src/microsoft-graph/teams/dto/claim-badge-action.dto.ts` | +8/−12 | Replaced `badgeId: UUID` + `userId: UUID` with `claimToken: string` |
| `backend/src/microsoft-graph/teams/teams-action.controller.spec.ts` | +50/−72 | Updated to claimToken-based tests; removed IDOR/ForbiddenException tests; added `@Public()` decorator metadata test |

### Backend — Swagger (Task 6)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `backend/src/main.ts` | +7 | Added `.addCookieAuth('access_token', ...)` in Swagger config |

### Backend — E2E Tests (Commit 2 fix)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `backend/test/helpers/test-setup.ts` | +28/−2 | New `extractCookieToken()` utility; `createAndLoginUser()` extracts token from `Set-Cookie` header; TODO comment on `authRequest` for future cookie migration |
| `backend/test/auth-simple.e2e-spec.ts` | +8/−8 | Register/login assertions check cookie presence instead of `body.accessToken` |
| `backend/test/analytics.e2e-spec.ts` | +5/−2 | Inline login call uses `extractCookieToken()` |

### Frontend — VerifyBadgePage (Task 4)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `frontend/src/pages/VerifyBadgePage.tsx` | +34/−29 | Replaced `axios.get()` with `apiFetch()`; replaced axios error handling pattern with `response.ok` checks; added explicit `any` type assertions for untyped API response; proper 404/410 handling before generic catch |

### Frontend — Test Cleanup (Task 6)

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` | −1 | Removed `localStorage.getItem` mock |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | −1 | Removed `localStorage.getItem` mock |
| `frontend/src/hooks/useAdminUsers.test.tsx` | −3 | Removed 3 `Storage.prototype.getItem` mocks |
| `frontend/src/hooks/useDashboard.test.tsx` | −5 | Removed 5 `Storage.prototype.getItem` mocks |
| `frontend/src/pages/IssueBadgePage.test.tsx` | −3 | Removed `Storage.prototype.getItem` mock |

### Root Config

| File | Lines Changed | What Changed |
|------|--------------|-------------|
| `package.json` | +2/−2 | `lint-staged` rules now specify explicit `--config` path for ESLint |

---

## Review Checklist

### 1. Security Analysis (CRITICAL for auth story)

- [ ] **C-1 Cookie check:** Verify `jwt-auth.guard.ts` — `isPublic` branch reads `request.cookies?.access_token` AND still falls back to Bearer header. Invalid cookie must NOT cause 401 on `@Public()` routes.
- [ ] **M-3 clearCookie parity:** Verify `getCookieOptions()` is used by BOTH `setAuthCookies()` and `logout()`. Check that `httpOnly`, `secure`, `sameSite`, `path` are identical.
- [ ] **M-4 Token leak elimination:** Verify `login()`, `register()`, `refresh()` response bodies contain NO `accessToken` or `refreshToken` fields. Only `{ user }` or `{ message }`.
- [ ] **C-2 Teams claimToken:** Verify `claimToken` lookup uses `findUnique({ where: { claimToken } })` — `claimToken` has `@unique` constraint in Prisma schema. Verify token is nullified after claim (`claimToken: null`).
- [ ] **No new security holes:** Removing `@UseGuards(JwtAuthGuard)` from Teams controller — confirm the `claimToken` one-time use pattern is sufficient authorization (token embedded in Adaptive Card, cleared on first use).

### 2. Functional Correctness

- [ ] **VerifyBadgePage migration:** `apiFetch` returns `Response` (not `AxiosResponse`). Error handling uses `response.ok` / `response.status` instead of axios error shape. 404/410 are handled inline before `throw`.
- [ ] **E2E test fix (Commit 2):** `extractCookieToken()` correctly parses `Set-Cookie` header array. Check edge cases: what if `Set-Cookie` is missing entirely? (returns empty string — acceptable for test helper)
- [ ] **lint-staged config:** `--config` paths added to root `package.json` — verify these paths are correct relative to execution context.

### 3. Test Coverage

- [ ] **JwtAuthGuard spec (new file):** 6 test cases covering: cookie auth, Bearer auth, no token, invalid cookie, invalid Bearer, non-public route delegation.
- [ ] **Teams spec updates:** Removed ForbiddenException tests (no longer applicable — no user identity check). Added `@Public()` decorator metadata test. All test cases use `claimToken` instead of `badgeId`+`userId`.
- [ ] **Frontend mocks removed:** 5 test files had `localStorage` mocks removed — confirm no test depends on these mocks still being present.

### 4. Architectural Consistency

- [ ] **No `axios` in frontend:** After this change, verify `VerifyBadgePage` was the last consumer. If so, consider whether `axios` should remain in `package.json` dependencies.
- [ ] **Bearer fallback preserved:** `JwtStrategy` still supports `Authorization: Bearer` header as fallback — this is intentional for E2E tests and potential API consumers. NOT removed.
- [ ] **`@ApiBearerAuth()` not mass-removed:** Only Teams controller decorator removed. Other controllers retain it alongside the new `addCookieAuth()` Swagger config.

### 5. Lesson 43 Compliance

- [ ] **E2E impact assessment:** Commit 2 (`0aab578`) was needed because removing tokens from response body broke `createAndLoginUser()` in E2E tests. The fix (`extractCookieToken()`) is correct and reusable. Confirm this Lesson 43 scenario was handled by the Dev.

---

## Diff Command

To inspect the full diff:
```bash
git diff 76f4f2a..0aab578 -- ":(exclude)*.md"
```

To inspect each commit separately:
```bash
# Commit 1: Main implementation
git diff 76f4f2a..c5ce6ab -- ":(exclude)*.md"

# Commit 2: E2E fix
git diff c5ce6ab..0aab578
```
