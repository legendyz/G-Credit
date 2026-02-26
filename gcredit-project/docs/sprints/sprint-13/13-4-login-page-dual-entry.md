# Story 13.4: Login Page Dual Entry + SSO Redirect Flow

Status: review

## Story

As a **user visiting the login page**,
I want to see both a "Sign in with Microsoft" button and a traditional email/password form,
So that I can use my preferred authentication method.

## Context

- PO Decision DEC-001: Option A (dual entry) for pilot phase
- PO Decision DEC-002: Password login retained for pilot
- Microsoft SSO button must follow Microsoft identity branding guidelines
- Login page currently uses native `<input>` elements — fix P2-6 as part of rewrite

## Acceptance Criteria

1. [x] Login page displays prominent "Sign in with Microsoft" button (Microsoft brand guidelines: logo + text, white/dark variants)
2. [x] Email/password form remains below SSO button with visual separator ("or sign in with email")
3. [x] Clicking SSO button redirects to `GET /api/auth/sso/login` (backend handles Azure AD redirect)
4. [x] SSO callback page (`/sso/callback`) handles redirect, reads auth state, navigates to dashboard
5. [x] Auth store updated: `loginViaSSO()` action that calls `/auth/profile` to validate SSO cookies
6. [x] Loading state shown during SSO redirect/callback flow
7. [x] Error handling: Azure AD login denied, callback error, network failure — all show user-friendly messages
8. [x] Native `<input>` elements on LoginPage replaced with shadcn/ui `<Input>` component (P2-6 fix included)
9. [x] Responsive: SSO button full-width on mobile, centered on desktop
10. [x] Tests: SSO button renders, SSO redirect triggered, callback success, callback error, password login still works

## Tasks / Subtasks

- [x] Task 1: SSO button component (AC: #1, #9)
  - [x] Create `MicrosoftSsoButton` component with Microsoft logo SVG (4-square, official brand)
  - [x] Follow Microsoft identity branding: white bg (#FFF), dark text (#2F2F2F), 1px #8C8C8C border
  - [x] Full-width layout, loading state with spinner + "Redirecting…"
  - [x] onClick: `window.location.href = '/api/auth/sso/login'`
- [x] Task 2: Login page layout redesign (AC: #2, #8)
  - [x] SSO button at top, primary CTA
  - [x] Visual separator: `<hr>` + centered "or sign in with email" text
  - [x] Email/password form with shadcn `<Input>`, `<Label>`, `<Button>` (P2-6 fix)
  - [x] SSO error display from URL params (`?error=<code>`)
  - [x] Maintained all existing behavior (redirect, clearError, validation, toasts, a11y)
- [x] Task 3: SSO callback page (AC: #4, #5, #6)
  - [x] Create `SsoCallbackPage` — loading spinner + "Signing you in…"
  - [x] Calls `authStore.loginViaSSO()` → navigate to `/` on success, `/login?error=sso_failed` on failure
  - [x] 10-second timeout guard
- [x] Task 4: Auth store — `loginViaSSO()` action (AC: #5)
  - [x] Calls `/auth/profile` directly (bypasses `validateSession()` isAuthenticated guard)
  - [x] Sets user, isAuthenticated, sessionValidated on success
- [x] Task 5: Route registration (AC: #4)
  - [x] Added `/sso/callback` route to `App.tsx` (public, no ProtectedRoute)
  - [x] Lazy-loaded `SsoCallbackPage`
- [x] Task 6: Tests (AC: #10) — 13 tests total
  - [x] LoginPage: SSO button renders, redirect, loading state, SSO errors (2), shadcn inputs, separator, password login, auth error, redirect if authenticated
  - [x] SsoCallbackPage: loading state, success → dashboard, failure → login error

## Dev Notes

### Performance
- SSO button uses `window.location.href` (full-page redirect), not AJAX
- `loginViaSSO()` directly calls `/auth/profile` — single network roundtrip
- Callback page has 10s timeout guard for safety

### Key References
- `src/components/auth/MicrosoftSsoButton.tsx` — SSO button component
- `src/pages/LoginPage.tsx` — redesigned login page
- `src/pages/SsoCallbackPage.tsx` — callback handler
- `src/stores/authStore.ts` — `loginViaSSO()` action
- Microsoft identity branding: https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps

---

## Dev Agent Record

### Implementation Plan
Frontend-only story wiring the existing backend SSO flow (13.1-13.3) to the UI:
1. New `MicrosoftSsoButton` component with Microsoft 4-square logo + branding
2. Redesigned `LoginPage` with SSO button → separator → email/password form (shadcn/ui)
3. New `SsoCallbackPage` with auto-redirect after `loginViaSSO()` validates cookies
4. New `loginViaSSO()` auth store action bypassing `validateSession()` guard
5. Route registration in `App.tsx`

### Debug Log
- Initial SSO error display used `useMemo` depending on `searchParams`, but `setSearchParams({})` clearing the URL triggered re-computation before render. Fixed by using `useState` initializer to capture error once on mount.

### Completion Notes
- 13 new tests (10 LoginPage + 3 SsoCallbackPage), all pass
- Full suite: 70 test files, 751 tests, 0 failures
- TypeScript: 0 type errors
- P2-6 fix: all native `<input>`, `<label>`, `<button>` replaced with shadcn `<Input>`, `<Label>`, `<Button>`

### File List

#### New Files
| File | Purpose |
|------|---------|
| `src/components/auth/MicrosoftSsoButton.tsx` | Microsoft SSO button with brand guidelines |
| `src/pages/SsoCallbackPage.tsx` | SSO callback handler — loading + validate + redirect |
| `src/pages/LoginPage.test.tsx` | 10 tests for redesigned login page |
| `src/pages/SsoCallbackPage.test.tsx` | 3 tests for SSO callback flow |

#### Modified Files
| File | Changes |
|------|---------|
| `src/pages/LoginPage.tsx` | Added SSO button, separator, shadcn components, SSO error display |
| `src/stores/authStore.ts` | Added `loginViaSSO()` action |
| `src/App.tsx` | Added `/sso/callback` lazy route |

### Change Log
| Change | Reason |
|--------|--------|
| New `MicrosoftSsoButton` component | AC #1, #9 — Microsoft branded SSO entry point |
| Redesigned LoginPage layout | AC #2, #8 — dual entry + shadcn/ui migration (P2-6) |
| SSO error display from URL params | AC #7 — user-friendly error messages for SSO failures |
| New `SsoCallbackPage` | AC #4, #6 — handle backend redirect, validate session, auto-navigate |
| New `loginViaSSO()` in authStore | AC #5 — bypass validateSession guard for fresh SSO cookies |
| `/sso/callback` route in App.tsx | AC #4 — register public route for SSO redirect target |
