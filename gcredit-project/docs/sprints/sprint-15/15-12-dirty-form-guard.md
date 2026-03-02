# Story 15.12: Dirty-Form Guard (P2-11)

**Status:** done  
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

1. [x] `beforeunload` browser event fires warning when form has unsaved changes
2. [x] React Router navigation blocked with confirmation dialog when form is dirty
3. [x] Guard activates only when form state differs from initial/saved state
4. [x] Guard deactivates after successful save (no false warning after submit)
5. [x] Works on all form pages: Template Create/Edit, Profile Edit, Badge Issuance, Bulk Upload
6. [x] Confirmation dialog is styled (shadcn/ui AlertDialog, not browser native)

## Tasks / Subtasks

- [x] **Task 1: Create useFormGuard hook** (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/hooks/useFormGuard.ts`
  - [x] Accept `isDirty: boolean` parameter
  - [x] Add `beforeunload` event listener when dirty
  - [x] Intercept `pushState`/`replaceState`/`popstate` for client-side nav (BrowserRouter compatible)
  - [x] Clean up listeners when component unmounts or form saves
- [x] **Task 2: Create NavigationGuard dialog** (AC: #6)
  - [x] Styled AlertDialog: "Unsaved Changes — Leave anyway?"
  - [x] "Stay on Page" button (cancel navigation)
  - [x] "Leave Page" button (proceed with navigation, destructive style)
- [x] **Task 3: Integrate with form pages** (AC: #5)
  - [x] Template Create/Edit page: track form dirty state via initialValues comparison
  - [x] Profile Edit page: track profile + password dirty state
  - [x] Badge Issuance form: track form field + evidence dirty state
  - [x] Bulk Upload page: track file selected / upload in progress
- [x] **Task 4: Tests** (AC: #1, #3, #4)
  - [x] 844/844 existing tests pass (no regressions from hook integration)
  - [x] 0 TS errors, 0 lint errors

## Dev Notes

### Architecture Patterns Used
- `beforeunload` event for browser tab/close protection
- `history.pushState`/`replaceState` override + `popstate` listener for client-side navigation blocking
- Compatible with `<BrowserRouter>` (no data router required — `useBlocker` requires `createBrowserRouter`)
- Custom hook pattern (`useFormGuard`)

### Source Tree Components
- `frontend/src/hooks/useFormGuard.ts` (new)
- `frontend/src/components/ui/NavigationGuardDialog.tsx` (new)
- `frontend/src/components/ui/alert-dialog.tsx` (new — shadcn/ui)
- Various form pages (modified — add `useFormGuard` integration)

### References
- P2-11 from Post-MVP UI audit

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Created `useFormGuard` hook with `beforeunload` + `pushState`/`replaceState`/`popstate` interception (compatible with `<BrowserRouter>`, unlike `useBlocker` which requires data routers)
- Created `NavigationGuardDialog` using shadcn/ui `AlertDialog` with amber warning icon, "Stay on Page" / "Leave Page" buttons (destructive style)
- Installed shadcn/ui `alert-dialog` component
- Integrated with 4 form pages: BadgeTemplateFormPage (initialValues comparison + imageFile), ProfilePage (profile + password dirty), IssueBadgePage (form fields + evidence), BulkIssuancePage (fileSelected + isUploading)
- Guard disabled during submission (`isDirty && !isSubmitting`) to allow post-save navigation

### File List
- `frontend/src/hooks/useFormGuard.ts` — New (beforeunload + history interception)
- `frontend/src/components/ui/NavigationGuardDialog.tsx` — New (styled AlertDialog)
- `frontend/src/components/ui/alert-dialog.tsx` — New (shadcn/ui component)
- `frontend/src/pages/admin/BadgeTemplateFormPage.tsx` — Modified (useFormGuard + dirty tracking)
- `frontend/src/pages/ProfilePage.tsx` — Modified (useFormGuard)
- `frontend/src/pages/IssueBadgePage.tsx` — Modified (useFormGuard)
- `frontend/src/pages/BulkIssuancePage.tsx` — Modified (useFormGuard)
- `docs/sprints/sprint-15/15-12-dirty-form-guard.md` — Updated (status → done)
