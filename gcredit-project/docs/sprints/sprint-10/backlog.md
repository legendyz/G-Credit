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
- ✅ ESLint: 0 errors + 0 warnings with `--max-warnings=0` zero-tolerance CI gate (backend + frontend)
- ✅ 0 TODO/FIXME markers in source code
- ✅ 0 hardcoded `localhost:3000` URLs in frontend
- ✅ 0 dead navigation links (all Quick Actions route to valid pages)
- ✅ 404 catch-all route implemented
- ✅ 0 `window.alert()` in frontend code
- ✅ Admin analytics connected to real data (no mock data)
- ✅ Full UAT: 100% P0 pass rate across all 10 Epics
- ✅ All 1087+ tests passing (0 regressions)
- ✅ Branch merged to main + tagged v1.0.0
- ✅ `package.json` version set to `1.0.0`

---

## 📊 Sprint Capacity

### Team Composition
- **Developers:** 2 full-time (40h each)
- **Total Capacity:** Extended sprint — no hard time constraint (experimental project)

### Capacity Allocation
| Category | Hours | Notes |
|----------|-------|---|
| **Technical Debt** | 28.5h | Stories 10.1-10.4 + 10.3b + 10.3c (API path fixes from buffer) |
| **Feature Enhancement** | 6h | Story 10.5 (Analytics real data) |
| **UI Walkthrough** | 2h | Story 10.6a (Screenshot baseline) |
| **Feature: Issuance UI** | 6h | Story 10.6b (Single badge issuance form) |
| **UAT Preparation** | 6h | Story 10.6c (Test plan + seed data) |
| **UI Overhaul** | 20h | Story 10.6d (Design system + full UI fix) |
| **UAT Execution** | 12h | Story 10.7 (Full UAT) |
| **Bug Fix Buffer** | 8h | Story 10.8 (UAT bug fixes) |
| **UAT Seed Fix** | 1h | Story 10.8b (Skill taxonomy seed) |
| **Release Documentation** | 4h | Story 10.9 (CHANGELOG + docs) |
| **Release** | 2h | Story 10.10 (Merge + tag) |
| **TOTAL** | **95.5h** | Extended sprint — no time constraint |

### Velocity Reference (Lessons Learned)
| Sprint | Estimated | Actual | Accuracy |
|--------|-----------|--------|----------|
| Sprint 7 | 41-47h | 38.5h | 82-93% |
| Sprint 8 | 76h | 80h | 95% |
| Sprint 9 | 51h | 37h | 73% |
| **Sprint 10** | **63h** | TBD | Target: >85% |

---

## 📦 Phase 1: Technical Debt Cleanup (19h)

### Story 10.1: TD-017 — Fix tsc Test Type Errors
**Priority:** 🔴 HIGH  
**Estimate:** 7.5h  
**Story Doc:** 📄 [10-1-tsc-test-type-errors.md](10-1-tsc-test-type-errors.md)  
**Status:** ✅ Complete  
**Dependencies:** None

**Quick Summary:** As a developer, I want all 114 tsc test-only type errors resolved, so that `tsc --noEmit` passes cleanly.

**Key Deliverables:**
- [ ] Fix 114 tsc errors in test files
- [ ] Add `tsc --noEmit` to CI pipeline
- [ ] Wrap password reset in `$transaction` (🏗️ Arch Audit)
- [ ] Zero regressions in 1087 tests

---

### Story 10.2: ESLint Full Cleanup + CI Zero-Tolerance Gate ✅ Complete
**Priority:** 🔴 HIGH  
**Estimate:** 8h | **Actual:** 8h  
**Story Doc:** 📄 [10-2-eslint-regression-ci-gate.md](10-2-eslint-regression-ci-gate.md)  
**Status:** ✅ Complete (SM Accepted 2026-02-08)  
**Dependencies:** Story 10.1 ✅

**Quick Summary:** As a developer, I want all ESLint errors and warnings eliminated (537→0) with a zero-tolerance CI gate.

**Key Deliverables:**
- [x] 0 ESLint errors (325→0)
- [x] 0 ESLint warnings (212→0)
- [x] `--max-warnings=0` zero-tolerance CI gate
- [x] Zero regressions (534 tests pass)

---

