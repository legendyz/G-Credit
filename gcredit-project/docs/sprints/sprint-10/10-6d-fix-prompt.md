# Story 10.6d Fix: Tailwind v4 @theme Migration

**Context:** Story 10.6d "Design System & UI Overhaul" was rejected during acceptance.
**Root Cause:** Project uses Tailwind CSS **v4.1.18** but `tailwind.config.js` uses **v3 format**. Tailwind v4 completely ignores `tailwind.config.js` — all design tokens (brand colors, shadows, fonts, spacing, radii) were never compiled to CSS. Visual walkthrough confirmed zero styling applied: Times New Roman font, no shadows, no brand colors, body margin 8px, etc.

**Fix:** Migrate all design tokens from `tailwind.config.js` into `@theme {}` blocks in `index.css` using Tailwind v4 CSS-first configuration.

---

## Critical Background: Tailwind v4 vs v3

Tailwind v4 fundamental changes:
1. **No `tailwind.config.js`** — v4 does NOT read JS config files at all
2. **`@import "tailwindcss"` replaces `@tailwind base/components/utilities`** — the old directives don't load preflight/utilities properly in v4
3. **`@theme {}` blocks define design tokens** — CSS variables in specific namespaces (`--color-*`, `--font-*`, `--text-*`, `--shadow-*`, `--radius-*`) auto-generate utility classes
4. **Spacing is dynamic** — v4 uses `--spacing: 0.25rem` as a multiplier; `px-4` = `0.25rem * 4`. No need to define individual spacing values
5. **`content` is auto-detected** — no need for JS config content array

Reference: https://tailwindcss.com/docs/theme

---

## Task 1: Fix CSS Entry Point (index.css)

### 1.1 Replace v3 directives with v4 import

**Current (BROKEN — v3 syntax mixed with v4):**
```css
@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

@tailwind base;
@tailwind components;
@tailwind utilities;

@theme inline {
  /* ...shadcn variables... */
}
```

**Required (v4 syntax):**
```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ...existing shadcn variables — KEEP ALL OF THEM... */
}
```

Key change: Replace the three `@tailwind` directives with a single `@import "tailwindcss"` at the very top. This loads preflight (body margin:0, font reset), base styles, components, and utilities properly.

### 1.2 Add design tokens to @theme block

Add a **NEW** `@theme {}` block (NOT `@theme inline`) after the existing `@theme inline {}` block. This block defines all custom design tokens that generate utility classes:

