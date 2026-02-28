# Dev Prompt: Story 14.9 — Design Tokens Prep (P1-2)

**Story File:** `docs/sprints/sprint-14/14-9-design-tokens-prep.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** LOW | **Estimate:** 1h | **Wave:** 4 (Testing + Design Tokens)  
**Depends On:** —

---

## Objective

Scan the frontend codebase for hardcoded color values and replace them with Tailwind v4 theme tokens. This ensures Sprint 15 UI overhaul builds on a consistent design token foundation.

**Key rule (ADR-009):** All tokens MUST be defined in `@theme {}` blocks in `frontend/src/index.css`. Do NOT modify `tailwind.config.js` (it's empty by design — Tailwind v4 CSS-first config).

---

## ⚠️ CRITICAL WARNINGS

1. **Do NOT modify `tailwind.config.js`** — ADR-009: all tokens in `@theme {}` blocks only
2. **Microsoft logo SVG colors are EXEMPT** — `MicrosoftSsoButton.tsx` lines 22–25 (`#f25022`, `#00a4ef`, `#7fba00`, `#ffb900`) are brand-mandated; do NOT tokenize
3. **Recharts requires JS objects for styling** — tooltip `contentStyle` and similar props can't use Tailwind classes directly. Use CSS variables via `var(--color-xxx)` instead
4. **Do NOT run `npx prisma format`** — Lesson 22
5. **Visual check only** — no automated visual regression tests exist; verify manually

---

## Current Token Inventory

The `@theme` block in `frontend/src/index.css` (lines 46–126) already defines:

| Category | Tokens Available |
|----------|-----------------|
| Brand colors | `brand-50` through `brand-900` (10 shades, Fluent blue) |
| Semantic | `success`, `warning`, `error`, `info` (each with `-light`, `-bright` variants) |
| Neutral | `neutral-50` through `neutral-900` (10 shades) |
| Gold | `gold`, `gold-light` |
| Chart | `chart-1` through `chart-5` (in `@theme inline` block) |
| Shadows | `elevation-1` through `elevation-4` |

The `@theme inline` block (lines 7–44) maps shadcn/ui semantic variables.

---

## Scan Results — Cleanup Targets

### Target 1: Recharts Colors (HIGH priority — 2 files, ~12 hex values)

**File: `frontend/src/components/analytics/IssuanceTrendChart.tsx`**

| Line(s) | Current Hardcoded | Replacement Token | Usage |
|---------|-------------------|-------------------|-------|
| 47 | `#e5e7eb` | `var(--color-neutral-200)` | CartesianGrid stroke |
| 50 | `#6b7280` | `var(--color-neutral-500)` | XAxis tick fill |
| 53 | `#6b7280` | `var(--color-neutral-500)` | YAxis tick fill |
| 56–58 | `border: '1px solid #e5e7eb'`, `background: 'white'` | `border: '1px solid var(--color-neutral-200)'`, `background: 'var(--color-background)'` | Tooltip contentStyle |
| 68 | `#3b82f6` | `var(--color-chart-1)` | Issued area stroke |
| 69 | `#93c5fd` | `var(--color-chart-1)` with opacity | Issued area fill |
| 77 | `#22c55e` | `var(--color-chart-2)` | Claimed area stroke |
| 78 | `#86efac` | `var(--color-chart-2)` with opacity | Claimed area fill |
| 86 | `#ef4444` | `var(--color-chart-3)` | Revoked area stroke |
| 87 | `#fca5a5` | `var(--color-chart-3)` with opacity | Revoked area fill |

**File: `frontend/src/components/analytics/SkillsDistributionChart.tsx`**

| Line(s) | Current Hardcoded | Replacement Token | Usage |
|---------|-------------------|-------------------|-------|
| 57 | `#e5e7eb` | `var(--color-neutral-200)` | CartesianGrid stroke |
| 67 | tooltip contentStyle | same pattern as above | Tooltip border/background |
| 73 | `#6366f1` | `var(--color-chart-4)` or new `--color-chart-indigo` | Bar fill |

**Pattern:** Recharts components accept string props for colors. Use `var(--color-xxx)` — Recharts supports CSS variables in SVG attributes.

```tsx
// BEFORE
<Area stroke="#3b82f6" fill="#93c5fd" />

// AFTER
<Area stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.3} />
```

For tooltip `contentStyle`:
```tsx
// BEFORE
contentStyle={{ border: '1px solid #e5e7eb', background: 'white' }}

// AFTER
contentStyle={{ border: '1px solid var(--color-neutral-200)', background: 'var(--color-background)' }}
```

---

### Target 2: Arbitrary Tailwind Colors (HIGH priority — 2 files, 5 usages)

**File: `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`**

| Line | Current | Action |
|------|---------|--------|
| 484 | `bg-[#0A66C2] hover:bg-[#094F96]` | Add `--color-linkedin: #0A66C2` and `--color-linkedin-dark: #094F96` to `@theme` → use `bg-linkedin hover:bg-linkedin-dark` |

**File: `frontend/src/components/auth/MicrosoftSsoButton.tsx`**

