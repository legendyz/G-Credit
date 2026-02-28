# Dev Prompt: Story 14.8 — 6-Combination Test Matrix

**Story File:** `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** HIGH | **Estimate:** 2h | **Wave:** 4 (Testing + Design Tokens)  
**Depends On:** 14.2 ✅, 14.3 ✅, 14.4 ✅, 14.7 ✅

---

## Objective

Create a comprehensive test suite verifying all 6 valid role×manager combinations in the ADR-017 dual-dimension identity model. This is the final backend validation gate before Sprint 15 UI work begins.

The 6 combinations are:

| # | Role | isManager | Description |
|---|------|-----------|-------------|
| 1 | EMPLOYEE | false | Regular employee |
| 2 | EMPLOYEE | true | Manager (employee with direct reports) |
| 3 | ISSUER | false | Badge issuer |
| 4 | ISSUER | true | Badge issuer who is also a manager |
| 5 | ADMIN | false | Admin without direct reports |
| 6 | ADMIN | true | Admin who also has direct reports |

---

## ⚠️ CRITICAL WARNINGS

1. **Use real JWT tokens from login flow** — not mocked tokens. The `computeIsManager()` in `auth.service.ts` reads `prisma.user.count({ where: { managerId: userId } })` at login time and sets `isManager` in the JWT payload. The test must create DB fixtures that make `computeIsManager()` return the correct value.
2. **ADMIN bypasses ManagerGuard** — combo #5 (ADMIN, isManager=false) still gets team access because `ManagerGuard` always returns `true` for ADMIN.
3. **DO NOT run `npx prisma format`** — Lesson 22.
4. **Use existing E2E infrastructure** — `setupE2ETest()`, `createAndLoginUser()`, `teardownE2ETest()`. Do NOT create a parallel test framework.

---

## Scope — Test File Structure

### New File: `backend/test/role-matrix.e2e-spec.ts`

A single E2E test file with a `describe` block per combination, testing 4 access dimensions per user.

---

## Existing Infrastructure

### Test Setup Pattern

```typescript
import { setupE2ETest, teardownE2ETest, TestContext } from './helpers/e2e-setup';
import { createAndLoginUser } from './helpers/auth-test-utils';

