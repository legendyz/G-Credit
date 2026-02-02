# Task 8.8: E2E Test Isolation - TD-001

**Task ID:** Task 8.8  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** CRITICAL 🔴  
**Estimated Hours:** 8h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

**Technical Debt TD-001** (Sprint 5): E2E test isolation issues causing 45/71 parallel tests to fail due to database cleanup race conditions.

**Current State:**
- Individual test suites: 100% pass rate
- Parallel execution: 45/71 failures (63% failure rate)
- Root cause: Shared database state between tests

**Impact:**
- ❌ Blocks CI/CD pipeline (cannot trust test results)
- ❌ Slows development (must run tests sequentially)
- ❌ Technical debt accumulating (302 tests, growing)

**Reference:** technical-debt-from-reviews.md (TD-001), Sprint 5 Retrospective

---

## Objectives

**As a** Developer,  
**I want** E2E tests to run reliably in parallel,  
**So that** CI/CD pipeline is fast and trustworthy.

---

## Acceptance Criteria

### AC1: Database Isolation Strategy
**Given** multiple E2E tests run in parallel  
**When** they interact with the database  
**Then** tests do not interfere with each other

**Strategy Options Evaluated:**

**Option A: Test Database Per Suite (Recommended)**
- Each test suite gets isolated PostgreSQL schema
- Uses `beforeAll` to create schema, `afterAll` to drop
- Prisma connects to different schemas: `DATABASE_URL?schema=test_suite_1`

**Option B: Transaction Rollback**
- Wrap each test in database transaction
- Rollback after test completes
- Requires custom Prisma client wrapper

**Option C: Database Seeding with Unique Data**
- Generate unique user emails/badge IDs per test
- Use UUID suffixes: `user-${testId}@example.com`
- No cleanup needed (data is isolated by ID)

**Recommended: Hybrid Approach**
- **Option A** for full isolation (recommended for Sprint 8)
- **Option C** as fallback if Option A has issues

### AC2: Test Data Factory Pattern
**Given** tests need realistic data  
**When** creating test fixtures  
**Then** use factory functions for consistency:

```typescript
// test/factories/user.factory.ts
export class UserFactory {
  static async createEmployee(
    prisma: PrismaClient,
    overrides?: Partial<User>
  ): Promise<User> {
    return prisma.user.create({
      data: {
        email: overrides?.email || `employee-${uuidv4()}@test.com`,
        name: overrides?.name || 'Test Employee',
        password: await hash('Password123!', 10),
        role: Role.EMPLOYEE,
        ...overrides
      }
    });
  }

  static async createIssuer(...): Promise<User> {...}
  static async createAdmin(...): Promise<User> {...}
}
```

**Benefits:**
- Consistent test data structure
- Easy to create variations
- Reduces boilerplate in tests
- Easier to maintain when schema changes

### AC3: Parallel Test Execution
**Given** all E2E tests are fixed  
**When** I run `npm test` with parallel mode  
**Then** all tests pass:

```bash
# Before Fix (Sprint 5)
npm test -- --maxWorkers=4
# Result: 45/71 tests fail (63% failure rate)

# After Fix (Sprint 8)
npm test -- --maxWorkers=4
# Result: 71/71 tests pass (100% pass rate) ✅
```

