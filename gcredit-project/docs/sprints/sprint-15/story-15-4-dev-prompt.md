# Dev Prompt — Story 15.4: Role×Manager Combination Testing (TD-035-D)

## Context

G-Credit backend (NestJS 11 + Prisma + TypeScript). This story creates E2E tests that validate all 6 role×isManager combinations against the dashboard endpoints and permissions API. Frontend unit tests already cover tab/sidebar computation (permissions.test.ts, DashboardPage.test.ts). This story adds **backend E2E** coverage to verify the full stack.

**Branch:** `sprint-15/ui-overhaul-dashboard`
**Existing patterns:** `test/role-matrix.e2e-spec.ts` (Story 14.8 — 31 tests, access control matrix)

---

## Architecture Overview

### Dashboard Endpoints
```
GET /api/dashboard/employee  → @Roles(EMPLOYEE, ISSUER, ADMIN) — all authenticated users
GET /api/dashboard/issuer    → @Roles(ISSUER, ADMIN)
GET /api/dashboard/manager   → @Roles(EMPLOYEE, ISSUER, ADMIN) + @UseGuards(ManagerGuard) — requires isManager=true (or ADMIN bypass)
GET /api/dashboard/admin     → @Roles(ADMIN)
```

### Permissions Endpoint (Story 15.2)
```
GET /api/users/me/permissions → Returns { role, isManager, dashboardTabs, sidebarGroups, permissions }
```

### Expected Matrix

| # | Role     | isManager | /employee | /manager | /issuer | /admin | dashboardTabs                              | sidebarGroups                      |
|---|----------|-----------|-----------|----------|---------|--------|--------------------------------------------|------------------------------------|
| 1 | EMPLOYEE | false     | 200       | 403      | 403     | 403    | [my-badges]                                | [base]                             |
| 2 | EMPLOYEE | true      | 200       | 200      | 403     | 403    | [my-badges, team]                          | [base, team]                       |
| 3 | ISSUER   | false     | 200       | 403      | 200     | 403    | [my-badges, issuance]                      | [base, issuance]                   |
| 4 | ISSUER   | true      | 200       | 200      | 200     | 403    | [my-badges, team, issuance]                | [base, team, issuance]             |
| 5 | ADMIN    | false     | 200       | 200      | 200     | 200    | [my-badges, issuance, admin]               | [base, issuance, admin]            |
| 6 | ADMIN    | true      | 200       | 200      | 200     | 200    | [my-badges, team, issuance, admin]         | [base, team, issuance, admin]      |

> **Note on Combos #4 and #5:**
> - Combo #4 (ISSUER+manager): `/manager` returns **200** because `@Roles(EMPLOYEE, ISSUER, ADMIN)` includes ISSUER, and ManagerGuard passes when `isManager=true`.
> - Combo #5 (ADMIN+!manager): `/manager` returns **200** because ManagerGuard always allows ADMIN regardless of isManager.

---

## Task 1: Create Shared Auth Fixtures (AC #1, #6)

Create `backend/test/fixtures/auth-combinations.ts` — a reusable test fixture factory with all 6 combinations and their expected outcomes.

