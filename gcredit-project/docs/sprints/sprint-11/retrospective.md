# Sprint 11 Retrospective — Security & Quality Hardening

**Sprint:** Sprint 11  
**Date:** 2026-02-14  
**Facilitator:** SM Agent (Bob)  
**Result:** ✅ 24/25 stories delivered across 6 waves, 1,301 tests, 0 regressions (Story 11.25 pending acceptance)

---

## ✅ What Went Well

### 1. Wave-Based Execution Model Was Highly Effective
- 23 stories organized into 5 thematic waves (Quick Wins → Security → Cross-cutting → Tests → Polish)
- Each wave had a self-contained dev prompt → code review → acceptance cycle
- **Result:** Zero context switching confusion despite 23 diverse stories
- **Recommendation:** Continue wave-based execution for large sprints (>10 stories)

### 2. Code Review Quality Was Consistently High
- All 5 waves received **APPROVED** on first review — no rework rounds
- Code review caught important issues early (e.g., ESLint scope in Wave 2, Lesson 35)
- Structured review prompts (checklists per story) ensured nothing was missed
- **Impact:** Zero post-merge bugs discovered

### 3. Test Count Growth Was Impressive (+202 tests, +19%)
- From 1,061 → 1,263 tests with 0 regressions across all 5 waves
- Wave 4 alone added 132 tests (3 service test suites from 0% → 90%+)
- Test trajectory tracking per wave provided clear visibility
- **Key insight:** Service test suites (11.10-11.12) were the highest-value stories for long-term quality

### 4. Security Posture Dramatically Improved
- Addressed all 2 HIGH findings from security audit (localStorage JWT → httpOnly Cookie, account lockout)
- Added defense-in-depth layers: magic-byte validation, PII sanitization, HTML sanitization, email masking
- **Result:** All P0 security findings from post-MVP audit resolved

### 5. Developer Experience Tooling Pays Dividends
- Husky pre-push hook (Story 11.22) catches issues locally before CI
- This was validated immediately — when pushing the Wave 5 code review prompt, Husky ran the full test suite
- **Impact:** Will prevent Lesson 40-type CI failures going forward

---

## ⚠️ What Could Be Improved

### 1. CI Failure Loop in Wave 2 (Lesson 40)
- 4 consecutive CI failures after Wave 2 push because local checks didn't mirror CI
- **Root cause:** Developer ran individual file linting instead of `npm run lint` (full scope)
- **Resolution:** Story 11.22 (Husky pre-push) now automates this, but the lesson stands
- **Action:** Lesson 40 documented, Husky pre-push prevents recurrence

### 2. Wave Sizing Could Be More Even
- Wave 4 was the largest (5 stories, +132 tests) while Wave 1 was smallest (5 stories but trivial)
- Wave 4 consumed more review/acceptance time proportionally
- **Suggestion:** For future sprints, aim for more even wave sizes (4-5 stories each, similar complexity)

### 3. Some Story Estimates Were Off
- Stories like 11.15 (Design System Consistency) estimated at 2-3h but involved significant Tailwind migration across multiple components
- Stories 11.10-11.12 (service test suites) were estimated at 3h each but delivered 90%+ coverage exceeding expectations
- **Observation:** Quality/refactoring stories are harder to estimate than feature stories

### 4. No UAT in Sprint 11
- Sprint 11 made significant security and UI changes that affect user-facing flows
- httpOnly Cookie migration changed the entire auth flow
- Navigation fixes, 403 page, export button — all user-visible
- **Action:** Full UAT planned for Sprint 12 kickoff (already decided)

---

## 🎯 Action Items for Next Sprint

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Execute comprehensive UAT before merging to main | SM + Dev | 🔴 P0 |
| 2 | Create Playwright-based regression test suite | Dev | 🟡 P1 |
| 3 | Plan Sprint 12 scope (FEAT-008, FR27, pilot prep) | SM + PO | 🟡 P1 |
| 4 | Resolve 6 PO decisions (DEC-001 through DEC-006) | PO | 🟡 P1 |
| 5 | Investigate remaining 12 inline styles (Recharts/dynamic) | Dev | 🟢 P2 |
| 6 | Add wave size guidelines to sprint planning template | SM | 🟢 P2 |

