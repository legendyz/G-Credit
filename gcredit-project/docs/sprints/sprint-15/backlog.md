# Sprint 15 Backlog

**Sprint Number:** Sprint 15  
**Sprint Goal:** Complete UI transformation — sidebar navigation, dashboard composite view, full visual polish — making G-Credit pilot-presentable.  
**Target Version:** v1.5.0  
**Team Capacity:** Solo developer + AI agents  
**Sprint Lead:** LegendZhu  
**Branch:** `sprint-15/ui-overhaul`  
**Extended Sprint:** Yes — ~44h scope (AI Agent development, no time-box constraint)

---

## Sprint Goal

Deliver the full UI overhaul: replace top-navigation with a collapsible sidebar, transform the dashboard from role-switched views to a tabbed composite view using the dual-dimension model (Sprint 14), and execute all deferred UI polish items. After this sprint, G-Credit's UI should feel like a professional enterprise application suitable for pilot demos.

**"Every user sees their badges first. Managers see their team. Issuers see their tools. Admins see everything. All in one sidebar, one dashboard."**

**Success Criteria:**
- [ ] Collapsible sidebar replaces top navigation — responsive on desktop and mobile
- [ ] Dashboard uses `<Tabs>` with additive tab computation (My Badges always default)
- [ ] All 6 role×manager combinations see correct tabs and sidebar groups
- [ ] All emoji icons replaced with Lucide React icons across entire site
- [ ] Template list has server-side pagination with page controls
- [ ] Wallet has cursor-based infinite scroll
- [ ] Badge template form has dirty-form guard (beforeunload)
- [ ] Forgot Password page wired to existing backend endpoints
- [ ] z-index values use Tailwind theme scale (no hardcoded `z-[9999]`)
- [ ] Remaining inline `style={{}}` converted to Tailwind classes
- [ ] All 1,708+ existing tests pass (0 regressions) + new tests

---

## Sprint Capacity

### Velocity Reference
| Sprint | Estimated | Actual | Accuracy | Type |
|--------|-----------|--------|----------|------|
| Sprint 12 | 67h | ~60h | 90% | Management UIs |
| Sprint 13 | 50-60h | ~55h | 92% | SSO + Session |
| Sprint 14 | ~24h | TBD | — | Arch refactor |
| **Sprint 15** | **~44h** | TBD | Target: >85% | UI Overhaul |

### Capacity Allocation
| Category | Hours (Est.) | Notes |
|----------|-------------|-------|
| **TD-035-C:** Sidebar layout migration | 12h | Largest single item — ADR-016 DEC-016-02 |
| **TD-035-A:** Dashboard tabbed composite view | 8h | ADR-016 DEC-016-01 + ADR-017 §5.4 |
| **TD-035-B:** Backend permissions API | 3h | ADR-017 §4.8 |
| **TD-035-D:** 6-combination testing | 4h | UI-level validation |
| **UI Polish stories** | 17h | P1-1, P1-7, P2-1, P2-2, P2-5, P2-7, P2-8, P2-11 |
| **TOTAL** | **~44h** | Extended sprint — no time-box |

---

## Architecture & Design References

| Document | Content | Status |
|----------|---------|--------|
| **ADR-016** | 5 UI design decisions (tabs, sidebar, pagination, icons, P2-12 defer) | ✅ Accepted |
| **ADR-017** | Dual-dimension model (Sprint 14 prerequisite) | ✅ Accepted |
| **ADR-009** | Tailwind v4 CSS-first config — all tokens in `@theme {}` | ✅ Active |
| **ADR-015** | UserRole enum clean design — dev code comment templates | ✅ Active |

---

## Wave Structure

### Wave 1: Sidebar Layout Migration (Stories 15.1 — 15.2)
*Focus: Replace top-nav with collapsible sidebar — biggest single change*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 15.1 | AppSidebar component — collapsible sidebar with grouped navigation | CRITICAL | 10h | Sprint 14 complete |
| 15.2 | Layout refactor — SidebarProvider + responsive mobile handling | CRITICAL | 2h | 15.1 |

### Wave 2: Dashboard Composite View (Stories 15.3 — 15.5)
*Focus: Tabbed dashboard with additive tab computation*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 15.3 | Dashboard tabbed composite view (My Badges default) | HIGH | 8h | Sprint 14 (isManager in auth store) |
| 15.4 | Backend permissions API: `/api/users/me/permissions` | HIGH | 3h | Sprint 14 (ManagerGuard) |
| 15.5 | 6-combination UI testing (tabs + sidebar) | HIGH | 4h | 15.1-15.4 |

