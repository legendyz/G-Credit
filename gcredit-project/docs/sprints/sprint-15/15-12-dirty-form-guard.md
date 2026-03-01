# Story 15.12: Dirty-Form Guard (P2-11)

**Status:** backlog  
**Priority:** MEDIUM  
**Estimate:** 2h  
**Wave:** 3 — UI Polish  
**Source:** P2-11 (Post-MVP UI Audit)  
**Dependencies:** None

---

## Story

**As a** user editing a form (template creation, profile update, etc.),  
**I want** a warning when I try to navigate away with unsaved changes,  
**So that** I don't accidentally lose my work.

## Acceptance Criteria

1. [ ] `beforeunload` browser event fires warning when form has unsaved changes
2. [ ] React Router navigation blocked with confirmation dialog when form is dirty
3. [ ] Guard activates only when form state differs from initial/saved state
4. [ ] Guard deactivates after successful save (no false warning after submit)
5. [ ] Works on all form pages: Template Create/Edit, Profile Edit, Badge Issuance, Bulk Upload
6. [ ] Confirmation dialog is styled (shadcn/ui AlertDialog, not browser native)

## Tasks / Subtasks

- [ ] **Task 1: Create useFormGuard hook** (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/hooks/useFormGuard.ts`
  - [ ] Accept `isDirty: boolean` parameter
  - [ ] Add `beforeunload` event listener when dirty
  - [ ] Use React Router `useBlocker` (or `unstable_useBlocker`) for client-side nav
  - [ ] Clean up listeners when component unmounts or form saves
- [ ] **Task 2: Create NavigationGuard dialog** (AC: #6)
  - [ ] Styled AlertDialog: "You have unsaved changes. Leave anyway?"
  - [ ] "Stay" button (cancel navigation)
  - [ ] "Leave" button (proceed with navigation, discard changes)
- [ ] **Task 3: Integrate with form pages** (AC: #5)
  - [ ] Template Create/Edit page: track form dirty state
  - [ ] Profile Edit page: track form dirty state
  - [ ] Badge Issuance form: track form dirty state
  - [ ] Bulk Upload page: track upload in progress
- [ ] **Task 4: Tests** (AC: #1, #3, #4)
  - [ ] Test guard activates when form is dirty
  - [ ] Test guard deactivates after save
  - [ ] Test navigation blocked and dialog shown

## Dev Notes

### Architecture Patterns Used
- `beforeunload` event for browser tab/close protection
- React Router `useBlocker` for client-side route change protection
- Custom hook pattern (`useFormGuard`)

### Source Tree Components
- `frontend/src/hooks/useFormGuard.ts` (new)
- `frontend/src/components/ui/NavigationGuardDialog.tsx` (new)
- Various form pages (modified — add `useFormGuard` integration)

### References
- P2-11 from Post-MVP UI audit
- React Router `useBlocker` docs

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
