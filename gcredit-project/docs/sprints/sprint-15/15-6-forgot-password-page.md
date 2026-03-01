# Story 15.6: Forgot Password Page (P1-7)

**Status:** backlog  
**Priority:** MEDIUM  
**Estimate:** 2h  
**Wave:** 3 — UI Polish  
**Source:** P1-7 (Post-MVP UI Audit)  
**Dependencies:** None (backend already has password reset endpoints)

---

## Story

**As a** user who has forgotten their password,  
**I want** a dedicated Forgot Password page with proper UI,  
**So that** I can reset my password through a user-friendly flow.

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
- [ ] **Task 4: Update Login page** (AC: #1)
  - [ ] Add "Forgot Password?" link below login form
  - [ ] Link navigates to `/forgot-password`
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

### Source Tree Components
- `frontend/src/pages/ForgotPasswordPage.tsx` (new)
- `frontend/src/pages/ResetPasswordPage.tsx` (new)
- `frontend/src/pages/LoginPage.tsx` (modified — add link)
- `frontend/src/App.tsx` (modified — add routes)

### Testing Standards
- Component tests for form validation
- Test success/error API response handling
- Verify redirect on success

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