### Wave 3: Pagination + Infinite Scroll (Stories 15.6 — 15.7)
*Focus: Data loading patterns for scale readiness*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 15.6 | Template list — server-side pagination | MEDIUM | 3h | — |
| 15.7 | Wallet — cursor-based infinite scroll | MEDIUM | 3h | — |

### Wave 4: UI Polish (Stories 15.8 — 15.13)
*Focus: Visual consistency, icon systems, UX guards*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 15.8 | Full site emoji → Lucide icons | MEDIUM | 5h | 15.1 (sidebar icons needed) |
| 15.9 | Inline styles → Tailwind classes (P1-1) | MEDIUM | 2h | — |
| 15.10 | Forgot Password page (P1-7) | MEDIUM | 2h | — |
| 15.11 | z-index scale in Tailwind theme (P2-8) | LOW | 1h | — |
| 15.12 | Styled delete confirmation modal (P2-5) | LOW | 1h | — |
| 15.13 | Dirty-form guard for template form (P2-11) | MEDIUM | 2h | — |
| 15.14 | TD-038: Configurable auth rate limits | MEDIUM | 2-3h | — |

---

## User Stories

### Wave 1: Sidebar Layout Migration

#### Story 15.1: AppSidebar — Collapsible Sidebar Navigation
**Priority:** CRITICAL  
**Estimate:** 10h  
**Source:** ADR-016 DEC-016-02, TD-035-C  

**As a** G-Credit user,  
**I want** a persistent sidebar navigation with clear section grouping,  
**So that** I can quickly access all features relevant to my role and manager status.

**Acceptance Criteria:**
1. [ ] New `AppSidebar.tsx` component using shadcn/ui `Sidebar` primitives
2. [ ] Sidebar collapsible to icon-only mode with toggle button
3. [ ] Navigation grouped by dual-dimension permissions:

| Group | Visible When | Items |
|-------|-------------|-------|
| *(no header)* | Always | Dashboard, My Wallet |
| Team | `isManager \|\| role === 'ADMIN'` | Team Badges |
| Issuance | `role in [ADMIN, ISSUER]` | Templates, Badges, Bulk Issue, Analytics |
| Administration | `role === ADMIN` | Users, Categories, Skills, Milestones |
| *(footer)* | Always | Profile, Sign Out |

4. [ ] Each nav item has Lucide React icon (no emoji)
5. [ ] Active state indicator: left border or background highlight
6. [ ] User info section at top: avatar initials + name + role badge(s)
7. [ ] Role display: combined tags `[Issuer] [Manager]` for dual-identity users
8. [ ] `Navbar.tsx` — **replaced** by AppSidebar (file can be archived or deleted)
9. [ ] ADR-016 code comments in sidebar component
10. [ ] Keyboard accessible: Tab, Enter, Escape for collapse toggle
11. [ ] Desktop: sidebar always visible (collapsed or expanded)
12. [ ] Mobile: no sidebar — delegates to MobileNav (existing)

**Technical Notes:**
- Use `SidebarProvider`, `SidebarMenu`, `SidebarMenuButton` from shadcn/ui
- Sidebar state (collapsed/expanded) persisted to `localStorage`
- Width: expanded ~240px, collapsed ~60px

---

#### Story 15.2: Layout Refactor — SidebarProvider Integration
**Priority:** CRITICAL  
**Estimate:** 2h  
**Source:** ADR-016 DEC-016-02  

**As a** frontend developer,  
**I want** the Layout component updated to use SidebarProvider + SidebarInset pattern,  
**So that** main content area responds correctly to sidebar collapse state.

**Acceptance Criteria:**
1. [ ] `Layout.tsx` wraps content in `SidebarProvider` + `SidebarInset`
2. [ ] Main content area shifts when sidebar collapses/expands (CSS transition)
3. [ ] Mobile breakpoint (<768px): sidebar hidden, MobileNav shown (existing behavior preserved)
4. [ ] `MobileNav.tsx` updated: remove `'MANAGER'` from role arrays, add `isManager` group logic
5. [ ] Skip link still works (`#main-content` target)
6. [ ] No layout shift or flash on page load

---

### Wave 2: Dashboard Composite View

#### Story 15.3: Dashboard Tabbed Composite View
**Priority:** HIGH  
**Estimate:** 8h  
**Source:** ADR-016 DEC-016-01, ADR-017 §5.4, TD-035-A  

**As a** user with multiple roles/manager status,  
**I want** to see all my relevant dashboard views as tabs in one page,  
**So that** I don't miss team or issuance features because of a single-role view.

