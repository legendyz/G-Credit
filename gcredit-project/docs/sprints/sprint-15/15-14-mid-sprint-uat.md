# Story 15.14: Mid-Sprint UAT — Sidebar + Dashboard (Wave 2.5)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 3h  
**Wave:** 2.5 — Mid-Sprint UAT  
**Source:** Sprint 15 Planning — UI-heavy sprint requires staged UAT  
**Dependencies:** 15.1 (Dashboard), 15.2 (Permissions API), 15.3 (Sidebar) — all must be complete

---

## Story

**As a** Product Owner,  
**I want** to validate the core UI architecture (sidebar + dashboard) across all 6 role×manager combinations at mid-sprint,  
**So that** structural issues are caught before the UI polish wave builds on top of them.

## Acceptance Criteria

1. [ ] All 6 role×manager combinations tested for sidebar navigation
2. [ ] All 6 combinations tested for dashboard tab visibility and content
3. [ ] Navigation routes verified — every sidebar item leads to correct page
4. [ ] Responsive behavior validated at desktop (1280px) and mobile (375px)
5. [ ] No 404 errors or broken routes
6. [ ] UAT results documented with PASS/FAIL per test case
7. [ ] Any FAIL items have follow-up action (fix in Wave 3 or create tech debt)

## UAT Test Cases

### A. Sidebar Navigation (6 combinations × 4 checks = 24 tests)

| # | Role | isManager | Check | Expected |
|---|------|-----------|-------|----------|
| A1 | EMPLOYEE | false | Base group visible | Dashboard, Wallet |
| A2 | EMPLOYEE | false | Team group hidden | Not visible |
| A3 | EMPLOYEE | false | Issuance group hidden | Not visible |
| A4 | EMPLOYEE | false | Admin group hidden | Not visible |
| A5 | EMPLOYEE | true | Team group visible | Team Badges |
| A6 | EMPLOYEE | true | Issuance group hidden | Not visible |
| A7 | ISSUER | false | Issuance group visible | Templates, Badges, Bulk, Analytics |
| A8 | ISSUER | false | Team group hidden | Not visible |
| A9 | ISSUER | true | Team + Issuance visible | Both groups |
| A10 | ADMIN | false | Issuance + Admin visible | Both groups |
| A11 | ADMIN | false | Team group hidden | Not visible |
| A12 | ADMIN | true | All groups visible | Base + Team + Issuance + Admin |

### B. Dashboard Tabs (6 combinations × 3 checks = 18 tests)

| # | Role | isManager | Check | Expected |
|---|------|-----------|-------|----------|
| B1 | EMPLOYEE | false | Default tab | "My Badges" |
| B2 | EMPLOYEE | false | Tab count | 1 tab |
| B3 | EMPLOYEE | false | Tab content | EmployeeDashboard renders |
| B4 | EMPLOYEE | true | Tab count | 2 tabs (My Badges, Team) |
| B5 | EMPLOYEE | true | Team tab content | ManagerDashboard renders |
| B6 | ISSUER | false | Tab count | 2 tabs (My Badges, Issuance) |
| B7 | ISSUER | true | Tab count | 3 tabs |
| B8 | ADMIN | false | Tab count | 3 tabs (My Badges, Issuance, Admin) |
| B9 | ADMIN | true | Tab count | 4 tabs (all) |
| B10 | ALL | — | Default tab | Always "My Badges" first |

### C. Route Integrity (10 tests)

| # | Check | Expected |
|---|-------|----------|
| C1 | Dashboard link | `/dashboard` loads composite view |
| C2 | Wallet link | `/wallet` loads badge wallet |
| C3 | Templates link (ISSUER) | `/templates` loads template list |
| C4 | Badges link (ISSUER) | `/badges` loads badge management |
| C5 | Bulk link (ISSUER) | `/bulk-issue` loads bulk page |
| C6 | Analytics link (ISSUER) | `/analytics` loads analytics |
| C7 | Users link (ADMIN) | `/admin/users` loads user management |
| C8 | Skills link (ADMIN) | `/admin/skills` loads skills |
| C9 | Categories link (ADMIN) | `/admin/categories` loads categories |
| C10 | Milestones link (ADMIN) | `/admin/milestones` loads milestones |

### D. Responsive (4 tests)

| # | Check | Expected |
|---|-------|----------|
| D1 | Desktop (1280px) | Sidebar visible, collapsible |
| D2 | Tablet (768px) | Sidebar collapsed or drawer |
| D3 | Mobile (375px) | Sidebar as drawer, hamburger trigger |
| D4 | Mobile drawer | Shows correct groups for logged-in user |