### Story 10.3: TD-018 — TODO/FIXME Cleanup + UX Audit Critical Fixes ✅ Complete
**Priority:** 🔴 HIGH  
**Estimate:** 5h | **Actual:** 4h  
**Story Doc:** 📄 [10-3-todo-fixme-cleanup.md](10-3-todo-fixme-cleanup.md)  
**Status:** ✅ Complete (SM Accepted 2026-02-08)  
**Dependencies:** None

**Quick Summary:** As a developer, I want all 14 TODO/FIXME markers resolved, hardcoded localhost URLs replaced, and dead navigation links fixed.

**Key Deliverables:**
- [x] 0 TODO/FIXME in src/ (backend + frontend)
- [x] Fix 8 hardcoded `localhost:3000` URLs (🎨 UX Audit Critical #3)
- [x] Fix 9 dead Quick Action links (🎨 UX Audit Critical #1)
- [x] Add 404 catch-all route (🎨 UX Audit Critical #2)
- [x] Deferred items tracked as ADR or TD
- [x] Zero regressions (534 backend + 397 frontend tests pass)

---

### Story 10.3b: TD-019 — Frontend ESLint Cleanup + CI Gate ✅ Complete
**Priority:** 🔴 HIGH  
**Estimate:** 3.5h (from buffer) | **Actual:** 3.5h  
**Story Doc:** 📄 [10-3b-frontend-eslint-cleanup.md](10-3b-frontend-eslint-cleanup.md)  
**Status:** ✅ Complete (SM Accepted 2026-02-09)  
**Dependencies:** None  
**Discovered:** During Story 10.3 development  

**Quick Summary:** As a developer, I want frontend ESLint at 0 errors + 0 warnings with CI enforcement, matching backend zero-tolerance standard.

**Key Deliverables:**
- [x] Create `.gitattributes` to fix 21,354 CRLF warnings
- [x] Fix 49 ESLint errors (React Compiler, any, unused vars, a11y)
- [x] Fix 9 react-hooks/exhaustive-deps warnings
- [x] Add `--max-warnings=0` to frontend lint script
- [x] Add `npm run lint` to CI frontend-tests job
- [x] Zero regressions (Vitest + backend tests)

---

### Story 10.3c: API Path Audit Fixes — Route Mismatch + Hardcoded URL Cleanup ✅ Complete
**Priority:** 🔴 CRITICAL  
**Estimate:** 2h (from buffer) | **Actual:** 1.5h  
**Story Doc:** 📄 [10-3c-api-path-audit-fixes.md](10-3c-api-path-audit-fixes.md)  
**Status:** ✅ Complete  
**Dependencies:** None  
**Discovered:** SM API Path Audit (2026-02-09)

**Quick Summary:** 5 CRITICAL API path mismatches causing 404s. 4 backend controllers missing `api/` prefix + 2 frontend path bugs + 8 hardcoded URLs.

**Key Deliverables:**
- [x] 4 backend controllers add `api/` prefix (auth, badge-templates, skills, skill-categories)
- [x] Fix Evidence download/preview path (missing `/badges` segment)
- [x] Fix Teams share path order (`/teams/share` → `/share/teams`)
- [x] 8 hardcoded `/api/...` → `${API_BASE_URL}/...`
- [x] E2E test paths updated
- [x] Zero regressions

---

### Story 10.4: i18n Scan + UX/Code Quality Quick Wins
**Priority:** 🟡 MEDIUM  
**Estimate:** 4h  
**Story Doc:** 📄 [10-4-i18n-chinese-string-scan.md](10-4-i18n-chinese-string-scan.md)  
**Status:** 🔴 Not Started  
**Dependencies:** None

**Quick Summary:** As a developer, I want all Chinese strings replaced with English, UX audit quick wins resolved, and CI/ESLint gaps fixed.

**Key Deliverables:**
- [ ] Global scan for Chinese characters (\u4E00-\u9FFF)
- [ ] Replace `window.alert()` with `toast.error()` (🎨 UX Audit)
- [ ] Remove `console.log` from BadgeDetailModal (🎨 UX Audit)
- [ ] Fix Navbar `role="menubar"` ARIA misuse (🎨 UX Audit)
- [ ] Migrate ~30 backend `console.log` to NestJS Logger (🏗️ Arch Audit)
- [ ] Fix CI E2E job dependency on frontend-tests (TD-020)
- [ ] Downgrade/disable `react-hooks/set-state-in-effect` + remove 9 inline suppressions (TD-021)
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

### Story 10.6a: UI Walkthrough & Screenshot Baseline
**Priority:** 🔴 HIGH  
**Estimate:** 2h  
**Story Doc:** 📄 [10-6a-ui-walkthrough-screenshot-baseline.md](10-6a-ui-walkthrough-screenshot-baseline.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Phase 1 & 2 complete  
**Discovered:** Sprint Planning review (2026-02-09)

**Quick Summary:** Visual walkthrough of all pages across 4 roles before UAT. Establish screenshot baseline and verify UI matches UX specs.

**Key Deliverables:**
- [ ] 4-role UI walkthrough completed
- [ ] Screenshot baseline saved
- [ ] UI issues checklist (P0/P1/P2)
- [ ] Sign-off: UI acceptable for UAT

---

### Story 10.6b: Single Badge Issuance UI
**Priority:** 🔴 HIGH  
**Estimate:** 6h  
**Story Doc:** 📄 [10-6b-single-badge-issuance-ui.md](10-6b-single-badge-issuance-ui.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Phase 1 & 2 complete  
**Discovered:** Sprint Planning review (2026-02-09)

**Quick Summary:** Add frontend form for single badge issuance. Backend API already complete (Sprint 3). Fix IssuerDashboard "Issue New Badge" navigation.

**Key Deliverables:**
- [ ] IssueBadgePage component + route (`/admin/badges/issue`)
- [ ] API service function (`issueBadge()`)
- [ ] Dashboard navigation fix
- [ ] Unit tests (≥5)

---

### Story 10.6c: UAT Test Plan & Seed Data Preparation
**Priority:** 🔴 HIGH  
**Estimate:** 6h  
**Story Doc:** 📄 [10-6c-uat-test-plan-seed-data.md](10-6c-uat-test-plan-seed-data.md)  
**Status:** ✅ Accepted (2026-02-10)  
**Dependencies:** Stories 10.6a, 10.6b complete

**Quick Summary:** Create comprehensive UAT test plan covering all 10 Epics (including single issuance) with realistic seed data.

**Key Deliverables:**
- [x] UAT test plan (35 test cases)
- [x] Demo seed script (`npm run seed:uat`)
- [x] Test accounts (4 roles)
- [x] Known limitations document (5 items)

---

### Story 10.6d: Frontend Design System & UI Overhaul
**Priority:** 🔴 HIGH  
**Estimate:** 20h  
**Story Doc:** 📄 [10-6d-design-system-ui-overhaul.md](10-6d-design-system-ui-overhaul.md)  
**Status:** ✅ Accepted (re-accepted 2026-02-09 with visual proof)  
**Dependencies:** Story 10.6a complete  
**Discovered:** Story 10.6a UI Walkthrough (2026-02-09)

**Quick Summary:** Implement UX design specification: Inter font, Microsoft Fluent palette, Tailwind theme, PageTemplate component, fix all page layouts.

**Key Deliverables:**
- [ ] Design system foundation (font + theme + CSS variables + PageTemplate)
- [ ] All 4 Dashboard pages: clean grid layouts
- [ ] Admin pages: consistent table/form layouts
- [ ] Wallet + public pages: polished UI
- [ ] Mobile responsive maintained
- [x] All tests passing (0 regressions)

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
**Priority:** 🔴 HIGH  
**Estimate:** 20h (expanded from 8h — all 7 bugs MVP core)  
**Actual:** ~18h  
**Story Doc:** 📄 [10-8-uat-bug-fixes.md](10-8-uat-bug-fixes.md)  
**Status:** ✅ Accepted (2026-02-15)  
**Dependencies:** Story 10.7

**Quick Summary:** Fix all P0/P1 bugs discovered during UAT.

**Key Deliverables:**
- [x] All P0 bugs fixed
- [x] P1 bugs fixed or workaround documented
- [x] Regression tests added
- [ ] Re-run UAT passes

---

### Story 10.8b: UAT Skill Taxonomy Seed Data
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Story Doc:** 📄 [10-8b-uat-skill-taxonomy-seed.md](10-8b-uat-skill-taxonomy-seed.md)  
**Status:** 🔴 Not Started  
**Dependencies:** Story 10.8 (BUG-009 fix)

**Quick Summary:** Add SkillCategory + Skill seed data to UAT environment so skill taxonomy feature can be tested.

**Discovered:** Re-UAT Round 2 — PO noticed skill selector shows "No skills available". Sprint 2 implemented full skill taxonomy (5大分类 + 20子分类) but seed-uat.ts never included this data.

**Key Deliverables:**
- [ ] 5 system-defined SkillCategories + sub-categories in seed-uat.ts
- [ ] 6+ Skills with varying SkillLevel values
- [ ] 2+ UAT templates with skillIds linked to real Skills
- [ ] Frontend skill selector loads and works during UAT

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
| 10.1 | TD-017: tsc Test Type Errors + Password Reset Tx | 🔴 HIGH | 7.5h | 1-TD | 🔴 |
| 10.2 | ESLint Regression + CI Gate | 🔴 HIGH | 5h | 1-TD | 🔴 |
| 10.3 | TD-018: TODO/FIXME + UX Critical Fixes | 🔴 HIGH | 5h | 1-TD | 🔴 |
| 10.4 | i18n Scan + UX/Code Quality Quick Wins | 🟡 MED | 3h | 1-TD | 🔴 |
| 10.5 | Analytics: Mock → Real Data | 🟡 MED | 6h | 2-Feature | 🔴 |
| 10.6a | UI Walkthrough & Screenshot Baseline | 🔴 HIGH | 2h | 3-UAT | 🔴 |
| 10.6b | Single Badge Issuance UI | 🔴 HIGH | 6h | 2-Feature | ✅ |
| 10.6c | UAT Test Plan & Seed Data | 🔴 HIGH | 6h | 3-UAT | ✅ |
| 10.6d | Design System & UI Overhaul | 🔴 HIGH | 20h | 2-Feature | ✅ |
| 10.7 | Full UAT Execution | 🔴 HIGH | 4h | 3-UAT | ❗ UAT NOT PASSED |
| 10.8 | UAT Bug Fixes (7 bugs) | 🔴 HIGH | 20h | 3-UAT | ✅ |
| 10.8b | UAT Skill Taxonomy Seed | 🟡 MED | 1h | 3-UAT | 🔴 |
| 10.9 | Release Documentation | 🟡 MED | 4h | 4-Release | 🔴 |
| 10.10 | Merge + Tag v1.0.0 | 🔴 HIGH | 2h | 4-Release | 🔴 |
| **Total** | | | **86.5h** | | |

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
| 10.6a | 🟢 LOW | Self Review | Visual walkthrough — no code |
| 10.6b | 🟡 MEDIUM | AI Review + Self | Frontend feature — new component + route |
| 10.6c | 🟢 LOW | Self Review | Documentation + seed script |
| 10.6d | 🔴 HIGH | AI Review + Self | Major UI refactor — high regression risk |
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
Phase 3: 10.6a → 10.6b (parallel with 10.6d) → 10.6c → 10.7 → 10.8 (strict sequence)
            10.6a → 10.6d (can run parallel with 10.6b)
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
- Story 10.6b adds single issuance UI (testable)
- Story 10.6c adds seed data script (testable)
- Story 10.8 adds regression tests for any bugs found
- **Target: 1100+ tests at Sprint end**

### CI Gate Additions
- `tsc --noEmit` (Story 10.1)
- ESLint `max-warnings` gate (Story 10.2)

---

## Version Manifest

📄 See [version-manifest.md](version-manifest.md) for complete dependency versions.

---

## 🔍 Pre-Release Audit Results (2026-02-08)

Two release audits were conducted before Sprint 10 kickoff. All findings have been integrated into existing stories.

| Audit | Reviewer | Rating | Verdict | Report |
|-------|----------|--------|---------|--------|
| UX Release Audit | Sally 🎨 | 4.1/5 | APPROVE WITH CONDITIONS | [ux-release-audit-v1.0.0.md](ux-release-audit-v1.0.0.md) |
| Architecture Release Audit | Winston 🏗️ | 4.3/5 | APPROVE WITH CONDITIONS | [architecture-release-audit-v1.0.0.md](architecture-release-audit-v1.0.0.md) |

**Audit Findings → Story Mapping:**

| Finding | Severity | Mapped To | Est. |
|---------|----------|-----------|------|
| 9 dead Quick Action links | 🔴 P0 | Story 10.3 Task 11 | 1h |
| No 404 catch-all route | 🔴 P0 | Story 10.3 Task 12 | 0.5h |
| 8 hardcoded `localhost:3000` | 🔴 P0 | Story 10.3 Task 10 | 0.5h |
| `window.alert()` → `toast.error()` | 🟡 P1 | Story 10.4 Task 4 | 15min |
| `console.log` in BadgeDetailModal | 🟡 P2 | Story 10.4 Task 5 | 5min |
| Navbar `role="menubar"` misuse | 🟡 P1 | Story 10.4 Task 6 | 30min |
| ~30 backend `console.log` → Logger | 🟡 P2 | Story 10.4 Task 7 | 30min |
| Password reset non-transactional | 🟡 P1 | Story 10.1 Task 5 | 15min |
| `package.json` version → 1.0.0 | 🟢 P3 | Story 10.9 Task 6 | 5min |

**Total audit-sourced work:** ~3.5h (absorbed into existing stories, buffer reduced from 23h → 21h)

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

---

## � UAT 期间变更管理规则

**生效日期:** 2026-02-11（Re-UAT Round 2 起）  
**适用范围:** UAT 阶段发现的所有改动请求

### 判断标准

> **如果改动影响超过 2 个文件 且 涉及新 API 端点或数据库变更 → 先在 Post-MVP Backlog 记录再决定是否开工。否则直接修复。**

### 分类处理流程

| 改动类型 | 判断条件 | 处理方式 | 示例 |
|----------|----------|----------|------|
| **直接修复** | ≤ 2 文件，无新 API/DB 变更 | 在 Story 10.8 buffer 内直接修复 + commit | UI 文案修正、按钮样式、现有 API 逻辑调整 |
| **记录后修复** | > 2 文件 或 新 API 端点，但为 UAT 测试 blocker | 在 backlog.md 记录后立即修复，标注"UAT blocker" | Claim 页面 404、部门编辑功能 |
| **延后 Post-MVP** | 非 blocker 的新功能需求 | 记录到 Post-MVP Backlog (FEAT-00X)，不实现 | 用户自助编辑 Profile |
| **拒绝** | 超出 v1.0.0 范围且非 UAT blocker | 告知 PO 不在本 Sprint 处理 | — |

### 质量底线（所有改动必须满足）

- ✅ `npx prettier --check` 通过
- ✅ 现有测试全部 PASS（backend 534 + frontend 527）
- ✅ 有清晰的 commit message
- ✅ P0/P1 bug 不允许延后

---

## �📋 Post-MVP Backlog (Sprint 11+)

Items deferred from v1.0.0 release, to be addressed in subsequent sprints.

| ID | Item | Priority | Effort | Blocker | Notes |
|----|------|----------|--------|---------|-------|
| BUG-001 | Navbar "My Wallet" 标签指向 Dashboard (`/`) | 🔴 High | 1h | 无 | 导航首链接 `to="/"` 标签为 "My Wallet"，实际应为 "Dashboard"；且无链接指向 `/wallet`（真正钱包页）。Desktop Navbar + MobileNav 均受影响。发现于 10.6d 验收截屏审查。 |
| TD-006 | Teams Channel Permissions | 🟡 Medium | 1 day | Tenant admin approval for `ChannelMessage.Send` | 4 tests skipped; Email sharing functional as workaround. See [SKIPPED-TESTS-TRACKER.md](../../testing/SKIPPED-TESTS-TRACKER.md) |
| FEAT-001 | AI Agent 对话式集成层 | 🟢 Low | 3-5 days | 无 | 83 个 JSON API 已覆盖全部业务功能，可构建 Agent 中间层实现对话式操作 |
| FEAT-002 | 邀请式 Badge 发放（非注册用户） | 🟡 Medium | 2-3 days | 无 | 当前 Badge 发放仅限系统内已注册用户（DB 外键约束 + API 校验）。Open Badges 2.0 标准支持向任意邮箱发放，收件人通过邮件链接注册后认领。需改造：1) 新增 PendingBadge 模型或 Badge 状态扩展 2) 发放时支持输入任意邮箱 3) 邮件含认领链接 4) 注册/登录后自动关联 Badge。参考 Credly/Badgr 的 claim 流程。 |
| FEAT-003 | M365 同步自动角色映射 + Manager 团队层级 | 🟡 Medium | 3-4 days | 无 | 当前 M365 同步仅导入身份数据（name/email/department），所有新用户统一为 EMPLOYEE，角色需 Admin 手动分配。改进方案：1) 基于 Azure AD Security Group 映射（创建 GCredit-Issuers/GCredit-Managers 组，同步时查 `/memberOf`）2) 基于 `jobTitle` 关键词规则映射 3) 基于 `directReports` 自动识别 Manager。需新增角色映射配置表或 env 配置。Sprint 7 Decision #14 已讨论 directReports 方案。`jobTitle` 已在 Graph API `$select` 中但未使用。**关联决策：** 若采用 `directReports` 方案自动识别 Manager，需同时在 User 模型新增 `managerId` 外键建立显式上下级关系（当前仅靠 department 文本匹配模拟团队，Manager 无法精确管理自己的下属）。两者存在设计耦合：M365 同步自动写入 `managerId` vs Admin 手动指定 vs 混合模式，需在开发前做架构决策。 |
| FEAT-004 | 角色模型重构：Issuer 作为权限标签而非独立角色 | 🟡 Medium | 2-3 days | 无 | UAT-033 发现的架构问题。当前 4 角色互斥（ADMIN/ISSUER/MANAGER/EMPLOYEE），导致 Manager 无法同时具有发证权限。建议重构为：Role（Admin/Manager/Employee 三选一）+ Permission Flag（can_issue, can_revoke）。或多角色模型：用户可同时具有多个角色。需评估对 RBAC Guard、前端导航、API 权限检查的全面影响。**扩展点：** Issuer-based revocation — 颁发者始终有权撤销自己颁发的 badge，不受角色变化和部门限制（MVP 中 Manager 撤销仅基于当前部门匹配）。 |
| FEAT-005 | ~~用户自助编辑个人资料（Profile Self-Edit）~~ | — | — | — | **已实现。** 调查发现 `PATCH /api/auth/profile`（编辑 firstName/lastName）和 `POST /api/auth/change-password` 已存在，前端 ProfilePage 已有编辑表单和密码修改。Department 自行修改属于 FEAT-008 讨论范围。 |
| TD-007 | 统一 Azure Storage Service：合并 StorageService 与 BlobStorageService | 🟡 Medium | 0.5-1 day | 无 | 当前存在两个独立的 Azure Blob Storage 服务：`StorageService`（全局，处理 badges+evidence 上传/下载/SAS）和 `BlobStorageService`（仅 BadgeTemplatesModule，处理图片验证/sharp 元数据/缩略图）。两者都连接 badges 容器，职责重叠。建议将 `BlobStorageService` 的图片处理能力（sharp 验证、尺寸检查、缩略图生成）合并到 `StorageService`，消除重复连接和职责不清的架构问题。发现于 Sprint 10 UAT 期间（BlobStorageService 环境变量加载时序 bug 排查时）。 |
| FEAT-006 | Badge Template 管理增强：Category 可配置 + Skill/Category 管理 UI | 🟢 Low | 3-4 days | 无 | **Category 可配置：** 当前 template category 是硬编码 4 个值（achievement/skill/certification/participation），前后端都写死。需改为数据库驱动，支持 Admin 增删改 category。**Skill 管理 UI：** 后端已有完整的 Skills + SkillCategories CRUD API（`/api/skills`、`/api/skill-categories`），但无前端管理页面。需新增 Admin Skills 管理页（CRUD + 分类树 + 拖拽排序）。两者均属于 template 创建体验的增强，建议合并开发。PO 提出于 Re-UAT Round 2 UAT-008 测试期间。 |
| FEAT-007 | Session 管理增强：集中化 HTTP Client + 自动 Token 刷新 + 闲置超时 | 🟡 Medium | 2-3 days | 无 | **v1.0.0 已实现基础：** App 启动时检查 Access Token 过期 → 尝试 Refresh Token 换新 → 失败则自动 Logout。**Post-MVP 增强：** 1) 集中化 HTTP Client（替换各 hook/page 零散的 `localStorage.getItem('accessToken')` + `fetch` 调用）2) 全局 401 Interceptor：API 返回 401 时自动尝试 refresh → 重试原请求 → 失败则 logout 3) 闲置超时自动 Logout（如 30 分钟无操作，`visibilitychange` + idle timer）4) Token 刷新队列（多个并发请求同时 401 时只发一次 refresh）。发现于 Re-UAT Round 2，PO 反馈用户关闭浏览器后再开会跳过登录直接进入。 |
| FEAT-008 | 用户管理功能完善：手动添加用户 + M365 同步 UI + 密码重置 + 导航修复 | 🔴 High | 5-8 days | FEAT-003 | **全面审计发现以下缺口（按优先级排序）：** **P0 — 导航修复（0.5天）：** User Management 页面缺少导航入口，Desktop Navbar 和 Mobile Nav 均无链接，仅能通过 Admin Dashboard 卡片或直接输入 `/admin/users` 访问。**P1 — M365 同步前端 UI（2-3天）：** 后端 4 个 API 完全就绪（`POST /api/admin/m365-sync` 触发同步、`GET /logs` 历史记录、`GET /logs/:id` 详情、`GET /status` 集成状态），但前端零代码。需新建：M365SyncPage（触发同步 + 进度显示 + 同步历史列表 + 集成状态检查）+ App.tsx 路由 + 导航入口。**P2 — 密码重置前端（1-2天）：** 后端 `POST /api/auth/request-reset` 和 `POST /api/auth/reset-password` 已实现，但前端无"忘记密码？"链接、无 ForgotPasswordPage、无 ResetPasswordPage。**P3 — 管理员手动创建用户（1-2天）：** 前后端均缺。需新增 `POST /api/admin/users` + `CreateUserDto`（含角色指定）+ AdminUserManagementPage 添加"Add User"按钮 + CreateUserModal。**P4 — 用户自注册页面（0.5天）：** 后端 `POST /api/auth/register` 已存在（固定 EMPLOYEE 角色），前端无注册页面，LoginPage 仅显示"Contact admin"。需评估是否开放自注册（安全策略决策）。**P5 — 角色变更审计查看（1天）：** 后端已记录到 UserRoleAuditLog 表，但前端无 UI 查看。可在 User 详情中展示角色变更历史。**关联项：** FEAT-003（M365 同步角色映射）是 M365 同步功能的增强，建议先实现 P1 基础 UI 后再叠加。发现于 Re-UAT Round 2，PO 审查 User Management 页面时提出。 |

