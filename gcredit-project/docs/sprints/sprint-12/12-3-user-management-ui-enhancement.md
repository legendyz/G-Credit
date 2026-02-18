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
  - [ ] Redesign table columns per design-direction.md
  - [ ] Add user avatar placeholder (initials)
  - [ ] Add role badge chips with color coding
  - [ ] Add status indicator (green dot / red dot)
  - [ ] Pagination with `PaginatedResponse<T>`
- [ ] Task 2: Search + filter bar (AC: #2, #3, #4)
  - [ ] Search input with debounce (300ms)
  - [ ] Role dropdown filter
  - [ ] Status dropdown filter
  - [ ] Clear filters button
- [ ] Task 3: Role edit functionality (AC: #5, #10)
  - [ ] Edit dialog with role selector
  - [ ] Confirmation: "Change Alice Smith from Employee to Issuer?"
  - [ ] API: `PATCH /api/admin/users/:id` (body: { role })
- [ ] Task 4: Lock/unlock functionality (AC: #6)
  - [ ] Lock button in actions column
  - [ ] Unlock resets `failedLoginAttempts` to 0
  - [ ] API: `PATCH /api/admin/users/:id` (body: { isLocked })
- [ ] Task 5: User detail panel/drawer (AC: #7)
  - [ ] Slide-out panel or dedicated section
  - [ ] Profile info, role, created date
  - [ ] Badge summary (count, recent badges)
  - [ ] Recent activity (from audit log)
- [ ] Task 6: Tests
  - [ ] Table rendering + filtering tests
  - [ ] Role change flow tests
  - [ ] Lock/unlock flow tests

## Dev Notes

### Architecture Patterns
- Enhance existing `UserManagementPage.tsx` — don't create new page
- Follow data table pattern from design-direction.md
- Role chips: Admin=blue, Issuer=gold, Manager=purple, Employee=gray
- Use Shadcn `Dialog` for confirmations

### Existing Backend Endpoints
- `GET /api/admin/users` — paginated, supports search + role filter
- `PATCH /api/admin/users/:id` — update role, isLocked
- `GET /api/admin/users/:id` — user detail (may need to add)

### ⚠️ Out of Scope
- User creation (M365 sync handles this, manual creation deferred)
- SSO/password changes (DEC-001~006 deferred)
- Bulk role changes

### ⚠️ Phase 2 Review Needed
- **Architecture Review:** User detail endpoint, audit log query for user activity
- **UX Review:** Table layout, detail panel slide-out vs drawer

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
