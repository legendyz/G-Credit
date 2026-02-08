# Sprint 10 Backlog

**Sprint:** Sprint 10  
**Duration:** 2026-02-09 to 2026-02-22 (2 weeks)  
**Target Version:** v1.0.0  
**Sprint Type:** Release Sprint (TD Cleanup + UAT + v1.0.0 Tag)  
**Branch:** `sprint-10/v1-release`

---

## 🎯 Sprint Goal

**"完成 v1.0.0 发布准备：技术债务归零 + 全面 UAT + 正式版本标记"**

Deliver a production-ready v1.0.0 by resolving all remaining technical debt, executing comprehensive UAT across all 10 Epics, and creating the official release tag.

**Success Criteria:**
- ✅ `tsc --noEmit` passes with 0 errors (src + test)
- ✅ ESLint ≤ 280 warnings with CI gate preventing regression
- ✅ 0 TODO/FIXME markers in source code
- ✅ Admin analytics connected to real data (no mock data)
- ✅ Full UAT: 100% P0 pass rate across all 10 Epics
- ✅ All 1087+ tests passing (0 regressions)
- ✅ Branch merged to main + tagged v1.0.0

---

## 📊 Sprint Capacity

### Team Composition
- **Developers:** 2 full-time (40h each)
- **Total Capacity:** 80 hours

### Capacity Allocation
| Category | Hours | % | Notes |
|----------|-------|---|-------|
| **Technical Debt** | 17h | 21% | Stories 10.1-10.4 |
| **Feature Enhancement** | 6h | 8% | Story 10.5 (Analytics real data) |
| **UAT Preparation** | 8h | 10% | Story 10.6 (Test plan + seed data) |
| **UAT Execution** | 12h | 15% | Story 10.7 (Full UAT) |
| **Bug Fix Buffer** | 8h | 10% | Story 10.8 (UAT bug fixes) |
| **Release Documentation** | 4h | 5% | Story 10.9 (CHANGELOG + docs) |
| **Release** | 2h | 3% | Story 10.10 (Merge + tag) |
| **Buffer** | 23h | 28% | Sprint buffer (no external dependencies) |
| **TOTAL** | **80h** | **100%** | |

### Velocity Reference (Lessons Learned)
| Sprint | Estimated | Actual | Accuracy |
|--------|-----------|--------|----------|
| Sprint 7 | 41-47h | 38.5h | 82-93% |
| Sprint 8 | 76h | 80h | 95% |
| Sprint 9 | 51h | 37h | 73% |
| **Sprint 10** | **57h** | TBD | Target: >85% |

---

## 📦 Phase 1: Technical Debt Cleanup (17h)

### Story 10.1: TD-017 — Fix tsc Test Type Errors
**Priority:** 🔴 HIGH  
**Estimate:** 7h  
**Story Doc:** 📄 [10-1-tsc-test-type-errors.md](10-1-tsc-test-type-errors.md)  
**Status:** 🔴 Not Started  
**Dependencies:** None

**Quick Summary:** As a developer, I want all 114 tsc test-only type errors resolved, so that `tsc --noEmit` passes cleanly.

**Key Deliverables:**
- [ ] Fix 114 tsc errors in test files
- [ ] Add `tsc --noEmit` to CI pipeline
- [ ] Zero regressions in 1087 tests

---

