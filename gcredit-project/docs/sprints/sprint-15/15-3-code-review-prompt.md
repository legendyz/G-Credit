# Code Review Prompt: Story 15.3 — Sidebar Layout Migration (TD-035-C)

## Review Metadata

- **Story:** 15.3 — Sidebar Layout Migration
- **Story File:** `docs/sprints/sprint-15/15-3-sidebar-layout-migration.md`
- **Commit:** `1375ed0` (single commit)
- **Parent:** `4632fd7` (Story 15.13 done — last pushed commit)
- **Branch:** `sprint-15/ui-overhaul-dashboard`
- **Priority:** CRITICAL (12h story, largest in Sprint 15)

---

## Diff Commands

```bash
# Full diff (all files, excluding package-lock.json)
git diff 4632fd7..1375ed0 -- ":(exclude)**/package-lock.json"

# Core implementation files only (5 files)
git diff 4632fd7..1375ed0 -- \
  gcredit-project/frontend/src/components/layout/AppSidebar.tsx \
  gcredit-project/frontend/src/components/layout/Layout.tsx \
  gcredit-project/frontend/src/config/navigation.ts \
  gcredit-project/frontend/src/index.css

# Deleted files (verify clean removal)
git diff 4632fd7..1375ed0 -- \
  gcredit-project/frontend/src/components/Navbar.tsx \
  gcredit-project/frontend/src/components/layout/MobileNav.tsx \
  gcredit-project/frontend/src/components/layout/MobileNav.test.tsx

# Test files only
git diff 4632fd7..1375ed0 -- \
  gcredit-project/frontend/src/components/layout/AppSidebar.test.tsx \
  gcredit-project/frontend/src/components/layout/Layout.test.tsx

# shadcn/ui generated files (low-priority, auto-generated)
git diff 4632fd7..1375ed0 -- \
  gcredit-project/frontend/src/components/ui/sidebar.tsx \
  gcredit-project/frontend/src/components/ui/tooltip.tsx \
  gcredit-project/frontend/src/components/ui/separator.tsx \
  gcredit-project/frontend/src/components/ui/tabs.tsx \
  gcredit-project/frontend/src/hooks/use-mobile.tsx

# Overwritten shadcn/ui files (verify no functional regressions)
git diff 4632fd7..1375ed0 -- \
  gcredit-project/frontend/src/components/ui/button.tsx \
  gcredit-project/frontend/src/components/ui/sheet.tsx \
  gcredit-project/frontend/src/components/ui/skeleton.tsx
```

---

## Scope

23 files changed (+2,280, −995 lines). Excluding package-lock.json and dev-prompt:

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `src/components/layout/AppSidebar.tsx` | NEW | +139 | Main sidebar component with grouped nav |
| `src/components/layout/AppSidebar.test.tsx` | NEW | +268 | 21 tests for sidebar behavior |
| `src/config/navigation.ts` | NEW | +75 | Centralized nav config (11 items, 4 groups) |
| `src/components/layout/Layout.tsx` | MODIFIED | ~85 | SidebarProvider + SidebarInset refactor |
| `src/components/layout/Layout.test.tsx` | MODIFIED | ~132 | 12 updated tests for new layout |
| `src/index.css` | MODIFIED | +17 | Active state + collapse animation CSS |
| `src/components/Navbar.tsx` | DELETED | −253 | Old top navigation bar |
| `src/components/layout/MobileNav.tsx` | DELETED | −328 | Old mobile drawer navigation |
| `src/components/layout/MobileNav.test.tsx` | DELETED | −271 | Old mobile nav tests |
| `src/components/ui/sidebar.tsx` | NEW (generated) | +745 | shadcn/ui Sidebar primitives |
| `src/components/ui/tooltip.tsx` | NEW (generated) | +30 | shadcn/ui Tooltip |
| `src/components/ui/separator.tsx` | NEW (generated) | +24 | shadcn/ui Separator |
| `src/components/ui/tabs.tsx` | NEW (generated) | +55 | shadcn/ui Tabs |
| `src/hooks/use-mobile.tsx` | NEW (generated) | +19 | Mobile breakpoint hook |
| `src/components/ui/button.tsx` | OVERWRITTEN | ±2 | Quote format only (safe) |
| `src/components/ui/sheet.tsx` | OVERWRITTEN | ±2 | Quote format + `"use client"` (safe) |
| `src/components/ui/skeleton.tsx` | OVERWRITTEN | ±2 | `bg-gray-200` → `bg-primary/10` (functional) |
| `package.json` | MODIFIED | +3 | New sidebar deps |

---

## Architecture Context

