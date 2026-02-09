# Dev Prompt: Story 10.6d — Frontend Design System & UI Overhaul

**Story:** [10-6d-design-system-ui-overhaul.md](10-6d-design-system-ui-overhaul.md)  
**Estimate:** 20h (5 tasks × 4h)  
**Branch:** `sprint-10/v1-release`  
**Priority:** 🔴 HIGH — blocks UAT (10.6c/10.7)

---

## Context

Story 10.6a UI Walkthrough revealed that all 11 routes work correctly (data loads, auth enforced, RBAC works) but the visual presentation has critical gaps. The UX Design Specification (`docs/planning/ux-design-specification.md`, 3,321 lines) defines a complete design system that was **never translated into code**.

**Current state:**
- `tailwind.config.js`: `theme: { extend: {} }` — completely empty
- `index.html`: No fonts loaded, `<title>` is "frontend"
- `index.css`: CSS variables are auto-generated shadcn defaults (oklch), not customized
- No `PageTemplate` component — each page reinvents its layout
- `Layout.tsx`: `px-4 py-4 md:px-6 md:py-6` inner padding causes double padding with pages
- Components use hardcoded `blue-600`, `gray-700`, `text-gray-500` etc.
- Inconsistent icon approach — emojis (AdminDashboard) vs Lucide icons (others)
- Background hardcoded: `bg-slate-50` in Layout.tsx instead of `bg-background`

**Target state:** Professional, branded UI using Microsoft Fluent-inspired design system with Inter font, consistent page templates, and proper design tokens.

---

## Execution Order

Execute tasks **strictly in order**. Task 1 is the foundation — all other tasks depend on it.

```
Task 1 (Foundation) → Task 2 (Dashboards) → Task 3 (Admin Pages) → Task 4 (Wallet + Public) → Task 5 (Mobile + Quality)
```

---

## Task 1: Design System Foundation (4h)

### 1.1 Font Loading + Title (index.html)

Current file (14 lines):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Changes:**
1. Add Google Fonts preconnect + Inter font link (weights 400, 500, 600, 700)
2. Change `<title>` to "G-Credit"

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>G-Credit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 1.2 Tailwind Theme Configuration (tailwind.config.js)

Current file (9 lines — completely empty theme):
```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

**Replace with full design token system:**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', 'Consolas', 'Monaco', '"Courier New"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B8FF',
          400: '#71AFE5',
          500: '#2B88D8',
          600: '#0078D4',
          700: '#106EBE',
          800: '#005A9E',
          900: '#004578',
        },
        success: {
          DEFAULT: '#107C10',
          light: '#DFF6DD',
          bright: '#13A10E',
        },
        warning: {
          DEFAULT: '#F7630C',
          light: '#FFF4CE',
          bright: '#FF8C00',
        },
        error: {
          DEFAULT: '#D13438',
          light: '#FDE7E9',
          bright: '#E81123',
        },
        info: {
          DEFAULT: '#0078D4',
          light: '#E6F3FF',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F3F2F1',
          200: '#EDEBE9',
          300: '#E1DFDD',
          400: '#D2D0CE',
          500: '#A19F9D',
          600: '#605E5C',
          700: '#3B3A39',
          800: '#323130',
          900: '#201F1E',
        },
        gold: {
          DEFAULT: '#FFB900',
          light: '#FFF100',
        },
      },
      fontSize: {
        'display': ['4.25rem', { lineHeight: '5.75rem', fontWeight: '600', letterSpacing: '-1px' }],
        'h1': ['2.625rem', { lineHeight: '3.25rem', fontWeight: '600', letterSpacing: '-0.5px' }],
        'h2': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h4': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem' }],
        'body': ['0.875rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem' }],
        'caption': ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'elevation-1': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'elevation-3': '0 8px 16px rgba(0, 0, 0, 0.16)',
        'elevation-4': '0 16px 32px rgba(0, 0, 0, 0.24)',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
};
```

### 1.3 Shadcn CSS Variables (index.css)

The `:root` block in `index.css` currently uses default shadcn oklch values (dark slate theme). Update the `:root` CSS variables to reflect Microsoft Fluent / G-Credit brand colors.

**Key color mappings:**

| CSS Variable | Current (default slate) | Target (G-Credit brand) | Hex Reference |
|-------------|------------------------|------------------------|---------------|
| `--primary` | `oklch(0.208 0.042 265.755)` (near black) | Microsoft Blue | `#0078D4` |
| `--primary-foreground` | `oklch(0.984 ...)` | White | `#FFFFFF` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Error red | `#D13438` |
| `--background` | `oklch(1 0 0)` (white) | Neutral-50 | `#FAFAFA` |
| `--card` | `oklch(1 0 0)` (white) | White | `#FFFFFF` |
| `--accent` | dark slate | Brand light blue | `#E6F3FF` |
| `--ring` | dark | Brand-600 | `#0078D4` |

