# Story 11.6: SEC-002 — JWT Migration to httpOnly Cookies

**Status:** backlog  
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Source:** Security Audit HIGH  

## Story

As a security engineer,  
I want JWT tokens stored in httpOnly cookies instead of localStorage,  
So that XSS attacks cannot steal authentication tokens.

## Acceptance Criteria

1. [ ] Access token set as httpOnly cookie on login and token refresh
2. [ ] Refresh token set as httpOnly cookie with stricter path (`/api/auth/refresh`)
3. [ ] Cookies configured with `SameSite=Strict`, `Secure=true` (in production)
4. [ ] Frontend removes all `localStorage.getItem('accessToken')` references (49 occurrences)
5. [ ] All API calls use `credentials: 'include'` for automatic cookie transmission
6. [ ] CORS configuration updated to allow credentials
7. [ ] Logout clears cookies server-side (Set-Cookie with `maxAge: 0`)
8. [ ] Token refresh flow works with cookie-based auth
9. [ ] All existing auth E2E tests pass (adapted for new flow)
10. [ ] ADR created documenting the migration decision
11. [ ] All existing tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: Backend — Set cookies on login** (AC: #1, #2, #3)
  - [ ] In `auth.service.ts` `login()`: return tokens as before (for service layer)
  - [ ] In `auth.controller.ts` `login()`: use `@Res()` to set cookies
    ```typescript
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/api',
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    });
    ```
  - [ ] Install `cookie-parser` middleware if not present

- [ ] **Task 2: Backend — JWT Strategy reads from cookies** (AC: #1)
  - [ ] Update JWT strategy `ExtractJwt.fromExtractors([])`:
    - Primary: extract from cookie `accessToken`
    - Fallback: extract from Authorization Bearer header (for API clients)
  - [ ] Import `cookie-parser` in `main.ts`

- [ ] **Task 3: Backend — Refresh endpoint uses cookies** (AC: #8)
  - [ ] In refresh endpoint: read `refreshToken` from cookie
  - [ ] Set new `accessToken` cookie on successful refresh
  - [ ] If refresh token rotated, set new `refreshToken` cookie too

- [ ] **Task 4: Backend — Logout clears cookies** (AC: #7)
  - [ ] In logout: `res.clearCookie('accessToken', { path: '/api' })`
  - [ ] And: `res.clearCookie('refreshToken', { path: '/api/auth/refresh' })`

- [ ] **Task 5: Backend — CORS update** (AC: #6)
  - [ ] In `main.ts` CORS config: add `credentials: true`
  - [ ] Ensure `origin` is specific (not `*`) when credentials enabled

- [ ] **Task 6: Frontend — Remove localStorage token handling** (AC: #4, #5)
  - [ ] In `authStore.ts`:
    - Remove `localStorage.setItem('accessToken', ...)` (L91)
    - Remove `localStorage.setItem('refreshToken', ...)` (L93)
    - Remove `localStorage.removeItem(...)` (L116-117)
    - Remove `localStorage.getItem('accessToken')` from store init
  - [ ] In ALL 49 files with `localStorage.getItem('accessToken')`:
    - Remove header: `Authorization: Bearer ${localStorage.getItem('accessToken')}`
    - Add: `credentials: 'include'` to fetch options
    - **Files:** adminUsersApi.ts, badgesApi.ts, badgeShareApi.ts (4x), badgeTemplatesApi.ts, analyticsApi.ts, useDashboard.ts, useSkills.ts, useWallet.ts, BulkIssuancePage.tsx, ProfilePage.tsx, IssueBadgePage.tsx, BulkPreviewPage.tsx (3x), TemplateSelector.tsx, ProcessingComplete.tsx, BadgeDetailModal.tsx (3x), EvidenceSection.tsx (3x), ReportIssueForm.tsx, SimilarBadgesSection.tsx, others

- [ ] **Task 7: Frontend — Create centralized API client** (AC: #5)
  - [ ] Consider creating `lib/apiClient.ts` with `credentials: 'include'` as default
  - [ ] Or modify each file individually (less ideal but simpler)

- [ ] **Task 8: Tests** (AC: #9, #11)
  - [ ] Update auth E2E tests to use cookies instead of Authorization header
  - [ ] Update all E2E test helpers that inject auth tokens
  - [ ] Verify token refresh via cookies works
  - [ ] Run full test suite

- [ ] **Task 9: ADR** (AC: #10)
  - [ ] Create `docs/decisions/005-jwt-httponly-cookies.md`
  - [ ] Document: context, decision, consequences, migration notes

## Dev Notes

### Source Tree Components
- **Auth controller:** `backend/src/modules/auth/auth.controller.ts`
- **Auth service:** `backend/src/modules/auth/auth.service.ts` (511 lines)
- **JWT Strategy:** `backend/src/modules/auth/strategies/`
- **Auth store:** `frontend/src/stores/authStore.ts`
- **API files (49 locations):** adminUsersApi.ts, badgesApi.ts, badgeShareApi.ts, etc.
- **main.ts:** CORS config + cookie-parser setup

### Architecture Patterns
- **Dual extraction:** Cookie (primary) + Bearer header (fallback for API tools/Postman)
- **Path-restricted cookies:** accessToken on `/api`, refreshToken on `/api/auth/refresh`
- **Lesson 36 warning:** This story changes shared auth patterns — expect test mock cascade (budget 30-50% extra)

### Risk Mitigation
- Keep Bearer header extraction as fallback during transition
- Test with both cookie and header auth in E2E tests
- Verify Swagger UI still works (it uses Bearer header)

### Coding Standards
- No `console.log` — use NestJS Logger
- Update `.env.example` if new CORS origin config needed

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
