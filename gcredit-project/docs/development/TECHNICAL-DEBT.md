# Technical Debt Tracking

**Last Updated:** 2026-01-28  
**Status:** Active

This document tracks known technical debt across the G-Credit project. Items are prioritized and linked to relevant issues/sprints for future resolution.

---

## 🔴 High Priority

### TD-001: E2E Test Suite Isolation Issues

**Identified:** Sprint 5 (2026-01-28)  
**Impact:** High - Tests fail when run in parallel  
**Effort:** Medium (8-12 hours)

**Description:**

E2E test suites experience race conditions and database conflicts when run concurrently:

1. **Foreign Key Constraint Violations** in `afterAll()` cleanup
   - `badge-verification.e2e-spec.ts` fails on `badgeTemplate.deleteMany()`
   - Error: `Foreign key constraint violated on badges_templateId_fkey`
   - Root cause: Multiple test suites deleting shared data simultaneously

2. **Cleanup Order Dependencies**
   - Tests must delete in order: evidenceFiles → badges → badgeTemplates → users
   - Current cleanup doesn't respect foreign key cascade order

3. **Test Data Contamination**
   - Tests share database state when run in parallel
   - `badge-integrity.e2e-spec.ts` test expects badge but finds null after cleanup

**Impact on Sprint 5:**
- All new Story 6.x tests pass individually ✅
- Full test suite has 13 failed tests due to concurrency issues
- Functional code is correct; only test infrastructure affected

**Reproduction:**
```bash
npm run test:e2e  # Fails with FK violations and timeouts
npm run test:e2e -- --testNamePattern="Story 6.4"  # Passes ✅
```

**Proposed Solutions:**

**Option A: Sequential Test Execution** (Quick fix - 2h)
- Update `test/jest-e2e.json` with `maxWorkers: 1`
- Pros: Immediate fix, no test changes
- Cons: Slower CI/CD pipeline

**Option B: Test Database Transactions** (Proper fix - 8h)
- Wrap each test suite in database transaction
- Rollback after each suite instead of manual cleanup
- Pros: True isolation, faster execution
- Cons: Requires refactoring all E2E tests

**Option C: Test Data Factory** (Best practice - 12h)
- Implement factory pattern for test data creation
- Use unique prefixes/UUIDs per test suite
- Cascade delete helper utility
- Pros: Robust, maintainable, parallel-safe
- Cons: More upfront work

**Recommended:** Option B (database transactions) + Option C (factory pattern) in Sprint 6

**Files Affected:**
- `test/badge-verification.e2e-spec.ts`
- `test/badge-integrity.e2e-spec.ts`
- `test/badge-issuance.e2e-spec.ts`
- `test/badge-templates.e2e-spec.ts`
- `test/baked-badge.e2e-spec.ts`

**Workaround:**
Use `--testNamePattern` to run test suites individually until fixed.

---

### TD-002: Badge Issuance E2E Test Regressions

**Identified:** Sprint 5 (2026-01-28)  
**Impact:** Medium - Some existing tests fail after metadataHash addition  
**Effort:** Small (2-4 hours)

**Description:**

After implementing Story 6.5 (metadata integrity), some Sprint 3/4 badge issuance tests fail:

**Failing Tests:**
1. `POST /api/badges/:id/claim` - 400 instead of 201 (2 tests)
2. `POST /api/badges/:id/claim` - Expired token test has Prisma validation error
3. `GET /api/badges/my-badges` - 401 unauthorized (2 tests)
4. `GET /api/badges/issued` - 404 instead of 201 (2 tests)
5. `POST /api/badges/:id/revoke` - 404 instead of 200 (2 tests)
6. `GET /api/badges/:id/assertion` - 404 instead of 200/410 (2 tests)
7. `POST /api/badges/bulk` - 0 successful instead of expected counts (2 tests)

**Root Causes:**

1. **Test Setup Issues**
   - Some tests don't properly create badge data before assertions
   - Missing `verificationId` or `metadataHash` in manually created badges

2. **Timing/Race Conditions**
   - Tests running before badge issuance completes
   - Async metadataHash generation not awaited properly

3. **Data Cleanup Conflicts**
   - Same issue as TD-001, affecting these tests too

**Impact:**
- New Sprint 5 features work correctly ✅
- Old tests need updating to match new badge creation flow
- No production functionality affected

**Proposed Solution:**
- Review failing tests one by one
- Update test data setup to include `verificationId` and `metadataHash`
- Ensure proper async/await in badge creation steps
- Add missing badges in test setup where needed

**Priority:** Medium - Should fix before Sprint 6 to prevent technical debt accumulation

**Files Affected:**
- `test/badge-issuance.e2e-spec.ts` (14 failing tests)

---

## 🟡 Medium Priority

### TD-003: Badge Template Image Validation Enhancement

**Identified:** Sprint 2  
**Impact:** Low - Workaround exists  
**Effort:** Small (2 hours)

**Description:**

