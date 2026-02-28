# Story 14.8: 6-Combination Test Matrix

**Status:** done  
**Priority:** HIGH  
**Estimate:** 2h  
**Wave:** 4 — Testing + Design Tokens  
**Source:** ADR-017 §7  
**Depends On:** 14.2, 14.3, 14.4, 14.7

**Partial Work Note:** Story 14.2 (commit `25c0ae3`) updated `test/factories/user.factory.ts` — `createManager()` now creates EMPLOYEE + subordinate (ADR-017 pattern), `createTestTeam()` links employees via `managerId`. E2E test helpers now support the dual-dimension model. Dependencies 14.5 and 14.6 are done (absorbed into 14.2).

---

## Story

**As a** QA engineer,  
**I want** all 6 valid role×manager combinations verified,  
**So that** the dual-dimension model is fully validated before Sprint 15 UI work begins.

## Acceptance Criteria

1. [x] Test matrix executed — all 6 combinations:

| # | Permission Role | isManager | Dashboard | Team Access | Issue Access | Admin Access |
|---|----------------|-----------|-----------|-------------|-------------|-------------|
| 1 | EMPLOYEE | false | ✅ | ❌ | ❌ | ❌ |
| 2 | EMPLOYEE | true | ✅ | ✅ | ❌ | ❌ |
| 3 | ISSUER | false | ✅ | ❌ | ✅ | ❌ |
| 4 | ISSUER | true | ✅ | ✅ | ✅ | ❌ |
| 5 | ADMIN | false | ✅ | ✅* | ✅ | ✅ |
| 6 | ADMIN | true | ✅ | ✅ | ✅ | ✅ |

*ADMIN bypasses ManagerGuard

2. [x] JWT backward compatibility: old tokens (without `isManager`) work with `isManager=false` fallback
3. [~] Migration test: N/A — MANAGER role already removed from enum in 14.2; no migration path exists
4. [~] M365 sync test: N/A — M365 sync E2E depends on external Graph API; covered by existing m365-sync.e2e-spec.ts
5. [x] Full regression: backend unit 932/932 ✅, frontend 794/794 ✅, role-matrix E2E 29/29 ✅

## Tasks / Subtasks

- [x] **Task 1: Create 6-combination test suite** (AC: #1)
  - [x] Create test file: `backend/test/role-matrix.e2e-spec.ts`
  - [x] All 6 combinations verified with real JWT tokens
  - [x] 24 endpoint tests across 4 access dimensions
- [x] **Task 2: JWT backward compatibility test** (AC: #2)
  - [x] JWT signed without `isManager` field via JwtService.sign()
  - [x] System treats as `isManager: false` (403 on /manager-only, 200 on /profile)
  - [x] No 500 errors or crashes
- [~] **Task 3: Migration verification test** (AC: #3)
  - N/A — MANAGER role removed from Prisma enum in 14.2; no migration code exists to test
- [~] **Task 4: M365 sync integration test** (AC: #4)
  - N/A — M365 sync depends on external Graph API; existing m365-sync E2E covers this
- [x] **Task 5: Full regression** (AC: #5)
  - [x] Backend unit: 51 suites, 932 passed (4 skipped)
  - [x] Frontend: 77 suites, 794 passed
  - [x] Role-matrix E2E: 29 passed
  - [x] Total: 1,755 tests (932 + 794 + 29), 0 regressions

## Dev Notes

### Architecture Patterns Used
- Test matrix verification (combinatorial testing)
- JWT claim-based authorization testing
- Data migration verification testing

### Source Tree Components
- `backend/test/` or `backend/src/**/*.spec.ts` — new test suite
- All guard files (RolesGuard, ManagerGuard) — tested indirectly

### Testing Standards
- All 6 combinations must pass — no partial acceptance
- Backward compatibility is non-negotiable
- Full regression must show 0 regressions (≥1,708 tests)

### References
- ADR-017 §7 — Test matrix specification
- ADR-017 §7 Table — Expected access matrix

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Created `role-matrix.e2e-spec.ts` with 29 tests covering all 6 role×manager combos
- All user creation + login consolidated in single `beforeAll` to stay within auth rate limit (5 logins/min)
- Combo #6 uses `JwtService.sign()` with `isManager: true` to avoid exceeding rate limit
- JWT backward compatibility verified using token without `isManager` claim
- Dashboard endpoint matrix tests reuse existing combo tokens
- AC #3 (migration) and AC #4 (M365 sync) marked N/A — MANAGER role enum already removed; M365 sync requires external infra

### File List
- `backend/test/role-matrix.e2e-spec.ts` — NEW (29 tests)

## Retrospective Notes