**Important:** The `@theme inline` block references these variables, so only the `:root` values need to change. The `@theme inline` mapping layer stays the same.

**Approach:** Convert hex values to oklch using an online converter, or use the `color()` function. Keep the existing oklch format for consistency with shadcn patterns.

**Quick reference for oklch conversion:**
- `#0078D4` ≈ `oklch(0.553 0.163 248.68)` (Microsoft Blue)
- `#FFFFFF` ≈ `oklch(1 0 0)`
- `#FAFAFA` ≈ `oklch(0.985 0 0)`
- `#D13438` ≈ `oklch(0.525 0.18 22.7)` (Error red)
- `#E6F3FF` ≈ `oklch(0.961 0.028 248)` (Brand light)

Also update chart colors (`--chart-1` through `--chart-5`) to use brand-compatible palette.

**PRESERVE:** The custom animations at the bottom (`confetti-fall`, `bounce-slow`) — do NOT remove these.

### 1.4 PageTemplate Component (NEW FILE)

Create: `frontend/src/components/layout/PageTemplate.tsx`

```tsx
import type { ReactNode } from 'react';

interface PageTemplateProps {
  /** Page heading (h1) */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional action buttons (top-right) */
  actions?: ReactNode;
  /** Page content */
  children: ReactNode;
  /** Additional class for content area */
  className?: string;
}

export function PageTemplate({
  title,
  description,
  actions,
  children,
  className = '',
}: PageTemplateProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 text-neutral-900">{title}</h1>
          {description && (
            <p className="mt-1 text-body text-neutral-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
```

### 1.5 Layout.tsx — Remove Inner Padding

Current `<main>` element has:
```tsx
className={`px-4 py-4 md:px-6 md:py-6 ${className}`}
```

**Change to:**
```tsx
className={`px-4 py-6 md:px-8 md:py-8 ${className}`}
```

This becomes the ONLY padding source. Pages use `PageTemplate` for their content structure, NOT their own `p-4`/`p-6` padding.

Also change `bg-slate-50` to `bg-background` (uses CSS variable).

Current:
```tsx
<div className="min-h-screen bg-slate-50">
```
Change to:
```tsx
<div className="min-h-screen bg-background">
```

### 1.6 Navbar Branding Update

In `Navbar.tsx`, update hardcoded colors to use design tokens:
- `text-blue-600` → `text-brand-600`
- `bg-blue-50` → `bg-brand-50`
- Active state colors: use brand tokens
- Logo text "G-Credit": keep as text but use `font-semibold text-brand-600`

### Verification After Task 1

Run these checks before proceeding:
```bash
cd gcredit-project/frontend
npm run build          # tsc -b && vite build — must pass
npm run lint           # eslint --max-warnings=0
npm run test:run       # vitest — all tests pass
```

Start dev server and verify:
- Browser shows Inter font (check DevTools → Computed → font-family)
- Tab title shows "G-Credit"
- Background color is `#FAFAFA` (Neutral-50)

---

## Task 2: Dashboard Pages (4h)

**General pattern for ALL dashboards:**
1. Import `PageTemplate` from `@/components/layout/PageTemplate`
2. Wrap content with `<PageTemplate title="..." description="...">`
3. Remove any per-page `<div className="p-4">`/`<div className="p-6">` wrappers
4. Replace hardcoded colors with design tokens:
   - `text-gray-*` → `text-neutral-*`
   - `text-blue-*` → `text-brand-*`
   - `bg-blue-*` → `bg-brand-*`
   - `bg-gray-*` → `bg-neutral-*`
   - `bg-green-*` → `bg-success-light`
   - `bg-red-*` → `bg-error-light`
   - `bg-yellow-*` → `bg-warning-light`
5. Use consistent card shadows: `shadow-elevation-1` (default), `shadow-elevation-2` (hover)

### 2.1 AdminDashboard.tsx (279 lines)

- Title: `"Admin Dashboard"`
- Description: `"System overview and management"`
- **Fix emoji icons** → replace with Lucide icons (consistent with other dashboards)
  - `👥` → `<Users />`, `📈` → `<TrendingUp />`, `🏆` → `<Award />`
- Stat cards: 4-column grid on lg, 2-column on md, 1-column on sm
- **Recent Activity: limit to 5 items** + "View All" link (AC 8)
- System Health: compact horizontal banner (not oversized card)
- Quick Actions: clean button group using shadcn `Button` variant="outline"

### 2.2 IssuerDashboard.tsx (282 lines)

