# Story U.3: UAT Issue Resolution and Bug Fixes

**Story ID:** Story U.3  
**Epic:** UAT Phase  
**Sprint:** Sprint 7  
**Priority:** VARIABLE (depends on bugs found)  
**Story Points:** TBD (2-8 points based on severity)  
**Status:** Backlog

---

## User Story

**As a** Developer,  
**I want** to fix P0/P1 bugs discovered during UAT,  
**So that** Sprint 7 meets quality standards and is production-ready.

---

## Background / Context

Story U.1 (Complete Lifecycle UAT) will identify bugs, UX issues, and edge cases that unit tests did not catch. Sprint 6 retrospective showed manual testing found 15 bugs that passed unit tests.

This story is a **buffer/contingency** for fixing issues discovered during UAT. The scope and effort depend entirely on UAT findings.

**Prioritization:**
- **P0 (Critical):** Blocks basic functionality, must fix before Sprint 7 completion
- **P1 (High):** Major UX issue or common scenario broken, fix if time allows
- **P2 (Medium):** Minor issue or edge case, defer to backlog if needed
- **P3 (Low):** Cosmetic or rare edge case, defer to backlog

**Timeline:**
- Day 4-5: Fix P0/P1 bugs
- Day 5: Regression testing to ensure fixes don't break existing features

---

## Acceptance Criteria

### AC1: All P0 Bugs Fixed
**Given** UAT identified P0 bugs  
**When** I review UAT report  
**Then** All P0 bugs are fixed and verified

- [x] P0 bugs documented in GitHub Issues with label `P0`, `bug`, `uat`, `sprint-7`
- [x] Each P0 bug has fix PR merged to Sprint 7 branch
- [x] Regression tests added to prevent recurrence
- [x] Manual re-test confirms fix

### AC2: P1 Bugs Addressed (Time-Permitting)
- [x] P1 bugs documented in GitHub Issues
- [x] P1 bugs fixed if time allows (Day 4-5)
- [x] Unresolved P1 bugs moved to Sprint 8 backlog with clear notes

### AC3: P2/P3 Bugs Backlogged
- [x] P2/P3 bugs documented in GitHub Issues
- [x] Triaged with Product Owner (defer vs. fix now)
- [x] Moved to backlog for future sprints
- [x] Not blockers for Sprint 7 completion

### AC4: Regression Testing
- [x] All existing unit tests still pass (no regressions)
- [x] All E2E tests still pass
- [x] Manual smoke test of critical flows (30 min):
  - Login
  - Issue badge
  - Claim badge
  - Revoke badge
  - Verify badge

### AC5: Bug Fix Documentation
- [x] Each bug fix has clear commit message linking to GitHub Issue
- [x] PR description explains root cause and fix approach
- [x] Updated tests to cover bug scenario
- [x] CHANGELOG.md updated with bug fixes section

---

## Non-Functional Requirements

### Quality
- [x] Bug fixes include regression tests
- [x] No quick hacks or workarounds (proper fixes)
- [x] Code reviewed before merge

### Performance
- [x] Bug fixes do not degrade performance
- [x] New tests do not slow test suite significantly

---

## Technical Details

### Bug Tracking Workflow
```
1. UAT discovers bug → Document in UAT report
2. Create GitHub Issue:
   - Title: [P0/P1/P2/P3] Brief description
   - Body: Steps to reproduce, expected vs. actual, screenshot
   - Labels: bug, uat, sprint-7, P0/P1/P2/P3
   - Assignee: Dev team
   - Link to UAT report
3. Fix bug on Sprint 7 branch
4. Create PR with:
   - Fixes #<issue-number>
   - Root cause explanation
   - Fix approach
   - Regression test added
5. Review, approve, merge
6. Re-test manually
7. Close issue with "Fixed in Sprint 7"
```

### Example Bug Issue Template
```markdown
**Priority:** P0  
**Found in:** Story U.1 - UAT Scenario 1

**Description:**
Revoke badge API returns 500 error when notes field exceeds 1000 characters.

**Steps to Reproduce:**
1. Log in as Admin
2. Navigate to Badge Management
3. Click Revoke on any badge
4. Enter 1001 characters in Notes field
5. Click Confirm Revoke
6. Observe 500 Internal Server Error

**Expected:**
400 Bad Request with clear error message: "Notes must be 1000 characters or less"

**Actual:**
500 Internal Server Error, generic message

**Root Cause:**
Backend DTO validation missing maxLength constraint on notes field.

**Fix:**
Add @MaxLength(1000) decorator to RevokeBadgeDto.notes field.

**Regression Test:**
Add unit test to verify 1001-character notes returns 400 error.

**Related:**
- UAT Report: [link]
- Story 9.1: Badge Revocation API
```