```typescript
/**
 * Auth Test Fixtures — Story 15.4 (CROSS-003)
 *
 * Reusable 6-combo fixture factory for role×isManager E2E testing.
 * Used by dashboard-combination.e2e-spec.ts.
 *
 * Strategy:
 * - Combos #1–#5: real login via createAndLoginUser + createIssuer/createEmployee
 * - Combo #6: JwtService.sign() to avoid exceeding login rate limit (5/min)
 *
 * Env: THROTTLE_TTL_SECONDS=1 THROTTLE_LIMIT=100 (from Story 15.13)
 * relaxes rate limits for test environment.
 */

export interface AuthCombo {
  label: string;
  role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN';
  isManager: boolean;
  expected: {
    employee: number; // /api/dashboard/employee
    manager: number;  // /api/dashboard/manager
    issuer: number;   // /api/dashboard/issuer
    admin: number;    // /api/dashboard/admin
    dashboardTabs: string[];
    sidebarGroups: string[];
    permissions: {
      canViewTeam: boolean;
      canIssueBadges: boolean;
      canManageUsers: boolean;
    };
  };
}

export const AUTH_COMBINATIONS: AuthCombo[] = [
  {
    label: 'EMPLOYEE + isManager=false',
    role: 'EMPLOYEE',
    isManager: false,
    expected: {
      employee: 200,
      manager: 403,
      issuer: 403,
      admin: 403,
      dashboardTabs: ['my-badges'],
      sidebarGroups: ['base'],
      permissions: { canViewTeam: false, canIssueBadges: false, canManageUsers: false },
    },
  },
  {
    label: 'EMPLOYEE + isManager=true',
    role: 'EMPLOYEE',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 403,
      admin: 403,
      dashboardTabs: ['my-badges', 'team'],
      sidebarGroups: ['base', 'team'],
      permissions: { canViewTeam: true, canIssueBadges: false, canManageUsers: false },
    },
  },
  {
    label: 'ISSUER + isManager=false',
    role: 'ISSUER',
    isManager: false,
    expected: {
      employee: 200,
      manager: 403,
      issuer: 200,
      admin: 403,
      dashboardTabs: ['my-badges', 'issuance'],
      sidebarGroups: ['base', 'issuance'],
      permissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: false },
    },
  },
  {
    label: 'ISSUER + isManager=true',
    role: 'ISSUER',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 403,
      dashboardTabs: ['my-badges', 'team', 'issuance'],
      sidebarGroups: ['base', 'team', 'issuance'],
      permissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: false },
    },
  },
  {
    label: 'ADMIN + isManager=false',
    role: 'ADMIN',
    isManager: false,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 200,
      dashboardTabs: ['my-badges', 'issuance', 'admin'],
      sidebarGroups: ['base', 'issuance', 'admin'],
      permissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: true },
    },
  },
  {
    label: 'ADMIN + isManager=true',
    role: 'ADMIN',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 200,
      dashboardTabs: ['my-badges', 'team', 'issuance', 'admin'],
      sidebarGroups: ['base', 'team', 'issuance', 'admin'],
      permissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: true },
    },
  },
];
```

---

## Task 2: Create Dashboard Combination E2E Spec (AC #1, #2, #3)

Create `backend/test/dashboard-combination.e2e-spec.ts`.

### Structure

```typescript
/**
 * Dashboard × Permissions Combination E2E Tests — Story 15.4 (TD-035-D)
 *
 * Tests all 6 role×isManager combinations against:
 * 1. Dashboard endpoint access (employee/manager/issuer/admin → 200/403)
 * 2. Permissions API response (dashboardTabs, sidebarGroups, permissions)
 * 3. Dashboard response shape (body structure for accessible endpoints)
 *
 * Token strategy: Same as role-matrix.e2e-spec.ts (Story 14.8):
 * - Combos #1-#5: real logins
 * - Combo #6: JwtService.sign() to avoid rate limit
 *
 * ENV: THROTTLE_TTL_SECONDS=1 THROTTLE_LIMIT=100 (Story 15.13)
 */

import { JwtService } from '@nestjs/jwt';
import {
  TestContext, setupE2ETest, teardownE2ETest,
  createAndLoginUser, extractCookieToken, authRequest,
} from './helpers/test-setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUTH_COMBINATIONS, AuthCombo } from './fixtures/auth-combinations';

describe('Dashboard × Permissions Combination (Story 15.4)', () => {
  let ctx: TestContext;
  const tokens: Map<string, string> = new Map();

  beforeAll(async () => {
    ctx = await setupE2ETest('dashboard-combo');
    // Create all 6 user tokens — follow role-matrix.e2e-spec.ts pattern
    // ... (see detailed instructions below)
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // ... test blocks
});
```

### Token Creation Strategy (in `beforeAll`)

Follow the exact pattern from `test/role-matrix.e2e-spec.ts`:

```typescript
beforeAll(async () => {
  ctx = await setupE2ETest('dashboard-combo');

  // Combo #1: EMPLOYEE, no subordinates → isManager=false
  const emp = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');
  tokens.set('EMPLOYEE-false', emp.token);

  // Combo #2: EMPLOYEE + subordinate → isManager=true
  const mgr = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
  tokens.set('EMPLOYEE-true', mgr.token);

  // Combo #3: ISSUER, no subordinates → isManager=false
  const iss = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
  tokens.set('ISSUER-false', iss.token);

  // Combo #4: ISSUER + subordinate → isManager=true
  const issuerUser = await ctx.userFactory.createIssuer({ password: 'TestPassword123!' });
  await ctx.userFactory.createEmployee({ managerId: issuerUser.id });
  const issuerLoginRes = await request(ctx.app.getHttpServer() as App)
    .post('/api/auth/login')
    .send({ email: issuerUser.email, password: 'TestPassword123!' })
    .expect(200);
  tokens.set('ISSUER-true', extractCookieToken(issuerLoginRes, 'access_token'));

  // Combo #5: ADMIN, no subordinates → isManager=false
  const adm = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
  tokens.set('ADMIN-false', adm.token);

  // Combo #6: ADMIN + subordinate → isManager=true (JwtService.sign to avoid rate limit)
  const adminUser = await ctx.userFactory.createAdmin({ password: 'TestPassword123!' });
  await ctx.userFactory.createEmployee({ managerId: adminUser.id });
  const jwtService = ctx.app.get(JwtService);
  tokens.set('ADMIN-true', jwtService.sign({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    isManager: true,
  }));
});
```

