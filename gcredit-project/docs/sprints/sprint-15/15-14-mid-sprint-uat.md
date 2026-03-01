# Story 15.14: Mid-Sprint UAT — Sidebar + Dashboard (Wave 2.5)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 3h  
**Wave:** 2.5 — Mid-Sprint UAT  
**Source:** Sprint 15 Planning — UI-heavy sprint requires staged UAT  
**Dependencies:** 15.1 (Dashboard), 15.2 (Permissions API), 15.3 (Sidebar) — all must be complete

---

## Story

**As a** Product Owner,  
**I want** to validate the core UI architecture (sidebar + dashboard) across all 6 role×manager combinations at mid-sprint,  
**So that** structural issues are caught before the UI polish wave builds on top of them.

## Acceptance Criteria

1. [ ] All 6 role×manager combinations tested for sidebar navigation
2. [ ] All 6 combinations tested for dashboard tab visibility and content
3. [ ] Navigation routes verified — every sidebar item leads to correct page
4. [ ] Responsive behavior validated at desktop (1280px) and mobile (375px)
5. [ ] No 404 errors or broken routes
6. [ ] UAT results documented with PASS/FAIL per test case
7. [ ] Any FAIL items have follow-up action (fix in Wave 3 or create tech debt)

## UAT Test Cases

### A. Sidebar Navigation (6 combinations × 4 checks = 24 tests)

| # | Role | isManager | Check | Expected |
|---|------|-----------|-------|----------|
| A1 | EMPLOYEE | false | Base group visible | Dashboard, Wallet |
| A2 | EMPLOYEE | false | Team group hidden | Not visible |
| A3 | EMPLOYEE | false | Issuance group hidden | Not visible |
| A4 | EMPLOYEE | false | Admin group hidden | Not visible |
| A5 | EMPLOYEE | true | Team group visible | Team Overview |
| A6 | EMPLOYEE | true | Issuance group hidden | Not visible |
| A7 | ISSUER | false | Issuance group visible | Templates, Badges, Bulk, Analytics |
| A8 | ISSUER | false | Team group hidden | Not visible |
| A9 | ISSUER | true | Team + Issuance visible | Both groups |
| A10 | ADMIN | false | Issuance + Admin visible | Both groups |
| A11 | ADMIN | false | Team group hidden | Not visible |
| A12 | ADMIN | true | All groups visible | Base + Team + Issuance + Admin |

### B. Dashboard Tabs (6 combinations × 3 checks = 18 tests)

| # | Role | isManager | Check | Expected |
|---|------|-----------|-------|----------|
| B1 | EMPLOYEE | false | Default tab | "My Badges" |
| B2 | EMPLOYEE | false | Tab count | 1 tab |
| B3 | EMPLOYEE | false | Tab content | EmployeeDashboard renders |
| B4 | EMPLOYEE | true | Tab count | 2 tabs (My Badges, Team) |
| B5 | EMPLOYEE | true | Team tab content | ManagerDashboard renders |
| B6 | ISSUER | false | Tab count | 2 tabs (My Badges, Issuance) |
| B7 | ISSUER | true | Tab count | 3 tabs |
| B8 | ADMIN | false | Tab count | 3 tabs (My Badges, Issuance, Admin) |
| B9 | ADMIN | true | Tab count | 4 tabs (all) |
| B10 | ALL | — | Default tab | Always "My Badges" first |

### C. Route Integrity (10 tests)

| # | Check | Expected |
|---|-------|----------|
| C1 | Dashboard link | `/dashboard` loads composite view |
| C2 | Wallet link | `/wallet` loads badge wallet |
| C3 | Templates link (ISSUER) | `/templates` loads template list |
| C4 | Badges link (ISSUER) | `/badges` loads badge management |
| C5 | Bulk link (ISSUER) | `/bulk-issue` loads bulk page |
| C6 | Analytics link (ISSUER) | `/analytics` loads analytics |
| C7 | Users link (ADMIN) | `/admin/users` loads user management |
| C8 | Skills link (ADMIN) | `/admin/skills` loads skills |
| C9 | Categories link (ADMIN) | `/admin/categories` loads categories |
| C10 | Milestones link (ADMIN) | `/admin/milestones` loads milestones |

### D. Responsive (4 tests)

| # | Check | Expected |
|---|-------|----------|
| D1 | Desktop (1280px) | Sidebar visible, collapsible |
| D2 | Tablet (768px) | Sidebar collapsed or drawer |
| D3 | Mobile (375px) | Sidebar as drawer, hamburger trigger |
| D4 | Mobile drawer | Shows correct groups for logged-in user |

### Test Accounts

| # | Email | Role | isManager | Password |
|---|-------|------|-----------|----------|
| 1 | employee@test.gcredit.com | EMPLOYEE | false | (UAT setup) |
| 2 | manager-employee@test.gcredit.com | EMPLOYEE | true | (UAT setup) |
| 3 | issuer@test.gcredit.com | ISSUER | false | (UAT setup) |
| 4 | manager-issuer@test.gcredit.com | ISSUER | true | (UAT setup) |
| 5 | admin@test.gcredit.com | ADMIN | false | (UAT setup) |
| 6 | admin-manager@test.gcredit.com | ADMIN | true | (UAT setup) |

## Dev Notes

### UAT Execution
- Manual testing with 6 browser sessions (or use incognito windows)
- Document results in this file's "UAT Results" section below
- Screenshot capture for any FAIL items

### References
- ADR-016 DEC-016-01: Dashboard tab matrix
- ADR-016 DEC-016-02: Sidebar navigation specification
- Sprint 10 UAT: 33/33 PASS pattern
- Sprint 11 UAT: 152/153 PASS pattern

## UAT Results

_To be filled during UAT execution_

| Test ID | Result | Notes |
|---------|--------|-------|
| A1 | | |
| A2 | | |
| ... | | |

**Total:** _/56 tests  
**PASS Rate:** _%  
**Action Items:** (if any FAIL)

## Dev Agent Record

### Agent Model Used
_To be filled during UAT_

### Completion Notes
_To be filled during UAT_
