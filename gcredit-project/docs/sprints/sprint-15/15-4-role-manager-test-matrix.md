# Story 15.4: Role×Manager Combination Testing (TD-035-D)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 4h  
**Wave:** 4 — Testing + Final UAT  
**Source:** TD-035-D, ADR-017 §7  
**Dependencies:** 15.1 (Dashboard), 15.3 (Sidebar) — must be complete

---

## Story

**As a** quality assurance process,  
**I want** automated E2E tests validating all 6 role×manager combinations against dashboard and sidebar,  
**So that** we have confidence that the composite view works correctly for every user type.

## Acceptance Criteria

1. [ ] E2E tests cover all 6 valid role×manager combinations
2. [ ] Each combination validates: sidebar groups visible, dashboard tabs visible, tab content loads
3. [ ] Tests validate navigation: clicking each sidebar item routes to correct page
4. [ ] Tests validate mobile sidebar behavior (drawer open/close)
5. [ ] All tests pass reliably (10/10 runs)
6. [ ] Tests use `ConfigService`-based rate limits (depends on 15.13 TD-038)

## Tasks / Subtasks

- [ ] **Task 1: Create test user fixtures** (AC: #1, #6)
  - [ ] Reuse Sprint 14 Story 14.8 pattern: 5 real logins + JwtService.sign() for 6th
  - [ ] OR: Use configurable rate limits from 15.13 to login all 6 users
  - [ ] Create shared `authRequest()` helper for Sprint 15 E2E
- [ ] **Task 2: Sidebar group visibility tests** (AC: #1, #2)
  - [ ] For each of 6 combinations, verify correct sidebar groups visible/hidden
  - [ ] Assert group headers present/absent
  - [ ] Assert individual menu items within groups
- [ ] **Task 3: Dashboard tab visibility tests** (AC: #1, #2)
  - [ ] For each of 6 combinations, verify correct tabs rendered
  - [ ] Assert default "My Badges" tab active on load
  - [ ] Assert tab content component renders
- [ ] **Task 4: Navigation routing tests** (AC: #3)
  - [ ] Click each visible sidebar item → verify URL change + page render
  - [ ] Verify hidden sidebar items don't appear in DOM
- [ ] **Task 5: Mobile tests** (AC: #4)
  - [ ] Set viewport to mobile (<768px)
  - [ ] Verify hamburger trigger appears
  - [ ] Verify drawer opens and shows correct groups
- [ ] **Task 6: Reliability verification** (AC: #5)
  - [ ] Run full test suite 10 consecutive times
  - [ ] Document any flakiness and fix

## Dev Notes

### Test Matrix

| # | Role | isManager | Expected Sidebar Groups | Expected Dashboard Tabs |
|---|------|-----------|------------------------|------------------------|
| 1 | EMPLOYEE | false | [base] | [My Badges] |
| 2 | EMPLOYEE | true | [base, team] | [My Badges, Team] |
| 3 | ISSUER | false | [base, issuance] | [My Badges, Issuance] |
| 4 | ISSUER | true | [base, team, issuance] | [My Badges, Team, Issuance] |
| 5 | ADMIN | false | [base, issuance, admin] | [My Badges, Issuance, Admin] |
| 6 | ADMIN | true | [base, team, issuance, admin] | [My Badges, Team, Issuance, Admin] |

### Architecture Patterns Used
- Sprint 14 Story 14.8 test matrix pattern
- Shared `authRequest()` helper
- E2E spec file structure with describe.each for matrix

### Source Tree Components
- `backend/test/dashboard-permissions.e2e-spec.ts` (new)
- OR `backend/test/sidebar-dashboard.e2e-spec.ts` (new)

### Testing Standards
- Reliability: 10/10 pass rate
- No `.skip()` — fix issues directly
- Rate limit aware (use 15.13 configurable limits)

### References
- Sprint 14 Story 14.8: 31-test E2E matrix (pattern to follow)
- ADR-017 §7: Test matrix requirements
- Story 15.13: TD-038 configurable rate limits

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
