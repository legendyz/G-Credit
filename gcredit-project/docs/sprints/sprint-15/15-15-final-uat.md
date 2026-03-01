# Story 15.15: Final UAT — Full UI Acceptance (Wave 4)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 4h  
**Wave:** 4 — Testing + Final UAT  
**Source:** Sprint 15 Planning — comprehensive UI acceptance before Sprint close  
**Dependencies:** All Wave 1-3 stories must be complete

---

## Story

**As a** Product Owner preparing for Pilot deployment,  
**I want** a comprehensive UI acceptance test covering all Sprint 15 deliverables,  
**So that** I'm confident the UI quality is Pilot-ready.

## Acceptance Criteria

1. [ ] Mid-Sprint UAT regression: all sidebar + dashboard tests still pass
2. [ ] Pagination: template list page controls work correctly
3. [ ] Infinite scroll: wallet loads more badges on scroll
4. [ ] Forgot Password: complete password reset flow works
5. [ ] Delete confirmation: styled modal replaces native confirm
6. [ ] Icons: no emoji remains in application UI (all Lucide)
7. [ ] Dirty-form guard: navigating away from unsaved form shows warning
8. [ ] z-index: modal/toast/sidebar layers correctly
9. [ ] Inline styles: no visual regression from Tailwind migration
10. [ ] Rate limits: configurable (E2E tests not blocked)
11. [ ] UAT results documented with PASS/FAIL and overall pass rate
12. [ ] All FAIL items have documented action plan

## UAT Test Cases

### E. Mid-Sprint Regression (Quick re-check: 10 tests)

| # | Check | Expected |
|---|-------|----------|
| E1 | ADMIN+Manager sidebar | All 4 groups visible |
| E2 | EMPLOYEE sidebar | Only base group |
| E3 | Dashboard default tab | "My Badges" for all |
| E4 | Dashboard ADMIN tabs | 4 tabs visible |
| E5 | Route: /dashboard | Loads without error |
| E6 | Route: /wallet | Loads without error |
| E7 | Route: /templates (ISSUER) | Loads without error |
| E8 | Route: /admin/users (ADMIN) | Loads without error |
| E9 | Mobile sidebar drawer | Opens/closes correctly |
| E10 | Sidebar collapse toggle | Icon-only mode works |

### F. Pagination & Scroll (8 tests)

| # | Check | Expected |
|---|-------|----------|
| F1 | Template list: page 1 | Shows first 10 templates |
| F2 | Template list: next page | Page 2 loads correctly |
| F3 | Template list: page size change | Dropdown 10/20/50 works |
| F4 | Template list: URL params | `/templates?page=2&pageSize=20` deep-linkable |
| F5 | Wallet: initial load | First 20 badges shown |
| F6 | Wallet: scroll to bottom | Loading indicator + next batch |
| F7 | Wallet: end of list | "No more badges" message |
| F8 | Wallet: filter + reset | Scroll position resets on filter change |

### G. Form & Dialog (8 tests)

| # | Check | Expected |
|---|-------|----------|
| G1 | Forgot Password: link on login | Visible and navigates to /forgot-password |
| G2 | Forgot Password: submit email | Shows "check your email" confirmation |
| G3 | Forgot Password: invalid email | Shows validation error |
| G4 | Reset Password: token page | Loads with password fields |
| G5 | Delete template: click delete | Styled AlertDialog appears (not native) |
| G6 | Delete template: cancel | Dialog closes, no deletion |
| G7 | Dirty-form: edit + navigate | Warning dialog appears |
| G8 | Dirty-form: save + navigate | No warning (form clean) |

### H. Visual Quality (10 tests)

| # | Check | Expected |
|---|-------|----------|
| H1 | Dashboard cards | Lucide icons, no emoji |
| H2 | Sidebar items | Lucide icons, no emoji |
| H3 | Toast messages | Lucide icons |
| H4 | Empty states | Lucide icons with descriptive text |
| H5 | Badge status indicators | Lucide icons (check, clock, x) |
| H6 | Inline styles audit | No `style={{}}` visible in DOM inspector (spot check 5 pages) |
| H7 | z-index: modal over sidebar | Modal overlay covers sidebar |
| H8 | z-index: toast over modal | Toast notification visible above modal |
| H9 | Overall visual consistency | Design tokens used, no hardcoded colors (spot check) |
| H10 | Mobile layout | No horizontal overflow, touch targets ≥ 44px |

### I. Technical Verification (4 tests)

| # | Check | Expected |
|---|-------|----------|
| I1 | Rate limit: login 6 users | All 6 users can login without 429 error |
| I2 | Rate limit: production default | 5/60s limit still in .env.example |
| I3 | All tests pass | `npm test` in both BE and FE: 0 failures |
| I4 | Build succeeds | `npm run build` in both BE and FE |

## UAT Results

_To be filled during UAT execution_

### Summary

| Section | Tests | PASS | FAIL | Rate |
|---------|-------|------|------|------|
| E. Regression | 10 | | | |
| F. Pagination | 8 | | | |
| G. Forms & Dialogs | 8 | | | |
| H. Visual Quality | 10 | | | |
| I. Technical | 4 | | | |
| **Total** | **40** | | | |

### Detailed Results

| Test ID | Result | Notes |
|---------|--------|-------|
| E1 | | |
| E2 | | |
| ... | | |

### Action Items (FAIL items)

| # | Test ID | Issue | Severity | Resolution |
|---|---------|-------|----------|------------|
| 1 | | | | |

**UAT Verdict:** ☐ PASS — Sprint 15 Pilot-Ready | ☐ CONDITIONAL PASS — Minor issues noted | ☐ FAIL — Blocking issues found

## Dev Notes

### References
- Sprint 10 UAT: 33/33 PASS (100%)
- Sprint 11 UAT: 152/153 PASS (99.3%)
- Sprint 13 UAT: 47/47 Agent + M1-M6 Manual PASS (100%)

## Dev Agent Record

### Agent Model Used
_To be filled during UAT_

### Completion Notes
_To be filled during UAT_
