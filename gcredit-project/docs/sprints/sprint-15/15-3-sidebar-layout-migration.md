# Story 15.3: Sidebar Layout Migration (TD-035-C)

**Status:** backlog  
**Priority:** CRITICAL  
**Estimate:** 12h  
**Wave:** 2 — Core UI  
**Source:** TD-035-C, ADR-016 DEC-016-02  
**Dependencies:** 15.2 (Permissions API for sidebar group visibility)

---

## Story

**As a** G-Credit user,  
**I want** a persistent collapsible sidebar navigation replacing the current top navigation bar,  
**So that** I can navigate efficiently across all features with clear visual grouping.

## Acceptance Criteria

1. [ ] Top navigation bar (`Navbar.tsx`) replaced by sidebar (`AppSidebar.tsx`)
2. [ ] Sidebar uses shadcn/ui `Sidebar` component (`SidebarProvider` + `SidebarInset`)
3. [ ] Navigation groups controlled by dual-dimension permissions:
   - Base group (Dashboard, Wallet): Always visible
   - Team group: Visible when `isManager === true`
   - Issuance group (Templates, Badges, Bulk, Analytics): Visible when `role in [ADMIN, ISSUER]`
   - Admin group (Users, Skills, Categories, Milestones): Visible when `role === ADMIN`
4. [ ] Collapsible to icon-only mode with toggle button
5. [ ] Active state indicator (left border highlight or background)
6. [ ] Responsive: on mobile (<768px), sidebar becomes drawer overlay (MobileNav pattern)
7. [ ] Profile section at bottom with user info + Sign Out
8. [ ] Layout uses `SidebarProvider` → content in `SidebarInset`
9. [ ] All existing routes continue to work (no broken navigation)
10. [ ] P2-10 (Mobile nav Issue Badge) absorbed — Issue Badge action accessible from mobile sidebar

## Tasks / Subtasks

- [ ] **Task 1: Install/verify shadcn/ui Sidebar** (AC: #2)
  - [ ] Verify shadcn/ui sidebar component available via `components.json`
  - [ ] If not installed, add via `npx shadcn@latest add sidebar`
  - [ ] Review API: `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenuItem`, `SidebarTrigger`, `SidebarInset`
- [ ] **Task 2: Create AppSidebar component** (AC: #1, #3, #4, #5, #7)
  - [ ] Build `AppSidebar.tsx` with grouped navigation items
  - [ ] Import permissions from `useAuthStore` (role, isManager)
  - [ ] Implement group visibility logic per DEC-016-02 matrix
  - [ ] Add collapsible toggle (icon-only mode)
  - [ ] Add active route indicator using `useLocation()`
  - [ ] Add Profile/Sign Out section at bottom
- [ ] **Task 3: Refactor Layout component** (AC: #8)
  - [ ] Wrap `Layout.tsx` content in `SidebarProvider`
  - [ ] Content area uses `SidebarInset` for proper spacing
  - [ ] Remove `Navbar.tsx` import and rendering
  - [ ] Ensure `Outlet` still renders page content correctly
- [ ] **Task 4: Mobile responsive sidebar** (AC: #6, #10)
  - [ ] On mobile (<768px): sidebar is a Sheet/Drawer overlay
  - [ ] Use `SidebarTrigger` (hamburger icon) in mobile header
  - [ ] Include "Issue Badge" action in mobile sidebar (absorb P2-10)
  - [ ] Touch targets ≥ 44px (WCAG)
- [ ] **Task 5: Navigation item configuration** (AC: #3, #9)
  - [ ] Create navigation config array with: label, icon, href, group, requireRole?, requireManager?
  - [ ] Map all existing routes to sidebar items
  - [ ] Verify every existing route is accessible from sidebar
- [ ] **Task 6: Remove old Navbar** (AC: #1)
  - [ ] Delete `Navbar.tsx` or mark as deprecated
  - [ ] Clean up any Navbar-specific CSS/styles
  - [ ] Update any components that referenced Navbar
- [ ] **Task 7: Design token usage** (AC: #5)
  - [ ] Use `@theme` design tokens for sidebar colors (Sprint 14 Lesson)
  - [ ] Active state, hover state, group headers use token-based colors
- [ ] **Task 8: Tests** (AC: #3, #6, #9)
  - [ ] Test sidebar group visibility for all 6 role×manager combos
  - [ ] Test collapse/expand toggle
  - [ ] Test mobile drawer open/close
  - [ ] Test all navigation links render correct routes

## Dev Notes

### Architecture Patterns Used
- shadcn/ui Sidebar component system
- ADR-016 DEC-016-02: Sidebar layout specification
- ADR-009: Tailwind v4 `@theme` design tokens
- Zustand `useAuthStore` for permission state

### Sidebar Structure (from ADR-016)
```
┌──────────┐
│ G-Credit │  ← Logo/Brand
│ ──────── │
│ Dashboard│  ← Base group (always)
│ Wallet   │
│          │
│ TEAM     │  ← Team group (isManager)
│ Oversight│
│          │
│ ISSUANCE │  ← Issuance group (ISSUER/ADMIN)
│ Templates│
│ Badges   │
│ Bulk     │
│ Analytics│
│          │
│ ADMIN    │  ← Admin group (ADMIN)
│ Users    │
│ Skills   │
│ Categs   │
│ Milesto. │
│ ──────── │
│ Profile  │  ← User info + Sign Out
│ Sign Out │
└──────────┘
```

### Source Tree Components
- `frontend/src/components/layout/AppSidebar.tsx` (new)
- `frontend/src/components/layout/Layout.tsx` (refactored)
- `frontend/src/components/layout/Navbar.tsx` (deprecated/removed)
- `frontend/src/components/layout/MobileNav.tsx` (updated for sidebar drawer)
- `frontend/src/config/navigation.ts` (new — nav config array)

### Testing Standards
- 6-combination unit tests for sidebar group visibility
- Responsive test at 768px breakpoint
- Route verification: all existing navigation items map to working routes

### References
- ADR-016 DEC-016-02: Full sidebar specification with ASCII wireframe
- ADR-009: Design tokens
- Sprint 14 Story 14.9: Design tokens prep (11 tokens)
- shadcn/ui Sidebar docs: https://ui.shadcn.com/docs/components/sidebar

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
