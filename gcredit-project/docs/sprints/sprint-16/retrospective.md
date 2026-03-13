# Sprint 16 Retrospective

**Sprint Number:** Sprint 16
**Sprint Name:** F-1 RBAC Issuer Template Ownership + Pilot Readiness
**Version:** v1.6.0
**Date:** 2026-03-13
**Participants:** LegendZhu, SM Agent (Bob)

---

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 5 |
| Stories Completed | 5 (100%) |
| Estimated Hours | 12h |
| Commits | 24 |
| Tests (Total) | 1,849 (BE 1,000 + FE 849) |
| Tests Added | +14 (1,835 → 1,849) |
| Sprint 16 New Automated Tests | 34 (ownership guards + E2E) |
| Test Pass Rate | 100% (1,849/1,849) |
| UAT | 26/26 PASS (100%) |
| Bugs Found in UAT | 4 |
| Bugs Fixed in UAT | 4 |
| Branch | sprint-16/f1-rbac-pilot-readiness |

---

## What Went Well ✅

### 1. RBAC Ownership Guard Pattern Is Clean and Reusable
The ARCH-P1-004 approach (inject `creatorId` at service layer, auto-detect from JWT) works seamlessly across issuance, list filtering, and edit/delete operations. The same guard pattern was applied to 3 stories (16.1, 16.2, 16.3) with consistent behavior: ISSUER = own only, ADMIN = bypass. Zero architectural debates.

### 2. Pilot Seed Data Enabled Proper Cross-Issuer Testing
Creating `seed-pilot.ts` with 3 Issuers, 10 Employees and deterministic UUID prefixes (`b000-*`) was critical for scripted API testing. Without it, the seed-uat data (single ISSUER) couldn't test ownership isolation. The `b000` prefix convention made debugging straightforward.

### 3. Four-Phase UAT Structure Was Comprehensive
Phase 1 (automated) → Phase 2 (scripted API) → Phase 3 (manual UI) → Phase 4 (pilot readiness) covered all angles. Phases 1/2/4 were agent-automated, Phase 3 was user-driven — good division of labor. The 26-test plan caught 4 bugs that automated tests couldn't.

### 4. UAT Bug Fixes Were Surgical
All 4 bugs found during UAT were small, focused fixes:
- `useFormGuard` navigation not completing (popstate dispatch)
- Template selector missing clear button (UX improvement)
- Sync Roles button styling too subtle (visual design)
- Timezone test dates using midnight UTC (pre-existing)

---

## What Could Be Improved 🔧

### 1. Timezone Test Dates Should Be Noon UTC by Default
Two test files used `T00:00:00Z` (midnight UTC) which breaks in UTC-negative timezones due to `toLocaleDateString()`. Using `T12:00:00Z` (noon UTC) ensures dates remain correct within ±12h of UTC. This was a pre-existing issue but Sprint 16 should have caught it during the ownership guard E2E tests.

### 2. Smoke Test Script Should Be Validated Before UAT
`pilot-smoke-test.ps1` had 3 bugs (`//` JS operator in PS, `$pid` reserved variable, wrong verify response assertion). These were discovered at test runtime. **Action:** Add a PS syntax check (`powershell -NoProfile -Command "& {Get-Content script.ps1 | Out-Null}"`) or a dry-run step before executing scripts in UAT.

### 3. Form Guard Testing Gap
`useFormGuard` had no dedicated test file — the navigation-complete bug was only caught by manual UI testing. **Action:** Add `useFormGuard.test.ts` covering the proceed/reset/popstate flows.

---

## Action Items for Sprint 17

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Use `T12:00:00Z` (noon UTC) for all test date fixtures | Dev | HIGH |
| 2 | Add PS lint/parse validation step before script execution | SM | MEDIUM |
| 3 | Create `useFormGuard.test.ts` with proceed/reset tests | Dev | MEDIUM |
| 4 | Fix pre-existing `useBadgeSearch.test.ts` timezone failure | Dev | HIGH |

---

## Lessons Learned

### Lesson 56: Use Noon UTC for Test Date Fixtures
When production code uses `toLocaleDateString()` or `Intl.DateTimeFormat`, test dates at `T00:00:00Z` (midnight UTC) can roll back a day in UTC-negative timezones. Always use `T12:00:00Z` to ensure the date is correct within ±12h of UTC. This applies to any test that later formats a date for human display.

### Lesson 57: React Router Needs PopState After History.pushState
When intercepting navigation via `history.pushState` overrides (e.g., form dirty guards), calling the original `pushState` updates the URL but React Router remains on the old route. Dispatching `new PopStateEvent('popstate')` after the pushState notifies React Router to re-sync its internal state with the browser URL.

### Lesson 58: PowerShell Reserved Variables in Loops
`$pid` is a read-only automatic variable in PowerShell (current process ID). Using it as a loop variable (`foreach ($pid in $list)`) causes "Cannot overwrite variable PID because it is read-only" errors. Always use descriptive loop variable names like `$tmplId`, `$itemId`, etc.

---

## Sprint 16 → Sprint 17 Handoff

### Completed in Sprint 16
- F-1 Level 1: Issuer template ownership isolation (issuance, list, edit/delete)
- Pilot seed data + smoke test
- UAT 26/26 PASS

### Carried Forward / Backlog
- 15.6 Forgot Password (deferred from Sprint 15)
- QR code on verification page (observed missing during UAT R11)
- `useFormGuard.test.ts` (testing gap)
- `useBadgeSearch.test.ts` timezone fix

### Prerequisites for Sprint 17
- Sprint 16 merged to `main` and tagged `v1.6.0`
- All 1,849 tests passing on `main`

---

**Created:** 2026-03-13
**Created By:** SM Agent (Bob)