### Test Block 1: Dashboard Endpoint Access Matrix

Use `describe.each` with `AUTH_COMBINATIONS`:

```typescript
describe.each(AUTH_COMBINATIONS)('$label', (combo: AuthCombo) => {
  const getToken = () => tokens.get(`${combo.role}-${combo.isManager}`)!;

  it(`/api/dashboard/employee → ${combo.expected.employee}`, async () => {
    await authRequest(ctx.app, getToken())
      .get('/api/dashboard/employee')
      .expect(combo.expected.employee);
  });

  it(`/api/dashboard/manager → ${combo.expected.manager}`, async () => {
    await authRequest(ctx.app, getToken())
      .get('/api/dashboard/manager')
      .expect(combo.expected.manager);
  });

  it(`/api/dashboard/issuer → ${combo.expected.issuer}`, async () => {
    await authRequest(ctx.app, getToken())
      .get('/api/dashboard/issuer')
      .expect(combo.expected.issuer);
  });

  it(`/api/dashboard/admin → ${combo.expected.admin}`, async () => {
    await authRequest(ctx.app, getToken())
      .get('/api/dashboard/admin')
      .expect(combo.expected.admin);
  });
});
```

This generates **24 tests** (6 combos × 4 endpoints).

### Test Block 2: Permissions API Verification

```typescript
describe('Permissions API (/api/users/me/permissions)', () => {
  AUTH_COMBINATIONS.forEach((combo) => {
    it(`${combo.label} → correct tabs, groups, permissions`, async () => {
      const token = tokens.get(`${combo.role}-${combo.isManager}`)!;
      const res = await authRequest(ctx.app, token)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as {
        role: string;
        isManager: boolean;
        dashboardTabs: string[];
        sidebarGroups: string[];
        permissions: { canViewTeam: boolean; canIssueBadges: boolean; canManageUsers: boolean };
      };

      expect(body.dashboardTabs).toEqual(combo.expected.dashboardTabs);
      expect(body.sidebarGroups).toEqual(combo.expected.sidebarGroups);
      expect(body.permissions).toMatchObject(combo.expected.permissions);
    });
  });
});
```

This generates **6 tests**.

### Test Block 3: Dashboard Response Shape Validation

For each combo, verify that accessible endpoints return the expected response structure:

```typescript
describe('Response shape validation', () => {
  it('employee endpoint returns badgeSummary + recentBadges', async () => {
    const token = tokens.get('EMPLOYEE-false')!;
    const res = await authRequest(ctx.app, token)
      .get('/api/dashboard/employee')
      .expect(200);

    const body = res.body as { badgeSummary: unknown; recentBadges: unknown[] };
    expect(body).toHaveProperty('badgeSummary');
    expect(body).toHaveProperty('recentBadges');
    expect(Array.isArray(body.recentBadges)).toBe(true);
  });

  it('manager endpoint returns teamMembers + teamBadgeSummary', async () => {
    const token = tokens.get('EMPLOYEE-true')!;
    const res = await authRequest(ctx.app, token)
      .get('/api/dashboard/manager')
      .expect(200);

    const body = res.body as { teamMembers: unknown; teamBadgeSummary: unknown };
    expect(body).toHaveProperty('teamMembers');
    expect(body).toHaveProperty('teamBadgeSummary');
  });

  it('issuer endpoint returns issuanceSummary + recentActivity', async () => {
    const token = tokens.get('ISSUER-false')!;
    const res = await authRequest(ctx.app, token)
      .get('/api/dashboard/issuer')
      .expect(200);

    const body = res.body as { issuanceSummary: unknown; recentActivity: unknown[] };
    expect(body).toHaveProperty('issuanceSummary');
    expect(body).toHaveProperty('recentActivity');
    expect(Array.isArray(body.recentActivity)).toBe(true);
  });

  it('admin endpoint returns adminSummary', async () => {
    const token = tokens.get('ADMIN-false')!;
    const res = await authRequest(ctx.app, token)
      .get('/api/dashboard/admin')
      .expect(200);

    const body = res.body as { adminSummary: unknown };
    expect(body).toHaveProperty('adminSummary');
  });
});
```

