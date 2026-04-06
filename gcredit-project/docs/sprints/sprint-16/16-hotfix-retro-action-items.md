# Story 16-HF: Sprint 16 Retrospective Action Items Hotfix

Status: draft

## Story
As a **developer maintaining the G-Credit test suite**,
I want **Sprint 16 retrospective action items resolved before Pilot phase**,
So that **test reliability is hardened and no known flaky patterns carry into production**.

## Background
Sprint 16 retrospective (2026-03-13) identified 4 action items. These are small, focused fixes that should be completed as a hotfix batch before formally closing Sprint 16 and entering Pilot.

**Reference:** [Sprint 16 Retrospective](./retrospective.md) — Action Items for Sprint 17

---

## Scope: 4 Tasks

### Task 1: Noon UTC Test Date Fixtures (HIGH)
**Lesson 56:** Test dates at `T00:00:00Z` (midnight UTC) can roll back a day in UTC-negative timezones when production code uses `toLocaleDateString()`. Replace with `T12:00:00Z` (noon UTC).

**Scope:** 11 files, 22 occurrences
- `backend/test/badge-integrity.e2e-spec.ts` (1)
- `frontend/src/hooks/__tests__/useAnalytics.test.tsx` (1)
- `frontend/src/hooks/useAdminUsers.test.tsx` (1)
- `frontend/src/lib/__tests__/analyticsApi.test.ts` (1)
- `frontend/src/lib/__tests__/badgeTemplatesApi.test.ts` (2)
- `frontend/src/lib/badgesApi.test.ts` (2)
- `frontend/src/pages/ProfilePage.test.tsx` (1)
- `frontend/src/pages/VerifyBadgePage.test.tsx` (6)
- `frontend/src/pages/admin/BadgeManagementPage.test.tsx` (3)
- `frontend/src/pages/admin/BadgeTemplateFormPage.test.tsx` (2)
- `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx` (2)

**Acceptance Criteria:**
- [x] All `T00:00:00Z` in test files replaced with `T12:00:00Z`
- [x] All 1,849 tests still pass
- [x] `useBadgeSearch.test.ts` timezone failure is resolved (pre-existing)

### Task 2: Fix `useBadgeSearch.test.ts` Timezone Failure (HIGH)
**File:** `frontend/src/hooks/useBadgeSearch.test.ts`

The mock data already uses `T12:00:00.000Z` (line 14), so this may be a date comparison issue in the `date range filter` test block (lines 139-161). The test uses `new Date('2025-01-05')` without explicit time, which defaults to midnight UTC — causing timezone-dependent failures in the date range boundary comparison.

**Acceptance Criteria:**
- [ ] Identify and fix the timezone-sensitive date comparison
- [ ] Test passes in UTC-negative timezones (e.g., `TZ=America/New_York vitest`)
- [ ] No regression in other tests

### Task 3: Create `useFormGuard.test.ts` (MEDIUM)
**File to create:** `frontend/src/hooks/__tests__/useFormGuard.test.ts`

**Test coverage needed:**
- `isDirty=false` → `isBlocked=false`, no interception
- `isDirty=true` + `pushState` → `isBlocked=true`
- `proceed()` → executes pending navigation + dispatches `PopStateEvent`
- `reset()` → clears blocked state, discards pending navigation
- `isDirty` transitions (true→false) clear blocked state
- `beforeunload` event prevention when dirty

**Source:** `frontend/src/hooks/useFormGuard.ts` (120 lines, Story 15.12)

**Acceptance Criteria:**
- [ ] Test file created with ≥6 test cases covering proceed/reset/popstate/beforeunload flows
- [ ] Tests pass in CI (vitest)
- [ ] No regression

### Task 4: PowerShell Smoke Test Syntax Validation (MEDIUM)
**Context:** `pilot-smoke-test.ps1` had 3 syntax bugs discovered at runtime during Sprint 16 UAT — JS `//` operator used instead of PS `#`, `$pid` reserved variable, wrong verify response assertion.

**Acceptance Criteria:**
- [ ] Verify `pilot-smoke-test.ps1` syntax bugs are already fixed (check current file)
- [ ] If not fixed, apply fixes
- [ ] Add a comment header documenting PS syntax check command: `powershell -NoProfile -Command "& {Get-Content script.ps1 | Out-Null}"`

---

## Estimates
| Task | Effort |
|------|--------|
| Task 1: Noon UTC dates | 0.5h |
| Task 2: useBadgeSearch timezone | 0.5h |  
| Task 3: useFormGuard tests | 1.5h |
| Task 4: PS smoke test validation | 0.5h |
| **Total** | **3h** |

## Dev Notes

### Branch Strategy
```
git checkout -b hotfix/sprint-16-retro-actions main
```

### Commit Strategy
One commit per task, squash on merge:
- `fix(test): use noon UTC dates in test fixtures (Lesson 56)`
- `fix(test): resolve useBadgeSearch timezone failure`
- `test: add useFormGuard hook tests`
- `fix(scripts): validate pilot smoke test PS syntax`

### Testing
```bash
# Backend
cd backend && npm test -- --forceExit

# Frontend  
cd frontend && npm test

# Specific files
cd frontend && npx vitest run src/hooks/useBadgeSearch.test.ts
cd frontend && npx vitest run src/hooks/__tests__/useFormGuard.test.ts
```

### Merge
After all tasks pass: merge to `main`, tag as `v1.6.1`, update project-context.md.
