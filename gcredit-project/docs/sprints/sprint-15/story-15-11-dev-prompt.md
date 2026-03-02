# Dev Prompt — Story 15.11: z-index Scale in Tailwind Theme

## Context

G-Credit frontend (React 19 + Tailwind v4 + shadcn/ui). The project currently uses a mix of ad-hoc `z-[9999]`, `z-[10000]`, `z-[10001]` arbitrary values and standard Tailwind `z-10`, `z-20`, `z-50` classes with no semantic naming. This story introduces a standardized z-index scale via the `@theme` block and migrates all existing z-index usage to semantic tokens.

**Branch:** `sprint-15/ui-overhaul-dashboard`
**Tailwind v4:** Uses `@theme` block in `frontend/src/index.css` — NOT `tailwind.config.js` (which is empty).

---

## Task 1: Define z-index Scale in @theme (AC #1, #2)

Add the following z-index tokens to the **second `@theme` block** (the non-inline one) in `frontend/src/index.css`, after the existing typography/color definitions:

```css
/* === z-index Scale === */
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-sidebar: 30;
--z-modal: 40;
--z-toast: 50;
--z-tooltip: 60;
```

In Tailwind v4, `--z-<name>: <value>` in `@theme` generates utility classes `z-<name>` → `z-index: <value>`. So `z-modal` maps to `z-index: 40`.

> **Note:** The existing numeric classes (`z-10`, `z-20`, `z-50`) remain available. We're adding semantic aliases, then migrating usage.

---

## Task 2: Migrate All Ad-hoc and Numeric z-index Values (AC #3, #4, #5)

### Migration Map

Below is the complete audit of every z-index usage in the frontend. Apply each migration exactly.

#### Group A — Ad-hoc Arbitrary Values (MUST migrate)

| # | File | Line | Current | → New | Reason |
|---|------|------|---------|-------|--------|
| A1 | `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | 201 | `z-[9999]` | `z-modal` | Modal overlay |
| A2 | `src/components/BadgeShareModal/BadgeShareModal.tsx` | 259 | `z-[10000]` | `z-modal` | Modal overlay |
| A3 | `src/components/ClaimSuccessModal.tsx` | 39 | `z-[10001]` | `z-modal` | Modal overlay |
| A4 | `src/styles/accessibility.css` | 15 | `z-index: 9999` | `z-index: var(--z-tooltip)` | Skip link — must be above everything visible (use tooltip=60, highest in scale) |

#### Group B — Custom Modals (z-50 → z-modal)

| # | File | Line | Current | → New |
|---|------|------|---------|-------|
| B1 | `src/components/admin/CreateUserDialog.tsx` | 169 | `z-50` | `z-modal` |
| B2 | `src/components/admin/DeactivateUserDialog.tsx` | 93 | `z-50` | `z-modal` |
| B3 | `src/components/admin/DeleteUserDialog.tsx` | 67 | `z-50` | `z-modal` |
| B4 | `src/components/admin/EditRoleDialog.tsx` | 207 | `z-50` | `z-modal` |
| B5 | `src/components/BulkIssuance/BulkResultPage.tsx` | 744 | `z-50` | `z-modal` |
| B6 | `src/components/BulkIssuance/ProcessingModal.tsx` | 74 | `z-50` | `z-modal` |
| B7 | `src/components/common/LoadingSpinner.tsx` | 44 | `z-50` | `z-modal` |

#### Group C — shadcn/ui Primitives

| # | File | Lines | Current | → New | Notes |
|---|------|-------|---------|-------|-------|
| C1 | `src/components/ui/dialog.tsx` | 24, 41 | `z-50` (×2) | `z-modal` | DialogOverlay + DialogContent |
| C2 | `src/components/ui/alert-dialog.tsx` | 19, 37 | `z-50` (×2) | `z-modal` | AlertDialogOverlay + AlertDialogContent |
| C3 | `src/components/ui/sheet.tsx` | 24, 34 | `z-50` (×2) | `z-modal` | SheetOverlay + SheetContent (side panel overlay) |
| C4 | `src/components/ui/select.tsx` | 71 | `z-50` | `z-modal` | Portaled via Radix — must be above sidebar (30). Use z-modal (40) NOT z-dropdown (10) because portaled selects compete with sidebar in root stacking context |
| C5 | `src/components/ui/tooltip.tsx` | 21 | `z-50` | `z-tooltip` | Highest layer |

#### Group D — Sidebar (z-10/z-20 → z-sidebar)

| # | File | Line | Current | → New |
|---|------|------|---------|-------|
| D1 | `src/components/ui/sidebar.tsx` | 248 | `z-10` | `z-sidebar` |
| D2 | `src/components/ui/sidebar.tsx` | 312 | `z-20` | `z-sidebar` |

#### Group E — Sticky Headers (z-10 → z-sticky)

| # | File | Line | Current | → New | Notes |
|---|------|------|---------|-------|-------|
| E1 | `src/components/admin/M365SyncPanel.tsx` | 159 | `z-10` | `z-sticky` | Sticky table header |
| E2 | `src/components/search/BadgeSearchBar.tsx` | 109 | `z-10` | `z-sticky` | Sticky search bar |
| E3 | `src/components/search/SearchInput.tsx` | 133 | `z-10` | `z-sticky` | Sticky search input |
| E4 | `src/components/TimelineView/TimelineView.tsx` | 300 | `z-10` | `z-sticky` | Sticky timeline header |

#### Group F — Dropdowns / Popovers (non-portaled)

| # | File | Line | Current | → New | Notes |
|---|------|------|---------|-------|-------|
| F1 | `src/components/BulkIssuance/TemplateSelector.tsx` | 150 | `z-10` | `z-dropdown` | Non-portaled absolute dropdown |
| F2 | `src/components/BulkIssuance/TemplateSelector.tsx` | 176 | `z-10` | `z-dropdown` | Non-portaled absolute dropdown |
| F3 | `src/components/search/SkillsFilter.tsx` | 511 | `z-20` | `z-sticky` | Filter dropdown above sticky headers — keep at z-sticky (20) level |
| F4 | `src/components/search/SearchInput.tsx` | 140 | `z-20` | `z-sticky` | Mobile suggestions above sticky — same level |

#### Group G — Custom Tooltips (z-50 → z-tooltip)

| # | File | Line | Current | → New |
|---|------|------|---------|-------|
| G1 | `src/components/admin/CategoryTree.tsx` | 480 | `z-50` | `z-tooltip` |
| G2 | `src/pages/admin/SkillManagementPage.tsx` | 469 | `z-50` | `z-tooltip` |

#### Group H — Relative/Internal z-index (DO NOT CHANGE)

These z-index values are relative within their parent container, not global stacking:

| File | Line | Current | Action |
|------|------|---------|--------|
| `BadgeDetailModal.tsx` | 215 | `z-10` | KEEP — sticky header inside modal |
| `CelebrationModal.tsx` | 118 | `z-10` | KEEP — content above confetti inside modal |
| `BadgeTemplateListPage.tsx` | 362 | `z-10` | KEEP — loading overlay inside card |

---

## Task 3: Sonner Toast z-index (AC #5)

Sonner applies its own z-index via inline styles (default: 999999999). Override it to use our scale.

In `frontend/src/App.tsx`, find:
```tsx
<Toaster richColors position="top-right" />
```

Add the `toastOptions` style override:
```tsx
<Toaster
  richColors
  position="top-right"
  style={{ '--z-index': 'var(--z-toast)' } as React.CSSProperties}
  toastOptions={{
    style: { zIndex: 'var(--z-toast)' },
  }}
