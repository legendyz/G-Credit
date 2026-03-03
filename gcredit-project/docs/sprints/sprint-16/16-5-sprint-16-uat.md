# Story 16.5: Sprint 16 UAT

Status: ready-for-dev

## Story
As a **Scrum Master**,
I want **comprehensive user acceptance testing of Issuer ownership isolation**,
So that **we confirm the RBAC changes work correctly before entering Phase 4 Pilot**.

## Acceptance Criteria
1. [ ] All ownership guard scenarios tested (Issuer own/other, Admin any)
2. [ ] Template visibility correctly scoped per role
3. [ ] Badge issuance restricted to owned templates
4. [ ] Template editing restricted to owned templates
5. [ ] Pilot seed data + smoke test PASS
6. [ ] No regressions from Sprint 15 (sidebar, dashboard, pagination)
7. [ ] All automated tests pass (target: ~1,860+ tests)

## UAT Test Plan

### F-1 RBAC Tests (12 scenarios)
| # | Scenario | Role | Expected | Result |
|---|----------|------|----------|--------|
| 1 | Login as Issuer A, view template list | ISSUER | Only own templates visible | |
| 2 | Login as Issuer B, view template list | ISSUER | Only own templates visible | |
| 3 | Login as Admin, view template list | ADMIN | All templates visible | |
| 4 | Issuer A issues badge with own template | ISSUER | 201 Created | |
| 5 | Issuer A issues badge with Issuer B's template | ISSUER | 403 Forbidden | |
| 6 | Admin issues badge with any template | ADMIN | 201 Created | |
| 7 | Issuer A edits own template | ISSUER | 200 OK | |
| 8 | Issuer A edits Issuer B's template | ISSUER | 403 Forbidden | |
| 9 | Admin edits any template | ADMIN | 200 OK | |
| 10 | Issuer A bulk issues with own template | ISSUER | Success | |
| 11 | Issuer A bulk issues with other's template | ISSUER | 403 Forbidden | |
| 12 | Delete ownership still works | ISSUER | Only own templates deletable | |

### Regression Tests (6 scenarios)
| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 13 | Sidebar navigation works | All links functional | |
| 14 | Dashboard composite view loads | 3 tabs, correct permissions | |
| 15 | Template pagination works | Page controls functional | |
| 16 | Wallet infinite scroll works | Loads more on scroll | |
| 17 | Badge verification public page | QR + details visible | |
| 18 | Login/Logout flow | Cookie-based auth works | |

### Pilot Readiness (2 scenarios)
| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 19 | Seed pilot data | Script runs without errors | |
| 20 | Smoke test passes | All core flows PASS | |

## Tasks / Subtasks
- [ ] Task 1: Execute F-1 RBAC tests (12 scenarios)
- [ ] Task 2: Execute regression tests (6 scenarios)
- [ ] Task 3: Execute pilot readiness tests (2 scenarios)
- [ ] Task 4: Fix any bugs found
- [ ] Task 5: Document results

## Dev Notes
### References
- Sprint 15 UAT: 36/36 PASS (baseline)
- Sprint 15 Retrospective Action Items applied

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