**Acceptance Criteria:**
1. [ ] `DashboardPage.tsx` rewritten: `switch(role)` → `useMemo` tab computation
2. [ ] Tab computation (declarative):

```
Tab "My Badges"      → always visible (DEFAULT TAB)
Tab "Team Overview"  → isManager === true
Tab "Issuance"       → role === 'ISSUER' || role === 'ADMIN'
Tab "Administration" → role === 'ADMIN'
```

3. [ ] Default active tab: always "My Badges" (ADR-016 DEC-016-01)
4. [ ] Uses shadcn/ui `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`
5. [ ] Existing sub-dashboards preserved as tab content:
   - `EmployeeDashboard` → My Badges tab
   - `ManagerDashboard` → Team Overview tab
   - `IssuerDashboard` → Issuance tab
   - `AdminDashboard` → Administration tab
6. [ ] All sub-dashboards wrapped in `ErrorBoundary` (existing pattern maintained)
7. [ ] ADR-015/ADR-017 code comments in DashboardPage
8. [ ] Tab count verified for all 6 combinations:
   - EMPLOYEE: 1 tab | EMPLOYEE+Manager: 2 | ISSUER: 2 | ISSUER+Manager: 3 | ADMIN: 3 | ADMIN+Manager: 4
9. [ ] URL does NOT change on tab switch (single-page state, not routes)
10. [ ] Tab state lost on navigation away (no persistence — per DEC-016-01)

---

#### Story 15.4: Backend Permissions API
**Priority:** HIGH  
**Estimate:** 3h  
**Source:** ADR-017 §4.8, TD-035-B  

**As a** frontend developer,  
**I want** a single API endpoint returning my computed permissions,  
**So that** UI tab/sidebar visibility is driven by a consistent backend source.

**Acceptance Criteria:**
1. [ ] New endpoint: `GET /api/users/me/permissions`
2. [ ] Response shape:
```json
{
  "role": "ISSUER",
  "isManager": true,
  "permissions": {
    "canViewTeam": true,
    "canIssueBadges": true,
    "canManageUsers": false,
    "canManageTemplates": true,
    "canViewAnalytics": true,
    "canViewAdminPanel": false
  }
}
```
3. [ ] `isManager` computed from DB (not just JWT) for freshest data
4. [ ] Protected by `JwtAuthGuard` only (no role restriction)
5. [ ] Response cached in frontend auth store (refreshed on token refresh)
6. [ ] Unit tests: all 6 combinations return correct permission set

---

#### Story 15.5: 6-Combination UI Testing (Tabs + Sidebar)
**Priority:** HIGH  
**Estimate:** 4h  
**Source:** ADR-017 §7, TD-035-D  

**As a** QA engineer,  
**I want** all 6 role×manager combinations tested at the UI level,  
**So that** sidebar groups and dashboard tabs render correctly for every user type.

**Acceptance Criteria:**
1. [ ] Test matrix — each combination verified for:
   - Sidebar: correct groups visible/hidden
   - Dashboard: correct number of tabs, correct default tab
   - ProtectedRoute: access allowed/denied for manager-required routes

| # | Role | isManager | Sidebar Groups | Dashboard Tabs | 
|---|------|-----------|---------------|---------------|
| 1 | EMPLOYEE | false | [base] | 1: My Badges |
| 2 | EMPLOYEE | true | [base, Team] | 2: My Badges, Team |
| 3 | ISSUER | false | [base, Issuance] | 2: My Badges, Issuance |
| 4 | ISSUER | true | [base, Team, Issuance] | 3: My Badges, Team, Issuance |
| 5 | ADMIN | false | [base, Team*, Issuance, Admin] | 3: My Badges, Issuance, Admin |
| 6 | ADMIN | true | [base, Team, Issuance, Admin] | 4: All tabs |

*ADMIN always sees Team in sidebar (bypasses manager check)

2. [ ] Snapshot tests for sidebar rendered state per combination
3. [ ] Integration test: tab click switches content correctly
4. [ ] Edge case: user with `isManager` changes to `false` between sessions — tab disappears on refresh

---

### Wave 3: Pagination + Infinite Scroll

#### Story 15.6: Template List — Server-Side Pagination
**Priority:** MEDIUM  
**Estimate:** 3h  
**Source:** ADR-016 DEC-016-03, P2-1  

**As an** admin managing many badge templates,  
**I want** the template list paginated with page controls,  
**So that** the page loads quickly even with hundreds of templates.

