# Story 16.3: Template Edit/Update Ownership Guard

Status: ready-for-dev

## Story
As an **Issuer**,
I want **to only edit and manage templates I created**,
So that **I cannot modify another Issuer's templates and template integrity is maintained**.

## Acceptance Criteria
1. [ ] `PUT /badge-templates/:id` checks `template.createdBy === userId` for ISSUER role
2. [ ] `PATCH /badge-templates/:id/status` checks ownership for ISSUER role
3. [ ] ADMIN can edit/update any template (no ownership check)
4. [ ] Returns 403 Forbidden with clear message on ownership violation
5. [ ] Frontend `BadgeTemplateManagementPage` only shows edit/delete actions for owned templates (ISSUER)
6. [ ] Existing delete ownership check (ARCH-P1-004) remains functional

## Tasks / Subtasks
- [ ] Task 1: Add ownership check in `badge-templates.controller.ts` `update()` (AC: #1, #3, #4)
  - [ ] Same pattern as existing `remove()` method (ARCH-P1-004)
  - [ ] `if (userRole === ISSUER && template.createdBy !== userId) → 403`
- [ ] Task 2: Add ownership check in status change endpoint (AC: #2, #4)
  - [ ] Apply to activate/archive/deactivate operations
- [ ] Task 3: Frontend — hide edit/delete buttons for non-owned templates (AC: #5)
  - [ ] `BadgeTemplateManagementPage`: compare `template.createdBy` with current user ID
  - [ ] Show view-only mode for other Issuers' templates
- [ ] Task 4: Unit + E2E tests (AC: #1-#6)
  - [ ] Test: Issuer edits own template → 200 OK
  - [ ] Test: Issuer edits other's template → 403 Forbidden
  - [ ] Test: Admin edits any template → 200 OK
  - [ ] Test: Delete ownership still works (regression)

## Dev Notes
### Architecture Patterns Used
- **ARCH-P1-004 extension:** Same pattern as `remove()`, applied to `update()` and status changes
- Reference code in `badge-templates.controller.ts` lines 312-328 (delete ownership check)

### Source Tree Components
- `backend/src/badge-templates/badge-templates.controller.ts` — update, updateStatus methods
- `frontend/src/pages/BadgeTemplateManagementPage.tsx` — edit/delete action visibility

### Testing Standards
- Backend unit test: ownership check for update and status change
- Frontend test: conditional rendering of edit/delete buttons

## Code Review Strategy
- 🔴 HIGH risk — AI Review (authorization change)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
