# Story 15.1: Dashboard Tabbed Composite View (TD-035-A)

**Status:** backlog  
**Priority:** CRITICAL  
**Estimate:** 8h  
**Wave:** 2 — Core UI  
**Source:** TD-035-A, ADR-016 DEC-016-01  
**Dependencies:** 15.2 (Permissions API must be available)

---

## Story

**As a** G-Credit user with multiple role dimensions,  
**I want** a tabbed dashboard that shows sections based on my combined permissions,  
**So that** I can access all my responsibilities from a single unified view.

## Acceptance Criteria

1. [ ] Dashboard displays tabs based on user's dual-dimension permissions (role × isManager)
2. [ ] Default tab is always "My Badges" for all users (DEC-016-01)
3. [ ] Tab visibility follows the permission matrix:
   - My Badges: Always visible (all users)
   - Team Overview: Visible when `isManager === true`
   - Issuance: Visible when `role === 'ISSUER' || role === 'ADMIN'`
   - Administration: Visible when `role === 'ADMIN'`
4. [ ] Each tab renders the correct existing dashboard component (EmployeeDashboard, ManagerDashboard, IssuerDashboard, AdminDashboard)
5. [ ] Tab switching is instant — all tab content mounted on load, non-active hidden via CSS; data fetching gated by React Query `enabled` on active tab only _(DEC-15-03, MEDIUM-15.1-001)_
6. [ ] Tab state is preserved during session (switching away and back retains scroll position)
7. [ ] Responsive: mobile (<768px) uses horizontal scroll with fade indicator — no dropdown _(REC-15.1-003)_
8. [ ] All 6 valid role×manager combinations render correct tab sets
9. [ ] URL supports `?tab=` query param for deep-linking (e.g., `/?tab=issuance`), but tab clicks do NOT push browser history entries _(REC-15.1-004)_
10. [ ] Tab container uses natural scroll height — no fixed height; no layout shift between tabs _(MEDIUM-15.1-002)_
11. [ ] **Intentional UX change:** Previous stacked dashboard layout replaced by tabs. Documented as improvement per ADR-016 DEC-016-01 _(CRITICAL-15.1-002)_

## Tasks / Subtasks

- [ ] **Task 1: Create DashboardPage container** (AC: #1, #2)
  - [ ] Create `DashboardPage.tsx` with tab container layout
  - [ ] Use shared `computeVisibleTabs()` from `utils/permissions.ts` _(CROSS-001, DEC-15-01)_
  - [ ] Compute visible tabs based on permission matrix
  - [ ] Default to "My Badges" tab on initial render
- [ ] **Task 2: Integrate permissions API (Hybrid)** (AC: #1, #3)
  - [ ] JWT claims (from authStore) used for immediate tab rendering _(DEC-15-01)_
  - [ ] Call `GET /api/users/me/permissions` in background on mount
  - [ ] If API response differs from JWT (e.g., stale JWT), update authStore
- [ ] **Task 3: Tab component implementation** (AC: #4, #5)
  - [ ] Use shadcn/ui `Tabs` component for tab navigation (must install: `npx shadcn@latest add tabs`)
  - [ ] Mount ALL visible tab content on load; hide non-active with CSS `display:none` — do NOT unmount _(DEC-15-03)_
  - [ ] Gate data fetching: React Query `enabled: isActiveTab` to avoid 4× parallel requests on mount _(MEDIUM-15.1-001)_
  - [ ] Each tab renders existing dashboard component with no modification
- [ ] **Task 4: Responsive design** (AC: #7)
  - [ ] Desktop: horizontal tabs below page header
  - [ ] Mobile (<768px): horizontally scrollable tabs with fade indicator _(REC-15.1-003)_
  - [ ] Ensure touch targets meet 44px minimum (WCAG)
- [ ] **Task 5: Update routing** (AC: #5, #9)
  - [ ] Replace role-based dashboard routing with single `/` route
  - [ ] Remove old role-switched routing logic
  - [ ] Support `?tab=` query param for deep-linking; do NOT push history on tab click _(REC-15.1-004)_
- [ ] **Task 6: Unit tests** (AC: #8)
  - [ ] Test all 6 role×manager combinations for correct tab visibility
  - [ ] Test default tab selection
  - [ ] Test tab switching behavior

## Dev Notes

### Architecture Patterns Used
- ADR-016 DEC-016-01: Default tab "My Badges" for all users
- ADR-015/017: Dual-dimension identity model (role × isManager)
- shadcn/ui Tabs component
- Zustand `useAuthStore` for permission state

### Source Tree Components
- `frontend/src/pages/DashboardPage.tsx` (new — tab container)
- `frontend/src/pages/EmployeeDashboard.tsx` (existing — "My Badges" tab)
- `frontend/src/pages/ManagerDashboard.tsx` (existing — "Team Overview" tab)
- `frontend/src/pages/IssuerDashboard.tsx` (existing — "Issuance" tab)
- `frontend/src/pages/admin/AdminDashboardPage.tsx` (existing — "Administration" tab)
- `frontend/src/App.tsx` (routing changes)
- `frontend/src/utils/permissions.ts` (shared — `computeVisibleTabs()`, CROSS-001)

### Important Distinction _(CRITICAL-15.1-ARCH-002)_
- **Dashboard tabs** = Overview/summary dashboards (cards, charts, recent activity)
- **Sidebar navigation items** = Full management pages (`/admin/templates`, `/admin/badges`, etc.)
- These are complementary, NOT duplicative. Dashboard lives at `/`, management pages at `/admin/*`.

### Review Findings (2026-03-01)
- **CRITICAL-15.1-001:** Mount all + gate data → DEC-15-03 resolved. No lazy-load; CSS hide inactive tabs.
- **CRITICAL-15.1-002:** Stacked → tabbed is intentional UX improvement. Confirmed by PO.
- **CRITICAL-15.1-ARCH-001:** Hybrid computation → DEC-15-01 resolved. JWT instant, API verification.
- **CRITICAL-15.1-ARCH-002:** Dashboard tabs ≠ sidebar pages. Documented above.
- **MEDIUM-15.1-001:** React Query `enabled` flag to avoid 4× parallel fetches on mount.
- **MEDIUM-15.1-002:** Tab container = natural scroll, no fixed height.
- **REC-15.1-003:** Mobile = horizontal scroll, not dropdown.
- **REC-15.1-004:** Deep-link via `?tab=` param; no history push on tab click.

### Testing Standards
- Unit tests: tab visibility for all 6 combinations
- Mock `useAuthStore` with each combination
- Verify no dashboard API calls for hidden tabs (`enabled` gating)

### References
- ADR-016: Sprint 15 UI Design Decisions
- ADR-015/017: Dual-Dimension Identity Model
- Sprint 14 Story 14.7: Frontend permission changes
- Sprint 14 Story 14.8: 6-combination test matrix pattern
- [UX-REVIEW-SPRINT-15.md](UX-REVIEW-SPRINT-15.md) — Story 15.1 section
- [ARCHITECTURE-REVIEW-SPRINT-15.md](ARCHITECTURE-REVIEW-SPRINT-15.md) — Story 15.1 section

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
