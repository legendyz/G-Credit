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
5. [ ] Tab switching is instant (no page reload, client-side routing)
6. [ ] Tab state is preserved during session (switching away and back retains scroll position)
7. [ ] Responsive: tabs work on mobile (consider horizontal scroll or dropdown for narrow screens)
8. [ ] All 6 valid role×manager combinations render correct tab sets

## Tasks / Subtasks

- [ ] **Task 1: Create DashboardPage container** (AC: #1, #2)
  - [ ] Create `DashboardPage.tsx` with tab container layout
  - [ ] Import `useAuthStore` to access `role` and `isManager`
  - [ ] Compute visible tabs based on permission matrix
  - [ ] Default to "My Badges" tab on initial render
- [ ] **Task 2: Integrate permissions API** (AC: #1, #3)
  - [ ] Call `GET /api/users/me/permissions` (from 15.2) on mount
  - [ ] Use response to determine tab visibility (fallback to JWT claims if API unavailable)
- [ ] **Task 3: Tab component implementation** (AC: #4, #5)
  - [ ] Use shadcn/ui `Tabs` component for tab navigation
  - [ ] Lazy-load tab content components (React.lazy or conditional render)
  - [ ] Each tab renders existing dashboard component with no modification
- [ ] **Task 4: Responsive design** (AC: #7)
  - [ ] Desktop: horizontal tabs below page header
  - [ ] Mobile (<768px): either scrollable tabs or select dropdown
  - [ ] Ensure touch targets meet 44px minimum (WCAG)
- [ ] **Task 5: Update routing** (AC: #5, #6)
  - [ ] Replace role-based dashboard routing with single `/dashboard` route
  - [ ] Remove old role-switched routing logic
  - [ ] Ensure deep-linking to specific tabs works (e.g., `/dashboard?tab=issuance`)
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

### Testing Standards
- Unit tests: tab visibility for all 6 combinations
- Mock `useAuthStore` with each combination
- Verify no dashboard API calls for hidden tabs (`enabled` gating)

### References
- ADR-016: Sprint 15 UI Design Decisions
- ADR-015/017: Dual-Dimension Identity Model
- Sprint 14 Story 14.7: Frontend permission changes
- Sprint 14 Story 14.8: 6-combination test matrix pattern

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