```css
@theme {
  /* === Fonts === */
  --font-sans: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: "Cascadia Code", Consolas, Monaco, "Courier New", monospace;

  /* === Brand Colors (Microsoft Fluent) === */
  --color-brand-50: #E6F3FF;
  --color-brand-100: #CCE7FF;
  --color-brand-200: #99CFFF;
  --color-brand-300: #66B8FF;
  --color-brand-400: #71AFE5;
  --color-brand-500: #2B88D8;
  --color-brand-600: #0078D4;
  --color-brand-700: #106EBE;
  --color-brand-800: #005A9E;
  --color-brand-900: #004578;

  /* === Semantic Colors === */
  --color-success: #107C10;
  --color-success-light: #DFF6DD;
  --color-success-bright: #13A10E;

  --color-warning: #F7630C;
  --color-warning-light: #FFF4CE;
  --color-warning-bright: #FF8C00;

  --color-error: #D13438;
  --color-error-light: #FDE7E9;
  --color-error-bright: #E81123;

  --color-info: #0078D4;
  --color-info-light: #E6F3FF;

  /* === Neutral Palette === */
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F3F2F1;
  --color-neutral-200: #EDEBE9;
  --color-neutral-300: #E1DFDD;
  --color-neutral-400: #D2D0CE;
  --color-neutral-500: #A19F9D;
  --color-neutral-600: #605E5C;
  --color-neutral-700: #3B3A39;
  --color-neutral-800: #323130;
  --color-neutral-900: #201F1E;

  /* === Gold === */
  --color-gold: #FFB900;
  --color-gold-light: #FFF100;

  /* === Typography Scale === */
  /* v4 namespace: --text-* generates text-* utilities */
  --text-display: 4.25rem;
  --text-display--line-height: 5.75rem;
  --text-h1: 2.625rem;
  --text-h1--line-height: 3.25rem;
  --text-h2: 1.75rem;
  --text-h2--line-height: 2.25rem;
  --text-h3: 1.25rem;
  --text-h3--line-height: 1.75rem;
  --text-h4: 1rem;
  --text-h4--line-height: 1.5rem;
  --text-body-lg: 1rem;
  --text-body-lg--line-height: 1.5rem;
  --text-body: 0.875rem;
  --text-body--line-height: 1.25rem;
  --text-body-sm: 0.75rem;
  --text-body-sm--line-height: 1rem;
  --text-caption: 0.6875rem;
  --text-caption--line-height: 0.875rem;

  /* === Shadows (Elevation) === */
  --shadow-elevation-1: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-elevation-2: 0 4px 8px rgba(0, 0, 0, 0.12);
  --shadow-elevation-3: 0 8px 16px rgba(0, 0, 0, 0.16);
  --shadow-elevation-4: 0 16px 32px rgba(0, 0, 0, 0.24);

  /* === Border Radius === */
  /* Note: v4 default already has --radius-xs through --radius-4xl */
  /* Override to match our design system values */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

**IMPORTANT:** The `--radius-*` values above will conflict with the existing `@theme inline {}` block which calculates radii from `var(--radius)`. You need to **remove** the `--radius-sm`, `--radius-md`, `--radius-lg` lines from the `@theme inline {}` block and keep only the ones that DON'T overlap (like `--radius-xl`, `--radius-2xl`, etc.), OR consolidate them. The simplest approach: remove all `--radius-*` from `@theme inline {}` since the new `@theme {}` block provides the actual values, and update the xl/2xl/3xl/4xl to fixed values too.

### 1.3 Handle spacing

Tailwind v4 uses a single `--spacing` base multiplier. The default is `0.25rem` (4px), which matches our design system exactly. **Do NOT add individual spacing values.** The utilities `px-4` = `0.25rem * 4 = 1rem = 16px`, `gap-6` = `0.25rem * 6 = 1.5rem = 24px`, etc. — all automatically work.

If you need the old custom names (xs, sm, md, lg), you could add them BUT the codebase currently uses numeric spacing (px-4, gap-6, etc.), so this is unnecessary.

---

## Task 2: Clean Up Configuration Files

### 2.1 Delete or empty tailwind.config.js

The file is no longer used. Either delete it or make it an empty export:

```js
// Tailwind v4 uses CSS-first configuration via @theme in index.css
// This file is kept for editor tooling compatibility only
/** @type {import('tailwindcss').Config} */
export default {};
```

### 2.2 PostCSS config — remove autoprefixer

Tailwind v4 bundles Lightning CSS which handles vendor prefixing. Remove `autoprefixer`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### 2.3 (Optional but recommended) Use @tailwindcss/vite instead of PostCSS

For a Vite project, the official recommended approach is:

```bash
npm install @tailwindcss/vite
```

Then in `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ...
});
```

And simplify `postcss.config.js` to just `export default { plugins: {} }` or delete it entirely. This gives better performance but is optional — PostCSS works too.

---

## Task 3: Fix fontSize Usage in Components

Tailwind v4 `--text-*` variables generate `text-*` utilities, BUT they only set `font-size` (and `line-height` via `--text-*--line-height`). They do NOT set `font-weight` or `letter-spacing` like v3's tuple syntax did.

The current `tailwind.config.js` defined fontSize entries with fontWeight and letterSpacing baked in:
```js
h1: ['2.625rem', { lineHeight: '3.25rem', fontWeight: '600', letterSpacing: '-0.5px' }],
```

In v4, `text-h1` will only set `font-size: 2.625rem` and `line-height: 3.25rem`. The fontWeight and letterSpacing must be applied separately via utility classes.

**Action:** Search for all uses of `text-h2` in TSX files. The current codebase has **1 usage of `text-h2`** (in PageTemplate.tsx). Verify and ensure `font-semibold` is also applied alongside it. The `text-h2` class in the `@theme` block matches the existing class name used by PageTemplate.

Check PageTemplate.tsx — it currently uses:
```tsx
<h1 className="text-h2 text-neutral-900">{title}</h1>
```
This needs to become:
```tsx
<h1 className="text-h2 font-semibold text-neutral-900">{title}</h1>
```

---

## Task 4: Verification Checklist

After making changes, verify ALL of the following in the dev server:

### 4.1 Build & Test
```bash
npx vite build        # Must pass clean
npx vitest run        # 442/442 must pass
npx eslint --max-warnings=0 .  # 0 errors, 0 warnings
```

### 4.2 CSS Verification (run in browser console)
```js
// Preflight active
getComputedStyle(document.body).margin  // Should be "0px"

