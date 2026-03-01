# Sprint 15 Technical Architecture Review

**Review ID:** ARCH-REVIEW-SPRINT-15  
**Date:** 2026-03-01  
**Reviewer:** Technical Architect (AI-Assisted)  
**Sprint:** Sprint 15 — UI Overhaul + Dashboard Composite View  
**Version:** v1.4.0 → v1.5.0  
**Sprint Capacity:** ~56 hours  
**Stories Reviewed:** 15.1 (Dashboard), 15.2 (Permissions API), 15.3 (Sidebar)

---

## Executive Summary

### Overall Verdict: **APPROVED WITH CHANGES** ⚠️

Sprint 15 represents the largest frontend architecture change since Sprint 8, replacing the top navigation paradigm with a sidebar layout and converting stacked dashboards to a tabbed composite view. The backend changes are minimal (one new endpoint, one config change), keeping risk concentrated in the frontend layer.

**Key Findings:**
- ✅ **Strengths:** Clean permission model, shadcn/ui component alignment, existing sub-dashboards preserved, good wave sequencing
- ⚠️ **Critical Issues:** 2 architecture concerns requiring decision
- 🟡 **Medium Concerns:** 4 technical design clarifications
- ✅ **Low Risk:** Backend changes (15.2, 15.13) are straightforward

**Approval Status:**
- **15.2 (Permissions API):** APPROVED ✅
- **15.13 (Rate Limits):** APPROVED ✅
- **15.1 (Dashboard):** APPROVED WITH CHANGES ⚠️
- **15.3 (Sidebar):** APPROVED WITH CHANGES ⚠️

---

## Story-by-Story Technical Review

### Story 15.2: Backend Permissions API ✅ APPROVED

**Rating:** 9/10  
**Estimated Hours:** 3h  
**Technical Risk:** LOW 🟢

#### Strengths
1. **Clean single endpoint** — `GET /api/users/me/permissions` consolidates permission logic server-side
2. **JWT + DB hybrid** — `isManager` from DB (freshest data), role from JWT
3. **6-combination unit tests** — Complete coverage requirement
4. **No schema migration** — Pure computation endpoint

#### Technical Notes

**NOTE-15.2-001: Permission Computation Location**
- **Current state:** Frontend `Navbar.tsx` and `MobileNav.tsx` both compute nav visibility inline using `user.role` and `user.isManager` from authStore
- **New endpoint adds:** A canonical backend computation of `dashboardTabs[]` and `sidebarGroups[]`
- **Recommendation:** Frontend should still compute visibility client-side from `role` + `isManager` (already in JWT/store). The permissions API becomes a **verification/enrichment** source, not the primary gate. This avoids adding a network dependency to navigation rendering.
- **Decision needed:** Is the permissions API the source of truth, or a supplementary check?

**NOTE-15.2-002: Caching Strategy**
- Story says "cached in frontend auth store (refreshed on token refresh)"
- ✅ Good approach — avoids per-navigation API calls
- Ensure cache invalidation on SSO re-sync (Story 13.3 login-time-mini-sync already refreshes profile)

**NOTE-15.2-003: Response Shape Enhancement**
- Current response includes flat permission booleans (`canViewTeam`, `canIssueBadges`, etc.)
- Consider also returning computed arrays:
```json
{
  "role": "ISSUER",
  "isManager": true,
  "dashboardTabs": ["my-badges", "team-overview", "issuance"],
  "sidebarGroups": ["base", "team", "issuance"]
}
```
- This ensures frontend and backend computation logic stay in sync
- Frontend can choose to use either format

---

### Story 15.13: Configurable Rate Limits ✅ APPROVED

**Rating:** 8/10  
**Estimated Hours:** 3h  
**Technical Risk:** LOW 🟢

#### Strengths
1. Directly addresses Sprint 14 retro action item (E2E test reliability)
2. Same defaults — no production behavior change
3. ConfigService integration is standard NestJS pattern

#### Technical Note

**NOTE-15.13-001: Env Variable Naming**
- Recommend: `THROTTLE_TTL_SECONDS` and `THROTTLE_LIMIT` (clear units, clear purpose)
- Add to `.env.example` with commented defaults
- E2E test `.env.test` should set generous limits (e.g., `THROTTLE_LIMIT=1000`)

---

### Story 15.1: Dashboard Tabbed Composite View ⚠️ APPROVED WITH CHANGES

**Rating:** 7/10  
**Estimated Hours:** 8h  
**Technical Risk:** MEDIUM 🟡

#### Critical Issues

**CRITICAL-15.1-ARCH-001: State Ownership — Tab Computation**
- **Severity:** HIGH 🟠
- **Issue:** Three potential sources for tab visibility: (1) JWT claims (already in authStore), (2) Permissions API response, (3) Inline useMemo computation in DashboardPage. Story references all three approaches without clear hierarchy.
- **Impact:** If permissions API disagrees with JWT (stale JWT, DB change), users may see inconsistent tabs vs sidebar.
- **Recommendation:**
  - **Primary source:** `useAuthStore()` → `role` + `isManager` (from JWT, refreshed on token rotation)
  - **Verification:** Permissions API called on mount, updates store if different
  - **Computation:** Single shared function `computeVisibleTabs(role, isManager)` used by both DashboardPage and Sidebar
  - Place in `frontend/src/utils/permissions.ts` — single source of truth