### FEAT-001: AI Agent Integration Layer
**产品方向：** 用户通过与 AI Agent 对话完成所有系统功能

**现状评估（v1.0.0）：**
- 88 个 API 端点中 83 个返回 JSON，天然适合 Agent 调用
- RESTful 设计 + JWT 认证，Agent 可直接调用
- 覆盖：认证、发证、模板管理、批量操作、分享、分析、管理等全部业务

**需要构建的能力：**
1. **Agent 中间层**（MCP Server 或 Function Calling Schema）— 意图识别→API 映射
2. **多步骤工作流编排** — 如"创建模板→发证→分享到 Teams"串联操作
3. **文件处理适配** — 模板上传（multipart）、CSV 批量导入、PNG/CSV 下载转发
4. **会话状态管理** — 对话上下文、操作确认、结果反馈
5. **实时通知机制** — SSE/WebSocket 支持异步任务完成通知（如批量导入完成）
6. **安全 Token 代理** — Agent 代表用户操作的权限边界控制

**典型对话场景：**
- "给张三发一个 Azure 认证徽章" → `POST /api/badges`
- "我有哪些徽章？" → `GET /api/badges/my-badges`
- "本月发证趋势如何？" → `GET /api/analytics/issuance-trends`
- "批量导入这个名单" → `POST /api/badges/bulk`
- "把我的徽章分享到 Teams" → `POST /api/badges/:id/share/teams`

### TD-006 Resolution Steps
1. Submit `ChannelMessage.Send` permission request to tenant admin
2. Wait for admin approval (external dependency)
3. Re-enable 4 skipped Teams integration tests
4. Run full Teams sharing E2E validation
5. Update SKIPPED-TESTS-TRACKER.md → mark resolved
6. Update project-context.md → TD-006 status to ✅ Resolved

---

**Last Updated:** 2026-02-08  
**Status:** Planning Complete  
**Template Version:** Based on sprint-backlog-template.md v1.2
