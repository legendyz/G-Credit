/**
 * Permissions API E2E Test — Story 15.2
 *
 * [AI-Review][HIGH]: Real integration test for GET /api/users/me/permissions
 * - Validates 401 for unauthenticated requests (no JWT)
 * - Validates 200 with correct permission shape for all 6 role×manager combos
 * - Validates no PII leakage in response
 *
 * Uses the same e2e infrastructure as role-matrix.e2e-spec.ts (Story 14.8).
 */

import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
} from './helpers/test-setup';

describe('Permissions API (Story 15.2)', () => {
  let ctx: TestContext;

  // Shared tokens — created once, reused across tests
  let employeeToken: string;
  let managerToken: string;
  let issuerToken: string;
  let issuerManagerToken: string;
  let adminToken: string;
  let adminManagerToken: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('permissions-api');

    // Combo #1: EMPLOYEE, isManager=false
    const emp = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');
    employeeToken = emp.token;

    // Combo #2: EMPLOYEE + isManager=true
    const mgr = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    managerToken = mgr.token;

    // Combo #3: ISSUER, isManager=false
    const iss = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    issuerToken = iss.token;

    // Combo #4: ISSUER + isManager=true (via JwtService to stay within rate limit)
    const issuerUser = await ctx.userFactory.createIssuer({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: issuerUser.id });
    const jwtService = ctx.app.get(JwtService);
    issuerManagerToken = jwtService.sign({
      sub: issuerUser.id,
      email: issuerUser.email,
      role: issuerUser.role,
      isManager: true,
    });

    // Combo #5: ADMIN, isManager=false
    const adm = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    adminToken = adm.token;

    // Combo #6: ADMIN + isManager=true (via JwtService)
    const adminUser = await ctx.userFactory.createAdmin({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: adminUser.id });
    adminManagerToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isManager: true,
    });
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // ─── AC #5: 401 for unauthenticated ──────────────────────────────
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request (no JWT)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/users/me/permissions')
        .expect(401);
    });

    it('should return 401 for invalid JWT token', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/users/me/permissions')
        .set('Authorization', 'Bearer invalid-token-abc123')
        .expect(401);
    });
  });

  // ─── AC #9: 6 role×manager combinations (e2e) ────────────────────
  describe('Permission matrix (6 combos)', () => {
    it('Combo #1: EMPLOYEE + isManager=false', async () => {
      const res = await authRequest(ctx.app, employeeToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('EMPLOYEE');
      expect(body.isManager).toBe(false);
      expect(body.dashboardTabs).toEqual(['my-badges']);
      expect(body.sidebarGroups).toEqual(['base']);
      expect(body.permissions).toEqual({
        canViewTeam: false,
        canIssueBadges: false,
        canManageUsers: false,
      });
    });

    it('Combo #2: EMPLOYEE + isManager=true', async () => {
      const res = await authRequest(ctx.app, managerToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('EMPLOYEE');
      expect(body.isManager).toBe(true);
      expect(body.dashboardTabs).toEqual(['my-badges', 'team']);
      expect(body.sidebarGroups).toEqual(['base', 'team']);
      expect(body.permissions).toEqual({
        canViewTeam: true,
        canIssueBadges: false,
        canManageUsers: false,
      });
    });

    it('Combo #3: ISSUER + isManager=false', async () => {
      const res = await authRequest(ctx.app, issuerToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('ISSUER');
      expect(body.isManager).toBe(false);
      expect(body.dashboardTabs).toEqual(['my-badges', 'issuance']);
      expect(body.sidebarGroups).toEqual(['base', 'issuance']);
    });

    it('Combo #4: ISSUER + isManager=true', async () => {
      const res = await authRequest(ctx.app, issuerManagerToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('ISSUER');
      expect(body.isManager).toBe(true);
      expect(body.dashboardTabs).toEqual(['my-badges', 'team', 'issuance']);
      expect(body.sidebarGroups).toEqual(['base', 'team', 'issuance']);
    });

    it('Combo #5: ADMIN + isManager=false', async () => {
      const res = await authRequest(ctx.app, adminToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('ADMIN');
      expect(body.isManager).toBe(false);
      expect(body.dashboardTabs).toEqual(['my-badges', 'issuance', 'admin']);
      expect(body.sidebarGroups).toEqual(['base', 'issuance', 'admin']);
    });

    it('Combo #6: ADMIN + isManager=true', async () => {
      const res = await authRequest(ctx.app, adminManagerToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body.role).toBe('ADMIN');
      expect(body.isManager).toBe(true);
      expect(body.dashboardTabs).toEqual([
        'my-badges',
        'team',
        'issuance',
        'admin',
      ]);
      expect(body.sidebarGroups).toEqual(['base', 'team', 'issuance', 'admin']);
    });
  });

  // ─── AC #7: No PII in response ───────────────────────────────────
  describe('Security — no PII', () => {
    it('response body does NOT include email, userId, or id', async () => {
      const res = await authRequest(ctx.app, employeeToken)
        .get('/api/users/me/permissions')
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body).not.toHaveProperty('email');
      expect(body).not.toHaveProperty('userId');
      expect(body).not.toHaveProperty('id');

      // Verify only expected keys
      const keys = Object.keys(body);
      expect(keys.sort()).toEqual(
        [
          'dashboardTabs',
          'isManager',
          'permissions',
          'role',
          'sidebarGroups',
        ].sort(),
      );
    });
  });

  // ─── AC #6: Response shape validation ─────────────────────────────
  describe('Response shape', () => {
    it('returns correct DTO shape with nested permissions', async () => {
      const res = await authRequest(ctx.app, issuerManagerToken)
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

      // Type checks
      expect(typeof body.role).toBe('string');
      expect(typeof body.isManager).toBe('boolean');
      expect(Array.isArray(body.dashboardTabs)).toBe(true);
      expect(Array.isArray(body.sidebarGroups)).toBe(true);
      expect(typeof body.permissions).toBe('object');
      expect(typeof body.permissions.canViewTeam).toBe('boolean');
      expect(typeof body.permissions.canIssueBadges).toBe('boolean');
      expect(typeof body.permissions.canManageUsers).toBe('boolean');
    });
  });
});