// Font
getComputedStyle(document.body).fontFamily  // Should contain "Inter"

// Brand colors generating CSS
document.querySelector('[class*="brand-600"]')  // Should exist
getComputedStyle(document.querySelector('[class*="bg-brand"]')).backgroundColor  // Should NOT be transparent

// Shadows
getComputedStyle(document.querySelector('[class*="shadow-elevation"]')).boxShadow  // Should NOT be "none"

// Neutral colors
getComputedStyle(document.querySelector('[class*="text-neutral"]')).color  // Should NOT be rgb(0,0,0)
```

### 4.3 Visual Spot-Check Pages
Open each page and confirm styling is visible:
- `/login` — brand gradient, Inter font, G-Credit styled
- `/` (dashboard) — cards with shadows, brand colors, grid layout
- `/admin/analytics` — charts in cards with elevation shadows
- `/admin/badges` — table with brand-colored badges
- `/admin/users` — role badges with brand colors
- `/admin/bulk-issuance` — step indicator with brand-600 circles
- `/wallet` — timeline cards with proper spacing
- `/verify/test` — public branding header with brand-600 background

---

## Token Usage Summary in Codebase

These custom tokens are used extensively — they MUST generate valid CSS after migration:

| Token Pattern | Usage Count | Example |
|---|---|---|
| `text-neutral-*` | 128 | `text-neutral-900`, `text-neutral-600` |
| `text-brand-*` | 31 | `text-brand-600`, `text-brand-800` |
| `shadow-elevation-*` | 27 | `shadow-elevation-1`, `shadow-elevation-2` |
| `bg-brand-*` | 24 | `bg-brand-600`, `bg-brand-100` |
| `bg-neutral-*` | 23 | `bg-neutral-50`, `bg-neutral-200` |
| `border-neutral-*` | 20 | `border-neutral-200`, `border-neutral-300` |
| `text-h2` | 1 | PageTemplate title |

---

## Files to Modify

| Action | File | Change |
|---|---|---|
| **MODIFY** | `frontend/src/index.css` | Replace `@tailwind` → `@import "tailwindcss"`, add `@theme {}` with all tokens, clean up `@theme inline {}` radius conflicts |
| **MODIFY** | `frontend/tailwind.config.js` | Empty or delete (v4 doesn't use it) |
| **MODIFY** | `frontend/postcss.config.js` | Remove `autoprefixer` |
| **MODIFY** | `frontend/src/components/layout/PageTemplate.tsx` | Add `font-semibold` to h1 (text-h2 no longer includes fontWeight) |
| **OPTIONAL** | `frontend/vite.config.ts` | Add `@tailwindcss/vite` plugin for better perf |

---

## Coding Standards

- No Chinese characters in source files
- No `console.log` in `src/` — use Sonner toasts for user-facing messages
- shadcn/ui components for all UI elements
- TypeScript strict mode — no `any`
- ESLint `--max-warnings=0`
- File naming: kebab-case; Component naming: PascalCase
- All existing tests must continue to pass (0 regressions)
