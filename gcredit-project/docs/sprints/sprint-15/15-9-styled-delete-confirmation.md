# Story 15.9: Styled Delete Confirmation Modal (P2-5)

**Status:** backlog  
**Priority:** LOW  
**Estimate:** 1h  
**Wave:** 3 — UI Polish  
**Source:** P2-5 (Post-MVP UI Audit)  
**Dependencies:** None

---

## Story

**As a** user performing destructive actions (delete template, revoke badge),  
**I want** a styled confirmation dialog instead of browser's native `confirm()`,  
**So that** the experience is consistent with the application's design system.

## Acceptance Criteria

1. [ ] All `window.confirm()` calls replaced with styled `AlertDialog` component
2. [ ] Dialog uses shadcn/ui `AlertDialog` with destructive variant
3. [ ] Dialog includes: title, description of what will be deleted, Cancel + Delete buttons
4. [ ] Delete button uses `destructive` variant (red) styling
5. [ ] Dialog is accessible (keyboard navigable, focus trap, ARIA labels)
6. [ ] Lucide icon (AlertTriangle or Trash2) in dialog header

## Tasks / Subtasks

- [ ] **Task 1: Audit existing confirm() usage** (AC: #1)
  - [ ] Search for `window.confirm`, `confirm(` in frontend source
  - [ ] List all locations and their destructive action context
- [ ] **Task 2: Create ConfirmDeleteDialog component** (AC: #2, #3, #4, #5, #6)
  - [ ] Use shadcn/ui `AlertDialog` (AlertDialogTrigger, AlertDialogContent, etc.)
  - [ ] Props: `title`, `description`, `onConfirm`, `isLoading`
  - [ ] Destructive button styling
  - [ ] Lucide AlertTriangle icon
- [ ] **Task 3: Replace all usages** (AC: #1)
  - [ ] Replace each `window.confirm()` with `ConfirmDeleteDialog`
  - [ ] Ensure async delete operations show loading state in dialog
- [ ] **Task 4: Test** (AC: #5)
  - [ ] Test dialog opens on trigger
  - [ ] Test cancel closes dialog without action
  - [ ] Test confirm triggers delete callback

## Dev Notes

### Source Tree Components
- `frontend/src/components/ui/ConfirmDeleteDialog.tsx` (new)
- Various pages with delete actions (modified)

### References
- shadcn/ui AlertDialog: https://ui.shadcn.com/docs/components/alert-dialog
- P2-5 from Post-MVP UI audit

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