This is the **largest UI story in Sprint 15** — replaces the entire navigation paradigm from top navbar to persistent collapsible sidebar.

**Key Architecture References:**
- **ADR-016 DEC-016-02:** Sidebar navigation groups (4 groups: base, team, issuance, admin)
- **DEC-15-04:** Cookie-based sidebar state persistence (shadcn/ui default)
- **CRITICAL-15.3-ARCH-002:** `max-w-7xl` constraint must stay inside `SidebarInset`
- **CROSS-001:** `computeSidebarGroups()` from `utils/permissions.ts` — same shared logic as dashboard tabs
- **REC-15.3-002:** Collapsed icon-only mode with tooltip labels
- **REC-15.3-003:** Active state = 3px left border + accent background

**Permission Group Matrix (ADR-016 §DEC-016-02):**

| Role | isManager | Visible Groups |
|------|-----------|----------------|
| EMPLOYEE | false | base |
| EMPLOYEE | true | base, team |
| ISSUER | false | base, issuance |
| ISSUER | true | base, team, issuance |
| ADMIN | false | base, issuance, admin |
| ADMIN | true | base, team, issuance, admin |

---

## Review Checklist

### 1. AppSidebar.tsx (Core Component — 139 lines)

**Permission-based Group Visibility (AC#3, CROSS-001):**
- [ ] Uses `computeSidebarGroups()` from `utils/permissions.ts` (not duplicated logic)
- [ ] Gets `role` from `useAuthStore()` correctly
- [ ] Gets `isManager` via `useIsManager()` hook (not raw store field)
- [ ] Falls back to `'EMPLOYEE'` when no user → `base` group only (safe default)
- [ ] Group visibility matches the 6-combo permission matrix above

**Navigation Structure (AC#1, AC#10):**
- [ ] All 11 nav items present and mapped to correct routes
- [ ] `handleNavigate()` uses `e.preventDefault()` + `navigate()` (SPA navigation, not full reload)
- [ ] No broken route references — every `href` matches an existing React Router route

**shadcn/ui Primitives (AC#2):**
- [ ] Uses `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem` correctly
- [ ] `collapsible="icon"` on `<Sidebar>` — enables icon-only collapse mode
- [ ] `SidebarMenuButton tooltip={item.label}` — tooltips in collapsed mode (REC-15.3-002)
- [ ] `SidebarRail` rendered — provides hover strip for toggle

**Active State (AC#5, REC-15.3-003):**
- [ ] `isActive={pathname === item.href}` — exact match comparison
- [ ] CSS in `index.css` targets `[data-sidebar="menu-button"][data-active="true"]`
- [ ] 3px left border + accent background (design token, not hardcoded color)

**Footer Section (AC#8):**
- [ ] User avatar shows first initial
- [ ] User name displayed (truncated with `truncate` class)
- [ ] Profile link navigates to `/profile`
- [ ] Sign Out calls `logout()` + `toast.success()` + `navigate('/login')`

**ARIA / Accessibility (AC#11):**
- [ ] `aria-label="Main navigation"` on `<Sidebar>`
- [ ] All interactive elements are focusable

**Reviewer Questions:**
1. `pathname === item.href` does exact match — what about sub-routes? E.g., `/admin/templates/new` won't highlight "Templates". Is `pathname.startsWith(item.href)` more appropriate? (Check if this is intentional per story AC or needs a follow-up.)
2. The `handleNavigate` returns a closure `(href) => (e) => ...`. Is the closure created on every render for every item? Consider if this causes unnecessary re-renders.
3. `Team Overview` and `Badges` both link to `/admin/badges` — is this intentional? (Check navigation.ts comment about dual-group behavior.)

---

### 2. Layout.tsx (Refactored — ~85 lines)

**SidebarProvider Architecture (AC#9, CRITICAL-15.3-ARCH-002):**
- [ ] `SidebarProvider` wraps everything (outermost layout wrapper)
- [ ] `AppSidebar` rendered inside `SidebarProvider`, before `SidebarInset`
- [ ] `SidebarInset` wraps main content area
- [ ] `max-w-7xl mx-auto` is INSIDE `SidebarInset > main > div` — NOT on the outer flex container

**Mobile Header (AC#7):**
- [ ] `SidebarTrigger` visible only on mobile (`md:hidden` on header)
- [ ] Header contains: trigger button + separator + "G-Credit" brand text
- [ ] Mobile header does NOT render when `showNavbar={false}`

**WCAG Compliance:**
- [ ] `SkipLink` is first focusable element (WCAG 2.4.1)
- [ ] `<main>` has `role="main"`, `id="main-content"`, `tabIndex={-1}`, `aria-label`
- [ ] `<footer>` has `role="contentinfo"` and is `sr-only`
- [ ] `sr-only` `<h1>` renders when `pageTitle` is provided (WCAG 1.3.1)

**Props Interface:**
- [ ] `showNavbar` defaults to `true` (backward compatible)
- [ ] `children` is `ReactNode` (not `React.PropsWithChildren`)
- [ ] `className` passed to `<main>` element (customizable)

**Reviewer Questions:**
1. Is `showNavbar` still the right prop name now that it controls a sidebar, not a navbar? Should it be renamed to `showSidebar` for clarity? (Non-blocking, but assess.)
2. Cookie-based persistence (DEC-15-04): `SidebarProvider` handles this natively — verify no custom `defaultOpen` or localStorage code was added.

---

### 3. navigation.ts (New Config — 75 lines)

**Route Coverage (AC#10):**
- [ ] All 11 existing user-facing routes are mapped
- [ ] Each item has: `label`, `href`, `icon` (LucideIcon), `group` (SidebarGroup type)
- [ ] Sub-routes excluded per comments (e.g., `/admin/badges/issue`, `/admin/templates/new`)

**Type Safety:**
- [ ] `NavItem` interface uses `LucideIcon` type for icons
- [ ] `group` field typed as `SidebarGroup` (imported from `utils/permissions.ts`)
- [ ] `groupLabels` is `Record<SidebarGroup, string>` — covers all 4 groups

**Dual-Group Route:**
- [ ] `/admin/badges` appears in BOTH `team` group (as "Team Overview") and `issuance` group (as "Badges")
- [ ] Comment explains this mirrors existing Navbar behavior

**Reviewer Questions:**
1. Having `/admin/badges` in two groups means it can render twice for `ADMIN+isManager` or `ISSUER+isManager`. Does the UI show duplicate links? Check how `visibleItems.filter()` handles this in AppSidebar.
2. `Award` icon is used for both "Badges" and "Skills" — consider using different icons for visual distinction?
3. `Settings` icon for "Users" admin page — is `Users` icon (already imported) more intuitive?

---

### 4. index.css (Active State + Animation CSS — +17 lines)

**Active State (REC-15.3-003):**
```css
[data-sidebar="menu-button"][data-active="true"] {
  border-left: 3px solid hsl(var(--primary));
  background-color: hsl(var(--accent));
}
```
- [ ] Uses design tokens (`--primary`, `--accent`), not hardcoded colors
- [ ] Targets correct data attributes from shadcn/ui
- [ ] 3px left border matches spec

**Collapse Animation (CRITICAL-15.3-002):**
```css
[data-sidebar="sidebar"] {
  transition: width 200ms ease-in-out;
}
```
- [ ] 200ms duration matches spec
- [ ] `ease-in-out` timing function
- [ ] `prefers-reduced-motion: reduce` disables animation (`transition: none`)

**Reviewer Questions:**
1. Does the `border-left: 3px` shift the menu item content by 3px? Should padding-left be adjusted to compensate? Or does the layout absorb it naturally?
2. Does shadcn/ui's built-in sidebar transition conflict with this custom CSS? Check if `sidebar.tsx` already defines a width transition.

---

### 5. Deleted Files (Navbar.tsx, MobileNav.tsx, MobileNav.test.tsx)

- [ ] `Navbar.tsx` (253 lines) fully deleted — no partial removal
- [ ] `MobileNav.tsx` (328 lines) fully deleted
- [ ] `MobileNav.test.tsx` (271 lines) fully deleted
- [ ] No other files still import from `Navbar` or `MobileNav` (run: `grep -rn "Navbar\|MobileNav" gcredit-project/frontend/src/ --include="*.tsx" --include="*.ts"`)
- [ ] `App.tsx` does NOT import Navbar or MobileNav

**Reviewer Question:**
1. Were there any features in MobileNav.tsx that are NOT replicated in the new sidebar? Specifically: Issue Badge action accessible from mobile (AC#12, absorb P2-10) — verify this action exists in the sidebar or is accessible from mobile.

---

### 6. Test Coverage (AC#8 — 21 new + 12 updated)

**AppSidebar.test.tsx (268 lines, 21 tests):**
- [ ] All 6 role×isManager combinations tested for group visibility
- [ ] Navigation links tested for correct `href` attributes
- [ ] Click navigation tested (`navigate()` called with correct path)
- [ ] Active state tested (Dashboard active on `/`, Wallet active on `/wallet`, Dashboard inactive on `/wallet`)
- [ ] User info rendered (name, initial avatar)
- [ ] Sign Out tested (calls `logout()`, navigates to `/login`)
- [ ] Sidebar structure (rail rendered, brand text)
- [ ] `SidebarProvider` used in render helper (required for shadcn/ui sidebar)

**Layout.test.tsx (132 lines, 12 tests):**
- [ ] AppSidebar mocked (tested separately — good isolation)
- [ ] SidebarProvider/SidebarInset properly mocked
- [ ] `showNavbar={true}` → sidebar + trigger rendered
- [ ] `showNavbar={false}` → no sidebar, no trigger
- [ ] Skip link rendered
- [ ] Children rendered
- [ ] Main landmark attributes (id, aria-label)
- [ ] `sr-only` h1 with pageTitle
- [ ] CRITICAL-15.3-ARCH-002: `max-w-7xl mx-auto` on content container
- [ ] Custom className on main

**Reviewer Questions:**
1. Is there a test for the mobile header rendering? The mock test verifies `SidebarTrigger` exists, but is there a responsive test at 768px breakpoint?
2. No E2E tests in this commit — is that expected? (Check if Story 15.14 mid-sprint UAT covers sidebar navigation E2E.)
3. Tests mock `SidebarProvider` in Layout.test.tsx — good for isolation, but does AppSidebar.test.tsx use the REAL `SidebarProvider`? If yes, this is good coverage.

---

### 7. shadcn/ui Generated Files (Low Priority)

These are auto-generated by `npx shadcn@latest add`:
- `src/components/ui/sidebar.tsx` (745 lines)
- `src/components/ui/tooltip.tsx` (30 lines)
- `src/components/ui/separator.tsx` (24 lines)
- `src/components/ui/tabs.tsx` (55 lines)
- `src/hooks/use-mobile.tsx` (19 lines)

**Quick Scan Only:**
- [ ] No custom modifications to generated files (they should be pure shadcn/ui output)
- [ ] `"use client"` directives present (shadcn/ui standard — harmless in non-RSC project)
- [ ] Imports from `@/lib/utils` and `@/components/ui/*` — consistent with project aliases

---

### 8. Overwritten shadcn/ui Files

**Pre-verified by SM — summary:**

| File | Change | Verdict |
|------|--------|---------|
| `button.tsx` | Single→double quotes only | Safe (format) |
| `sheet.tsx` | Single→double quotes + `"use client"` | Safe (format) |
| `skeleton.tsx` | Quotes + `bg-gray-200` → `bg-primary/10` | Functional but improved (uses design token, dark-mode friendly) |

- [ ] Confirm skeleton change is acceptable (uses theme token instead of hardcoded gray)
- [ ] No other functional changes in overwritten files

---

### 9. package.json Dependencies

- [ ] Only sidebar-related deps added (check diff for exact additions)
- [ ] No version conflicts with existing packages
- [ ] `package-lock.json` is consistent (no manual edits)

---

### 10. Story Documentation

- [ ] Story status = `done` (AC all checked)
- [ ] All 13 ACs marked `[x]`
- [ ] All 8 tasks/subtasks marked `[x]`
- [ ] Dev Agent Record filled: model, completion notes, file list
- [ ] Test results documented: 820 total tests passing
- [ ] `sprint-status.yaml` status = `in-progress` for 15.3 (will update to `done` after CR)

---

## What Was NOT Changed (Verify Unchanged)

These files/areas MUST NOT be modified in this story:

| File/Area | Belongs To |
|-----------|-----------|
| `App.tsx` route definitions | Not in scope — routes unchanged |
| `utils/permissions.ts` | Story 15.2 — shared logic, should be reused not modified |
| `stores/authStore.ts` | Not in scope — `useIsManager()` already exists |
| Backend files | No backend changes in this story |
| `components/ui/sidebar.tsx` internals | Auto-generated, should not be hand-edited |
| E2E tests | Story 15.14 (mid-sprint UAT) |

**Verification commands:**
```bash
# Verify no changes to permissions.ts
git diff 4632fd7..1375ed0 -- gcredit-project/frontend/src/utils/permissions.ts

# Verify no changes to App.tsx
git diff 4632fd7..1375ed0 -- gcredit-project/frontend/src/App.tsx

# Verify no changes to authStore
git diff 4632fd7..1375ed0 -- gcredit-project/frontend/src/stores/authStore.ts

# Verify no stale imports to deleted files
grep -rn "Navbar\|MobileNav" gcredit-project/frontend/src/ --include="*.tsx" --include="*.ts"
```

---

## Verdict Options

- **APPROVED** — Sidebar correctly replaces Navbar/MobileNav, permissions matrix matches ADR-016, ARCH-002 constraint preserved, tests adequate
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking items (e.g., `startsWith` active matching, icon dedup, prop rename)
- **CHANGES REQUESTED** — Blocking issue found (describe)