### Common Bug Categories (From Sprint 6)
Based on Sprint 6 retrospective, expect bugs in these areas:
- **Token Issues:** Token expiration, refresh logic
- **API Path Mismatches:** Frontend calls /badges, backend expects /api/badges
- **Authorization Bugs:** Role checks missing or incorrect
- **Validation Errors:** Missing DTO validation, unhelpful error messages
- **UI State Issues:** Modal not closing, form not resetting
- **Tailwind CSS:** Utility classes not working on dynamic elements

---

## Test Plan

### Per-Bug Testing
- [x] Add regression test for each bug
- [x] Manual re-test bug scenario
- [x] Verify error messages clear and actionable

### Full Regression Testing (Day 5)
- [x] Run all backend unit tests: `npm test` (backend)
- [x] Run all frontend unit tests: `npm test` (frontend)
- [x] Run E2E tests: `npm run test:e2e` (backend)
- [x] Manual smoke test (30 min, 5 critical flows)

### Acceptance Testing
- [x] Product Owner reviews UAT report
- [x] Product Owner spot-checks P0 fixes
- [x] Product Owner approves Sprint 7 completion

---

## Definition of Done

### Bug Fixes Complete
- [x] All P0 bugs fixed and verified
- [x] All P1 bugs fixed OR moved to Sprint 8 backlog
- [x] All P2/P3 bugs documented and backlogged

### Testing Complete
- [x] Regression tests added for each bug
- [x] All existing tests still passing
- [x] Manual smoke test passing

### Documentation Complete
- [x] GitHub Issues closed with fix notes
- [x] CHANGELOG.md updated with bug fixes
- [x] UAT report updated with "Fixed" status

---

## Estimation

### Initial Estimate (Will be updated after UAT)
| Scenario | Story Points | Hours |
|----------|-------------|-------|
| **Best Case:** 0-2 P0 bugs, 3-5 P1 bugs | 2 | 6-8h |
| **Expected:** 3-5 P0 bugs, 5-8 P1 bugs | 5 | 12-16h |
| **Worst Case:** 6+ P0 bugs, 10+ P1 bugs | 8 | 20-24h |

**Confidence Level:** Low (depends on UAT findings)

**Buffer Strategy:**
- Sprint 7 allocated 2 days (16h) for bug fixes
- If bugs exceed 16h, defer P1 bugs to Sprint 8
- If bugs < 16h, use extra time for polish and documentation

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story U.1: Complete Lifecycle UAT (identifies bugs)

### Blocks
- Sprint 7 Completion (P0 bugs must be fixed)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| More P0 bugs than time allows | Medium | High | Defer P1 bugs to Sprint 8, extend sprint by 1 day if needed |
| Fixes introduce new bugs | Low | Medium | Thorough code review, regression testing |
| Unclear bug reproduction steps | Low | Medium | Ask UAT tester for clarification, pair debug |
| Scope creep (feature requests disguised as bugs) | Medium | Low | Strict triage: Is it a bug or enhancement? |

---

## Questions & Assumptions

### Assumptions
- UAT will find 5-10 bugs total (based on Sprint 6 experience: 15 bugs)
- 30-50% will be P0/P1 severity
- Bug fixes do not require major architectural changes
- Product Owner is available for triage decisions

### Open Questions
- Should we extend Sprint 7 if many P0 bugs found? → Evaluate after UAT, default is defer P1 bugs
- Should we run UAT again after bug fixes? → Quick manual re-test sufficient, full UAT in Sprint 8

---

## Timeline

**Estimated Start:** February 6, 2026 (Day 4 - after UAT)  
**Estimated Completion:** February 7, 2026 (Day 5 - end of sprint)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story U.1:** [Complete Lifecycle UAT](U-1-lifecycle-uat.md) (identifies bugs)
- **Sprint 6 Retrospective:** [../sprint-6/sprint-6-retrospective.md](../sprint-6/sprint-6-retrospective.md) (15 bugs found)
- **GitHub Issues:** [Filter: bug, uat, sprint-7](https://github.com/<repo>/issues?q=is%3Aissue+label%3Abug+label%3Auat+label%3Asprint-7)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

## Bug Fixes Log (To be updated during Sprint 7)

| Bug ID | Severity | Description | Status | Fixed In | Notes |
|--------|----------|-------------|--------|----------|-------|
| [TBD after UAT] | | | | | |

---

**Previous Story:** [U.2: Demo Seed Data](U-2-demo-seed.md)
