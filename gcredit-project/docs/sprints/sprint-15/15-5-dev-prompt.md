# Dev Prompt: Story 15.5 — Inline Styles → Tailwind Classes + UAT Findings

**Story File:** `docs/sprints/sprint-15/15-5-inline-styles-to-tailwind.md`  
**Branch:** `sprint-15/ui-overhaul-dashboard`  
**Priority:** MEDIUM | **Estimate:** 4h | **Wave:** 3 (UI Polish)  
**Dependencies:** Story 15.3 (Sidebar) ✅ Done, Story 15.14 (UAT) ✅ Done

---

## Objective

Two-part story:

1. **Inline Style Cleanup** — Convert all `style={{}}` inline styles to Tailwind classes across 14 frontend files (23 occurrences). Dynamic/computed values use arbitrary value syntax `[value]` or CSS variables where Tailwind utilities don't exist.

2. **UAT FINDING Fixes** — Resolve 3 findings from mid-sprint UAT (FINDING-01, FINDING-08, FINDING-10), all are responsive/UX issues.

---

## CRITICAL Architecture Rules

- **Tailwind v4** — CSS-first config (`@theme` in `index.css`), NOT `tailwind.config.js` tokens. Use `var(--color)` directly, NOT `hsl(var(--color))` (Lesson 52 — oklch format).
- **`cn()` utility** — Use `cn()` from `@/lib/utils` for conditional class merging.
- **No new CSS files** — All styling via Tailwind utility classes + existing `@theme` tokens.
- **Zero visual regression** — Before/after must look identical unless intentionally changing (FINDING fixes).

---

## Part 1: Inline Style Audit & Conversion

### Complete File List (23 occurrences in 14 files)

**Category A — Dynamic computed values (KEEP as inline style or use CSS var):**

These use JavaScript-computed values, acceptable to keep as `style={}`:

| File | Line | Pattern | Action |
|------|------|---------|--------|
| `CategoryDropdown.tsx` | 128 | `paddingLeft: ${(level-1)*16}px` | KEEP — dynamic tree indent |
| `CategoryFormDialog.tsx` | 201 | `paddingLeft: ${(level-1)*20}px` | KEEP — dynamic tree indent |
| `CategoryTree.tsx` | 312 | `style={style}` (dnd-kit transform) | KEEP — library requirement |
| `CategoryTree.tsx` | 411 | `marginLeft: ${level*1.5}rem` | KEEP — dynamic tree indent |
| `MoveToDialog.tsx` | 181 | `paddingLeft: ${level*16+8}px` | KEEP — dynamic tree indent |
| `SkillManagementPage.tsx` | 302 | `paddingLeft: ${(level-1)*16}px` | KEEP — dynamic dropdown indent |
| `SkillManagementPage.tsx` | 637 | `paddingLeft: ${(level-1)*16}px` | KEEP — dynamic dialog indent |
| `sidebar.tsx` | 143, 209, 669 | CSS vars for sidebar width | KEEP — shadcn/ui internal |

**Category B — Progress bars with dynamic width (KEEP):**

| File | Line | Pattern | Action |
|------|------|---------|--------|
| `SkillsDistributionChart.tsx` | 109 | `width: ${Math.max(pct, 2)}%` | KEEP — dynamic percentage |
| `ProcessingModal.tsx` | 88 | `width: ${percentComplete}%` | KEEP — dynamic progress |
| `EvidenceAttachmentPanel.tsx` | 179 | `width: ${uploadProgress}%` | KEEP — dynamic upload progress |
| `EmployeeDashboard.tsx` | 238 | `width: ${milestone.percentage}%` | KEEP — dynamic milestone |
| `IssuerDashboard.tsx` | 268 | `width: ${percentage}%` | KEEP — dynamic chart bar |

**Category C — Static/convertible styles (CONVERT to Tailwind):**

