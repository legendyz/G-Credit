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
 * ENV: THROTTLE_TTL_SECONDS=60 THROTTLE_LIMIT=1000 (.env.test)
 */

import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  extractCookieToken,
  authRequest,
} from './helpers/test-setup';
import { AUTH_COMBINATIONS, AuthCombo } from './fixtures/auth-combinations';

// Azure DB + prisma push + 5 real logins need generous timeout
jest.setTimeout(120_000);

describe('Dashboard × Permissions Combination (Story 15.4)', () => {
  let ctx: TestContext;
  const tokens: Map<string, string> = new Map();

  beforeAll(async () => {
    ctx = await setupE2ETest('dashboard-combo');

    // Combo #1: EMPLOYEE, no subordinates → isManager=false
    const emp = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');
    tokens.set('EMPLOYEE-false', emp.token);

    // Combo #2: EMPLOYEE + subordinate → isManager=true (via createManager)
    const mgr = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    tokens.set('EMPLOYEE-true', mgr.token);

    // Combo #3: ISSUER, no subordinates → isManager=false
    const iss = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    tokens.set('ISSUER-false', iss.token);

    // Combo #4: ISSUER + subordinate → isManager=true
    const issuerUser = await ctx.userFactory.createIssuer({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: issuerUser.id });
    const issuerLoginRes = await request(ctx.app.getHttpServer() as App)
      .post('/api/auth/login')
      .send({ email: issuerUser.email, password: 'TestPassword123!' })
      .expect(200);
    tokens.set(
      'ISSUER-true',
      extractCookieToken(issuerLoginRes, 'access_token'),
    );

    // Combo #5: ADMIN, no subordinates → isManager=false
    const adm = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    tokens.set('ADMIN-false', adm.token);

    // Combo #6: ADMIN + subordinate → isManager=true
    // Uses JwtService.sign() to avoid exceeding rate limit
    const adminUser = await ctx.userFactory.createAdmin({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: adminUser.id });
    const jwtService = ctx.app.get(JwtService);
    tokens.set(
      'ADMIN-true',
      jwtService.sign({
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isManager: true,
      }),
    );
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // ─── Block 1: Dashboard Endpoint Access Matrix (24 tests) ──────────
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

  // ─── Block 2: Permissions API Verification (6 tests) ──────────────
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
          permissions: {
            canViewTeam: boolean;
            canIssueBadges: boolean;
            canManageUsers: boolean;
          };
        };

        expect(body.dashboardTabs).toEqual(combo.expected.dashboardTabs);
        expect(body.sidebarGroups).toEqual(combo.expected.sidebarGroups);
        expect(body.permissions).toMatchObject(combo.expected.permissions);
      });
    });
  });

  // ─── Block 3: Dashboard Response Shape Validation (4 tests) ────────
  describe('Response shape validation', () => {
    it('employee endpoint returns badgeSummary + recentBadges', async () => {
      const token = tokens.get('EMPLOYEE-false')!;
      const res = await authRequest(ctx.app, token)
        .get('/api/dashboard/employee')
        .expect(200);

      const body = res.body as {
        badgeSummary: unknown;
        recentBadges: unknown[];
      };
      expect(body).toHaveProperty('badgeSummary');
      expect(body).toHaveProperty('recentBadges');
      expect(Array.isArray(body.recentBadges)).toBe(true);
    });

    it('manager endpoint returns teamInsights', async () => {
      const token = tokens.get('EMPLOYEE-true')!;
      const res = await authRequest(ctx.app, token)
        .get('/api/dashboard/manager')
        .expect(200);

      const body = res.body as { teamInsights: unknown };
      expect(body).toHaveProperty('teamInsights');
    });

    it('issuer endpoint returns issuanceSummary + recentActivity', async () => {
      const token = tokens.get('ISSUER-false')!;
      const res = await authRequest(ctx.app, token)
        .get('/api/dashboard/issuer')
        .expect(200);

      const body = res.body as {
        issuanceSummary: unknown;
        recentActivity: unknown[];
      };
      expect(body).toHaveProperty('issuanceSummary');
      expect(body).toHaveProperty('recentActivity');
      expect(Array.isArray(body.recentActivity)).toBe(true);
    });

    it('admin endpoint returns systemOverview', async () => {
      const token = tokens.get('ADMIN-false')!;
      const res = await authRequest(ctx.app, token)
        .get('/api/dashboard/admin')
        .expect(200);

      const body = res.body as { systemOverview: unknown };
      expect(body).toHaveProperty('systemOverview');
    });
  });
});
