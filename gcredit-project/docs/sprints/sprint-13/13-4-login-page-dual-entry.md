# Story 13.4: Login Page Dual Entry + SSO Redirect Flow

Status: backlog

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

1. [ ] Login page displays prominent "Sign in with Microsoft" button (Microsoft brand guidelines: logo + text, white/dark variants)
2. [ ] Email/password form remains below SSO button with visual separator ("or sign in with email")
3. [ ] Clicking SSO button redirects to `GET /api/auth/sso/login` (backend handles Azure AD redirect)
4. [ ] SSO callback page (`/auth/sso/callback`) handles redirect, reads auth state, navigates to dashboard
5. [ ] Auth store updated: `loginViaSSO()` action that detects SSO callback and calls `validateSession()`
6. [ ] Loading state shown during SSO redirect/callback flow
7. [ ] Error handling: Azure AD login denied, callback error, network failure — all show user-friendly messages
8. [ ] Native `<input>` elements on LoginPage replaced with shadcn/ui `<Input>` component (P2-6 fix included)
9. [ ] Responsive: SSO button full-width on mobile, centered on desktop
10. [ ] Tests: SSO button renders, SSO redirect triggered, callback success, callback error, password login still works

## Tasks / Subtasks

- [ ] Task 1: SSO button component (AC: #1, #9)
  - [ ] Create `SsoLoginButton` component with Microsoft logo SVG
  - [ ] Follow Microsoft identity branding: `Sign in with Microsoft` text
  - [ ] White variant for light theme, dark variant for dark theme
  - [ ] Full-width on mobile (`w-full md:w-auto`), centered on desktop
  - [ ] Loading spinner state when redirect is in progress
- [ ] Task 2: Login page layout redesign (AC: #2, #8)
  - [ ] SSO button at top, primary CTA
  - [ ] Visual separator: horizontal rule + "or sign in with email" text
  - [ ] Email/password form below with shadcn/ui `<Input>` components (replacing native `<input>`)
  - [ ] Replace `<button>` with shadcn `<Button>` if not already
  - [ ] Maintain existing form validation behavior
- [ ] Task 3: SSO redirect flow (AC: #3, #6)
  - [ ] `SsoLoginButton` onClick → `window.location.href = '/api/auth/sso/login'`
  - [ ] Show loading overlay while redirect pending
  - [ ] Handle case where popup blockers prevent redirect (fallback message)
- [ ] Task 4: SSO callback page (AC: #4, #5)
  - [ ] Create `/auth/sso/callback` route in React Router
  - [ ] `SsoCallbackPage` component:
    - Shows "Signing you in..." loading state
    - Calls `authStore.validateSession()` to verify cookies are set
    - On success → navigate to `/dashboard`
    - On failure → navigate to `/login?error=sso_failed`
  - [ ] Add `loginViaSSO()` action to auth store (Zustand)
- [ ] Task 5: Error handling (AC: #7)
  - [ ] Parse URL params on callback page for error codes
  - [ ] Display user-friendly error messages via `sonner` toast:
    - `access_denied` → "Access denied. Please contact your administrator."
    - `server_error` → "Sign-in failed. Please try again."
    - `network_error` → "Network error. Please check your connection."
  - [ ] Error state on login page with retry option
- [ ] Task 6: Tests (AC: #10)
  - [ ] Unit: SSO button renders with Microsoft branding
  - [ ] Unit: SSO button click triggers redirect
  - [ ] Unit: Callback page success → navigates to dashboard
  - [ ] Unit: Callback page error → shows error message
  - [ ] Unit: Password login form still functional
  - [ ] Unit: shadcn `<Input>` renders instead of native `<input>`

## Dev Notes

### UX Design
- SSO button should be visually prominent — larger than email/password submit button
- Microsoft branding: use official SVG logo, `#2F2F2F` background for dark variant
- Separator pattern: `<hr className="my-6" />` with centered "or" text overlay
- Consider adding "Remember me" checkbox affecting idle timeout behavior (Story 13.6)

### Key References
- [Microsoft identity branding guidelines](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps)
- `src/pages/LoginPage.tsx` — current login page
- `src/stores/authStore.ts` — Zustand auth state
- `src/lib/apiFetch.ts` — API client (used for `validateSession`)
