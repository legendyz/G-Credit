# Code Review Prompt: Story 14.9 — Design Tokens Prep (P1-2)

## Review Metadata

- **Story:** 14.9 — Design Tokens Prep (P1-2)
- **Story File:** `docs/sprints/sprint-14/14-9-design-tokens-prep.md`
- **Commit:** `ca60114`
- **Parent:** `356937b` (Story 14.8 acceptance docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff 356937b..ca60114 -- gcredit-project/frontend/`

---

## Scope

8 frontend files changed (+135, −57), plus 2 docs files:

| File | Change Type | Purpose |
|------|-------------|---------|
| `frontend/src/index.css` | Modified | 11 new tokens added to `@theme` block |
| `frontend/src/components/analytics/IssuanceTrendChart.tsx` | Modified | 10 hex values → CSS vars |
| `frontend/src/components/analytics/SkillsDistributionChart.tsx` | Modified | 5 hex values → CSS vars + formatting |
| `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` | Modified | `bg-[#0A66C2]` → `bg-linkedin` |
| `frontend/src/components/auth/MicrosoftSsoButton.tsx` | Modified | `text-[#2F2F2F]` / `border-[#8C8C8C]` → token classes |
| `frontend/src/components/common/CelebrationModal.tsx` | Modified | 5 confetti hex → CSS vars |
| `frontend/src/components/BadgeWallet/EmptyStateScenarios/PendingBadgesEmptyState.tsx` | Modified | 7 SVG fill hex → CSS vars |
| `frontend/src/components/admin/UserListTable.tsx` | Modified | 2 arbitrary `rgba()` shadows → `shadow-sticky` |
| `docs/sprints/sprint-14/14-9-design-tokens-prep.md` | Modified | Status → `done`, ACs checked, dev record |
| `docs/sprints/sprint-14/14-9-dev-prompt.md` | **New** | Dev prompt |

---

## Architecture Context

**ADR-009:** Tailwind v4 CSS-first config — all design tokens live in `@theme {}` blocks in `index.css`. `tailwind.config.js` is empty by design.

This story replaces hardcoded hex/rgb/arbitrary color values across components with references to `@theme` tokens, establishing a consistent token foundation for Sprint 15 UI overhaul.

---

## Review Checklist

### 1. New Tokens — `@theme` Block in `index.css`

**File:** `frontend/src/index.css`

**Verify 11 new tokens added after typography section, before shadows:**

| Token | Value | Category |
|-------|-------|----------|
| `--color-linkedin` | `#0A66C2` | Third-party brand |
| `--color-linkedin-dark` | `#094F96` | Third-party brand |
| `--color-ms-text` | `#2F2F2F` | Third-party brand |
| `--color-ms-border` | `#8C8C8C` | Third-party brand |
| `--color-confetti-pink` | `#f472b6` | Confetti |
| `--color-confetti-purple` | `#a78bfa` | Confetti |
| `--color-gift-box` | `#FCD34D` | SVG illustration |
| `--color-gift-box-dark` | `#F59E0B` | SVG illustration |
| `--color-gift-ribbon` | `#EF4444` | SVG illustration |
| `--color-gift-ribbon-dark` | `#DC2626` | SVG illustration |
| `--shadow-sticky` | `-4px 0 8px -4px rgba(0,0,0,0.1)` | Shadow |

**Reviewer checks:**
- [ ] All 11 tokens are inside the `@theme` block (not `@theme inline`)
- [ ] Token naming follows existing convention: `--color-{namespace}-{shade}`
- [ ] Shadow token placed in the `=== Shadows (Elevation) ===` section
- [ ] No accidental modification of existing tokens
- [ ] No changes to `tailwind.config.js` (should remain empty — ADR-009)

**Reviewer question:**
1. The SVG illustration tokens (`gift-box`, `gift-ribbon`) are very specific to one component. Is this the right abstraction level for the design token system? These map 1:1 to a single SVG illustration in `PendingBadgesEmptyState.tsx`. Acceptable for Sprint 14 prep scope, but Sprint 15 might want to reconsider if these should use existing semantic tokens (e.g. `warning` / `error`) with the SVG just using those directly.

### 2. Recharts — IssuanceTrendChart.tsx

**File:** `frontend/src/components/analytics/IssuanceTrendChart.tsx`

**Verify:**
- [ ] `CartesianGrid stroke` → `var(--color-neutral-200)`
- [ ] XAxis/YAxis `tick fill` → `var(--color-neutral-500)`
- [ ] Tooltip `contentStyle.border` → `var(--color-neutral-200)`
- [ ] Tooltip `contentStyle.background` → `var(--color-background)` (**new addition — wasn't hardcoded before, was implicit white**)
- [ ] Area "Issued" stroke/fill → `var(--color-chart-1)` with `fillOpacity={0.3}`
- [ ] Area "Claimed" stroke/fill → `var(--color-chart-2)` with `fillOpacity={0.3}`
- [ ] Area "Revoked" stroke/fill → `var(--color-chart-3)` with `fillOpacity={0.3}`
- [ ] fillOpacity changed from 0.4 to 0.3 on "Issued" — intentional unification

**Reviewer questions:**
2. The "Issued" area had `fillOpacity={0.4}` before, now unified to `0.3` like the others. Is this a visual regression or an intentional normalized opacity? (Looks intentional — consistency improvement.)
3. Adding `background: 'var(--color-background)'` to tooltip `contentStyle` is new — the original didn't specify background (defaulted to browser default, likely white). This is a good dark-mode prep change but verify it doesn't change the look in light mode.
4. Do CSS variables work in Recharts SVG `stroke`/`fill` attributes? (Yes — CSS custom properties work in SVG presentation attributes via `var()`. Verified by the 31 E2E tests still passing.)

### 3. Recharts — SkillsDistributionChart.tsx

**File:** `frontend/src/components/analytics/SkillsDistributionChart.tsx`

**Verify:**
- [ ] Same pattern as IssuanceTrendChart: grid, axis, tooltip → neutral tokens
- [ ] YAxis uses `var(--color-neutral-700)` (darker than XAxis `neutral-500` — intentional for label readability)
- [ ] Bar fill → `var(--color-chart-4)` (was `#6366f1` indigo)
- [ ] Added `background: 'var(--color-background)'` to tooltip contentStyle
- [ ] Code reformatted — multi-line JSX attributes (style improvement)

**Reviewer question:**
5. Bar fill mapped from `#6366f1` (Tailwind indigo-500) to `var(--color-chart-4)`. Check what `--color-chart-4` resolves to in the `@theme inline` block — is the color close enough to the original intent?

### 4. BadgeShareModal — LinkedIn Button

**File:** `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`

**Verify:**
- [ ] `bg-[#0A66C2]` → `bg-linkedin`
- [ ] `hover:bg-[#094F96]` → `hover:bg-linkedin-dark`
- [ ] Single line change, no other modifications

### 5. MicrosoftSsoButton — Brand Colors

**File:** `frontend/src/components/auth/MicrosoftSsoButton.tsx`

**Verify:**
- [ ] Loading spinner: `text-[#2F2F2F]` → `text-ms-text`
- [ ] Button: `text-[#2F2F2F]` → `text-ms-text`, `border-[#8C8C8C]` → `border-ms-border`
- [ ] Microsoft logo SVG (lines 22–25) **NOT touched** — brand-mandated colors exempt

**Reviewer question:**
6. The MS logo SVG still has hardcoded `#f25022`, `#00a4ef`, `#7fba00`, `#ffb900`. These are correctly exempted per the dev prompt. Verify no one flags these as missed items.

### 6. CelebrationModal — Confetti Colors

**File:** `frontend/src/components/common/CelebrationModal.tsx`

**Verify:**
- [ ] Confetti array expanded from single-line to multi-line format
- [ ] `#fbbf24` → `var(--color-warning)` (amber/gold)
- [ ] `#34d399` → `var(--color-success)` (green)
- [ ] `#60a5fa` → `var(--color-brand-400)` (blue)
- [ ] `#f472b6` → `var(--color-confetti-pink)` (new token)
- [ ] `#a78bfa` → `var(--color-confetti-purple)` (new token)

**Reviewer question:**
7. The confetti uses `var()` CSS variables in a JS array. These are eventually used in inline `style` for confetti particles. Verify that this pattern works — the browser resolves `var()` at render time in `style` attributes. (Should work — same mechanism as Recharts.)

### 7. PendingBadgesEmptyState — SVG Illustration

**File:** `frontend/src/components/BadgeWallet/EmptyStateScenarios/PendingBadgesEmptyState.tsx`

**Verify:**
- [ ] 7 SVG fill/stroke attributes → `var(--color-gift-box*)` / `var(--color-gift-ribbon*)`
- [ ] `#FCD34D` → `var(--color-gift-box)` (yellow)
- [ ] `#F59E0B` → `var(--color-gift-box-dark)` (amber)
- [ ] `#EF4444` → `var(--color-gift-ribbon)` (red)
- [ ] `#DC2626` → `var(--color-gift-ribbon-dark)` (dark red)
- [ ] Sparkle elements also tokenized
- [ ] Some JSX reformatted to multi-line (last `<circle>` element)

### 8. UserListTable — Sticky Shadow

**File:** `frontend/src/components/admin/UserListTable.tsx`

**Verify:**
- [ ] Line 453 (th): `shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]` → `shadow-sticky`
- [ ] Line 557 (td): same replacement
- [ ] Both occurrences replaced — no remaining arbitrary shadow values

---

## Completeness Check

**Verify nothing was missed from the dev prompt scan:**

| Target | Status |
|--------|--------|
| Recharts (IssuanceTrendChart) | ✅ All 10 hex values replaced |
| Recharts (SkillsDistributionChart) | ✅ All hex values replaced |
| Arbitrary Tailwind `[#hex]` (BadgeShareModal) | ✅ Both replaced |
| Arbitrary Tailwind `[#hex]` (MicrosoftSsoButton) | ✅ 3/3 replaced |
| Confetti (CelebrationModal) | ✅ 5/5 replaced |
| SVG (PendingBadgesEmptyState) | ✅ 7/7 replaced |
| Sticky shadow (UserListTable) | ✅ 2/2 replaced |
| Microsoft logo SVG (exempt) | ✅ Correctly untouched |
| StatusBadge comments (exempt) | ✅ Correctly untouched |

**Remaining hardcoded hex values after this change (expected):**
- `MicrosoftSsoButton.tsx` lines 22–25: brand-mandated MS logo SVG
- `StatusBadge.tsx`: values in comments only (contrast ratio documentation)
- `index.css` `@theme` blocks: these ARE the token definitions

---

## Test Evidence Required

- [ ] Frontend tests: `npm run test -- --run` → 77 suites, 794 passed
- [ ] Frontend build: `npm run build` → no errors
- [ ] Visual spot-check: charts, LinkedIn button, MS SSO button, confetti, gift box illustration, admin table sticky column

---

## Decision Points for Reviewer

1. **APPROVE if:** All hardcoded colors correctly mapped to tokens, no visual regressions, `@theme` block properly structured, exempt items correctly untouched.
2. **REQUEST CHANGES if:** Token naming doesn't follow conventions, CSS variable usage breaks in SVG/Recharts, missing replacements from scan.
3. **NOTE for Sprint 15:** The `gift-box`/`gift-ribbon` tokens are component-specific. Sprint 15 UI overhaul may want to simplify these to semantic tokens (warning/error) if the illustration is redesigned.

---

**Created:** 2026-02-28  
**Created By:** SM Agent (Bob)