describe('Role×Manager Matrix (ADR-017)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupE2ETest('role-matrix');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // ... test combinations
});
```

### User Factory Methods

| Factory Method | Creates | isManager Result |
|---------------|---------|------------------|
| `createEmployee()` | EMPLOYEE, no subordinates | `false` |
| `createManager()` | EMPLOYEE + one subordinate → `isManager: true` | `true` |
| `createIssuer()` | ISSUER, no subordinates | `false` |
| `createAdmin()` | ADMIN, no subordinates | `false` (bypassed by guard) |

**Missing combinations that need setup:**
- **ISSUER + isManager=true** (#4): Create ISSUER, then create another user with `managerId` pointing to the ISSUER
- **ADMIN + isManager=true** (#6): Create ADMIN, then create another user with `managerId` pointing to the ADMIN

### Login & Token Extraction

```typescript
const { user, token } = await createAndLoginUser(ctx.app, ctx.factories.user, 'EMPLOYEE');
// `token` is extracted from httpOnly cookie — it's a real JWT with `isManager` computed from DB
```

For ISSUER+manager and ADMIN+manager, you need to:
1. Create the user via factory
2. Create a subordinate user with `managerId: user.id`
3. THEN login (so `computeIsManager()` returns `true`)

---

## Target Endpoints for Access Matrix

Test each combination against these 4 endpoints:

| Endpoint | Guards | Tests | Expected Access |
|----------|--------|-------|----------------|
| `GET /api/profile` | `JwtAuthGuard` only | Dashboard access | All 6 ✅ |
| `GET /api/manager-only` | `@Roles('EMPLOYEE','ADMIN')` + `@RequireManager()` + `ManagerGuard` | Team access | #2, #5*, #6 ✅ |
| `GET /api/issuer-only` | `@Roles('ISSUER','ADMIN')` | Issue access | #3, #4, #5, #6 ✅ |
| `GET /api/admin-only` | `@Roles('ADMIN')` | Admin access | #5, #6 ✅ |

\*ADMIN bypasses ManagerGuard

### Expected HTTP Status per Combination

| # | Role | isManager | /profile | /manager-only | /issuer-only | /admin-only |
|---|------|-----------|----------|---------------|--------------|-------------|
| 1 | EMPLOYEE | false | 200 | 403 | 403 | 403 |
| 2 | EMPLOYEE | true | 200 | 200 | 403 | 403 |
| 3 | ISSUER | false | 200 | 403 | 200 | 403 |
| 4 | ISSUER | true | 200 | 403* | 200 | 403 |
| 5 | ADMIN | false | 200 | 200** | 200 | 200 |
| 6 | ADMIN | true | 200 | 200 | 200 | 200 |

\* ISSUER+manager (#4) gets 403 on `/manager-only` because `@Roles('EMPLOYEE','ADMIN')` blocks ISSUER — the ManagerGuard never runs. This is correct — manager-only endpoint is for EMPLOYEE managers, not ISSUER managers. ISSUER managers access team features through issuer-specific endpoints.

\** ADMIN (#5) gets 200 on `/manager-only` even with `isManager: false` — ADMIN bypass.

---

## Detailed Test Implementation

### Combination #1: EMPLOYEE (non-manager)

```typescript
describe('Combo #1: EMPLOYEE + isManager=false', () => {
  let token: string;

  beforeAll(async () => {
    const result = await createAndLoginUser(ctx.app, ctx.factories.user, 'EMPLOYEE');
    token = result.token;
  });

  it('GET /profile → 200 (dashboard)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /manager-only → 403 (no team access)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/manager-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /issuer-only → 403 (no issue access)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/issuer-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /admin-only → 403 (no admin access)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
```

### Combination #2: EMPLOYEE + isManager=true

```typescript
describe('Combo #2: EMPLOYEE + isManager=true', () => {
  let token: string;

  beforeAll(async () => {
    // createManager() creates EMPLOYEE + subordinate → isManager=true at login
    const result = await createAndLoginUser(ctx.app, ctx.factories.user, 'MANAGER');
    token = result.token;
  });

  it('GET /profile → 200', ...);
  it('GET /manager-only → 200 (team access via isManager)', ...);
  it('GET /issuer-only → 403', ...);
  it('GET /admin-only → 403', ...);
});
```

### Combination #3: ISSUER (non-manager)

```typescript
describe('Combo #3: ISSUER + isManager=false', () => {
  let token: string;

  beforeAll(async () => {
    const result = await createAndLoginUser(ctx.app, ctx.factories.user, 'ISSUER');
    token = result.token;
  });

  it('GET /profile → 200', ...);
  it('GET /manager-only → 403', ...);
  it('GET /issuer-only → 200 (issue access)', ...);
  it('GET /admin-only → 403', ...);
});
```

### Combination #4: ISSUER + isManager=true

This combination requires manual setup since there's no `createIssuerManager()` factory method:

```typescript
describe('Combo #4: ISSUER + isManager=true', () => {
  let token: string;

  beforeAll(async () => {
    // Step 1: Create ISSUER
    const issuer = await ctx.factories.user.createIssuer();

    // Step 2: Create subordinate pointing to issuer
    await ctx.factories.user.createEmployee({
      managerId: issuer.id,
    });

    // Step 3: Login the issuer — computeIsManager() will find subordinate → isManager=true
    const loginRes = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: issuer.email, password: 'TestPassword123!' })
      .expect(201);

    token = extractCookieToken(loginRes, 'access_token');
  });

  it('GET /profile → 200', ...);
  it('GET /manager-only → 403 (ISSUER blocked by @Roles)', ...);
  it('GET /issuer-only → 200', ...);
  it('GET /admin-only → 403', ...);
});
```

### Combination #5: ADMIN (non-manager)

```typescript
describe('Combo #5: ADMIN + isManager=false', () => {
  let token: string;

  beforeAll(async () => {
    const result = await createAndLoginUser(ctx.app, ctx.factories.user, 'ADMIN');
    token = result.token;
  });

  it('GET /profile → 200', ...);
  it('GET /manager-only → 200 (ADMIN bypass)', ...);
  it('GET /issuer-only → 200 (ADMIN bypass)', ...);
  it('GET /admin-only → 200', ...);
});
```

### Combination #6: ADMIN + isManager=true

```typescript
describe('Combo #6: ADMIN + isManager=true', () => {
  let token: string;

  beforeAll(async () => {
    // Create ADMIN then add subordinate
    const admin = await ctx.factories.user.createAdmin();
    await ctx.factories.user.createEmployee({ managerId: admin.id });

    const loginRes = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'TestPassword123!' })
      .expect(201);

    token = extractCookieToken(loginRes, 'access_token');
  });

  it('GET /profile → 200', ...);
  it('GET /manager-only → 200', ...);
  it('GET /issuer-only → 200', ...);
  it('GET /admin-only → 200', ...);
});
```

---

## Additional Test Sections

### JWT Backward Compatibility (AC #2)

Test that a JWT without `isManager` field works correctly:

```typescript
describe('JWT backward compatibility', () => {
  it('old token without isManager → treated as isManager=false', async () => {
    // Create employee, manually craft JWT without isManager claim
    // OR: use JwtService to sign a payload without isManager
    const jwtService = ctx.app.get(JwtService);
    const user = await ctx.factories.user.createEmployee();
    const payload = { sub: user.id, email: user.email, role: user.role };
    // Note: no `isManager` field
    const token = jwtService.sign(payload);

    // Should be treated as non-manager
    await request(ctx.app.getHttpServer())
      .get('/api/manager-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    // Should NOT cause 500
    await request(ctx.app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### Dashboard Endpoints (Additional Matrix Verification)

For more thorough coverage, also test the `/api/dashboard/*` endpoints:

```typescript
describe('Dashboard endpoint matrix', () => {
  // Combo #2 (EMPLOYEE+manager) → GET /api/dashboard/manager → 200
  // Combo #1 (EMPLOYEE non-manager) → GET /api/dashboard/manager → 403
  // Combo #5 (ADMIN) → GET /api/dashboard/manager → 200 (bypass)
  // Combo #3 (ISSUER) → GET /api/dashboard/manager → 403
});
```

---

## What NOT to Test in This Story

- **Migration test (AC #3):** The MANAGER→EMPLOYEE migration was already verified in Story 14.2. The schema no longer contains MANAGER enum. If you want to verify migration integrity, check that all users in DB have valid roles (ADMIN/ISSUER/EMPLOYEE) and directReports relationships are intact. This can be a simple query check, not a full migration re-run.

- **M365 sync test (AC #4):** The M365 sync logic was updated in Story 14.2. Existing tests in `m365-sync.e2e-spec.ts` should already cover this. If needed, add a focused test for the dual-dimension scenario (user in Issuers group + has directReports → ISSUER + isManager=true), but keep it minimal.

---

## Existing E2E Test Helpers

Look for these utilities in `test/helpers/`:

| Helper | Purpose |
|--------|---------|
| `setupE2ETest(name)` | Creates isolated test database schema, returns `TestContext` |
| `teardownE2ETest(ctx)` | Drops test schema, closes connections |
| `createAndLoginUser(app, factory, role)` | Creates user + logs in → returns `{ user, token }` |
| `extractCookieToken(res, name)` | Extracts JWT from httpOnly Set-Cookie header |
| `UserFactory` | `ctx.factories.user` — creates EMPLOYEE/ISSUER/ADMIN/Manager |

If `createAndLoginUser` doesn't accept `'MANAGER'` as a role string, you may need to handle the manager combo manually (create user → add subordinate → login directly).

---

## Test Execution

```bash
# Run only the new matrix test
cd gcredit-project/backend
npm test -- test/role-matrix.e2e-spec.ts --runInBand

# Full regression — backend
npm test

# Full regression — frontend
cd ../frontend
npm test
```

Expected totals:
- Backend: ≥51 suites, ≥932 tests (plus new matrix tests)
- Frontend: 77 suites, 794 tests
- Combined: ≥1,726 tests

---

## Commit Convention

```
test: add 6-combination role×manager test matrix (ADR-017 §7) [14.8]
```

---

## Completion Checklist

Before marking story as `review`:

- [ ] `test/role-matrix.e2e-spec.ts` created with 6 combination blocks (24 endpoint tests)
- [ ] JWT backward compatibility test present
- [ ] All 6 combinations produce expected HTTP status codes
- [ ] Full backend test suite passes
- [ ] Full frontend test suite passes
- [ ] Total test count reported (≥1,726)
- [ ] Story file updated: ACs checked, Dev Agent Record filled
- [ ] `sprint-status.yaml` updated to `review`