| Line | Current | Action |
|------|---------|--------|
| 31 | `text-[#2F2F2F]` | Add `--color-ms-text: #2F2F2F` to `@theme` → use `text-ms-text` |
| 68 | `text-[#2F2F2F] border-[#8C8C8C]` | Add `--color-ms-border: #8C8C8C` to `@theme` → use `border-ms-border` |

**New tokens to add to `@theme` block:**
```css
/* Third-party brand colors */
--color-linkedin: #0A66C2;
--color-linkedin-dark: #094F96;
--color-ms-text: #2F2F2F;
--color-ms-border: #8C8C8C;
```

---

### Target 3: Confetti Colors (MEDIUM priority — 1 file)

**File: `frontend/src/components/common/CelebrationModal.tsx`**

| Line | Current | Action |
|------|---------|--------|
| 84 | `['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']` | Map to existing tokens: `var(--color-warning)`, `var(--color-success)`, `var(--color-brand-400)`, plus add 2 new confetti tokens |

**New tokens:**
```css
--color-confetti-pink: #f472b6;
--color-confetti-purple: #a78bfa;
```

```tsx
// AFTER
const CONFETTI_COLORS = [
  'var(--color-warning)',      // gold/amber
  'var(--color-success)',      // green
  'var(--color-brand-400)',    // blue
  'var(--color-confetti-pink)',
  'var(--color-confetti-purple)',
];
```

---

### Target 4: SVG Illustration Fills (MEDIUM priority — 1 file)

**File: `frontend/src/components/BadgeWallet/EmptyStateScenarios/PendingBadgesEmptyState.tsx`**

| Line(s) | Current | Action |
|---------|---------|--------|
| 29–49 | `#FCD34D`, `#F59E0B`, `#EF4444`, `#DC2626` | These are decorative SVG fills. Map to nearest tokens: `var(--color-warning-bright)`, `var(--color-warning)`, `var(--color-error)`, `var(--color-error)` with adjusted opacity |

**Judgment call:** If exact color match isn't critical for the illustration, map to existing tokens. If the illustration needs precise colors for visual fidelity, these can be left as-is (exempt as decorative art) — add a `/* ADR-009: decorative SVG — brand-exempt */` comment.

---

### Target 5: Sticky Column Shadow (LOW priority — 1 file)

**File: `frontend/src/components/admin/UserListTable.tsx`**

| Line(s) | Current | Action |
|---------|---------|--------|
| 453 | `shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]` | Add `--shadow-sticky: -4px 0 8px -4px rgba(0,0,0,0.1)` to `@theme` → use `shadow-sticky` |
| 557 | Same pattern | Same replacement |

---

### EXEMPT — Do NOT Change

| File | Lines | Reason |
|------|-------|--------|
| `MicrosoftSsoButton.tsx` | 22–25 | Microsoft logo SVG — brand-mandated colors |
| `StatusBadge.tsx` | 33, 39, 45, 51 | Hex values only in comments (contrast ratio docs) |
| `index.css` `@theme` blocks | all | Source of truth — these ARE the tokens |

---

## Implementation Order

1. **Add new tokens to `@theme` block** in `index.css` (lines 46–126) — add after existing tokens:
   - Third-party brands: `linkedin`, `linkedin-dark`, `ms-text`, `ms-border`
   - Confetti: `confetti-pink`, `confetti-purple`
   - Shadow: `sticky` (in shadow section)
   
2. **Replace Recharts hex values** — IssuanceTrendChart.tsx, SkillsDistributionChart.tsx (use `var(--color-xxx)`)

3. **Replace arbitrary Tailwind colors** — BadgeShareModal.tsx, MicrosoftSsoButton.tsx (use new token classes)

4. **Replace confetti colors** — CelebrationModal.tsx

5. **Handle SVG illustrations** — PendingBadgesEmptyState.tsx (map or exempt)

6. **Replace sticky shadow** — UserListTable.tsx

7. **Run tests:** `npm run test -- --run` in frontend/ → 77 suites, 794 tests, 0 failures

8. **Visual check** — `npm run dev` → verify Dashboard, Login, Badge Wallet, Badge Share Modal, CelebrationModal, UserListTable

---

## Testing Checklist

- [ ] Frontend unit tests: `npm run test -- --run` → 77/77 suites, 794 passed
- [ ] Frontend build: `npm run build` → no errors
- [ ] Visual check: Dashboard page (charts use new tokens)
- [ ] Visual check: Login page (MS SSO button unchanged look)
- [ ] Visual check: Badge Wallet (empty states, celebration)
- [ ] Visual check: Badge Share Modal (LinkedIn button)
- [ ] Visual check: Admin User List (sticky column shadow)

---

## Commit Convention

```
style: replace hardcoded colors with design tokens (P1-2) [14.9]
```

---

## Story File Updates

After completion, update `14-9-design-tokens-prep.md`:
1. Set `**Status:** done`
2. Check all ACs
3. Fill `Dev Agent Record`: model, completion notes, file list
4. List all new tokens added to `@theme`

---

**Created:** 2026-02-28  
**Created By:** SM Agent (Bob)
