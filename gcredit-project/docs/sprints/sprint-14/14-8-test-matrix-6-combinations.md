# Story 14.8: 6-Combination Test Matrix

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 2h  
**Wave:** 4 — Testing + Design Tokens  
**Source:** ADR-017 §7  
**Depends On:** 14.2, 14.3, 14.4, 14.5, 14.6, 14.7

---

## Story

**As a** QA engineer,  
**I want** all 6 valid role×manager combinations verified,  
**So that** the dual-dimension model is fully validated before Sprint 15 UI work begins.

## Acceptance Criteria

1. [ ] Test matrix executed — all 6 combinations:

| # | Permission Role | isManager | Dashboard | Team Access | Issue Access | Admin Access |
|---|----------------|-----------|-----------|-------------|-------------|-------------|
| 1 | EMPLOYEE | false | ✅ | ❌ | ❌ | ❌ |
| 2 | EMPLOYEE | true | ✅ | ✅ | ❌ | ❌ |
| 3 | ISSUER | false | ✅ | ❌ | ✅ | ❌ |
| 4 | ISSUER | true | ✅ | ✅ | ✅ | ❌ |
| 5 | ADMIN | false | ✅ | ✅* | ✅ | ✅ |
| 6 | ADMIN | true | ✅ | ✅ | ✅ | ✅ |

*ADMIN bypasses ManagerGuard

2. [ ] JWT backward compatibility: old tokens (without `isManager`) work with `isManager=false` fallback
3. [ ] Migration test: MANAGER users → EMPLOYEE with directReports preserved
4. [ ] M365 sync test: user in Issuers group + has directReports → ISSUER role + isManager=true
5. [ ] Full regression: all 1,708+ tests pass

## Tasks / Subtasks

- [ ] **Task 1: Create 6-combination test suite** (AC: #1)
  - [ ] Create test file (backend): test all 6 role×manager combinations
  - [ ] For each combination, verify:
    - Dashboard access (all should have it)
    - Team management access (only isManager=true or ADMIN)
    - Badge issuance access (only ISSUER or ADMIN)
    - Admin panel access (only ADMIN)
  - [ ] Use real JWT tokens with correct claims
- [ ] **Task 2: JWT backward compatibility test** (AC: #2)
  - [ ] Create JWT without `isManager` field
  - [ ] Verify system treats it as `isManager: false`
  - [ ] Verify no 500 errors or crashes
  - [ ] Verify graceful degradation (features accessible to non-managers)
- [ ] **Task 3: Migration verification test** (AC: #3)
  - [ ] Create test users with MANAGER role (pre-migration state)
  - [ ] Run migration
  - [ ] Verify: role changed to EMPLOYEE
  - [ ] Verify: directReports relationships intact
  - [ ] Verify: managerId foreign keys preserved
- [ ] **Task 4: M365 sync integration test** (AC: #4)
  - [ ] Mock M365 response: user in Issuers security group + has directReports
  - [ ] Run sync
  - [ ] Verify: role = ISSUER (from group membership)
  - [ ] Verify: isManager = true (from directReports count > 0)
  - [ ] Verify: the two dimensions are independent
- [ ] **Task 5: Full regression** (AC: #5)
  - [ ] Run all backend tests: `npm test` in backend/
  - [ ] Run all frontend tests: `npm test` in frontend/
  - [ ] Verify: 1,708+ tests pass (0 regressions)
  - [ ] Report exact test count

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
### Completion Notes
### File List

## Retrospective Notes