> **Adjust property names** based on actual controller return types. Read the dashboard service to verify the exact shape.

This generates **4 tests**.

---

## Task 3: Create Frontend Auth Fixture Factory (CROSS-003)

Create `frontend/src/test-utils/auth-fixtures.ts` — the frontend-side reusable fixture for unit tests.

```typescript
/**
 * Auth Test Fixtures — Story 15.4 (CROSS-003)
 *
 * Reusable auth combination fixtures for frontend unit tests.
 * Used by DashboardPage.test.tsx and permissions.test.ts (already have inline versions).
 *
 * This centralizes the 6-combo definition so future tests don't duplicate it.
 */
import type { UserRole, DashboardTab, SidebarGroup, FlatPermissions } from '@/utils/permissions';

export interface AuthCombination {
  role: UserRole;
  isManager: boolean;
  expectedTabs: DashboardTab[];
  expectedGroups: SidebarGroup[];
  expectedPermissions: FlatPermissions;
}

export const AUTH_COMBINATIONS: AuthCombination[] = [
  {
    role: 'EMPLOYEE',
    isManager: false,
    expectedTabs: ['my-badges'],
    expectedGroups: ['base'],
    expectedPermissions: { canViewTeam: false, canIssueBadges: false, canManageUsers: false },
  },
  {
    role: 'EMPLOYEE',
    isManager: true,
    expectedTabs: ['my-badges', 'team'],
    expectedGroups: ['base', 'team'],
    expectedPermissions: { canViewTeam: true, canIssueBadges: false, canManageUsers: false },
  },
  {
    role: 'ISSUER',
    isManager: false,
    expectedTabs: ['my-badges', 'issuance'],
    expectedGroups: ['base', 'issuance'],
    expectedPermissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: false },
  },
  {
    role: 'ISSUER',
    isManager: true,
    expectedTabs: ['my-badges', 'team', 'issuance'],
    expectedGroups: ['base', 'team', 'issuance'],
    expectedPermissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: false },
  },
  {
    role: 'ADMIN',
    isManager: false,
    expectedTabs: ['my-badges', 'issuance', 'admin'],
    expectedGroups: ['base', 'issuance', 'admin'],
    expectedPermissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: true },
  },
  {
    role: 'ADMIN',
    isManager: true,
    expectedTabs: ['my-badges', 'team', 'issuance', 'admin'],
    expectedGroups: ['base', 'team', 'issuance', 'admin'],
    expectedPermissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: true },
  },
];
```

> **Optional refactoring:** If time permits, update `permissions.test.ts` and `DashboardPage.test.tsx` to import from this fixture instead of their inline copies. Not required for this story.

---

## Task 4: Environment Configuration for E2E

Ensure `backend/.env.test` has relaxed rate limits (Story 15.13):

```env
THROTTLE_TTL_SECONDS=1
THROTTLE_LIMIT=100
```

If `.env.test` already has these, no action needed. Verify by checking the file.

---

## Task 5: Verification (AC #5)

After all tests are written:

1. **Run the new spec:**
   ```bash
   cd backend
   npx jest --config jest-e2e.config.ts dashboard-combination --verbose
   ```

2. **Expected test count:** ~34 tests (24 endpoint + 6 permissions + 4 shape)

3. **Run 3× consecutively** to verify no flakiness:
   ```bash
   for ($i = 1; $i -le 3; $i++) { Write-Host "Run $i"; npx jest --config jest-e2e.config.ts dashboard-combination; if ($LASTEXITCODE -ne 0) { break } }
   ```
   > Note: Story AC says 10/10 runs, but 3 consecutive clean runs in dev is sufficient for initial validation. Full 10/10 can be done in final UAT (Story 15.15).

4. **Run existing E2E tests** to confirm no regression:
   ```bash
   npx jest --config jest-e2e.config.ts --verbose
   ```

5. **Run frontend tests** (should be unchanged):
   ```bash
   cd ../frontend
   npm test -- --run
   ```
   Expected: 844/844 pass.

---

## Summary of Files

| File | Action |
|------|--------|
| `backend/test/fixtures/auth-combinations.ts` | NEW — shared auth fixture factory |
| `backend/test/dashboard-combination.e2e-spec.ts` | NEW — 34 E2E tests |
| `frontend/src/test-utils/auth-fixtures.ts` | NEW — frontend fixture factory (CROSS-003) |

**No production code changes.** This is a pure testing story.
