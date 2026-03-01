# Story 15.6: Forgot Password Page (P1-7)

**Status:** backlog  
**Priority:** MEDIUM  
**Estimate:** 3h  
**Wave:** 3 — UI Polish  
**Source:** P1-7 (Post-MVP UI Audit)  
**Dependencies:** None (backend already has password reset endpoints)

---

## Story

**As a** local (non-SSO) user who has forgotten their password,  
**I want** a dedicated Forgot Password page with proper UI,  
**So that** I can reset my password through a user-friendly flow.

> **Scope note:** This feature applies to **local users only**. M365/SSO users authenticate via Microsoft and must reset their password through their organization's IT portal. See "M365 vs Local User Handling" in Dev Notes.

## Acceptance Criteria

1. [ ] Forgot Password page accessible from Login page via "Forgot Password?" link
2. [ ] Page has email input field with validation
3. [ ] Submit triggers `POST /api/auth/request-reset` API call
4. [ ] Success state shows "Check your email" confirmation message
5. [ ] Error state shows appropriate error messages (Sonner toast)
6. [ ] Reset Password page (`/reset-password?token=...`) handles token from email link
7. [ ] Reset Password form: new password + confirm password with strength validation
8. [ ] Submit triggers `POST /api/auth/reset-password` API call
9. [ ] Success redirects to Login page with success toast
10. [ ] Responsive design (mobile + desktop)
11. [ ] Uses Tailwind classes and design tokens (no inline styles)
12. [ ] Uses Lucide icons (no emoji)
13. [ ] Backend: `requestPasswordReset()` silently skips M365 users (`user.azureId` non-null) — returns same generic success message (no user-type leakage)
14. [ ] Frontend: "Forgot Password?" link placed in local login form area only (not near SSO button)
15. [ ] Frontend: ForgotPasswordPage includes secondary hint text for M365 users
16. [ ] Test: M365 user email submission → no reset email sent, same success response

## Tasks / Subtasks

- [ ] **Task 1: Create ForgotPasswordPage** (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/pages/ForgotPasswordPage.tsx`
  - [ ] Email input with validation (required, email format)
  - [ ] Submit handler calls `POST /api/auth/request-reset`
  - [ ] Loading state during API call
  - [ ] Success state with email icon + confirmation text
  - [ ] Error handling with Sonner toast
- [ ] **Task 2: Create ResetPasswordPage** (AC: #6, #7, #8, #9)
  - [ ] Create `frontend/src/pages/ResetPasswordPage.tsx`
  - [ ] Extract token from URL query params
  - [ ] New password + confirm password fields
  - [ ] Password strength validation (8+ chars, uppercase, lowercase, number)
  - [ ] Submit handler calls `POST /api/auth/reset-password` with token + new password
  - [ ] Success → redirect to `/login` with toast
- [ ] **Task 3: Add routes** (AC: #1, #6)
  - [ ] Add `/forgot-password` route in `App.tsx`
  - [ ] Add `/reset-password` route in `App.tsx`
  - [ ] Both routes are public (no auth required)
- [ ] **Task 4: Update Login page** (AC: #1, #14)
  - [ ] Add "Forgot Password?" link below local login form (email/password area)
  - [ ] Link navigates to `/forgot-password`
  - [ ] Link must NOT appear near "Sign in with Microsoft" SSO button
- [ ] **Task 6: Backend — M365 user guard** (AC: #13)
  - [ ] In `auth.service.ts` `requestPasswordReset()`: add `if (user.azureId)` check after user lookup
  - [ ] If M365 user → skip token generation and email sending, return same generic success message
  - [ ] No new endpoint or DTO changes needed (response shape unchanged)
- [ ] **Task 7: M365 UX hint on ForgotPasswordPage** (AC: #15)
  - [ ] Add secondary text below form: "Sign in with Microsoft? Reset your password through your organization's IT portal."
  - [ ] Style as muted text (`text-muted-foreground text-sm`)
- [ ] **Task 5: Styling** (AC: #10, #11, #12)
  - [ ] Centered card layout (similar to login page)
  - [ ] Tailwind classes only (no inline styles)
  - [ ] Lucide icons for mail, lock, check
  - [ ] Responsive at all breakpoints

## Dev Notes

### Architecture Patterns Used
- `apiFetch()` for API calls (API_BASE_URL)
- Sonner toast for user feedback
- React Router `useNavigate` + `useSearchParams`
- shadcn/ui form components (Input, Button, Card)

### Existing Backend Endpoints (Sprint 1)
- `POST /api/auth/request-reset` — sends reset email (body: `{ email }`)
- `POST /api/auth/reset-password` — resets password (body: `{ token, newPassword }`)

### M365 vs Local User Handling

**Problem:** The system has two user types — local (email/password) and M365/SSO (`user.azureId` non-null). Password reset only applies to local users. M365 users' passwords are managed by their organization via Microsoft 365.

**Existing precedent in codebase:**
- `auth.service.ts:131-132`: Login blocks M365 users from password auth → `if (user.azureId)` check
- `ProfilePage.tsx:150`: `const isSsoUser = !!profile?.azureId` → hides password change form
- `LoginPage.tsx`: Dual entry — SSO button (primary) + email/password form (secondary)

**Three-layer approach:**

| Layer | What | How |
|-------|------|-----|
| Backend | Don't send reset email to M365 users | `if (user.azureId) return genericSuccess` — silent skip, no info leakage |
| Frontend (Login) | "Forgot Password?" in local form only | Place link under email/password inputs, not near SSO button |
| Frontend (ForgotPasswordPage) | Hint text for M365 users | Secondary muted text: "Sign in with Microsoft? Reset via your organization." |

**Security:** All three layers return/display the same generic message regardless of user type — no information leakage about whether an email exists or what type of account it is.

### Source Tree Components
- `frontend/src/pages/ForgotPasswordPage.tsx` (new)
- `frontend/src/pages/ResetPasswordPage.tsx` (new)
- `frontend/src/pages/LoginPage.tsx` (modified — add Forgot Password link in local form area)
- `frontend/src/App.tsx` (modified — add routes)
- `backend/src/modules/auth/auth.service.ts` (modified — add azureId check in requestPasswordReset)

### Testing Standards
- Component tests for form validation
- Test success/error API response handling
- Verify redirect on success
- **M365 guard test:** Submit M365 user email → backend returns success but does NOT create PasswordResetToken or send email
- **Login page test:** "Forgot Password?" link visible in local form area, not near SSO button

### References
- Sprint 1: Auth API endpoints (14 endpoints)
- P1-7 from Post-MVP UI audit

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
