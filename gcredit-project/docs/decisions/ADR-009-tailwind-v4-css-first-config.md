# ADR-009: Tailwind CSS v4 CSS-First Configuration

**ADR Number:** 009  
**Status:** ✅ Accepted  
**Date:** 2026-02-09  
**Author:** Bob (SM)  
**Deciders:** LegendZhu (Project Lead), Bob (SM)  
**Context:** Story 10.6d UI Overhaul — discovered Tailwind v4 ignores JS config

---

## Context and Problem Statement

G-Credit frontend uses Tailwind CSS **v4.1.18** (installed via `@tailwindcss/postcss`). During Story 10.6d acceptance, a UI walkthrough revealed that **zero CSS styling was applied** — no brand colors, no shadows, no font loading, body margin 8px instead of 0.

Root cause: The project had a fully populated `tailwind.config.js` using **Tailwind v3 format**. Tailwind v4 introduced a fundamentally different configuration model — it does NOT read `tailwind.config.js` at all. All design tokens must be defined in CSS `@theme {}` blocks.

This was a silent, catastrophic failure: builds passed, tests passed, ESLint passed — but no custom utility classes were generated.

## Decision

**Use Tailwind v4 CSS-first configuration exclusively.** All design tokens are defined in `@theme {}` blocks within `frontend/src/index.css`. The `tailwind.config.js` file is either empty or deleted.

## Key Rules for All Future Frontend Development

### 1. Configuration Location

| Item | Tailwind v3 (OLD — DO NOT USE) | Tailwind v4 (CURRENT) |
|------|------|------|
| Design tokens | `tailwind.config.js` → `theme.extend` | `@theme {}` in `index.css` |
| Entry point | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Content paths | `content: ['./src/**/*.tsx']` | Auto-detected (not needed) |
| Plugins | `plugins: [require('...')]` | `@plugin "..."` in CSS |
| Dark mode | `darkMode: 'class'` | `@custom-variant dark (...)` in CSS |
| Vendor prefixing | `autoprefixer` plugin | Built-in (Lightning CSS) |

### 2. Token Namespace Convention

Tailwind v4 auto-generates utility classes from CSS variable namespaces:

| CSS Variable | Generated Utility | Example |
|---|---|---|
| `--color-brand-600: #0078D4` | `bg-brand-600`, `text-brand-600`, `border-brand-600` | `<div className="bg-brand-600">` |
| `--font-sans: "Inter", ...` | `font-sans` | `<body className="font-sans">` |
| `--text-h2: 1.75rem` | `text-h2` | `<h1 className="text-h2">` |
| `--text-h2--line-height: 2.25rem` | (auto-applied with `text-h2`) | — |
| `--shadow-elevation-1: ...` | `shadow-elevation-1` | `<div className="shadow-elevation-1">` |
| `--radius-md: 8px` | `rounded-md` | `<div className="rounded-md">` |
| `--spacing: 0.25rem` | `px-4` = 0.25rem × 4 | `<div className="px-4 gap-6">` |

### 3. fontSize Behavior Change

Tailwind v3 `fontSize` allowed bundling `fontWeight` and `letterSpacing`:
```js
// v3 — NOT SUPPORTED IN v4
h2: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.5px' }]
```

Tailwind v4 `--text-*` only sets `font-size` and `line-height`. **Font weight and letter spacing must be applied separately** via utility classes:
```tsx
// v4 — correct
<h1 className="text-h2 font-semibold tracking-tight">Title</h1>
```

### 4. Adding New Design Tokens

To add a new color, shadow, or typography token, edit `frontend/src/index.css` → `@theme {}` block:

```css
@theme {
  /* Add new token here */
  --color-accent: #FF6B35;
  --shadow-elevation-5: 0 24px 48px rgba(0, 0, 0, 0.32);
}
```

**Do NOT** create or modify `tailwind.config.js` — it is dead code in v4.

### 5. Version Pinning

| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | `4.1.18` | Core CSS framework |
| `@tailwindcss/postcss` | `0.1.8` | PostCSS integration |
| `tailwindcss-animate` | `1.0.7` | Animation utilities (shadcn) |

**Do NOT downgrade to Tailwind v3.x** — the entire design system depends on v4 `@theme {}` syntax.

**Do NOT upgrade major versions** without reviewing the Tailwind changelog for breaking changes and testing all 246+ custom token usages.

## Consequences

### Positive
- Single source of truth: all design tokens in one CSS file
- No JS/CSS config split — easier to understand
- Auto-detection of content paths — no manual maintenance
- Built-in Lightning CSS — no separate autoprefixer needed
- Better Vite integration available (`@tailwindcss/vite`)

### Negative
- **No backward compatibility with v3 config** — any v3 tutorial or AI-generated code using `tailwind.config.js` will silently fail
- IDE tooling (Tailwind IntelliSense) may need `@tailwindcss/language-server` v4-compatible version
- Team must learn CSS-first configuration model

### Risks
- **Silent failure risk:** If someone recreates `tailwind.config.js` with tokens, they will NOT be applied. Mitigated by: (1) empty config file with warning comment, (2) this ADR, (3) Lesson #39 mandating visual verification
- **AI code generation risk:** LLMs trained on Tailwind v3 will suggest `tailwind.config.js` changes. Developers must redirect to `@theme {}` in `index.css`

## References

- [Tailwind CSS v4 Theme Documentation](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- Story 10.6d Fix Prompt: `docs/sprints/sprint-10/10-6d-fix-prompt.md`
- Lesson #39: Always visual-verify after UI stories