### Story 10.2: ESLint Regression Fix + CI Gate
**Priority:** 🔴 HIGH  
**Estimate:** 5h  
**Story Doc:** 📄 [10-2-eslint-regression-ci-gate.md](10-2-eslint-regression-ci-gate.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Ideally after 10.1

**Quick Summary:** As a developer, I want ESLint warnings reduced from 423 to <280 with a CI gate preventing future regression.

**Key Deliverables:**
- [ ] ESLint warnings ≤ 280
- [ ] CI gate: max-warnings cannot increase
- [ ] Zero regressions

---

### Story 10.3: TD-018 — Code TODO/FIXME Cleanup
**Priority:** 🟡 MEDIUM  
**Estimate:** 3h  
**Story Doc:** 📄 [10-3-todo-fixme-cleanup.md](10-3-todo-fixme-cleanup.md)  
**Status:** 🔴 Not Started  
**Dependencies:** None

**Quick Summary:** As a developer, I want all 14 TODO/FIXME markers resolved, so that the codebase is clean for v1.0.0.

**Key Deliverables:**
- [ ] 0 TODO/FIXME in src/ (backend + frontend)
- [ ] Deferred items tracked as ADR or TD
- [ ] Zero regressions

---

### Story 10.4: i18n — Hardcoded Chinese String Scan & Fix
**Priority:** 🟢 LOW  
**Estimate:** 2h  
**Story Doc:** 📄 [10-4-i18n-chinese-string-scan.md](10-4-i18n-chinese-string-scan.md)  
**Status:** 🔴 Not Started  
**Dependencies:** None

**Quick Summary:** As a developer, I want all hardcoded Chinese strings replaced with English for MVP consistency.

**Key Deliverables:**
- [ ] Global scan for Chinese characters (\u4E00-\u9FFF)
- [ ] All instances replaced with English
- [ ] Zero regressions

---

## 📦 Phase 2: Feature Enhancement (6h)

### Story 10.5: Admin Analytics — Mock Data → Real Data
**Priority:** 🟡 MEDIUM  
**Estimate:** 6h  
**Story Doc:** 📄 [10-5-admin-analytics-real-data.md](10-5-admin-analytics-real-data.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Story 10.3 (removes TODO marker)

**Quick Summary:** As an HR administrator, I want the analytics dashboard to display real data from the database.

**Key Deliverables:**
- [ ] AdminAnalyticsPage connected to `/api/analytics/admin`
- [ ] KPI cards show real metrics
- [ ] Charts render real data
- [ ] Loading/error/empty states

---

## 📦 Phase 3: UAT (28h)

### Story 10.6: UAT Test Plan & Seed Data Preparation
**Priority:** 🔴 HIGH  
**Estimate:** 8h  
**Story Doc:** 📄 [10-6-uat-test-plan-seed-data.md](10-6-uat-test-plan-seed-data.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Phase 1 & 2 complete

**Quick Summary:** Create comprehensive UAT test plan covering all 10 Epics with realistic seed data.

**Key Deliverables:**
- [ ] UAT test plan (30+ test cases)
- [ ] Demo seed script (`npm run seed:uat`)
- [ ] Test accounts (4 roles)
- [ ] Known limitations document

---

### Story 10.7: Full UAT Execution (All 10 Epics)
**Priority:** 🔴 HIGH  
**Estimate:** 12h  
**Story Doc:** 📄 [10-7-full-uat-execution.md](10-7-full-uat-execution.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Story 10.6

**Quick Summary:** Execute comprehensive manual UAT covering all 10 Epics.

**Key Deliverables:**
- [ ] All test cases executed with pass/fail results
- [ ] Cross-Epic lifecycle test (issue → claim → share → verify → revoke)
- [ ] UAT results report
- [ ] 100% P0 pass rate

---

### Story 10.8: UAT Bug Fixes
**Priority:** 🟡 MEDIUM  
**Estimate:** 8h (buffer)  
**Story Doc:** 📄 [10-8-uat-bug-fixes.md](10-8-uat-bug-fixes.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Story 10.7

**Quick Summary:** Fix all P0/P1 bugs discovered during UAT.

**Key Deliverables:**
- [ ] All P0 bugs fixed
- [ ] P1 bugs fixed or workaround documented
- [ ] Regression tests added
- [ ] Re-run UAT passes

---

## 📦 Phase 4: Release (6h)

### Story 10.9: Release Documentation & CHANGELOG
**Priority:** 🟡 MEDIUM  
**Estimate:** 4h  
**Story Doc:** 📄 [10-9-release-documentation.md](10-9-release-documentation.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Stories 10.1-10.7 complete

**Quick Summary:** Complete all release documentation for v1.0.0.

**Key Deliverables:**
- [ ] CHANGELOG.md (backend + frontend)
- [ ] README.md updated
- [ ] project-context.md updated
- [ ] Release notes document
- [ ] All links verified

---

### Story 10.10: Merge to Main + Tag v1.0.0
**Priority:** 🔴 HIGH  
**Estimate:** 2h  
**Story Doc:** 📄 [10-10-merge-main-tag-v1.md](10-10-merge-main-tag-v1.md)  
**Status:** 🔴 Not Started  
**Dependencies:** ALL Stories 10.1-10.9 complete

**Quick Summary:** Merge Sprint 10 branch to main and tag v1.0.0.

**Key Deliverables:**
- [ ] Sprint branch merged to main
- [ ] Git tag `v1.0.0` created and pushed
- [ ] Sprint 10 retrospective

---

## 📊 Stories Summary

| Story | Title | Priority | Hours | Phase | Status |
|-------|-------|----------|-------|-------|--------|
| 10.1 | TD-017: tsc Test Type Errors | 🔴 HIGH | 7h | 1-TD | 🔴 |
| 10.2 | ESLint Regression + CI Gate | 🔴 HIGH | 5h | 1-TD | 🔴 |
| 10.3 | TD-018: TODO/FIXME Cleanup | 🟡 MED | 3h | 1-TD | 🔴 |
| 10.4 | i18n: Chinese String Scan | 🟢 LOW | 2h | 1-TD | 🔴 |
| 10.5 | Analytics: Mock → Real Data | 🟡 MED | 6h | 2-Feature | 🔴 |
| 10.6 | UAT Test Plan & Seed Data | 🔴 HIGH | 8h | 3-UAT | 🔴 |
| 10.7 | Full UAT Execution | 🔴 HIGH | 12h | 3-UAT | 🔴 |
| 10.8 | UAT Bug Fixes | 🟡 MED | 8h | 3-UAT | 🔴 |
| 10.9 | Release Documentation | 🟡 MED | 4h | 4-Release | 🔴 |
| 10.10 | Merge + Tag v1.0.0 | 🔴 HIGH | 2h | 4-Release | 🔴 |
| **Total** | | | **57h** | | |

---

## Definition of Done

### Story-Level DoD
- [ ] All acceptance criteria met
- [ ] Code review completed (Code Review as DoD Gate — Lesson 31)
- [ ] All tests pass (0 regressions)
- [ ] Story file updated (Completion Notes)

### Sprint-Level DoD (v1.0.0 Release)
- [ ] `tsc --noEmit` returns 0 errors
- [ ] ESLint ≤ 280 warnings, 0 errors
- [ ] 0 TODO/FIXME in source code
- [ ] UAT 100% P0 pass rate
- [ ] 1087+ tests passing (0 failures)
- [ ] project-context.md updated
- [ ] CHANGELOG.md updated (backend + frontend)
- [ ] Branch merged to main + v1.0.0 tagged
- [ ] Sprint retrospective completed

---

## Code Review Strategy

| Story | Risk Level | Review Method | Reason |
|-------|-----------|---------------|--------|
| 10.1 | 🟡 MEDIUM | AI Review + Self | Type fixes — risk of regressions |
| 10.2 | 🟡 MEDIUM | AI Review + Self | Lint fixes — risk of regressions |
| 10.3 | 🟡 MEDIUM | Self Review | Mixed fixes — moderate scope |
| 10.4 | 🟢 LOW | Self Review | Simple find-and-replace |
| 10.5 | 🟡 MEDIUM | AI Review + Self | Frontend-backend integration |
| 10.6 | 🟢 LOW | Self Review | Documentation + seed script |
| 10.7 | N/A | N/A | Manual UAT — no code |
| 10.8 | 🔴 HIGH | AI Review + Self | Bug fixes — high regression risk |
| 10.9 | 🟢 LOW | Self Review | Documentation only |
| 10.10 | 🔴 HIGH | Full verification | Release gate — all checks must pass |

---

## Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UAT discovers major bugs | Medium | High | 8h buffer (Story 10.8); if exceeded, defer v1.0.0 to Sprint 11 |
| tsc fixes cascade into more errors | Low | Medium | Lesson 36: budget 30-50% extra; 7h allocated (was 5h) |
| ESLint --fix strips type assertions | Low | Low | Lesson 34: use variable annotations |
| Admin analytics API gaps | Low | Medium | Fallback: show available data only, mark gaps |

---

## Dependencies

### Story Dependencies (Execution Order)
```
Phase 1 (Parallel): 10.1, 10.3, 10.4 can run in parallel
Phase 1 (Sequential): 10.2 ideally after 10.1
Phase 2: 10.5 after 10.3 (TODO marker removal)
Phase 3: 10.6 → 10.7 → 10.8 (strict sequence)
Phase 4: 10.9 → 10.10 (strict sequence, after all others)
```

### External Dependencies
- **TD-006 (Teams Permissions):** External — admin approval needed. If resolved, re-enable 4 skipped tests. Not blocking Sprint 10.

---

## Testing Strategy

### Baseline
- Backend: 532 tests
- Frontend: 397 tests
- E2E: 158 tests
- **Total: 1087 tests (100% pass rate)**

### Sprint 10 Expectations
- Stories 10.1-10.5 should **not decrease** test count
- Story 10.5 adds tests for analytics integration
- Story 10.6 adds seed data script (testable)
- Story 10.8 adds regression tests for any bugs found
- **Target: 1100+ tests at Sprint end**

### CI Gate Additions
- `tsc --noEmit` (Story 10.1)
- ESLint `max-warnings` gate (Story 10.2)

---

## Version Manifest

📄 See [version-manifest.md](version-manifest.md) for complete dependency versions.

**Key Notes:**
- No new dependencies planned
- Prisma locked at 6.19.2 (ADR)
- No database schema changes
- No new Azure resources

---

## Git Branch Strategy

**Branch Name:** `sprint-10/v1-release`  
**Base:** `main` (after Sprint 9 v0.9.0 tag)  
**Merge Strategy:** `--no-ff` merge to main  
**Tag:** `v1.0.0`

---

## Sprint Ceremonies

| Ceremony | Date | Notes |
|----------|------|-------|
| Sprint Planning | 2026-02-08 | ✅ This document |
| Sprint Kickoff | 2026-02-09 | After branch creation |
| Sprint Review | 2026-02-22 | Demo v1.0.0 features |
| Sprint Retrospective | 2026-02-22 | Final MVP retrospective |

---

**Last Updated:** 2026-02-08  
**Status:** Planning Complete  
**Template Version:** Based on sprint-backlog-template.md v1.2