- Title: `"Issuer Dashboard"`
- Description: `"Badge issuance and management"`
- Keep existing Lucide icons
- Quick Actions grid: consistent sizing with AdminDashboard
- "Issue New Badge" button → primary variant (`bg-brand-600 hover:bg-brand-700 text-white`)

### 2.3 ManagerDashboard.tsx (237 lines)

- Title: **`"Manager Dashboard"`** (fix — AC 11: no "Team Dashboard" vs "My Dashboard" confusion)
- Description: `"Team badge overview"`
- Stat cards with brand colors
- Clean grid layout

### 2.4 EmployeeDashboard.tsx (495 lines — largest)

- Title: `"My Dashboard"`
- Description: `"Your badges and achievements"`
- Keep celebration logic (localStorage tracking) — don't break
- Badge stat cards with brand accents
- "View My Badges" → `/wallet` link using brand button

---

## Task 3: Admin Pages (4h)

### 3.1 BadgeManagementPage.tsx (512 lines)

- `<PageTemplate title="Badge Management" description="View and manage all badges">`
- Table section: use `Card` wrapper for the table area
- Action buttons: consistent shadcn `Button` variants
- **Note:** Has hardcoded `MOCK_USER_ROLE` / `MOCK_USER_ID` — leave as-is (separate tech debt)

### 3.2 AdminUserManagementPage.tsx (298 lines)

- `<PageTemplate title="User Management" description="Manage user accounts and roles">`
- Search/filter bar: clean horizontal layout
- Role badges: use brand-compatible colors
  - ADMIN: `bg-brand-50 text-brand-700 border-brand-200`
  - ISSUER: `bg-success-light text-success`
  - MANAGER: `bg-warning-light text-warning`
  - EMPLOYEE: `bg-neutral-100 text-neutral-700`

### 3.3 AdminAnalyticsPage.tsx (293 lines)

- **Role-aware title (AC 12):** Check user role from auth store
  - ADMIN → `"Admin Analytics"`
  - ISSUER → `"Issuer Analytics"`
- Charts section: 2-column grid on lg, full-width on mobile
- Stats summary cards at top with proper spacing
- Period selector buttons: use brand styling

### 3.4 BulkIssuancePage.tsx (398 lines)

- `<PageTemplate title="Bulk Badge Issuance" description="Issue badges to multiple recipients">`
- **Upload area (AC 10):** Reduce cloud icon size, use `w-12 h-12` (not w-24 h-24)
  - Use dashed border: `border-2 border-dashed border-neutral-300 rounded-lg`
  - Subtle background: `bg-neutral-50`
  - Text: "Drag & drop CSV file here" in `text-neutral-600`
- Steps indicator: clean horizontal stepper if applicable
- Template download button: outline variant

---

## Task 4: Wallet & Public Pages (4h)

### 4.1 TimelineView (Wallet) — 398 lines

**Actual path:** `src/components/TimelineView/TimelineView.tsx`

- `<PageTemplate title="My Badges" description="Your badge collection">`
- View toggle (Timeline / Grid): styled toggle buttons
- Timeline cards: use `shadow-elevation-1`, brand accent for dates
- Empty state: branded illustration or icon + description text
- Grid view: responsive card grid with consistent sizing

### 4.2 LoginPage.tsx (172 lines)

**Note:** LoginPage does NOT use `Layout` — it's a standalone full-page component. Keep this behavior.

- Background: `bg-gradient-to-br from-brand-50 to-brand-100` (replace `blue-50 to-indigo-100`)
- Card: `bg-white shadow-elevation-2 rounded-lg`
- "G-Credit" heading: `text-brand-600 font-bold text-h2`
- Submit button: `bg-brand-600 hover:bg-brand-700 text-white`
- Form inputs: use shadcn `Input` component if not already
- Links: `text-brand-600 hover:text-brand-700`

### 4.3 VerifyBadgePage.tsx (301 lines)

- Public page — doesn't require login
- Brand header: "G-Credit Verification" with brand colors
- Badge status indicators with semantic colors:
  - Verified: `bg-success-light text-success border-success`
  - Revoked: `bg-error-light text-error border-error`
  - Not Found: `bg-neutral-100 text-neutral-600`
- Clean card layout with proper section spacing

### 4.4 NotFoundPage.tsx (22 lines)

- Replace `text-gray-300` → `text-neutral-300`
- Replace `bg-blue-600` → `bg-brand-600`
- Center content with brand styling
- "Return to Dashboard" button: brand primary

### 4.5 BadgeDetailModal

- In `src/components/BadgeDetailModal/` (multiple files)
- Consistent card styling with design tokens
- Evidence section: clean spacing
- **Light touch only** — don't restructure, just apply color tokens

---

## Task 5: Mobile Responsive & Quality (4h)

### 5.1 Mobile Responsive Review (1.5h)

