# Story 15.9: Styled Delete Confirmation Modal (P2-5)

**Status:** done  
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

1. [x] All `window.confirm()` calls replaced with styled `AlertDialog` component
2. [x] Dialog uses shadcn/ui `AlertDialog` with destructive variant
3. [x] Dialog includes: title, description of what will be deleted, Cancel + Delete buttons
4. [x] Delete button uses `destructive` variant (red) styling
5. [x] Dialog is accessible (keyboard navigable, focus trap, ARIA labels)
6. [x] Lucide icon (AlertTriangle or Trash2) in dialog header

## Tasks / Subtasks

- [x] **Task 1: Audit existing confirm() usage** (AC: #1)
  - [x] Search for `window.confirm`, `confirm(` in frontend source
  - [x] List all locations and their destructive action context
- [x] **Task 2: Create ConfirmDeleteDialog component** (AC: #2, #3, #4, #5, #6)
  - [x] Use shadcn/ui `AlertDialog` (AlertDialogTrigger, AlertDialogContent, etc.)
  - [x] Props: `title`, `description`, `onConfirm`, `isLoading`
  - [x] Destructive button styling
  - [x] Lucide AlertTriangle icon
- [x] **Task 3: Replace all usages** (AC: #1)
  - [x] Replace each `window.confirm()` with `ConfirmDeleteDialog`
  - [x] Ensure async delete operations show loading state in dialog
- [x] **Task 4: Test** (AC: #5)
  - [x] Test dialog opens on trigger
  - [x] Test cancel closes dialog without action
  - [x] Test confirm triggers delete callback

## Dev Notes

### Source Tree Components
- `frontend/src/components/ui/ConfirmDeleteDialog.tsx` (new)
- Various pages with delete actions (modified)

### References
- shadcn/ui AlertDialog: https://ui.shadcn.com/docs/components/alert-dialog
- P2-5 from Post-MVP UI audit

## Dev Agent Record

## Review Follow-ups (AI)

### Story 15.9 CR Verdict (2026-03-02)

**Result:** APPROVED  
**AC Coverage:** 6/6 verified

### AC Mapping

- **AC#1:** Verified. `window.confirm()` flow in `BadgeTemplateListPage` replaced by state-driven `ConfirmDeleteDialog` open/confirm handlers.
- **AC#2:** Verified. `ConfirmDeleteDialog` implemented with shadcn/ui `AlertDialog` primitives.
- **AC#3:** Verified. Dialog renders title, description, Cancel, and Delete actions.
- **AC#4:** Verified. Confirm action uses destructive red styling (`bg-destructive text-destructive-foreground`).
- **AC#5:** Verified. Uses Radix/shadcn alert-dialog accessibility behavior (focus trap + keyboard navigation); tests cover open/confirm/cancel interaction.
- **AC#6:** Verified. Lucide icon present in header (`TriangleAlert`).

### Validation Evidence (review-side)

- Diff scope: `git diff HEAD~1 --stat` → 6 files changed (`+361/-43`)
- Type check: `npx tsc --noEmit` → `TSC_EXIT_CODE=0`
- Lint: `npm run lint` → `LINT_EXIT_CODE=0`
- Tests: `npm test -- --run` → `79/79` files pass, `844/844` tests pass (`TEST_EXIT_CODE=0`)

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Audited frontend: only one raw `confirm()` call existed — in `BadgeTemplateListPage.tsx` line 205
- Created `ConfirmDeleteDialog` component using shadcn/ui `AlertDialog` with `TriangleAlert` Lucide icon (destructive color), Cancel + Delete buttons, loading state support
- Refactored `BadgeTemplateListPage`: replaced `handleDelete` (with `confirm()`) with `handleDeleteRequest` + `handleDeleteConfirm` pattern using `deleteTarget` state
- Updated test: removed `window.confirm` mock, tests now interact with the styled dialog (open → confirm/cancel)
- `alert-dialog.tsx` primitive already installed from Story 15.12

### File List
- `frontend/src/components/ui/ConfirmDeleteDialog.tsx` — New (AlertDialog-based delete confirmation)
- `frontend/src/pages/admin/BadgeTemplateListPage.tsx` — Modified (replace `confirm()` with dialog state)
- `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx` — Modified (test dialog interaction)