**Jest Configuration:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 4,                    // Run 4 test suites in parallel
  testTimeout: 30000,               // 30s timeout per test
  globalSetup: './test/setup.ts',   // Database setup
  globalTeardown: './test/teardown.ts' // Database cleanup
};
```

### AC4: CI/CD Integration
**Given** tests pass locally  
**When** GitHub Actions runs tests  
**Then** CI pipeline passes reliably:

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npm test -- --maxWorkers=2
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

**Success Criteria:**
- 10 consecutive CI runs with 100% pass rate
- No flaky tests (intermittent failures)

### AC5: Documentation & Best Practices
**Given** new tests are added  
**When** developers write E2E tests  
**Then** they follow isolation guidelines:

**E2E Test Checklist:**
- [ ] Use test data factories (no hardcoded values)
- [ ] Clean up created resources in `afterEach` or `afterAll`
- [ ] Use unique identifiers (UUIDs) for test data
- [ ] Avoid shared global state
- [ ] Use `beforeAll` for expensive setup (database connections)
- [ ] Use `beforeEach` for per-test setup (create test user)

---

## Tasks / Subtasks

### Task 1: Database Isolation Implementation (AC1) - 3h
- [ ] **Option A: Schema-Based Isolation**
  - [ ] Create `test/helpers/database.ts` with schema management
  - [ ] Update `jest.config.js` with `setupFilesAfterEnv`
  - [ ] Modify Prisma client to use dynamic schema
  - [ ] Test with 2 parallel suites
  
```typescript
// test/helpers/database.ts
export async function setupTestDatabase(suiteName: string): Promise<PrismaClient> {
  const schemaName = `test_${suiteName}_${Date.now()}`;
  const databaseUrl = `${process.env.DATABASE_URL}?schema=${schemaName}`;

  // Create Prisma client with custom schema
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  // Run migrations on the schema
  execSync(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });

  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient, schemaName: string) {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await prisma.$disconnect();
}
```

- [ ] **Fallback: Option C (Unique Data Strategy)**
  - [ ] Add UUID suffix to all test emails
  - [ ] Generate unique badge claim tokens
  - [ ] Use timestamp-based badge names

### Task 2: Test Data Factory (AC2) - 2h
- [ ] Create `test/factories/` directory
  - [ ] `user.factory.ts` (Employee, Issuer, Manager, Admin)
  - [ ] `badge-template.factory.ts`
  - [ ] `badge.factory.ts`
  - [ ] `skill.factory.ts`
- [ ] Refactor existing tests to use factories
  - [ ] Update `auth.e2e-spec.ts` (10 occurrences)
  - [ ] Update `badge-issuance.e2e-spec.ts` (15 occurrences)
  - [ ] Update `badge-templates.e2e-spec.ts` (12 occurrences)
- [ ] Write factory tests (5 tests: each factory function)

### Task 3: Parallel Test Fixes (AC3) - 2h
- [ ] Run tests with `--maxWorkers=4` and identify failures
- [ ] Fix each failing test:
  - [ ] Add proper cleanup in `afterEach` / `afterAll`
  - [ ] Replace hardcoded data with factory functions
  - [ ] Add unique identifiers to test data
- [ ] Verify 100% pass rate with parallel execution
- [ ] Document flaky test patterns to avoid

### Task 4: CI/CD Integration (AC4) - 0.5h
- [ ] Update `.github/workflows/test.yml`
  - [ ] Add test database environment variable
  - [ ] Run tests with `--maxWorkers=2` (GitHub Actions has 2 cores)
  - [ ] Add test result reporting
- [ ] Run 10 consecutive CI builds
- [ ] Document any remaining flaky tests

### Task 5: Documentation & Best Practices (AC5) - 0.5h
- [ ] Create `docs/testing/e2e-test-guidelines.md`
  - [ ] Database isolation strategy
  - [ ] Test data factory usage
  - [ ] Parallel execution best practices
  - [ ] Common pitfalls to avoid
- [ ] Update `backend/README.md` with test instructions
- [ ] Add comments to factory files

---

## Testing Strategy

### Validation Tests
- [ ] **Baseline:** Run all tests sequentially (expect 100% pass)
- [ ] **Parallel (2 workers):** Run with `--maxWorkers=2` (expect 100% pass)
- [ ] **Parallel (4 workers):** Run with `--maxWorkers=4` (expect 100% pass)
- [ ] **Stress Test:** Run 5 times consecutively (check for flakiness)
- [ ] **CI Test:** Run on GitHub Actions 10 times (verify reliability)

### Performance Metrics
| Configuration | Duration (Before) | Duration (After) | Speedup |
|---------------|-------------------|------------------|---------|
| Sequential    | ~4min             | ~4min            | 1x      |
| Parallel (2x) | N/A (fails)       | ~2.5min          | 1.6x    |
| Parallel (4x) | N/A (fails)       | ~1.5min          | 2.7x    |

---

## Dev Notes

### Root Cause Analysis (Sprint 5)
**Why tests failed in parallel:**
1. Shared database state (same test user email)
2. No cleanup between tests (orphaned data)
3. Race conditions in badge creation (claim tokens collision)
4. Global beforeAll/afterAll hooks (not suite-isolated)

### Solution Details
**Option A Benefits:**
- Complete isolation (no data leakage)
- Parallel-safe by design
- Minimal test code changes

**Option A Drawbacks:**
- Schema creation overhead (~500ms per suite)
- Requires database DROP SCHEMA permission

### Alternative Considered (Option B)
Transaction rollback was considered but rejected because:
- Prisma doesn't support manual transaction rollback well
- Would require custom PrismaClient wrapper
- More complex implementation

---

## Definition of Done

- [ ] All 5 Acceptance Criteria met
- [ ] 71/71 E2E tests pass in parallel (100% pass rate)
- [ ] Test data factories implemented for all entities
- [ ] Tests run in <2 minutes with 4 workers (vs 4min sequential)
- [ ] CI/CD pipeline passes 10 consecutive runs
- [ ] E2E test guidelines documented
- [ ] Code review complete
- [ ] Task notes updated with final metrics

---

## Success Metrics

**Before (Sprint 5):**
- Sequential: 71/71 pass (100%)
- Parallel: 26/71 pass (37%)
- CI reliability: 20% (1/5 runs pass)

**After (Sprint 8 Target):**
- Sequential: 71/71 pass (100%)
- Parallel: 71/71 pass (100%) ✅
- CI reliability: 100% (10/10 runs pass) ✅

---

## Dependencies

**Blocked By:**
- None (can start immediately)

**Blocks:**
- CI/CD pipeline reliability
- Future test scaling (currently 302 tests, will grow)

**Critical Priority:**
- This is the HIGHEST priority technical debt
- Blocks production readiness
- Affects team velocity

---

## References

- technical-debt-from-reviews.md (TD-001)
- Sprint 5 Retrospective: "Test infrastructure debt needs addressing"
- [Jest Parallelization](https://jestjs.io/docs/cli#--maxworkersnumstring)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing/integration-testing)
- TD-005: Test Data Factory Pattern (Sprint 5 proposed solution)