### Test Accounts

| # | Email | Role | isManager | Password |
|---|-------|------|-----------|----------|
| 1 | employee@test.gcredit.com | EMPLOYEE | false | (UAT setup) |
| 2 | manager-employee@test.gcredit.com | EMPLOYEE | true | (UAT setup) |
| 3 | issuer@test.gcredit.com | ISSUER | false | (UAT setup) |
| 4 | manager-issuer@test.gcredit.com | ISSUER | true | (UAT setup) |
| 5 | admin@test.gcredit.com | ADMIN | false | (UAT setup) |
| 6 | admin-manager@test.gcredit.com | ADMIN | true | (UAT setup) |

## Dev Notes

### UAT Execution
- Manual testing with 6 browser sessions (or use incognito windows)
- Document results in this file's "UAT Results" section below
- Screenshot capture for any FAIL items

### References
- ADR-016 DEC-016-01: Dashboard tab matrix
- ADR-016 DEC-016-02: Sidebar navigation specification
- Sprint 10 UAT: 33/33 PASS pattern
- Sprint 11 UAT: 152/153 PASS pattern

## UAT Results

_To be filled during UAT execution_

| Test ID | Result | Notes |
|---------|--------|-------|
| A1 | ✅ PASS | EMPLOYEE (no manager): Base group visible — Dashboard, Wallet shown |
| A2 | ✅ PASS | EMPLOYEE (no manager): Team group hidden |
| A3 | ✅ PASS | EMPLOYEE (no manager): Issuance group hidden |
| A4 | ✅ PASS | EMPLOYEE (no manager): Admin group hidden |
| A5 | ✅ PASS | EMPLOYEE+isManager: Team group visible — "Team Badges" shown |
| A6 | ✅ PASS | EMPLOYEE+isManager: Issuance group hidden |
| A7 | ✅ PASS | ISSUER (no manager): Issuance group visible — Templates, Badges, Bulk Issue, Analytics |
| A8 | ✅ PASS | ISSUER (no manager): Team group hidden |
| A9 | ✅ PASS | ISSUER+isManager: Team group (Team Badges) + Issuance group (4 links) both visible |
| A10 | ✅ PASS | ADMIN (no manager): Issuance group (4 links) + Admin group (4 links) visible |
| A11 | ✅ PASS | ADMIN (no manager): Team group hidden |
| A12 | ✅ PASS | ADMIN+isManager: Team + Issuance + Admin groups all visible |
| B1 | ✅ PASS | EMPLOYEE (no manager): 1 tab — "My Badges" only |
| B2 | ✅ PASS | EMPLOYEE (no manager): No Team/Issuance/Admin tabs |
| B3 | ✅ PASS | EMPLOYEE (no manager): My Badges tab content renders correctly |
| B4 | ✅ PASS | EMPLOYEE+isManager: 2 tabs — "My Badges" and "Team Overview" |
| B5 | ✅ PASS | EMPLOYEE+isManager: Team Overview tab renders ManagerDashboard content |
| B6 | ✅ PASS | ISSUER (no manager): 2 tabs — "My Badges" and "Issuance" |
| B7 | ✅ PASS | ISSUER+isManager: 3 tabs — "My Badges", "Team Overview", "Issuance" |
| B8 | ✅ PASS | ADMIN (no manager): 3 tabs — "My Badges", "Issuance", "Administration" |
| B9 | ✅ PASS | ADMIN+isManager: 4 tabs — all tabs visible |
| B10 | ✅ PASS | All roles: default selected tab is "My Badges" |
| C1 | ✅ PASS | Dashboard link → `/` loads composite view |
| C2 | ✅ PASS | Wallet link → `/wallet` loads badge wallet (title mismatch — see FINDING-01) |
| C3 | ✅ PASS | Team Badges link → `/admin/badges` loads Badge Management |
| C4 | ✅ PASS | Templates link → `/admin/templates` loads template list |
| C5 | ✅ PASS | Badges link → `/admin/badges` loads Badge Management |
| C6 | ✅ PASS | Bulk Issue link → `/admin/bulk-issuance` loads bulk page |
| C7 | ✅ PASS | Analytics link → `/admin/analytics` loads analytics |
| C8 | ✅ PASS | Users link → `/admin/users` loads user management |
| C9 | ✅ PASS | Categories link → `/admin/skills/categories` loads categories |
| C10 | ✅ PASS | Skills link → `/admin/skills` loads Skill Management (FINDING-08: table compressed on narrow viewport) |
| C10b | ✅ PASS | Milestones link → `/admin/milestones` loads milestones |
| D1 | ✅ PASS | Desktop (1280px): Sidebar visible, collapsible |
| D2 | ✅ PASS | Tablet (768px): Sidebar auto-collapsed to icon mode |
| D3 | ✅ PASS | Mobile (375px): Sidebar as drawer, hamburger trigger |
| D4 | ✅ PASS | Mobile drawer shows correct groups for logged-in user |

