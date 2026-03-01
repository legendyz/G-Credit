# Dev Prompt: Story 15.3 — Sidebar Layout Migration (TD-035-C)

**Story File:** `docs/sprints/sprint-15/15-3-sidebar-layout-migration.md`  
**Branch:** `sprint-15/ui-overhaul-dashboard`  
**Priority:** CRITICAL | **Estimate:** 12h | **Wave:** 2 (Core UI)  
**Dependencies:** Story 15.2 (Permissions API) ✅ Done

---

## Objective

Replace the current top navigation bar (`Navbar.tsx`, 254 lines) with a persistent, collapsible sidebar using shadcn/ui `Sidebar` component. This is the largest story in Sprint 15 and touches the global layout — every page in the application will be affected.

---

## Pre-Requisites: Install shadcn/ui Components

**CRITICAL: These components are NOT yet installed.** Run these before writing any code:

```bash
cd frontend
npx shadcn@latest add sidebar
npx shadcn@latest add tooltip
npx shadcn@latest add tabs
```

After installation, verify these files exist:
- `src/components/ui/sidebar.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/tabs.tsx`

**shadcn/ui config** (`components.json`):
- Style: `new-york`
- RSC: `false` (Vite, not Next.js)
- Icon Library: `lucide`
- Aliases: `@/components/ui` → `src/components/ui`

---

## Current Architecture (What You're Replacing)

### Layout.tsx (70 lines) — `src/components/layout/Layout.tsx`

```tsx
// Current structure:
<div className="min-h-screen bg-background">
  <SkipLink targetId="main-content" />
  {showNavbar && (
    <header role="banner">
      <MobileNav className="md:hidden" />        {/* < 768px */}
      <div className="hidden md:block">
        <Navbar />                                 {/* ≥ 768px */}
      </div>
    </header>
  )}
  <main id="main-content" role="main" tabIndex={-1}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </main>
</div>
```

**Key points:**
- `max-w-7xl mx-auto` constrains content width — **MUST be preserved inside SidebarInset**
- `SkipLink` for WCAG 2.4.1 — keep it
- Layout receives `children` prop (not Outlet)

### Navbar.tsx (254 lines) — `src/components/Navbar.tsx`

**⚠️ Inconsistent path!** Should be in `components/layout/` but is directly in `components/`.

Current navigation link structure:
```
Always:             Dashboard (/), Wallet (/wallet)
ADMIN|ISSUER:       Templates (/admin/templates), Badges (/admin/badges),
                    Bulk Issue (/admin/bulk-issuance), Analytics (/admin/analytics)
ADMIN only:         Users (/admin/users), Categories (/admin/skills/categories),
                    Skills (/admin/skills), Milestones (/admin/milestones)
EMPLOYEE+isManager: Badges (/admin/badges)
```

Permission logic used:
```tsx
const { user, isAuthenticated, logout } = useAuthStore();
const isManager = useIsManager();
// Role check: user?.role && ['ADMIN', 'ISSUER'].includes(user.role)
// Manager check: isManager && user?.role === 'EMPLOYEE'
```

**Active state:** `text-brand-600 bg-brand-50` (background highlight only)

### MobileNav.tsx (329 lines) — `src/components/layout/MobileNav.tsx`

Right-slide drawer with:
- Hamburger button (top-right)
- User info section
- Flat nav links (no groups)
- Sign Out at bottom
- Focus trap, Escape to close, backdrop click
- `navLinks` array with `{ to, label, roles, managerAccess? }`

### App.tsx Route Pattern (243 lines) — `src/App.tsx`

Each protected route wraps content individually:
```tsx
<Route path="/" element={
  <ProtectedRoute>
    <Layout pageTitle="Dashboard">
      <DashboardPage />
    </Layout>
  </ProtectedRoute>
} />
```

**This pattern does NOT use `<Outlet>`.** Layout is applied per-route, not via a layout route. Consider whether to refactor to a layout route pattern with `SidebarProvider`, but be cautious — this is a big change and may break things. The safer approach is to keep the per-route `<Layout>` pattern and modify `Layout.tsx` internally.