**Acceptance Criteria:**
1. [ ] Backend: `GET /api/badge-templates` accepts `page` + `pageSize` query params
2. [ ] Response includes `{ data, meta: { total, page, pageSize, totalPages, hasNextPage } }`
3. [ ] Reuses existing `PaginationDto` infrastructure (Sprint 8)
4. [ ] Frontend: `BadgeTemplateListPage` shows page controls (shadcn/ui `Pagination`)
5. [ ] Default: page 1, pageSize 20
6. [ ] Page state persisted in URL search params (bookmarkable)
7. [ ] Loading state shown during page transition
8. [ ] Empty state: "No templates found" with create action

---

#### Story 15.7: Wallet — Cursor-Based Infinite Scroll
**Priority:** MEDIUM  
**Estimate:** 3h  
**Source:** ADR-016 DEC-016-03, P2-2  

**As an** employee browsing my badge collection,  
**I want** badges to load progressively as I scroll,  
**So that** I get a smooth browsing experience without page breaks.

**Acceptance Criteria:**
1. [ ] Backend: wallet API accepts `cursor` + `limit` query params
2. [ ] Response includes `{ data, nextCursor }` — cursor is last item's ID
3. [ ] Frontend: `TimelineView` uses `IntersectionObserver` to trigger next page load
4. [ ] Initial load: 20 badges; subsequent: 20 per scroll trigger
5. [ ] Loading indicator at bottom during fetch
6. [ ] End state: "All badges loaded" message when `nextCursor = null`
7. [ ] Scroll position preserved on tab switch (within Dashboard)
8. [ ] Works correctly on mobile viewports

---

### Wave 4: UI Polish

#### Story 15.8: Full Site Emoji → Lucide Icons
**Priority:** MEDIUM  
**Estimate:** 5h  
**Source:** ADR-016 DEC-016-05, P2-7  

**As a** user,  
**I want** consistent professional icons throughout the application,  
**So that** the UI feels polished and enterprise-grade.

**Acceptance Criteria:**
1. [ ] Audit all emoji usage across frontend `src/` — create replacement map
2. [ ] Replace all emoji in:
   - Dashboard cards (stats, badges, milestones)
   - Toast messages (success ✅, error ❌, warning ⚠️)
   - Dialog headers and empty states
   - Sidebar navigation items (Story 15.1)
   - Status indicators (badge status, user status)
   - Error pages (404, 403, error boundary)
3. [ ] Use Lucide React components (`import { Icon } from 'lucide-react'`)
4. [ ] Icon sizing consistent: `w-4 h-4` inline, `w-5 h-5` nav, `w-8 h-8` or `w-12 h-12` empty states
5. [ ] Grep verification: zero emoji characters in JSX (excluding test fixtures and comments)
6. [ ] No visual regressions — icons match semantic meaning of replaced emoji

---

#### Story 15.9: Inline Styles → Tailwind Classes (P1-1)
**Priority:** MEDIUM  
**Estimate:** 2h  
**Source:** P1-1 (Feature Completeness Audit)  

**As a** frontend developer,  
**I want** all static inline `style={{}}` converted to Tailwind utility classes,  
**So that** the design system is consistently applied via CSS-first configuration.

**Acceptance Criteria:**
1. [ ] Scan: identify all `style={{` uses in frontend `src/`
2. [ ] Convert static styles to Tailwind classes (color, padding, margin, font, border)
3. [ ] **Keep** dynamic inline styles that compute from props (e.g., `width: ${percent}%`, `animationDelay`, Recharts API props)
4. [ ] Add `// inline style retained: [reason]` comment for each kept inline style
5. [ ] ADR-009 compliance: all tokens reference `@theme {}` variables
6. [ ] No visual regressions

---

#### Story 15.10: Forgot Password Page (P1-7)
**Priority:** MEDIUM  
**Estimate:** 2h  
**Source:** P1-7 (Feature Completeness Audit)  

**As a** user who forgot their password,  
**I want** a "Forgot Password?" link on the login page that leads to a password reset flow,  
**So that** I can regain access without contacting an admin.

**Acceptance Criteria:**
1. [ ] Add "Forgot Password?" link to LoginPage below password field
2. [ ] New `ForgotPasswordPage` component — email input + submit button
3. [ ] Calls existing `POST /api/auth/forgot-password` endpoint
4. [ ] Success message: "If an account exists with that email, you'll receive a reset link."
5. [ ] New `ResetPasswordPage` component — new password + confirm password
6. [ ] Calls existing `POST /api/auth/reset-password` endpoint
7. [ ] Route: `/forgot-password` and `/reset-password?token=xxx` (public routes)
8. [ ] Form validation: email format, password strength, password match
9. [ ] Accessible: proper labels, error announcements