- **Status:** ARCHITECTURE DECISION NEEDED

**CRITICAL-15.1-ARCH-002: Route Consolidation Strategy**
- **Severity:** MEDIUM 🟡
- **Issue:** Current routing sends all authenticated users to `/` → `DashboardPage`. Story Task 5 mentions deep-linking via `?tab=issuance`. But sidebar navigation items (Templates, Badges, etc.) go to separate `/admin/*` routes, not dashboard tabs.
- **Impact:** Potential confusion: Is "Issuance" tab on dashboard the same as clicking "Templates" in sidebar? They show different content.
- **Clarification:** Dashboard tabs show overview/summary dashboards. Sidebar items navigate to full management pages. These are complementary, not duplicative.
- **Recommendation:** Document this distinction in Story 15.1:
  - Dashboard Issuance tab = IssuerDashboard (summary cards, recent activity)
  - Sidebar Issuance group = Full management pages (Templates list, Badge list, etc.)
  - No route conflict — dashboard lives at `/`, management pages at `/admin/*`
- **Status:** CLARIFICATION NEEDED

#### Medium Issues

**MEDIUM-15.1-001: Sub-Dashboard Data Fetching**
- When all tabs mount, 4 sub-dashboards may fire parallel API requests
- Current AdminDashboard (372 lines), EmployeeDashboard (517 lines) both fetch data on mount
- With all tabs mounted, initial page load triggers 4× data fetches simultaneously
- **Recommendation:** Use `enabled: isActiveTab` in React Query hooks, or wrap in conditional render that preserves DOM (CSS `display:none` for inactive tabs, not unmount)

**MEDIUM-15.1-002: Tab Content Height Consistency**
- Sub-dashboards have varying heights (AdminDashboard ~3 screens, EmployeeDashboard ~2 screens)
- Tab container should not have fixed height — allow natural scroll
- Avoid layout shift when switching between tabs of different heights

---

### Story 15.3: Sidebar Layout Migration ⚠️ APPROVED WITH CHANGES

**Rating:** 7/10  
**Estimated Hours:** 12h  
**Technical Risk:** HIGH 🟡

#### Critical Issues

**CRITICAL-15.3-ARCH-001: shadcn/ui Sidebar Installation**
- **Severity:** HIGH 🟠
- **Issue:** `sidebar.tsx` does not exist in `components/ui/`. Must be installed before development.
- **Impact:** Blocking for Story 15.3 Task 1
- **Required Action:**
```bash
npx shadcn@latest add sidebar
```
- This installs: `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarProvider`, `SidebarTrigger`, `SidebarInset`, `SidebarRail`
- **Dependency check:** Requires `@radix-ui/react-slot` (already present), tooltip component (may need installation)
- Verify compatibility with current React 19.2.0 + Tailwind 4.1.18
- **Status:** BLOCKING — Must resolve in Wave 1 or Sprint Setup

**CRITICAL-15.3-ARCH-002: Layout.tsx Restructure Scope**
- **Severity:** MEDIUM 🟡
- **Issue:** Current Layout.tsx (70 lines) uses `max-w-7xl mx-auto` container pattern. Sidebar layout requires full-width with sidebar + content area pattern. This is a fundamental layout paradigm shift.
- **Current Layout structure:**
```
<header>
  <MobileNav className="md:hidden" />
  <Navbar className="hidden md:block" />
</header>
<main className="max-w-7xl mx-auto">
  <Outlet />
</main>
```
- **New Layout structure needed:**
```
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header> <!-- mobile trigger only --> </header>
    <main className="max-w-7xl mx-auto p-4">
      <Outlet />
    </main>
  </SidebarInset>
</SidebarProvider>
```
- **Impact:** All page content shifts. Must verify all 15+ page components still render correctly.
- **Recommendation:** 
  - Create the new layout structure
  - Test every route visually after migration
  - Keep `max-w-7xl` constraint inside `SidebarInset` to prevent content from stretching too wide
- **Status:** HIGH RISK — Needs careful implementation

#### Medium Issues

**MEDIUM-15.3-001: Navigation Config Extraction**
- Current nav items are defined inline in both `Navbar.tsx` (254 lines) and `MobileNav.tsx` (329 lines) — duplicated role-gating logic
- Story Task 5 introduces `config/navigation.ts` — good refactoring
- **Recommendation:** Define navigation config once:
```typescript
// frontend/src/config/navigation.ts
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: 'base' | 'team' | 'issuance' | 'admin';
}
export const navigationConfig: NavItem[] = [...]
```
- Both AppSidebar and MobileNav consume same config
- Group visibility function shared with dashboard tab computation

**MEDIUM-15.3-002: Navbar.tsx Path Inconsistency**
- Navbar is at `components/Navbar.tsx` (not in `layout/` folder)
- MobileNav is at `components/layout/MobileNav.tsx`
- Story 15.3 creates AppSidebar at `components/layout/AppSidebar.tsx`
- **Recommendation:** When removing Navbar.tsx, clean up the import path inconsistency. All layout components should live in `components/layout/`.