Current badge template image validation only checks size (128-2048px). Additional validations needed:

**Missing Validations:**
- File format verification (only PNG/JPEG/SVG allowed)
- File size limit (currently unlimited, should be <5MB)
- Aspect ratio check (should be square or within 1:1.2 ratio)
- Color profile validation (sRGB recommended)

**Current Workaround:**
- Azure Blob Storage enforces some limits
- Frontend validation catches most issues
- Manual admin review for edge cases

**Proposed Solution:**
- Add `sharp` metadata inspection in `StorageService.uploadBadgeImage()`
- Implement comprehensive validation DTO
- Return detailed error messages

**Priority:** Medium - Nice to have, not blocking

**Related:** Sprint 2, Story 3.2

---

## 🟢 Low Priority

### TD-004: Test Coverage for Baked Badge Caching

**Identified:** Sprint 5 (2026-01-28)  
**Impact:** Low - Feature works, just needs more tests  
**Effort:** Small (4 hours)

**Description:**

Baked badge generation (Story 6.4) is functional but lacks comprehensive caching tests:

**Missing Test Coverage:**
- Cache hit/miss scenarios
- Cache invalidation on badge revocation
- Cache expiry behavior
- Concurrent generation requests
- Error handling for corrupted cache

**Current State:**
- Basic functionality tested ✅
- HTTP authentication tested ✅
- Integration tests for authorization ✅
- Cache behavior not explicitly tested ❌

**Proposed Solution:**
- Add dedicated test suite `baked-badge-caching.spec.ts`
- Mock Azure Blob Storage responses
- Test cache behavior under load

**Priority:** Low - Enhancement for future sprint

---

## 📋 Backlog

### TD-005: Assertion Hash Backward Compatibility Script

**Identified:** Sprint 5 (2026-01-28)  
**Impact:** Low - Only affects old badges  
**Effort:** Small (2 hours)

**Description:**

Badges created before Story 6.5 don't have `metadataHash` populated. Need backfill script to:

1. Query all badges where `metadataHash IS NULL`
2. Compute hash from existing `assertionJson`
3. Update badge with computed hash

**Script Location:** `backend/src/badge-issuance/scripts/backfill-metadata-hash.ts`

**Status:** Partially implemented (code exists in backlog.md but not as runnable script)

**Proposed Solution:**
- Create NestJS command script using `@nestjs/command`
- Add to deployment checklist for production migration
- Run once after Story 6.5 deployment

**Priority:** Low - Can run when convenient, no user impact

---

## 📊 Technical Debt Metrics

### Sprint 5 Summary

| Category | Count | Estimated Effort |
|----------|-------|------------------|
| High Priority | 2 | 10-16 hours |
| Medium Priority | 1 | 2 hours |
| Low Priority | 2 | 6 hours |
| **Total** | **5** | **18-24 hours** |

### Debt Ratio

**Current Sprint Capacity:** 56 hours  
**Technical Debt Created:** ~18-24 hours  
**Debt Ratio:** ~35-43%

**Analysis:**
- Acceptable for new feature sprint introducing complex functionality
- Most debt is test infrastructure, not production code
- Should address TD-001 and TD-002 in Sprint 6 to prevent accumulation

---

## 🎯 Resolution Plan

### Sprint 6 Recommendations

1. **Week 1: Test Infrastructure** (8-10 hours)
   - Resolve TD-001 (E2E isolation) with database transactions
   - Implement test data factory pattern
   
2. **Week 2: Test Fixes** (2-4 hours)
   - Resolve TD-002 (badge issuance test regressions)
   - Update all failing tests to pass consistently

3. **Optional Enhancements** (4-6 hours)
   - TD-003: Image validation improvements
   - TD-004: Baked badge caching tests
   - TD-005: Hash backfill script

**Total Estimated Resolution:** 14-20 hours (35-40% of Sprint 6 capacity)

---

## 📝 Process Notes

### How to Add Technical Debt

When identifying new technical debt:

1. **Create Entry:**
   - Assign TD-XXX identifier (increment from last)
   - Set priority (High/Medium/Low)
   - Estimate effort in hours

2. **Document:**
   - Clear description of issue
   - Impact on users/developers
   - Root cause analysis
   - Reproduction steps
   - Proposed solutions

3. **Link:**
   - Reference related sprints/stories
   - Link to GitHub issues (when created)
   - Tag relevant files

4. **Review:**
   - Discuss in sprint retrospective
   - Prioritize for next sprint
   - Track resolution progress

### Debt Prevention

**Best Practices:**
- Write tests as you develop (TDD when possible)
- Review test isolation before committing
- Use database transactions in E2E tests
- Implement proper cleanup with cascade deletes
- Run full test suite before pushing

---

## 🔄 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Initial technical debt tracking document created | Amelia (Dev Agent) |
| 2026-01-28 | Added TD-001 through TD-005 from Sprint 5 | Amelia (Dev Agent) |

---

**Next Review:** Sprint 6 Planning (2026-02-10)