/>
```

> **Verify:** If Sonner doesn't support `style` on `<Toaster>` directly for z-index, check the Sonner docs. The container `[data-sonner-toaster]` can be targeted via CSS instead:
> ```css
> [data-sonner-toaster] {
>   z-index: var(--z-toast) !important;
> }
> ```
> Add this to `src/index.css` if needed.

---

## Task 4: Verification (AC #6)

After all migrations:

1. **Run type check:** `npx tsc --noEmit` — must pass
2. **Run lint:** `npm run lint` — must pass
3. **Run tests:** `npm test -- --run` — all 844 tests must pass (z-index changes are CSS-only, tests should be unaffected)
4. **Search for orphans:** `grep -rn "z-\[" src/` — should return NO results (all arbitrary z-index eliminated)
5. **Verify standard z-N remnants:** After migration, no file should use `z-10`, `z-20`, or `z-50` **except** Group H (internal/relative contexts listed above). If any remain, migrate them.

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add z-index scale to @theme; optionally add Sonner z-index override |
| `src/App.tsx` | Sonner Toaster z-index override |
| `src/styles/accessibility.css` | Skip-link z-index → var(--z-tooltip) |
| `src/components/ui/dialog.tsx` | z-50 → z-modal (×2) |
| `src/components/ui/alert-dialog.tsx` | z-50 → z-modal (×2) |
| `src/components/ui/sheet.tsx` | z-50 → z-modal (×2) |
| `src/components/ui/select.tsx` | z-50 → z-modal |
| `src/components/ui/tooltip.tsx` | z-50 → z-tooltip |
| `src/components/ui/sidebar.tsx` | z-10 → z-sidebar, z-20 → z-sidebar |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | z-[9999] → z-modal |
| `src/components/BadgeShareModal/BadgeShareModal.tsx` | z-[10000] → z-modal |
| `src/components/ClaimSuccessModal.tsx` | z-[10001] → z-modal |
| `src/components/admin/CreateUserDialog.tsx` | z-50 → z-modal |
| `src/components/admin/DeactivateUserDialog.tsx` | z-50 → z-modal |
| `src/components/admin/DeleteUserDialog.tsx` | z-50 → z-modal |
| `src/components/admin/EditRoleDialog.tsx` | z-50 → z-modal |
| `src/components/admin/CategoryTree.tsx` | z-50 → z-tooltip |
| `src/components/admin/M365SyncPanel.tsx` | z-10 → z-sticky |
| `src/components/BulkIssuance/BulkResultPage.tsx` | z-50 → z-modal |
| `src/components/BulkIssuance/ProcessingModal.tsx` | z-50 → z-modal |
| `src/components/BulkIssuance/TemplateSelector.tsx` | z-10 → z-dropdown (×2) |
| `src/components/common/LoadingSpinner.tsx` | z-50 → z-modal |
| `src/components/search/BadgeSearchBar.tsx` | z-10 → z-sticky |
| `src/components/search/SearchInput.tsx` | z-10 → z-sticky, z-20 → z-sticky |
| `src/components/search/SkillsFilter.tsx` | z-20 → z-sticky |
| `src/components/TimelineView/TimelineView.tsx` | z-10 → z-sticky |
| `src/pages/admin/SkillManagementPage.tsx` | z-50 → z-tooltip |

**Total: 27 files, ~30 individual class replacements.**
