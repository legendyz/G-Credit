# Story 10.7: Full UAT Execution (All 10 Epics)

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 12h  
**Sprint:** Sprint 10  
**Type:** UAT Execution  
**Dependencies:** Story 10.6 (UAT Test Plan & Seed Data)

---

## Story

As a **Product Owner**,  
I want **a complete manual UAT execution covering all 10 Epics**,  
So that **we can confidently certify v1.0.0 as production-ready with zero P0/P1 bugs**.

## Background

Sprint 7 UAT covered Epic 9 (Revocation) only with 15 scenarios at 100% pass. Sprint 10 requires a comprehensive UAT covering ALL implemented functionality — the full badge lifecycle and every user role.

## Acceptance Criteria

1. [ ] All UAT test cases from Story 10.6 executed
2. [ ] Each test case has documented pass/fail result with evidence (screenshots optional)
3. [ ] 100% pass rate for P0 scenarios (core lifecycle)
4. [ ] Any P1 bugs discovered → logged and assigned to Story 10.8
5. [ ] UAT Results summary report created
6. [ ] All 4 roles tested (Admin, Issuer, Manager, Employee)
7. [ ] Cross-Epic lifecycle test: issue → claim → share → verify → revoke → re-verify
8. [ ] Mobile responsive verification (key pages)
9. [ ] Accessibility spot-check (keyboard navigation on 3+ pages)

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
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
