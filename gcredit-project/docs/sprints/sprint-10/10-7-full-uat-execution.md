# Story 10.7: Full UAT Execution (All 10 Epics)

**Status:** complete (UAT NOT PASSED — 7 bugs → Story 10.8)  
**Priority:** 🔴 HIGH  
**Estimate:** 12h  
**Actual:** 4h  
**Sprint:** Sprint 10  
**Type:** UAT Execution  
**Dependencies:** Story 10.6 (UAT Test Plan & Seed Data)  
**Executed By:** LegendZhu (Product Owner)  
**Execution Date:** 2026-02-10

---

## Story

As a **Product Owner**,  
I want **a complete manual UAT execution covering all 10 Epics**,  
So that **we can confidently certify v1.0.0 as production-ready with zero P0/P1 bugs**.

## Background

Sprint 7 UAT covered Epic 9 (Revocation) only with 15 scenarios at 100% pass. Sprint 10 requires a comprehensive UAT covering ALL implemented functionality — the full badge lifecycle and every user role.

## Acceptance Criteria

1. [x] All UAT test cases from Story 10.6 executed (35/35 attempted)
2. [x] Each test case has documented pass/fail result with evidence (screenshots optional)
3. [ ] ~~100% pass rate for P0 scenarios~~ — **NOT MET: 5.7% pass, 4 P0 bugs found**
4. [x] Any P1 bugs discovered → logged and assigned to Story 10.8 (7 bugs total: BUG-002 to BUG-008)
5. [x] UAT Results summary report created (`uat-results.md`)
6. [x] All 4 roles tested (Admin, Issuer, Manager, Employee)
7. [ ] ~~Cross-Epic lifecycle test~~ — **BLOCKED by BUG-003 (no template creation UI)**
8. [ ] ~~Mobile responsive verification~~ — **DEFERRED until P0 bugs fixed**
9. [ ] ~~Accessibility spot-check~~ — **DEFERRED until P0 bugs fixed**

## Tasks / Subtasks

- [ ] **Task 1: Environment Setup** (AC: #1)
  - [ ] Run `npm run seed:uat` to populate test data
  - [ ] Start backend: `npm run start:dev`
  - [ ] Start frontend: `npm run dev`
  - [ ] Verify health endpoint: GET /api/health

- [ ] **Task 2: Execute Auth UAT (Epic 2)** (AC: #1, #6)
  - [ ] Test registration (4 roles)
  - [ ] Test login/logout flow
  - [ ] Test password reset
  - [ ] Test role-based access denial

- [ ] **Task 3: Execute Template UAT (Epic 3)** (AC: #1, #6)
  - [ ] Create badge template (Admin/Issuer)
  - [ ] Edit template, add skills
  - [ ] Search templates
  - [ ] Archive template

- [ ] **Task 4: Execute Issuance UAT (Epic 4)** (AC: #1)
  - [ ] Issue single badge
  - [ ] Verify email notification
  - [ ] Claim badge via claim link

- [ ] **Task 5: Execute Wallet UAT (Epic 5)** (AC: #1, #6)
  - [ ] View badge wallet (Employee)
  - [ ] Timeline view navigation
  - [ ] Badge detail modal
  - [ ] Evidence upload/download

- [ ] **Task 6: Execute Verification UAT (Epic 6)** (AC: #1)
  - [ ] Open public verification URL
  - [ ] Verify JSON-LD assertion
  - [ ] Download baked badge PNG

- [ ] **Task 7: Execute Sharing UAT (Epic 7)** (AC: #1)
  - [ ] Email share badge
  - [ ] Teams notification (if TD-006 resolved, else skip)
  - [ ] Verify sharing analytics

- [ ] **Task 8: Execute Bulk Issuance UAT (Epic 8)** (AC: #1)
  - [ ] Download CSV template
  - [ ] Upload CSV with valid data
  - [ ] Preview validation results
  - [ ] Execute batch issuance (≤20 badges)
  - [ ] Verify all badges issued

- [ ] **Task 9: Execute Revocation UAT (Epic 9)** (AC: #1)
  - [ ] Revoke badge with reason
  - [ ] Verify revocation email
  - [ ] Verify public page shows revoked status
  - [ ] Check audit trail

- [ ] **Task 10: Execute Production Features UAT (Epic 10)** (AC: #1)
  - [ ] Dashboard homepage with metrics
  - [ ] Badge search
  - [ ] Admin user management panel
  - [ ] Admin analytics (after Story 10.5)

- [ ] **Task 11: Cross-Epic Lifecycle Test** (AC: #7)
  - [ ] Full lifecycle: Create template → Issue → Claim → Share → Verify → Revoke → Re-verify
  - [ ] Verify state transitions are consistent

- [ ] **Task 12: Responsive & Accessibility** (AC: #8, #9)
  - [ ] Mobile viewport (375px): Login, Wallet, Verification pages
  - [ ] Keyboard navigation: Dashboard, Badge Detail, Admin Panel
  - [ ] Screen reader basics: ARIA labels present

- [ ] **Task 13: Create UAT Results Report** (AC: #2, #3, #5)
  - [ ] Document pass/fail for each test case
  - [ ] Log any bugs found (with reproduction steps)
  - [ ] Calculate pass rate
  - [ ] Create `docs/sprints/sprint-10/uat-results.md`

## Dev Notes

### UAT Pattern (Lesson 28)
Pre-UAT review → Fix P0 → Execute UAT → Fix bugs → Re-test

### Output
- `docs/sprints/sprint-10/uat-results.md`

---

## Dev Agent Record

### Agent Model Used
Manual UAT by Product Owner + SM analysis by Claude Opus 4.6

### Completion Notes
UAT executed 2026-02-10. 35 test cases attempted: 2 PASS, 7 PARTIAL, 25 FAIL, 1 SKIP.
7 unique bugs identified (4 P0 + 3 P1). All cascading from root-cause issues.
Bugs logged → Story 10.8 for fix. Re-test required after 10.8.

### File List
- `docs/sprints/sprint-10/uat-results.md` — Full UAT results report
