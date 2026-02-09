# Story 10.6b: Single Badge Issuance UI

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 6h  
**Sprint:** Sprint 10  
**Type:** Feature Enhancement  
**Dependencies:** Phase 1 & 2 complete  
**Discovered:** Sprint Planning review (2026-02-09)

---

## Story

As an **Issuer**,  
I want **a form to issue a single badge to an employee through the UI**,  
So that **I can award badges without creating a CSV file for bulk upload**.

## Background

The backend API for single badge issuance (`POST /api/badges`) was completed in Sprint 3 (Story 4.1) with full validation, Open Badges 2.0 compliance, and tests. However, no frontend UI was ever built for it. Currently, the only way to issue a badge through the UI is via the Bulk Issuance flow (CSV upload), which is impractical for awarding a single badge. The IssuerDashboard "Issue New Badge" button incorrectly points to `/admin/badges` (the management list), not an issuance form.

## Acceptance Criteria

1. [ ] New route `/admin/badges/issue` with `IssueBadgePage` component
2. [ ] Issue badge form with fields: Template selector, Recipient selector, Evidence URL (optional), Expiry days (optional)
3. [ ] Template selector loads from `GET /api/badge-templates` (only ACTIVE templates)
4. [ ] Recipient selector searches users via existing API
5. [ ] Form validation matches backend DTO (templateId: UUID required, recipientId: UUID required, evidenceUrl: URL format, expiresIn: 1-3650 days)
6. [ ] Success state: Sonner toast + redirect to badge management page
7. [ ] Error handling: API errors displayed via Sonner toast (not window.alert)
8. [ ] IssuerDashboard "Issue New Badge" button updated to navigate to `/admin/badges/issue`
9. [ ] AdminDashboard "Issue New Badge" (if exists) also updated
10. [ ] Route protected: only ADMIN and ISSUER roles can access
11. [ ] Unit tests for IssueBadgeForm component (minimum 5 tests)
12. [ ] All existing tests still pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: API Service Function** (0.5h)
  - [ ] Add `issueBadge()` to `frontend/src/lib/badgesApi.ts`
  - [ ] Type: `(data: { templateId: string; recipientId: string; evidenceUrl?: string; expiresIn?: number }) => Promise<Badge>`
  - [ ] POST to `/api/badges` with JWT auth header

- [ ] **Task 2: IssueBadgePage Component** (3-4h)
  - [ ] Create `frontend/src/pages/IssueBadgePage.tsx`
  - [ ] Page layout: Card with form, consistent with existing admin pages
  - [ ] Template selector: Dropdown/Combobox loading ACTIVE templates
  - [ ] Recipient selector: User search (use existing admin users API or badge recipients API)
  - [ ] Evidence URL input: Optional text field with URL validation
  - [ ] Expiry days input: Optional number field (1-3650)
  - [ ] Submit button with loading state
  - [ ] Success: `toast.success()` + `navigate('/admin/badges')`
  - [ ] Error: `toast.error()` with server error message
  - [ ] Use shadcn/ui components (Card, Button, Select, Input, Label)

- [ ] **Task 3: Route Registration** (0.25h)
  - [ ] Add route `/admin/badges/issue` in `App.tsx`
  - [ ] Wrap with `ProtectedRoute` requiring `ADMIN` or `ISSUER` role
  - [ ] Place inside Layout wrapper

- [ ] **Task 4: Fix Dashboard Navigation** (0.25h)
  - [ ] IssuerDashboard: "Issue New Badge" → `/admin/badges/issue`
  - [ ] AdminDashboard: Update if similar button exists
  - [ ] Navbar: Consider adding "Issue Badge" link for Issuer/Admin

- [ ] **Task 5: Tests** (2h)
  - [ ] Unit test: Form renders correctly
  - [ ] Unit test: Template dropdown loads from API
  - [ ] Unit test: Form validation (required fields)
  - [ ] Unit test: Successful submission → toast + redirect
  - [ ] Unit test: API error → toast.error
  - [ ] Integration: Route accessible to ISSUER, blocked for EMPLOYEE

## Dev Notes

### Backend API (Already Complete)
```
POST /api/badges
Auth: JWT + ADMIN/ISSUER role
Body: {
  templateId: string (UUID, required)
  recipientId: string (UUID, required)
  evidenceUrl?: string (URL format)
  expiresIn?: number (1-3650 days)
}
Response: Badge object with template/recipient/issuer relations
```

### Existing Patterns to Follow
- **Form pattern:** See `LoginPage.tsx` for form with validation + toast
- **API service:** See `badgesApi.ts` for existing API wrapper pattern
- **Admin page:** See `BulkIssuancePage.tsx` for admin layout with Card wrapper
- **Toast:** Use `sonner` — `toast.success()`, `toast.error()`
- **Navigation:** Use `react-router-dom` — `useNavigate()`
- **Role guard:** Use `ProtectedRoute` with `requiredRoles` prop

### Coding Standards
- No Chinese characters in source files
- No `console.log` — use Sonner toasts for user feedback
- shadcn/ui components for all form elements
- TypeScript strict mode — no `any` types
- ESLint: `--max-warnings=0`
- File naming: kebab-case
- Component naming: PascalCase

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
