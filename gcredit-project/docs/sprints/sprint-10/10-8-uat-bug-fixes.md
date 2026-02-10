# Story 10.8: UAT Bug Fixes

**Status:** backlog  
**Priority:** � HIGH  
**Estimate:** 20h (expanded from 8h — all bugs are MVP core)  
**Sprint:** Sprint 10  
**Type:** Bug Fix + New Pages  
**Dependencies:** Story 10.7 (UAT Execution)

---

## Story

As a **developer**,  
I want **all P0/P1 bugs discovered during UAT fixed before v1.0.0**,  
So that **the release is production-ready with no critical defects**.

## Background

This story is a buffer allocation for bugs discovered during full UAT (Story 10.7). Sprint 7 UAT found 0 P0/P1 bugs (thanks to pre-UAT reviews), but a full 10-Epic UAT may uncover issues.

## Acceptance Criteria

1. [ ] All P0 bugs fixed (UAT blocker)
2. [ ] All P1 bugs fixed or have documented workaround
3. [ ] P2 bugs logged as tech debt for future sprints
4. [ ] Regression tests added for each fixed bug
5. [ ] Re-run affected UAT test cases → all pass
6. [ ] All 1087+ tests still pass

## Tasks / Subtasks

### P0 Bug Fixes (must fix)

- [ ] **BUG-002: Nav "My Wallet" links to `/` instead of `/wallet`** (P0, 0.5h)
  - [ ] Navbar.tsx: change My Wallet `to="/wallet"`, add Dashboard `to="/"`
  - [ ] MobileNav.tsx: add Dashboard entry, change My Wallet `to="/wallet"`
  - [ ] Update nav active state checks
  - [ ] Regression tests for Navbar/MobileNav

- [ ] **BUG-005: BadgeSearchBar input doesn't accept typing** (P0, 1h)
  - [ ] Fix SearchInput.tsx controlled mode: use `internalValue` for display
  - [ ] Eliminate double-debounce conflict
  - [ ] Test: Badge Management search + Wallet search
  - [ ] Regression test for SearchInput controlled mode

- [ ] **BUG-004: Issue Badge recipient dropdown not loading** (P0, 1.5h)
  - [ ] Backend: add `GET /api/badges/recipients` (ADMIN + ISSUER)
  - [ ] Frontend: update IssueBadgePage to use new endpoint
  - [ ] Verify Issuer Quick Action "Issue New Badge" navigation
  - [ ] Regression test for recipient loading

- [ ] **BUG-003: No Badge Template Management UI** (P0, 10h)
  - [ ] Create `badgeTemplatesApi.ts` (CRUD API layer)
  - [ ] Create `BadgeTemplateListPage.tsx` (list + filter + search)
  - [ ] Create `BadgeTemplateFormPage.tsx` (create/edit form)
  - [ ] Add routes in App.tsx (`/admin/templates`, `/admin/templates/new`, `/admin/templates/:id/edit`)
  - [ ] Update Navbar + MobileNav + AdminDashboard Quick Action
  - [ ] Regression tests for list + form pages
  - [ ] **⚠️ Design System compliance required — UX review needed**

### P1 Bug Fixes

- [ ] **BUG-008: Prisma P2028 transaction timeout** (P1, 1h)
  - [ ] Increase transaction timeout to 30s + maxWait 10s
  - [ ] Verify first-time bulk issuance succeeds

- [ ] **BUG-006: Manager has no revocation UI** (P1, 2h)
  - [ ] Backend: add MANAGER to revoke endpoint roles + department check
  - [ ] Frontend: add MANAGER to Badge Management route + nav
  - [ ] Manager view: filter to same-department, hide Issue buttons
  - [ ] Regression tests for Manager revoke (same dept pass, cross dept 403)

- [ ] **BUG-007: No Profile / password change page** (P1, 4h)
  - [ ] Create `ProfilePage.tsx` (profile info + password change)
  - [ ] Add `/profile` route in App.tsx
  - [ ] Add Profile link in Navbar + MobileNav
  - [ ] Regression tests for profile update + password change
  - [ ] **⚠️ Design System compliance required — UX review needed**

### Quality Assurance

- [ ] **QA: UX Designer Review** (AC: new pages)
  - [ ] Screenshot all new pages (Template List, Template Form, Profile, Manager view)
  - [ ] Submit for UX review
  - [ ] Apply feedback if any

- [ ] **QA: Full Test Suite** (AC: #4, #6)
  - [ ] All existing backend tests pass (534+)
  - [ ] All new frontend tests pass
  - [ ] `tsc --noEmit` + `lint` clean

## Dev Notes

### Historical Context
- Sprint 7 UAT: 15/15 passed, 0 bugs — Pre-UAT reviews were key
- Sprint 8 Code Review: 30 issues found and fixed (100%)
- If Sprint 10 discovers significant bugs, consider deferring v1.0.0

### Buffer Allocation
- 8h allocated as buffer
- If unused, time returns to Sprint capacity
- If exceeded, escalate to PO for scope decision

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