---

## Target Architecture

### New File: `src/config/navigation.ts`

Create a centralized navigation configuration:

```tsx
import {
  LayoutDashboard,
  Wallet,
  Users,
  Award,
  FileStack,
  Upload,
  BarChart3,
  Settings,
  Tag,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { SidebarGroup } from '@/utils/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: SidebarGroup;
}

export const navigationItems: NavItem[] = [
  // Base group (always visible)
  { label: 'Dashboard', href: '/',       icon: LayoutDashboard, group: 'base' },
  { label: 'Wallet',    href: '/wallet', icon: Wallet,          group: 'base' },

  // Team group (isManager === true)
  { label: 'Team Overview', href: '/admin/badges', icon: Users, group: 'team' },

  // Issuance group (ISSUER | ADMIN)
  { label: 'Templates', href: '/admin/templates',     icon: FileStack,  group: 'issuance' },
  { label: 'Badges',    href: '/admin/badges',        icon: Award,      group: 'issuance' },
  { label: 'Bulk Issue', href: '/admin/bulk-issuance', icon: Upload,    group: 'issuance' },
  { label: 'Analytics', href: '/admin/analytics',     icon: BarChart3,  group: 'issuance' },

  // Admin group (ADMIN only)
  { label: 'Users',       href: '/admin/users',              icon: Settings, group: 'admin' },
  { label: 'Categories',  href: '/admin/skills/categories',  icon: Tag,      group: 'admin' },
  { label: 'Skills',      href: '/admin/skills',             icon: Award,    group: 'admin' },
  { label: 'Milestones',  href: '/admin/milestones',         icon: Target,   group: 'admin' },
];

export const groupLabels: Record<SidebarGroup, string> = {
  base: '',           // No header for base group
  team: 'Team',
  issuance: 'Issuance',
  admin: 'Admin',
};
```

### New File: `src/components/layout/AppSidebar.tsx`

Use shadcn/ui Sidebar primitives. Here's the target structure:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore, useIsManager } from '@/stores/authStore';
import { computeSidebarGroups, type SidebarGroup as SidebarGroupType } from '@/utils/permissions';
import { navigationItems, groupLabels } from '@/config/navigation';

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const isManager = useIsManager();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const role = user?.role ?? 'EMPLOYEE';
  const visibleGroups = computeSidebarGroups(role, isManager);

  const visibleItems = navigationItems.filter(
    (item) => visibleGroups.includes(item.group)
  );

  // Group items by their group key
  const groupedItems = visibleGroups.map((group) => ({
    group,
    label: groupLabels[group],
    items: visibleItems.filter((item) => item.group === group),
  }));

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header / Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <span className="text-xl font-bold text-brand-600">G-Credit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent>
        {groupedItems.map(({ group, label, items }) => (
          <SidebarGroup key={group}>
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}  // Shows on collapsed hover (REC-15.3-002)
                    >
                      <a href={item.href} onClick={(e) => {
                        e.preventDefault();
                        navigate(item.href);
                      }}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: User info + Sign Out */}
      <SidebarFooter>
        {/* ... user avatar + name + sign out button ... */}
      </SidebarFooter>
    </Sidebar>
  );
}
```

**Key shadcn/ui Sidebar API points:**
- `collapsible="icon"` — enables icon-only mode with toggle
- `SidebarMenuButton tooltip` prop — shows tooltip on collapsed hover
- `isActive` prop — controls active state styling
- `SidebarProvider` wraps the entire layout (goes in Layout.tsx)
- `SidebarInset` wraps main content area
- Cookie persistence is built-in (`sidebar:state` cookie) — DEC-15-04

### Refactored: `src/components/layout/Layout.tsx`

```tsx
import type { ReactNode } from 'react';
import { SkipLink } from '@/components/ui/SkipLink';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  showNavbar?: boolean;
  className?: string;
}

