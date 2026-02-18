# Story 12.3: User Management UI Enhancement

Status: backlog

## Story

As an **Admin**,
I want an enhanced user management page with role editing, status toggling, filtering, and bulk actions,
So that I can efficiently manage all platform users without direct database access.

## Context

- Current `UserManagementPage.tsx` exists but has limited functionality
- Backend RBAC system is complete (4 roles: ADMIN, ISSUER, MANAGER, EMPLOYEE)
- User model includes: id, email, firstName, lastName, role, isLocked, badgeCount, etc.
- Account lockout system from Sprint 11 (Story 11.1) — `isLocked`, `failedLoginAttempts`
- M365 sync creates users with `passwordHash=null` — relevant for display but auth changes deferred
- DEC-001~006 (SSO/password decisions) NOT in Sprint 12 scope

## Acceptance Criteria

1. [ ] Admin can view all users in a data table with: name, email, role, status, badge count, last active
2. [ ] Admin can search users by name or email (debounced)
3. [ ] Admin can filter by role (Admin/Issuer/Manager/Employee)
4. [ ] Admin can filter by status (Active/Locked/Inactive)
5. [ ] Admin can edit a user's role via inline dropdown or edit dialog
6. [ ] Admin can lock/unlock a user account
7. [ ] Admin can view user detail panel (profile info + badge summary + activity)
8. [ ] Table supports pagination with page size selector
9. [ ] Row hover reveals action buttons (edit, view, lock/unlock)
10. [ ] Role change requires confirmation dialog
11. [ ] Route: `/admin/users` (already exists, enhance existing page)

## Tasks / Subtasks

- [ ] Task 1: Enhance `UserManagementPage` data table (AC: #1, #8, #9)
  - [ ] Wrap in `<AdminPageShell>` (from Story 12.1)
  - [ ] Redesign table columns per design-direction.md
  - [ ] Add user avatar placeholder (initials circle)
  - [ ] Add role badge chips with color coding: ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray
  - [ ] Add status indicator (green dot=active, red dot=locked)
  - [ ] Pagination with `PaginatedResponse<T>` (standardized per CQ-007)
- [ ] Task 2: Search + filter bar (AC: #2, #3, #4)
  - [ ] Search input with debounce (300ms) — searches name AND email simultaneously
  - [ ] Role dropdown filter
  - [ ] Status dropdown filter
  - [ ] Clear filters button
- [ ] Task 3: Role edit functionality (AC: #5, #10)
  - [ ] Edit dialog with role selector
  - [ ] Confirmation via shared `<ConfirmDialog>`: "Change Alice Smith from Employee to Issuer?"
  - [ ] **Self-demotion guard:** Admin cannot change their OWN role (backend 403 + frontend disable)
  - [ ] API: `PATCH /api/admin/users/:id` (body: { role })
- [ ] Task 4: Lock/unlock functionality (AC: #6)
  - [ ] **Toggle switch** (Shadcn `Switch`) — not a button — visual state is clearer
  - [ ] Lock confirmation via `<ConfirmDialog>`: "Lock account for jane@example.com? They won't be able to sign in."
  - [ ] Unlock resets `failedLoginAttempts` to 0
  - [ ] API: `PATCH /api/admin/users/:id` (body: { isLocked })
- [ ] Task 5: User detail slide-over panel (AC: #7)
  - [ ] Slide-over from RIGHT side (standard pattern)
  - [ ] Show: avatar, name, email, role, lock status, badge count, last login date, created date
  - [ ] Badge summary section (count + recent badges)
  - [ ] Recent activity section (from audit log)
  - [ ] Compose from existing APIs (no new backend endpoint needed)
- [ ] Task 6: Tests
  - [ ] Table rendering + filtering tests
  - [ ] Role change flow tests (including self-demotion guard)
  - [ ] Lock/unlock toggle tests
  - [ ] Slide-over panel render tests

## Dev Notes

### Architecture Patterns
- Enhance existing `UserManagementPage.tsx` — don't create new page
- Wrap in `<AdminPageShell>` from Story 12.1
- Use `<ConfirmDialog>` from Story 12.1 for role change + lock confirmations
- Follow data table pattern from design-direction.md
- Role badge colors: ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray
- Lock/unlock: Shadcn `Switch` (toggle) — not a button
- Slide-over: render from RIGHT side using Shadcn `Sheet` component
- Use Shadcn `Dialog` for role change confirmation

### Existing Backend Endpoints
- `GET /api/admin/users` — paginated, supports search + role filter
- `PATCH /api/admin/users/:id` — update role, isLocked
- `GET /api/admin/users/:id` — user detail (may need to add)

### ⚠️ Out of Scope
- User creation (M365 sync handles this, manual creation deferred)
- SSO/password changes (DEC-001~006 deferred)
- Bulk role changes

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Self-demotion guard (backend 403 + frontend disable), no new backend endpoint needed (compose from existing APIs for detail panel)
- **UX (Sally):** Toggle switch for lock/unlock (not button), role colors ADMIN=red/ISSUER=blue/MANAGER=purple/EMPLOYEE=gray, debounced search (name+email), slide-over from RIGHT, specific confirm dialog text
- **Estimate confirmed:** 10h

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