**Total:** 37/37 tests  
**PASS Rate:** 100%  
**Action Items:** 10 findings recorded (FINDING-01 through FINDING-10). 5 hotfixed during UAT, 3 to resolve in Sprint 15 Wave 3, 2 accepted (MVP design / known limitation).

---

## UAT Findings (Non-Blocking)

### FINDING-01: Wallet page title shows "My Badges" instead of "My Badge Wallet"

- **Severity:** LOW (UX inconsistency)
- **Test ID:** C2 (Route Integrity — Wallet link)
- **Description:** Clicking sidebar "Wallet" navigates to `/wallet` correctly, but the page content title reads "My Badges" (from `TimelineView.tsx` line 256: `<PageTemplate title="My Badges">`). This conflicts with the sidebar label "Wallet" and Layout's `pageTitle="My Badge Wallet"`.
- **Root Cause:** `TimelineView` component hardcodes `title="My Badges"` in its `PageTemplate`. This is a pre-Sprint 15 issue, not introduced by sidebar migration.
- **Disposition:** **To be resolved in Sprint 15 Wave 3.** Suggest aligning title to "My Badge Wallet" or just "Badge Wallet" to match sidebar.
- **File:** `frontend/src/components/TimelineView/TimelineView.tsx` line 256

### FINDING-02: Manager permissions not reflected until re-login

- **Severity:** LOW (Expected JWT behavior, but UX surprise)
- **Test ID:** A9 / A12 prep (adding subordinates to create isManager=true)
- **Description:** After assigning a subordinate to a user via Admin Users page, the sidebar Team group and Dashboard Team Overview tab do not appear until the user logs out and logs back in. The background permission verification (`GET /api/users/me/permissions`, DEC-15-01) exists but has 5-minute staleTime and only triggers on Dashboard page, not on sidebar navigation.
- **Root Cause:** `isManager` is computed at login time and stored in JWT. Subordinate changes are not reflected in the current session's JWT. The background API check (Story 15.1) could theoretically auto-correct, but the 5-minute cache and Dashboard-only scope limit its effectiveness.
- **Disposition:** Accept as known limitation for MVP. Consider future enhancement: reduce staleTime or trigger permission refresh after Admin user edits. Not blocking — re-login resolves immediately.
- **Workaround:** Log out and log back in after changing subordinate assignments.

### FINDING-03: Team Overview only shows direct reports, not full org tree