| File | Line | Current | Convert To |
|------|------|---------|------------|
| `IssuanceTrendChart.tsx` | 56 | `contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px' }}` | Recharts `contentStyle` — document as library prop, cannot use Tailwind directly. Add comment `/* Recharts requires inline style object */` |
| `IssuanceTrendChart.tsx` | 64 | `wrapperStyle={{ fontSize: '13px' }}` | Same — Recharts Legend prop. Add comment |
| `SkillsDistributionChart.tsx` | 75 | `contentStyle={{ ... }}` | Same — Recharts tooltip. Add comment |
| `ProcessingModal.tsx` | 135 | `animationDelay: ${i * 0.15}s` | KEEP — dynamic stagger delay |
| `CelebrationModal.tsx` | 45 | `style={{ ... animation }}` | KEEP — dynamic confetti animation |
| `ClaimSuccessModal.tsx` | 47, 54, 69 | `animation: 'fadeInScale ...'` / `animation: 'bounceIn ...'` | **CONVERT** — Add Tailwind `@keyframes` in `index.css` and use `animate-[fadeInScale_0.3s_ease-out]` or define named animations |

### Conversion Instructions

**For ClaimSuccessModal.tsx animations (lines 47, 54, 69):**

Check if `fadeInScale` and `bounceIn` keyframes already exist in `index.css`. If yes, convert to Tailwind `animate-*` class. If the keyframes are defined only in `<style>` tag within the component itself, move them to `index.css` `@theme` block and use Tailwind class.

**For Recharts contentStyle/wrapperStyle (3 occurrences):**

These are **library API props** that require plain objects — they cannot use Tailwind classes. Add a clearly visible comment above each:
```tsx
/* Recharts API requires style object — cannot use Tailwind classes */
```

No further action needed — document and move on.

---

## Part 2: UAT FINDING Fixes

### FINDING-01: Wallet Page Title (5 min)

**File:** `src/components/TimelineView/TimelineView.tsx` line 256

**Current:**
```tsx
<PageTemplate title="My Badges" actions={<ViewToggle mode={viewMode} onChange={setViewMode} />}>
```

**Change to:**
```tsx
<PageTemplate title="My Badge Wallet" actions={<ViewToggle mode={viewMode} onChange={setViewMode} />}>
```

That's it. One line.

---

### FINDING-08: Skills Management Table Responsive (1.5h)

**File:** `src/pages/admin/SkillManagementPage.tsx`

**Problem:** `table-fixed` with `<colgroup>` forces rigid column widths. On narrow viewports, columns compress and text truncates to "Doc...", "Neg...", "Tea...".

**Current layout (line 343):**
```tsx
<table className="w-full table-fixed">
  <colgroup>
    <col className="w-[22%]" />   {/* Name */}
    <col className="w-[22%]" />   {/* Description */}
    <col className="w-[16%]" />   {/* Category */}
    <col className="w-[12%]" />   {/* Level */}
    <col className="w-[12%]" />   {/* Badge Templates */}
    <col className="w-[16%]" />   {/* Actions */}
  </colgroup>
```

**Fix — 4 changes:**

#### Change 1: Remove `table-fixed` and `<colgroup>`

```tsx
<table className="w-full">
  {/* Removed: table-fixed + colgroup — let columns size naturally (FINDING-08) */}
  <thead>
```

Remove the entire `<colgroup>` block (6 `<col>` elements).

#### Change 2: Improve responsive column hiding

Current breakpoints hide too few columns. Update:

```
Description: hidden md:table-cell   → hidden lg:table-cell  (hide until ≥1024px)
Level:       hidden sm:table-cell   → hidden md:table-cell  (hide until ≥768px)
Badge Templates: hidden sm:table-cell → hidden lg:table-cell  (hide until ≥1024px)
```

Apply to BOTH `<th>` headers AND `<td>` cells (edit rows and inline add row). There are 6 pairs to update:

**Headers (lines ~357-366):**
- Description `<th>`: `hidden md:table-cell` → `hidden lg:table-cell`
- Level `<th>`: keep `hidden sm:table-cell` → `hidden md:table-cell`
- Badge Templates `<th>`: `hidden sm:table-cell` → `hidden lg:table-cell`

**Inline add row cells (lines ~390-419):**
- Description `<td>`: `hidden md:table-cell` → `hidden lg:table-cell`
- Level `<td>`: `hidden sm:table-cell` → `hidden md:table-cell`
- Badge Templates `<td>`: `hidden sm:table-cell` → `hidden lg:table-cell`

**Data row cells (lines ~455-468):**
- Description `<td>`: `hidden md:table-cell` → `hidden lg:table-cell`
- Level `<td>`: `hidden sm:table-cell` → `hidden md:table-cell`
- Badge Templates `<td>`: `hidden sm:table-cell` → `hidden lg:table-cell`

#### Change 3: Add `min-w-0` to Name column cells