---

#### Story 15.11: z-index Scale (P2-8)
**Priority:** LOW  
**Estimate:** 1h  
**Source:** P2-8 (Feature Completeness Audit)  

**As a** frontend developer,  
**I want** a defined z-index scale in the Tailwind theme,  
**So that** stacking contexts are predictable and maintainable.

**Acceptance Criteria:**
1. [ ] Add z-index tokens to `@theme {}` in `index.css`:
```css
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
--z-tooltip: 600;
```
2. [ ] Replace all hardcoded `z-[9999]` / `z-[10000]` with semantic tokens
3. [ ] Verify: modals above overlays, tooltips above modals, toasts above everything
4. [ ] Document scale in a code comment in `index.css`

---

#### Story 15.12: Styled Delete Confirmation Modal (P2-5)
**Priority:** LOW  
**Estimate:** 1h  
**Source:** P2-5 (Feature Completeness Audit)  

**As a** user deleting a badge template,  
**I want** a styled confirmation dialog instead of the browser's `confirm()`,  
**So that** the delete confirmation feels consistent with the rest of the application.

**Acceptance Criteria:**
1. [ ] Replace `window.confirm()` in `BadgeTemplateListPage` with shadcn/ui `AlertDialog`
2. [ ] Dialog shows: template name, destructive action warning, Cancel + Delete buttons
3. [ ] Delete button is `variant="destructive"` (red)
4. [ ] Focus trapped in dialog — Escape to cancel
5. [ ] Reusable `ConfirmDeleteDialog` component for future use

---

#### Story 15.13: Dirty-Form Guard (P2-11)
**Priority:** MEDIUM  
**Estimate:** 2h  
**Source:** P2-11 (Feature Completeness Audit)  

**As a** user editing a badge template,  
**I want** a warning when I try to navigate away with unsaved changes,  
**So that** I don't accidentally lose my work.

**Acceptance Criteria:**
1. [ ] New `useDirtyFormGuard(isDirty: boolean)` hook
2. [ ] Registers `beforeunload` event when form is dirty
3. [ ] Shows browser-native "Leave page?" confirmation on navigation attempt
4. [ ] React Router: intercept with `useBlocker` (React Router v6.4+) for in-app navigation
5. [ ] Applied to: `BadgeTemplateFormPage` (create and edit modes)
6. [ ] Form dirty state tracked via react-hook-form `formState.isDirty`
7. [ ] Guard removed after successful save

---

## Deferred Items

| Item | Reason | Target |
|------|--------|--------|
| **P2-12:** Template preview modes (wallet/catalog/verify views) | Sprint 15 already at ~44h; not blocking for pilot | Sprint 16 or Post-Pilot |
| **P2-10:** Mobile nav Issue Badge action | Absorbed into Sidebar migration (Story 15.1 handles nav grouping) | Merged into 15.1 |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Sidebar migration breaks mobile nav | Mobile unusable | Medium | Keep MobileNav as-is for <768px; sidebar desktop-only |
| shadcn/ui Sidebar component API changes | Integration effort | Low | Pin shadcn version; review component docs before starting |
| Tab-based dashboard slower than single view | Perceived performance regression | Low | Lazy-load tab content; only mount active tab |
| Full Lucide icon migration scope creep | Exceeds 5h estimate | Medium | Create icon audit list first; defer obscure locations |
| Extended sprint fatigue | Quality drops | Medium | Wave structure allows natural pause points |

---

## Definition of Done (Sprint Level)

- [ ] All 13 stories completed and tested
- [ ] Sidebar navigation replaces top nav — all role/manager combos correct
- [ ] Dashboard tabs computed from dual dimensions — 6 combos verified
- [ ] All emoji replaced with Lucide icons across entire frontend
- [ ] Template pagination + wallet infinite scroll functional
- [ ] Dirty-form guard active on template forms
- [ ] Forgot Password flow wired end-to-end
- [ ] z-index scale defined — no hardcoded z-index values
- [ ] All inline static styles converted to Tailwind
- [ ] All 1,708+ existing tests pass + new tests for Sprint 15 features
- [ ] Pre-push hook passes reliably
- [ ] CHANGELOG.md updated for v1.5.0
- [ ] Sprint retrospective notes captured

---

**Created:** 2026-02-27  
**Created By:** SM Agent (Bob)  
**Design Spec:** ADR-016 (John/Sally/Winston)  
**Architecture Spec:** ADR-017 (Winston)