**MEDIUM-15.3-003: localStorage Collision Check**
- Sidebar collapse state stored in localStorage (per story Dev Notes)
- authStore already persists to localStorage (from authStore.ts)
- shadcn/ui Sidebar uses cookie by default (`sidebar:state`) — verify localStorage vs cookie approach
- Ensure no key collision with existing persisted state

---

## Cross-Story Architecture Concerns

### CROSS-001: Shared Permission Computation
- **Affected Stories:** 15.1, 15.2, 15.3
- **Issue:** Three stories independently compute permission-based visibility
- **Recommendation:** Create shared utility early (Wave 1):
```typescript
// frontend/src/utils/permissions.ts
export function computeDashboardTabs(role: UserRole, isManager: boolean): DashboardTab[]
export function computeSidebarGroups(role: UserRole, isManager: boolean): SidebarGroup[]
export function computeNavItems(role: UserRole, isManager: boolean): NavItem[]
```
- Unit test this function with all 6 combinations once
- All UI components consume this instead of inline computation
- Backend 15.2 permissions API uses equivalent server-side logic

### CROSS-002: Component Installation Sequencing
- **Required installations before Wave 2:**
  - `npx shadcn@latest add sidebar` (for 15.3)
  - `npx shadcn@latest add tabs` (for 15.1)
  - `npx shadcn@latest add tooltip` (if not present — sidebar tooltips on collapse)
- **Recommendation:** Add a "Sprint 15 Setup" step at start of Wave 1 to install all components

### CROSS-003: Testing Infrastructure for 6 Combinations
- Stories 15.1, 15.3, 15.4 all test 6 role×manager combinations
- **Recommendation:** Create test fixture factory:
```typescript
// frontend/src/test-utils/auth-fixtures.ts
export const AUTH_COMBINATIONS = [
  { role: 'EMPLOYEE', isManager: false, expectedTabs: 1, expectedGroups: ['base'] },
  { role: 'EMPLOYEE', isManager: true, expectedTabs: 2, expectedGroups: ['base', 'team'] },
  // ... all 6
] as const;
```
- Reusable across all 3 stories' test suites

---

## Performance Architecture Notes

### Initial Page Load Impact
- **Current:** Dashboard loads 1-2 sub-dashboards based on role
- **New:** Dashboard mounts up to 4 tab contents; Sidebar adds ~8KB JS
- **Mitigation:** 
  - Use `enabled` flag on React Query hooks for non-active tabs
  - Sidebar component tree-shakes well (shadcn/ui is Radix-based, minimal overhead)
  - Expected total bundle increase: ~15-20KB (acceptable)

### Navigation Performance
- **Current:** Navbar re-renders on every route change (reads role/isManager from store)
- **New:** Sidebar renders once, only active state updates on route change
- **Net impact:** Slight improvement — sidebar is more efficient than re-reading role-gated nav

---

## Security Architecture Notes

### Story 15.2: Permissions API
- Endpoint protected by `JwtAuthGuard` — correct
- Response includes no sensitive data — only permission flags
- **Note:** Do NOT include user email, ID, or PII in permissions response (keep it minimal)

### Story 15.13: Rate Limits
- ConfigService values default to current hardcoded values — no security regression
- E2E test env gets relaxed limits — ensure these never leak to production `.env`
- **Gate:** `THROTTLE_LIMIT` must have a minimum floor (e.g., ≥5) to prevent accidental disablement

---

## Architectural Decisions Needed

| ID | Decision | Options | Recommendation | Story |
|----|----------|---------|----------------|-------|
| DEC-15-01 | Tab computation source of truth | JWT only / API only / Hybrid | Hybrid: JWT primary, API verification | 15.1, 15.2 |
| DEC-15-02 | ADMIN Team group visibility | isManager only / ADMIN bypass | Align with dashboard tab logic | 15.3 |
| DEC-15-03 | Tab content mounting strategy | Mount all / Lazy per tab | Mount all, gate data fetching | 15.1 |
| DEC-15-04 | Sidebar state storage | localStorage / Cookie | Follow shadcn/ui default | 15.3 |

---

## Pre-Development Checklist

### Must Complete Before Wave 2
- [ ] Install shadcn/ui components: `sidebar`, `tabs`, `tooltip`
- [ ] Create `frontend/src/utils/permissions.ts` with shared computation
- [ ] Create `frontend/src/test-utils/auth-fixtures.ts` with 6-combo factory
- [ ] Resolve DEC-15-01 through DEC-15-04

### Architecture Review Sign-Off
- [ ] Permission computation model agreed
- [ ] Layout restructure approach confirmed
- [ ] Performance impact accepted (~15-20KB bundle increase)
- [ ] Security review: 15.2 response shape, 15.13 env var safety

---

**Reviewed By:** Technical Architect (AI-Assisted)  
**Review Date:** 2026-03-01  
**Next Step:** Resolve 4 architecture decisions, install shadcn/ui components, then begin Wave 1