Name cells have `truncate` class — ensure parent allows it:
```tsx
<td className="px-4 py-3 min-w-0">
  <span className="text-sm font-medium text-neutral-900 truncate block">
```

#### Change 4: Add scroll hint for tablet

Wrap the table's outer `<div>` with a relative container and horizontal scroll shadow:
```tsx
<div className="rounded-lg border border-neutral-200 bg-white overflow-hidden relative">
  <div className="overflow-x-auto scrollbar-none">
    <table className="w-full min-w-[600px]">
```

Add `min-w-[600px]` to table so it scrolls on narrow viewports instead of compressing.

---

### FINDING-10: BadgeSearchBar Responsive (30 min)

**File:** `src/components/search/BadgeSearchBar.tsx`

**Problem:** `sm:flex-nowrap` forces all filters into one row at ≥640px. At medium widths (640–1024px), the search input gets squished to near-zero.

**Fix — 2 changes:**

#### Change 1: Adjust nowrap breakpoint (line ~131)

```tsx
// BEFORE:
<div className={`flex flex-wrap gap-2 sm:flex-nowrap ${isSearchFocused ? 'hidden sm:flex' : ''}`}>

// AFTER:
<div className={`flex flex-wrap gap-2 lg:flex-nowrap ${isSearchFocused ? 'hidden sm:flex' : ''}`}>
```

This allows filters to wrap into multiple rows at 640–1023px (tablet), and only force single-row at ≥1024px (desktop).

#### Change 2: Set min-width on search input container (line ~127)

```tsx
// BEFORE:
<div className="flex-1 min-w-0">

// AFTER:
<div className="flex-1 min-w-[200px]">
```

This prevents the search input from shrinking below 200px.

---

## Verification Checklist

After all changes:

- [ ] `npm run lint` — 0 errors
- [ ] No `style={{` with static values (grep should show only Category B / dynamic entries)
- [ ] **FINDING-01:** Navigate to `/wallet` → page title is "My Badge Wallet"
- [ ] **FINDING-08 @ 375px:** Skills table shows only Name + Category + Actions; scrolls horizontally
- [ ] **FINDING-08 @ 768px:** Skills table shows Name + Category + Level + Actions
- [ ] **FINDING-08 @ 1280px:** All 6 columns visible, no truncation
- [ ] **FINDING-10 @ 768px:** Badge search bar wraps filters into 2 rows; search input ≥200px wide
- [ ] **FINDING-10 @ 1280px:** All filters in single row
- [ ] Recharts chart pages (`/admin/analytics`) still render correctly
- [ ] Modals (ClaimSuccess, Celebration, Processing) animations play correctly

---

## Files to Modify (Summary)

| # | File | Changes |
|---|------|---------|
| 1 | `TimelineView.tsx` | Title "My Badges" → "My Badge Wallet" |
| 2 | `SkillManagementPage.tsx` | Remove table-fixed/colgroup, update responsive breakpoints, add min-w-[600px], fix inline style comments |
| 3 | `BadgeSearchBar.tsx` | `sm:flex-nowrap` → `lg:flex-nowrap`, min-w-[200px] |
| 4 | `IssuanceTrendChart.tsx` | Add "Recharts requires style object" comments |
| 5 | `SkillsDistributionChart.tsx` | Add "Recharts requires style object" comment |
| 6 | `ClaimSuccessModal.tsx` | Evaluate animation inline styles → Tailwind `animate-*` if keyframes exist in CSS |

**Files explicitly NOT modified** (dynamic computed styles, keep as-is):
- CategoryDropdown.tsx, CategoryFormDialog.tsx, CategoryTree.tsx, MoveToDialog.tsx
- ProcessingModal.tsx, CelebrationModal.tsx, EvidenceAttachmentPanel.tsx
- EmployeeDashboard.tsx, IssuerDashboard.tsx, sidebar.tsx

---

## Architecture References

- **ADR-009:** Tailwind v4 CSS-first configuration
- **Lesson 52:** `hsl(var(--x))` invalid with oklch — use `var(--x)` directly
- **FINDING-01:** `docs/sprints/sprint-15/15-14-mid-sprint-uat.md` § FINDING-01
- **FINDING-08:** `docs/sprints/sprint-15/15-14-mid-sprint-uat.md` § FINDING-08
- **FINDING-10:** `docs/sprints/sprint-15/15-14-mid-sprint-uat.md` § FINDING-10
