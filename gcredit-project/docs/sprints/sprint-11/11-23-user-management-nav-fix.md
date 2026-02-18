# Story 11.23: User Management Nav Fix + BUG-001 Investigation

**Status:** backlog  
**Priority:** 🔴 P0-PILOT  
**Estimate:** 1h  
**Source:** MVP Audit / Sprint 10 Bug  

## Story

As an admin,  
I want the User Management navigation item correctly displayed and accessible,  
So that I can manage users without confusion.

## Acceptance Criteria

1. [ ] User Management nav item visible for admin users
2. [ ] Nav item routes to correct page (`/admin/users` or similar)
3. [ ] Active state styling correct when on User Management page
4. [ ] Works in both desktop navbar and mobile navigation
5. [ ] BUG-001 investigated: "My Wallet" label → should be "Dashboard" (if applicable)
6. [ ] No visual regressions on other nav items
7. [ ] Tests updated

## Tasks / Subtasks

- [ ] **Task 1: Audit current nav** (AC: #1-4)
  - [ ] Review `Navbar.tsx` (258 lines) — find User Management nav item config
  - [ ] Review `MobileNav.tsx` (312 lines) — same
  - [ ] Identify the routing/visibility issue

- [ ] **Task 2: Fix navigation** (AC: #1-4)
  - [ ] Ensure admin-only nav items use proper role check
  - [ ] Fix route path if incorrect
  - [ ] Fix active state styling

- [ ] **Task 3: BUG-001 investigation** (AC: #5)
  - [ ] Check if "My Wallet" label exists → should it be "Dashboard"?
  - [ ] Fix label if confirmed as bug
  - [ ] If already fixed or not applicable, document in retrospective

- [ ] **Task 4: Mobile nav sync** (AC: #4)
  - [ ] Ensure MobileNav.tsx has same nav items as Navbar.tsx
  - [ ] Test responsive breakpoint transition

- [ ] **Task 5: Verify** (AC: #6, #7)
  - [ ] Visual check all nav states
  - [ ] Run `npm test`
  - [ ] Run `npm run build`

## Dev Notes

### Source Tree Components
- **Desktop nav:** `frontend/src/components/Navbar.tsx` (258 lines)
- **Mobile nav:** `frontend/src/components/MobileNav.tsx` (312 lines)
- **Router:** App.tsx or router config
- **Auth context:** Role-based rendering logic

### BUG-001 Context
- From Sprint 10 backlog — "My Wallet" label possibly wrong
- Needs user confirmation if this is covered here or separate story

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