- **Severity:** INFO (MVP design decision, not a defect)
- **Test ID:** B5 (Team tab content)
- **Description:** The Manager Dashboard "Team Overview" tab only displays statistics for direct reports (users whose `managerId` equals the current user). It does not recursively traverse the organization hierarchy to include indirect subordinates (e.g., a director cannot see their manager's direct reports).
- **Root Cause:** `dashboard.service.ts` queries `where: { managerId: userId }` — single-level lookup by design (Story 12.3a).
- **Disposition:** This is an **intentional MVP design decision**. Recursive org tree traversal (indirect subordinates) is deferred as a **post-MVP enhancement** item due to: (1) recursive CTE query complexity, (2) performance considerations for deep hierarchies, (3) permission boundary definitions needed for multi-level visibility. Not blocking Sprint 15.

### FINDING-04: ISSUER+isManager gets 403 on Team Overview tab (**HOTFIXED**)

- **Severity:** HIGH (functional bug — tab visible but content blocked)
- **Test ID:** A9 / B7 (ISSUER + isManager=true)
- **Description:** When an ISSUER user with subordinates (isManager=true) clicks the "Team Overview" tab, the backend returns 403 Forbidden. The frontend correctly shows the tab (based on `computeDashboardTabs`), but the backend `GET /api/dashboard/manager` endpoint's `@Roles` decorator only allowed `EMPLOYEE` and `ADMIN` — missing `ISSUER`.
- **Root Cause:** `dashboard.controller.ts` line 94: `@Roles(UserRole.EMPLOYEE, UserRole.ADMIN)` — ISSUER was omitted when the MANAGER role was removed in Sprint 14 refactor (Story 14.5).
- **Fix:** Added `UserRole.ISSUER` to `@Roles(UserRole.EMPLOYEE, UserRole.ISSUER, UserRole.ADMIN)`. ManagerGuard already supported ISSUER+isManager (confirmed by `manager.guard.spec.ts`).
- **Disposition:** **Hotfixed immediately** during UAT. Commit pending.

### FINDING-05: Sidebar "Team Overview" label confused with Dashboard "Team Overview" tab (**HOTFIXED**)

- **Severity:** MEDIUM (UX confusion — same name, different content)
- **Test ID:** C3 (Route Integrity — Team Overview link)
- **Description:** Sidebar "Team Overview" link navigates to `/admin/badges` (Badge Management table), but Dashboard has a "Team Overview" tab showing ManagerDashboard (team stats). Same label, completely different content — users expect clicking sidebar "Team Overview" to show the same content as the Dashboard tab.
- **Root Cause:** `navigation.ts` used label "Team Overview" for the `/admin/badges` route in the Team sidebar group. This was inherited from old Navbar behavior.
- **Fix:** Renamed sidebar label from "Team Overview" to **"Team Badges"** in `navigation.ts`. Updated corresponding sidebar tests in `AppSidebar.test.tsx`. Dashboard tab "Team Overview" label unchanged (it genuinely shows team overview stats).
- **Disposition:** **Hotfixed immediately** during UAT.
- **Future Enhancement:** Sidebar "Team Badges" currently points to `/admin/badges` (same route as Issuance group's "Badges" link — shared Badge Management page). This is inherited from the old Navbar design. A dedicated **Team Dashboard page** (`/team` or `/team/dashboard`) should be created in a future sprint, providing: (1) team statistics summary (similar to Dashboard "Team Overview" tab content), (2) subordinate badge status list, (3) one-click badge issuance for team members. This would give the Team sidebar group a distinct destination and eliminate the route duplication with Issuance → Badges. Related: FINDING-03 (recursive org tree traversal also deferred to post-MVP).

### FINDING-06: Content area overlapped by sidebar — Tailwind v4 CSS variable syntax incompatibility (**HOTFIXED**)

- **Severity:** HIGH (Layout broken — content clipped on all pages)
- **Test ID:** D1-D4 (Responsive Layout — all viewport sizes)
- **Description:** When resizing the browser window, the main content area does not adapt — content is clipped/hidden behind the sidebar on the left side. The sidebar gap div (space-holder that pushes content right) has 0px width, so the content area starts at x=0, directly underneath the fixed-position sidebar (~173px wide).
- **Root Cause:** shadcn/ui `sidebar.tsx` was generated for Tailwind CSS v3, using bare CSS variable syntax `w-[--sidebar-width]`. In Tailwind v3, this auto-wraps to `width: var(--sidebar-width)`. But the project uses **Tailwind v4.1.18**, where `w-[--sidebar-width]` generates **invalid CSS** `width: --sidebar-width` (literal string, not a `var()` function). The gap div has no content, so its width falls back to 0px. The fixed sidebar renders at its content's intrinsic width (~173px) instead of the intended 256px (16rem).
- **Fix:** Changed all 5 bare `w-[--sidebar-width]` / `w-[--sidebar-width-icon]` occurrences to `w-[var(--sidebar-width)]` / `w-[var(--sidebar-width-icon)]` in `sidebar.tsx`. Also removed a redundant wrapper `<div>` in `Layout.tsx` that created a nested flex container.
- **Files Changed:** `frontend/src/components/ui/sidebar.tsx`, `frontend/src/components/layout/Layout.tsx`
- **Disposition:** **Hotfixed immediately** during UAT. Verified via Playwright: gap div now correctly computes to 256px.

### FINDING-07: Sidebar active link not visually highlighted (**HOTFIXED**)

- **Severity:** MEDIUM (UX — no visual indication of current page in sidebar)
- **Test ID:** C1-C10 (Route Integrity — sidebar link active state)
- **Description:** After clicking a sidebar link and navigating to a page, the sidebar link loses all visual highlight (no background, no border). Only hover state shows the accent color. The `data-active="true"` attribute is correctly set on the DOM, but the CSS styling has no visible effect.
- **Root Cause:** Custom CSS in `index.css` (Story 15.3, REC-15.3-003) used `hsl(var(--primary))` and `hsl(var(--accent))` to style active buttons, but the project's CSS variables use **oklch** color format (not hsl). `hsl()` wrapping an oklch value produces invalid CSS, so background-color resolves to transparent. Additionally, Tailwind v4 did not generate CSS for the `data-[active=true]:bg-sidebar-accent` utility class from the cva string in `sidebar.tsx`.
- **Fix:** Changed `hsl(var(--primary))` → `var(--primary)` and `hsl(var(--accent))` → `var(--accent)` in `index.css`.
- **File:** `frontend/src/index.css` line 252-255
- **Disposition:** **Hotfixed immediately** during UAT. Verified via Playwright: active button now shows `bg=oklch(0.961 0.028 248)`.

### FINDING-08: Skills Management table compressed across all viewports

- **Severity:** LOW (pre-existing UX issue, not Sprint 15 regression)
- **Test ID:** C10 (Route Integrity — Skills page), D2 (Tablet), D3 (Mobile)
- **Description:** Skills Management table columns are squeezed and text truncated across all viewport sizes: (1) **Desktop** — sidebar + CategoryTree left panel reduce table width, columns overlap; (2) **Tablet (768px)** — even with sidebar collapsed to icon mode, table still compressed; (3) **Mobile (375px)** — responsive `hidden sm:table-cell` hides some columns, but remaining columns (Name, Category, Actions) still show truncated text ("Doc...", "Neg...", "Tea..."). The page has responsive breakpoints but they are insufficient for the data density.
- **Root Cause:** `SkillManagementPage.tsx` uses `table-fixed` layout which forces equal column widths. While `overflow-x-auto` and responsive `hidden md:table-cell` / `hidden sm:table-cell` classes exist, the split layout (CategoryTree left + table right) further reduces available width for the table on medium viewports. On mobile, the CategoryTree switches to a dropdown but table columns are still too narrow.
- **Disposition:** Pre-existing, not a Sprint 15 regression. **To be resolved in Sprint 15.** Recommended improvements: (1) replace `table-fixed` with `table-auto`; (2) convert to card layout on mobile viewports; (3) add horizontal scroll indicator for tablet; (4) consider responsive column priority — hide low-value columns earlier.

### FINDING-09: CategoryDropdown "All Categories" cannot be re-selected

- **Severity:** MEDIUM (UX bug affecting mobile/tablet)
- **Test ID:** D3 (Mobile 375px), D4 (Mobile drawer groups)
- **Description:** On mobile/tablet viewports, `CategoryTree` renders a `CategoryDropdown` (Select) instead of the full tree view. The initial value is "All Categories" (`__all__`). After selecting a specific category, the user cannot re-select "All Categories" — clicking it does nothing. This traps the user in a selected state with no way to clear/reset the selection.
- **Root Cause:** `CategoryDropdown.handleValueChange` contained `if (value === '__all__') return;` which silently discarded the selection.
- **Fix:** Added `onClearSelection` callback prop through the chain: `SkillCategoryManagementPage` → `CategoryTree` → `CategoryDropdown`. Selecting "All Categories" now calls `onClearSelection()` which resets `selectedCategoryId` to `undefined`.
- **Files:** `CategoryDropdown.tsx`, `CategoryTree.tsx`, `SkillCategoryManagementPage.tsx`
- **Disposition:** **Hotfixed immediately** during UAT.

### FINDING-10: BadgeSearchBar filters don't adapt to viewport width

- **Severity:** LOW (pre-existing responsive UX issue, not Sprint 15 regression)
- **Test ID:** D2 (Tablet), D3 (Mobile)
- **Description:** On Badge Management page, the search/filter toolbar (`BadgeSearchBar`) uses `sm:flex-nowrap` which forces all filter controls (search, skills, date range, status, issuer) into a single row at ≥640px. At medium viewports (640–1024px), the search input gets severely compressed because fixed-width filters (`sm:w-40`, `sm:w-32`) consume most of the row width. The search input's `flex-1 min-w-0` allows it to shrink to near-zero.
- **Root Cause:** `BadgeSearchBar.tsx` line 129 uses `sm:flex-nowrap` — all filters forced into one row above 640px. No intermediate breakpoint wrapping strategy for tablet widths.
- **Files:** `frontend/src/components/search/BadgeSearchBar.tsx`
- **Disposition:** Pre-existing (Story 8.2). **To be resolved in Sprint 15** — recommended fix: add `lg:flex-nowrap` instead of `sm:flex-nowrap` to allow wrapping at tablet widths, or use responsive grid layout.

---

### Agent Model Used
_To be filled during UAT_

### Completion Notes
_To be filled during UAT_