Test at 375px viewport width:
- [ ] Login: form fills width, submit button full-width
- [ ] Dashboard cards: stack single-column
- [ ] Wallet: readable, timeline compact
- [ ] MobileNav hamburger: brand-colored
- [ ] Analytics: charts adapt or horizontal scroll
- [ ] Badge detail modal: full-screen on mobile
- [ ] Verification page: fills width

For MobileNav (`src/components/layout/MobileNav.tsx`, 281 lines):
- Update hardcoded colors to brand tokens
- Active state: `bg-brand-50 text-brand-600`
- Menu header: "G-Credit" branding

### 5.2 Test Validation (1.5h)

Run full test suite:
```bash
cd gcredit-project/frontend
npm run lint            # Must be 0 errors, 0 warnings
npm run test:run        # All Vitest tests pass
npm run build           # tsc -b && vite build succeeds
```

Common test issues from layout changes:
- Tests that snapshot specific class names will break if classes change
- Tests that look for specific text (e.g., page titles) may need updating
- Component tests with `render()` may need `MemoryRouter` wrapper if `PageTemplate` uses route-dependent features

### 5.3 Screenshot Comparison (1h)

After all changes:
1. Start backend (`npm run start:dev` in `gcredit-project/backend`)
2. Start frontend (`npm run dev` in `gcredit-project/frontend`)
3. Run Playwright screenshot script: `python docs/sprints/sprint-10/screenshots/capture-ui-v2.py`
4. Compare before (existing screenshots in `screenshots/`) vs after
5. Document visual improvements in story completion notes

---

## Coding Standards (CRITICAL)

1. **No Chinese characters** in source files — English only in code/comments
2. **No `console.log`** in `src/` — use Sonner toasts for user feedback
3. **No `any`** — TypeScript strict mode
4. **ESLint `--max-warnings=0`** — zero tolerance
5. **File naming:** kebab-case for files, PascalCase for components
6. **shadcn/ui** components preferred for all UI elements
7. **Design tokens first:** Use `text-brand-600`, `bg-neutral-100`, `shadow-elevation-1` etc. Do NOT hardcode colors like `blue-600`, `gray-500` in new code.
8. **Preserve existing functionality** — this is a visual overhaul, not a functional rewrite. All routes, auth, data loading, and RBAC must work identically before and after.

---

## Technical Reference

### Installed shadcn Components (src/components/ui/)
`alert`, `button`, `card`, `dialog`, `input`, `label`, `select`, `skeleton`, `textarea`
Plus custom: `FormError`, `SkipLink`, `StatusBadge`

### Key Imports
```tsx
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
```

### Route Structure (App.tsx — 128 lines)
All routes use `React.lazy()` + `Suspense`. Keep this pattern.

| Route | Component | Auth |
|-------|-----------|------|
| `/login` | LoginPage | Public |
| `/verify/:verificationId` | VerifyBadgePage | Public |
| `/badges/:badgeId/embed` | BadgeEmbedPage | Public |
| `/` | DashboardPage (role-based switch) | Protected |
| `/wallet` | TimelineView | Protected |
| `/admin/analytics` | AdminAnalyticsPage | ADMIN, ISSUER |
| `/admin/badges` | BadgeManagementPage | ADMIN, ISSUER |
| `/admin/bulk-issuance` | BulkIssuancePage | ADMIN, ISSUER |
| `/admin/bulk-issuance/preview/:sessionId` | BulkPreviewPage | ADMIN, ISSUER |
| `/admin/users` | AdminUserManagementPage | ADMIN |
| `*` | NotFoundPage | Public |

### Test Users (for manual verification)
| Email | Password | Role |
|-------|----------|------|
| admin@gcredit.com | password123 | ADMIN |
| issuer@gcredit.com | password123 | ISSUER |
| manager@gcredit.com | password123 | MANAGER |
| M365DevAdmin@2wjh85.onmicrosoft.com | password123 | EMPLOYEE |

### Dev Servers
- Backend: `cd gcredit-project/backend && npm run start:dev` → localhost:3000
- Frontend: `cd gcredit-project/frontend && npm run dev` → localhost:5173
- Seed data: `cd gcredit-project/backend && npx prisma db seed`

### Final Checklist Before Commit

```
[ ] npm run build passes (frontend)
[ ] npm run lint passes (frontend) — 0 warnings
[ ] npm run test:run passes (frontend) — all green
[ ] npm run test passes (backend) — no regressions
[ ] All 4 roles manually verified (login, dashboard, role-specific pages)
[ ] Mobile viewport (375px) spot-checked
[ ] Screenshots captured for comparison
[ ] No Chinese characters in source code
[ ] No console.log in src/
[ ] PageTemplate used on all applicable pages
[ ] No hardcoded blue-600/gray-500 colors remaining (use brand-*/neutral-*)
```