---

## 📚 Lessons Learned (Sprint 11)

### Lesson 35: ESLint Must Lint Full `src/` Directory
- Running `npx eslint src/file.ts` misses project-wide configuration issues
- Always use `npm run lint` which lints the entire `src/` directory
- CI gate catches this, but catching locally saves 10-15 min per round-trip

### Lesson 40: Local Pre-Push Checks Must Mirror CI Pipeline
- 4 consecutive CI failures because local checks only covered 1-2 of 4 CI steps
- Solution: Husky pre-push hook (Story 11.22) runs full CI mirror locally
- Key takeaway: **Partial checks = false confidence**

### Lesson 41: Wave-Based Execution Handles Large Sprints Well
- 23 stories in 1 sprint could have been chaotic
- Grouping by theme (security → quality → features → DX) reduced context switching
- Each wave's code review provided a natural quality gate
- **Recommendation:** Use waves for any sprint with >10 stories

### Lesson 42: Service Test Suites Are High-Value Technical Debt Items
- Stories 11.10-11.12 added 90%+ coverage to 3 critical services previously at 0%
- These tests caught edge cases that manual testing would miss
- **ROI:** Each test suite took ~3h but provides ongoing regression safety for critical business logic

### Lesson 43: API Response Contract Changes Require E2E Impact Check
- Story 11.25 removed `accessToken`/`refreshToken` from login response body (tokens → httpOnly cookies only)
- All local checks passed (756 unit + 551 FE tests + lint + tsc + build), but **121/158 E2E tests failed in CI**
- Root cause: Unit tests mock the service layer, so they never see controller response shape changes. E2E tests can't run locally (need Postgres container)
- **Fix:** Updated E2E helper `createAndLoginUser()` to extract JWT from `Set-Cookie` header instead of `response.body`
- **Key takeaway:** When modifying controller return values, always `grep test/` for consumers of changed fields before committing
- **Action items:**
  1. [SM] Dev prompts involving API response changes must include an "E2E Impact Assessment" checklist (grep `test/` for field consumers)
  2. [Dev] Consider adding auth contract smoke test runnable without DB (decorator metadata pattern)
  3. [SM/Dev] Evaluate adding optional E2E smoke test to pre-push (run if local DB detected, skip otherwise)
- **Full analysis:** `gcredit-project/docs/lessons-learned/lessons-learned.md` (Lesson 43)

---

## 📊 Sprint Metrics

| Metric | Sprint 10 | Sprint 11 | Change |
|--------|-----------|-----------|--------|
| Stories | 12 | 23 | +92% |
| Tests | 1,061 | 1,263 | +202 (+19%) |
| BE Tests | 534 | 722 | +188 (+35%) |
| FE Tests | 527 | 541 | +14 (+3%) |
| ESLint Errors | 0 | 0 | Maintained |
| ESLint Warnings | 0 | 0 | Maintained |
| tsc Errors | 0 | 0 | Maintained |
| Security HIGHs | 2 | 0 | -2 ✅ |
| Code Review Rounds | 1 (Sprint) | 5 (Waves) | More granular |

---

## Velocity

| Sprint | Stories | Estimated | Completed | Accuracy |
|--------|---------|-----------|-----------|----------|
| Sprint 10 | 12/12 | 95h | 109h | 87% |
| Sprint 11 | 23/23 | 51.5-65.5h | ~60h | ~92-100% |

---

**Created:** 2026-02-14  
**Updated:** 2026-02-15 (Lesson 43 added from Story 11.25 E2E incident)  
**Author:** SM Agent (Bob)  
**Next Review:** Sprint 12 Planning