export function Layout({ children, pageTitle, showNavbar = true, className = '' }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <SkipLink targetId="main-content" />

        {showNavbar && <AppSidebar />}

        <SidebarInset>
          {/* Mobile header with sidebar trigger */}
          {showNavbar && (
            <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
              <SidebarTrigger />
              <span className="text-lg font-bold text-brand-600">G-Credit</span>
            </header>
          )}

          <main
            id="main-content"
            role="main"
            tabIndex={-1}
            className={className}
            aria-label={pageTitle || 'Main content'}
          >
            <div className="max-w-7xl mx-auto">
              {pageTitle && <h1 className="sr-only">{pageTitle}</h1>}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
```

**CRITICAL: `max-w-7xl mx-auto` stays INSIDE `SidebarInset`** — without this, content will stretch to full viewport width.

---

## Active State Styling (AC #5 — REC-15.3-003)

The default shadcn/ui `isActive` adds `data-active` attribute. Override in your sidebar CSS:

```css
/* In index.css or a sidebar-specific file */
[data-sidebar="menu-button"][data-active="true"] {
  border-left: 3px solid hsl(var(--primary));
  background-color: hsl(var(--accent));
}
```

Or via Tailwind classes in the `SidebarMenuButton` component override.

---

## Animation (AC #6 — CRITICAL-15.3-002)

shadcn/ui Sidebar has built-in collapse animation. Verify it uses `200ms ease-in-out`. If not, override:

```css
[data-sidebar="sidebar"] {
  transition: width 200ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  [data-sidebar="sidebar"] {
    transition: none;
  }
}
```

---

## Keyboard Navigation (AC #11 — REC-15.3-004)

- Container: `role="navigation"` + `aria-label="Main navigation"`
- Tab/Shift+Tab between menu items
- Enter/Space to activate
- Home/End to jump to first/last item
- shadcn/ui handles most of this via Radix primitives — verify and supplement if needed

---

## Permissions Integration (CROSS-001)

Use the shared `utils/permissions.ts` created in Story 15.2:

```tsx
import { computeSidebarGroups, type SidebarGroup } from '@/utils/permissions';
import { useAuthStore, useIsManager } from '@/stores/authStore';

// In component:
const { user } = useAuthStore();
const isManager = useIsManager();
const role = user?.role ?? 'EMPLOYEE';
const visibleGroups = computeSidebarGroups(role, isManager);
```

**Group visibility matrix (DEC-016-02, DEC-15-02):**

| Role | isManager | Visible Groups |
|------|-----------|----------------|
| EMPLOYEE | false | base |
| EMPLOYEE | true | base, team |
| ISSUER | false | base, issuance |
| ISSUER | true | base, team, issuance |
| ADMIN | false | base, issuance, admin |
| ADMIN | true | base, team, issuance, admin |

**Important:** Team group visibility is `isManager === true` only — no ADMIN bypass (DEC-15-02).

---

## Complete Route-to-Sidebar Mapping

Every existing route must remain accessible. Map as follows:

| Route | Sidebar Label | Group | Icon |
|-------|--------------|-------|------|
| `/` | Dashboard | base | LayoutDashboard |
| `/wallet` | Wallet | base | Wallet |
| `/admin/badges` | Team Overview | team | Users |
| `/admin/templates` | Templates | issuance | FileStack |
| `/admin/badges` | Badges | issuance | Award |
| `/admin/bulk-issuance` | Bulk Issue | issuance | Upload |
| `/admin/analytics` | Analytics | issuance | BarChart3 |
| `/admin/users` | Users | admin | Settings |
| `/admin/skills/categories` | Categories | admin | Tag |
| `/admin/skills` | Skills | admin | Award |
| `/admin/milestones` | Milestones | admin | Target |
| `/profile` | (in footer) | — | User |

**Note:** `/admin/badges` appears in both Team and Issuance groups — this mirrors the current Navbar behavior where EMPLOYEE+isManager can access badge management.

**Routes NOT in sidebar** (sub-pages accessed via in-page navigation):
- `/admin/badges/issue` — accessed from Badge Management page
- `/admin/templates/new` — accessed from Templates page
- `/admin/templates/:id/edit` — accessed from Templates page
- `/admin/bulk-issuance/preview/:sessionId` — accessed from Bulk Issuance flow

---

## File Deletion Plan

After sidebar is working:

1. **Delete** `src/components/Navbar.tsx` (254 lines) — replaced by AppSidebar
2. **Update** `src/components/layout/MobileNav.tsx` — either:
   - **Option A:** Delete entirely if shadcn/ui Sidebar's built-in mobile Sheet handles everything
   - **Option B:** Refactor to use shadcn/ui Sheet as the underlying component (keeping focus trap, backdrop, etc.)
   - **Recommended:** Option A — shadcn/ui Sidebar has built-in mobile support via `SidebarTrigger`
3. **Clean up** any imports referencing deleted files (Layout.tsx, App.tsx, tests)

---

## Execution Order

Follow this sequence strictly:

1. **Install components** — `npx shadcn@latest add sidebar tooltip tabs`
2. **Create `config/navigation.ts`** — navigation data (no UI yet, testable)
3. **Create `AppSidebar.tsx`** — sidebar component (can render standalone for testing)
4. **Refactor `Layout.tsx`** — swap Navbar/MobileNav for SidebarProvider+AppSidebar
5. **Verify all routes** — navigate every route, check no 404s
6. **Style active state** — left border + bg tint per REC-15.3-003
7. **Verify mobile** — <768px: sidebar becomes drawer via SidebarTrigger
8. **Delete Navbar.tsx** — clean up old code
9. **Delete/refactor MobileNav.tsx** — if shadcn handles mobile
10. **Write tests** — 6 role×manager combos, collapse toggle, mobile drawer, route links

---

## Testing Strategy

### Unit Tests for AppSidebar

```tsx
// Test all 6 role×manager combinations
const testCases = [
  { role: 'EMPLOYEE', isManager: false, expectedGroups: ['base'] },
  { role: 'EMPLOYEE', isManager: true,  expectedGroups: ['base', 'team'] },
  { role: 'ISSUER',   isManager: false, expectedGroups: ['base', 'issuance'] },
  { role: 'ISSUER',   isManager: true,  expectedGroups: ['base', 'team', 'issuance'] },
  { role: 'ADMIN',    isManager: false, expectedGroups: ['base', 'issuance', 'admin'] },
  { role: 'ADMIN',    isManager: true,  expectedGroups: ['base', 'team', 'issuance', 'admin'] },
];

// For each case, render AppSidebar with mocked authStore, assert:
// - Correct group headers visible/hidden
// - Correct nav links rendered
// - No unauthorized links visible
```

### Commands

```bash
# Run frontend tests
cd frontend
npx vitest run

# Run specific sidebar tests
npx vitest run src/components/layout/AppSidebar.test.tsx

# Check for TypeScript errors
npx tsc --noEmit

# Check lint
npm run lint

# Build to verify no errors
npm run build
```

---

## Design Token Reminders (Sprint 14 Lesson)

Use `@theme` variables, NOT hardcoded colors:

```tsx
// ✅ Good
className="text-primary bg-accent"
className="border-l-3 border-primary"

// ❌ Bad
className="text-blue-600 bg-blue-50"
style={{ borderLeft: '3px solid #2563eb' }}
```

---

## Coding Standards

- **No Chinese characters** in code/comments
- **No `console.log`** — use structured logging if needed
- **No inline styles** (`style={{}}`) — use Tailwind classes
- **No emoji in UI** — use Lucide icons (Story 15.10 will do full sweep, but don't add new emoji)
- **Touch targets ≥ 44px** — WCAG AAA / Apple HIG
- **Import from `@/`** — use path aliases, not relative `../../`

---

## After Completion

1. Update Story file status: `in-progress` → `done`
2. Update `sprint-status.yaml`: `15-3-sidebar-layout-migration: done`
3. Document all created/modified files in Story file `Dev Agent Record → File List`
4. Commit: `feat(ui): sidebar layout migration replacing top navigation (Story 15.3)`
5. Run full test suite: `cd frontend && npx vitest run` — all must pass
6. Run lint: `npm run lint` — zero warnings
7. Run build: `npm run build` — no errors
