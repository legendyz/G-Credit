# Story 15.11: z-index Scale in Tailwind Theme (P2-8)

**Status:** done  
**Priority:** LOW  
**Estimate:** 1h  
**Wave:** 3 — UI Polish  
**Source:** P2-8 (Post-MVP UI Audit)  
**Dependencies:** 15.3 (Sidebar — introduces new z-index layers)

---

## Story

**As a** developer building UI components with overlapping layers,  
**I want** a standardized z-index scale defined in the Tailwind theme,  
**So that** modals, toasts, sidebars, and dropdowns layer correctly without ad-hoc values.

## Acceptance Criteria

1. [x] z-index scale defined in `tailwind.config.js` or `@theme` block
2. [x] Scale covers: base(0), dropdown(10), sticky(20), sidebar(30), modal(40), toast(50), tooltip(60)
3. [x] All existing ad-hoc z-index values migrated to use scale tokens
4. [x] Sidebar z-index fits correctly between sticky and modal layers
5. [x] Sonner toast renders above modals
6. [x] No z-index conflicts between components

## Tasks / Subtasks

- [x] **Task 1: Define z-index scale** (AC: #1, #2)
  - [x] Add z-index tokens to Tailwind theme (`@theme` or `tailwind.config.js`)
  - [x] Scale: `z-base: 0`, `z-dropdown: 10`, `z-sticky: 20`, `z-sidebar: 30`, `z-modal: 40`, `z-toast: 50`, `z-tooltip: 60`
- [x] **Task 2: Audit existing z-index usage** (AC: #3)
  - [x] Search for `z-index`, `z-[` in frontend source
  - [x] Map each usage to appropriate scale token
- [x] **Task 3: Migrate values** (AC: #3, #4, #5)
  - [x] Replace hardcoded z-index values with Tailwind z-index classes
  - [x] Verify Sidebar uses `z-sidebar` (z-30)
  - [x] Verify Sonner toast portal uses `z-toast` (z-50)
  - [x] Verify modals use `z-modal` (z-40)
- [x] **Task 4: Visual verification** (AC: #6)
  - [x] Open sidebar + modal simultaneously → modal above sidebar
  - [x] Open toast while modal open → toast above modal
  - [x] Dropdown in content area → above content, below sidebar

## Dev Notes

### z-index Scale
```
z-base:     0    — normal content flow
z-dropdown: 10   — dropdown menus, popovers
z-sticky:   20   — sticky headers, floating action buttons
z-sidebar:  30   — sidebar navigation
z-modal:    40   — dialog/modal overlays
z-toast:    50   — toast notifications (Sonner)
z-tooltip:  60   — tooltips (highest)
```

### Source Tree Components
- `frontend/tailwind.config.js` or `frontend/src/index.css` `@theme` block (modified)
- Various components with z-index values (modified)

### References
- P2-8 from Post-MVP UI audit
- ADR-009: Tailwind v4 `@theme` configuration

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Added 7 z-index tokens to `@theme` block in `index.css`: base(0), dropdown(10), sticky(20), sidebar(30), modal(40), toast(50), tooltip(60)
- Migrated 30 z-index usages across 27 files:
  - Group A: 3 arbitrary values (z-[9999], z-[10000], z-[10001]) → z-modal
  - Group B: 7 custom modals z-50 → z-modal
  - Group C: shadcn/ui primitives (dialog, alert-dialog, sheet, select, tooltip)
  - Group D: sidebar z-10/z-20 → z-sidebar
  - Group E: 4 sticky headers z-10 → z-sticky
  - Group F: 4 dropdowns z-10/z-20 → z-dropdown/z-sticky
  - Group G: 2 custom tooltips z-50 → z-tooltip
  - accessibility.css: z-index: 9999 → var(--z-tooltip)
- Group H (3 files) intentionally kept: internal/relative z-10 within parent containers
- Sonner toast z-index overridden via `toastOptions.style` in App.tsx
- Post-migration grep: 0 arbitrary z-[N] values, only 3 intentional z-10 remnants (Group H)

### File List
- `frontend/src/index.css` — Modified (z-index scale in @theme)
- `frontend/src/App.tsx` — Modified (Sonner toast z-index override)
- `frontend/src/styles/accessibility.css` — Modified (skip-link z-index)
- `frontend/src/components/ui/dialog.tsx` — Modified (z-50 → z-modal ×2)
- `frontend/src/components/ui/alert-dialog.tsx` — Modified (z-50 → z-modal ×2)
- `frontend/src/components/ui/sheet.tsx` — Modified (z-50 → z-modal ×2)
- `frontend/src/components/ui/select.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/ui/tooltip.tsx` — Modified (z-50 → z-tooltip)
- `frontend/src/components/ui/sidebar.tsx` — Modified (z-10 → z-sidebar, z-20 → z-sidebar)
- `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` — Modified (z-[9999] → z-modal)
- `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` — Modified (z-[10000] → z-modal)
- `frontend/src/components/ClaimSuccessModal.tsx` — Modified (z-[10001] → z-modal)
- `frontend/src/components/admin/CreateUserDialog.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/admin/DeactivateUserDialog.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/admin/DeleteUserDialog.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/admin/EditRoleDialog.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/admin/CategoryTree.tsx` — Modified (z-50 → z-tooltip)
- `frontend/src/components/admin/M365SyncPanel.tsx` — Modified (z-10 → z-sticky)
- `frontend/src/components/BulkIssuance/BulkResultPage.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/BulkIssuance/ProcessingModal.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx` — Modified (z-10 → z-dropdown ×2)
- `frontend/src/components/common/LoadingSpinner.tsx` — Modified (z-50 → z-modal)
- `frontend/src/components/search/BadgeSearchBar.tsx` — Modified (z-10 → z-sticky)
- `frontend/src/components/search/SearchInput.tsx` — Modified (z-10 → z-sticky, z-20 → z-sticky)
- `frontend/src/components/search/SkillsFilter.tsx` — Modified (z-20 → z-sticky)
- `frontend/src/components/TimelineView/TimelineView.tsx` — Modified (z-10 → z-sticky)
- `frontend/src/pages/admin/SkillManagementPage.tsx` — Modified (z-50 → z-tooltip)
## Review Follow-ups (AI)

### Story 15.11 CR Verdict (2026-03-02)

**Result:** APPROVED  
**AC Coverage:** 6/6 verified

### AC Mapping

- **AC#1:** Verified. 7 z-index tokens added to `@theme` block in `index.css` (`--z-base` through `--z-tooltip`).
- **AC#2:** Verified. Scale: base(0), dropdown(10), sticky(20), sidebar(30), modal(40), toast(50), tooltip(60).
- **AC#3:** Verified. 30 z-index usages migrated across 27 files. Zero arbitrary `z-[N]` values remain. 3 intentional `z-10` kept (internal/relative contexts within parent containers — Group H).
- **AC#4:** Verified. Sidebar uses `z-sidebar` (30), sits between sticky(20) and modal(40).
- **AC#5:** Verified. Sonner toast overridden via `toastOptions.style: { zIndex: 'var(--z-toast)' }` in App.tsx (z-toast=50 > z-modal=40).
- **AC#6:** Verified. Layering: content(0) < dropdown(10) < sticky(20) < sidebar(30) < modal(40) < toast(50) < tooltip(60). Select uses `z-modal` (portaled, must exceed sidebar). No conflicts.

### Validation Evidence (review-side)

- Diff scope: `git diff HEAD~1 --stat` → 29 files changed (`+299/-57`)
- Orphan check: `grep z-\[` → 0 results (all arbitrary values eliminated)
- Commit message confirms: 0 lint errors | 0 TS errors | 844/844 tests pass