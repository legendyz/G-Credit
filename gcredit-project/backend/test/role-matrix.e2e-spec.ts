/**
 * Role×Manager Test Matrix — Story 14.8 (ADR-017 §7)
 *
 * Validates all 6 valid role×isManager combinations against 4 access dimensions.
 * Uses real JWT tokens from login flow (computeIsManager reads DB at login time).
 *
 * Token strategy: Logins are consolidated to stay within the auth endpoint's
 * per-IP rate limit (5 logins/min). Combos #1–#5 use real login tokens.
 * Combo #6 uses JwtService.sign() with correct claims (equivalent JWT).
 * Dashboard tests reuse combo tokens.
 *
 * Expected access matrix:
 *  #1 EMPLOYEE  isManager=false  -> profile 200, manager-only 403, issuer-only 403, admin-only 403
 *  #2 EMPLOYEE  isManager=true   -> profile 200, manager-only 200, issuer-only 403, admin-only 403
 *  #3 ISSUER    isManager=false  -> profile 200, manager-only 403, issuer-only 200, admin-only 403
 *  #4 ISSUER    isManager=true   -> profile 200, manager-only 403, issuer-only 200, admin-only 403
 *  #5 ADMIN     isManager=false  -> profile 200, manager-only 200, issuer-only 200, admin-only 200
 *  #6 ADMIN     isManager=true   -> profile 200, manager-only 200, issuer-only 200, admin-only 200
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

describe('Role-Manager Matrix (ADR-017)', () => {
  let ctx: TestContext;

  // Shared tokens — created once, reused across describe blocks
  let employeeToken: string; // Combo #1
  let managerToken: string; // Combo #2 (EMPLOYEE + isManager=true)
  let issuerToken: string; // Combo #3
  let issuerManagerToken: string; // Combo #4 (ISSUER + isManager=true)
  let adminToken: string; // Combo #5
  let adminManagerToken: string; // Combo #6 (ADMIN + isManager=true)

  beforeAll(async () => {
    ctx = await setupE2ETest('role-matrix');

    // --- Create all users and login (5 real logins, 1 JwtService token) ---

    // Combo #1: EMPLOYEE, no subordinates -> isManager=false
    const emp = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');
    employeeToken = emp.token;

    // Combo #2: EMPLOYEE + subordinate -> isManager=true (via createManager)
    const mgr = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    managerToken = mgr.token;

    // Combo #3: ISSUER, no subordinates -> isManager=false
    const iss = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    issuerToken = iss.token;

    // Combo #4: ISSUER + subordinate -> isManager=true
    const issuerUser = await ctx.userFactory.createIssuer({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: issuerUser.id });
    const issuerLoginRes = await request(ctx.app.getHttpServer() as App)
      .post('/api/auth/login')
      .send({ email: issuerUser.email, password: 'TestPassword123!' })
      .expect(200);
    issuerManagerToken = extractCookieToken(issuerLoginRes, 'access_token');

    // Combo #5: ADMIN, no subordinates -> isManager=false
    const adm = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    adminToken = adm.token;

    // Combo #6: ADMIN + subordinate -> isManager=true
    // Uses JwtService.sign() to avoid exceeding 5-login/min rate limit
    const adminUser = await ctx.userFactory.createAdmin({
      password: 'TestPassword123!',
    });
    await ctx.userFactory.createEmployee({ managerId: adminUser.id });
    const jwtService = ctx.app.get(JwtService);
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

  // ─── Combo #1: EMPLOYEE + isManager=false ──────────────────────────
  describe('Combo #1: EMPLOYEE + isManager=false', () => {
    it('profile -> 200 (dashboard)', async () => {
      await authRequest(ctx.app, employeeToken).get('/profile').expect(200);
    });

    it('manager-only -> 403 (no team access)', async () => {
      await authRequest(ctx.app, employeeToken).get('/manager-only').expect(403);
    });

    it('issuer-only -> 403 (no issue access)', async () => {
      await authRequest(ctx.app, employeeToken).get('/issuer-only').expect(403);
    });

    it('admin-only -> 403 (no admin access)', async () => {
      await authRequest(ctx.app, employeeToken).get('/admin-only').expect(403);
    });
  });

  // ─── Combo #2: EMPLOYEE + isManager=true ───────────────────────────
  describe('Combo #2: EMPLOYEE + isManager=true', () => {
    it('profile -> 200', async () => {
      await authRequest(ctx.app, managerToken).get('/profile').expect(200);
    });

    it('manager-only -> 200 (team access via isManager)', async () => {
      await authRequest(ctx.app, managerToken).get('/manager-only').expect(200);
    });

    it('issuer-only -> 403', async () => {
      await authRequest(ctx.app, managerToken).get('/issuer-only').expect(403);
    });

    it('admin-only -> 403', async () => {
      await authRequest(ctx.app, managerToken).get('/admin-only').expect(403);
    });
  });

  // ─── Combo #3: ISSUER + isManager=false ────────────────────────────
  describe('Combo #3: ISSUER + isManager=false', () => {
    it('profile -> 200', async () => {
      await authRequest(ctx.app, issuerToken).get('/profile').expect(200);
    });

    it('manager-only -> 403', async () => {
      await authRequest(ctx.app, issuerToken).get('/manager-only').expect(403);
    });

    it('issuer-only -> 200 (issue access)', async () => {
      await authRequest(ctx.app, issuerToken).get('/issuer-only').expect(200);
    });

    it('admin-only -> 403', async () => {
      await authRequest(ctx.app, issuerToken).get('/admin-only').expect(403);
    });
  });

  // ─── Combo #4: ISSUER + isManager=true ─────────────────────────────
  describe('Combo #4: ISSUER + isManager=true', () => {
    it('profile -> 200', async () => {
      await authRequest(ctx.app, issuerManagerToken).get('/profile').expect(200);
    });

    it('manager-only -> 403 (ISSUER blocked by @Roles)', async () => {
      // ISSUER+manager gets 403 because @Roles('EMPLOYEE','ADMIN') blocks ISSUER.
      // ManagerGuard never runs. This is by design — ISSUER managers use issuer endpoints.
      await authRequest(ctx.app, issuerManagerToken).get('/manager-only').expect(403);
    });

    it('issuer-only -> 200', async () => {
      await authRequest(ctx.app, issuerManagerToken).get('/issuer-only').expect(200);
    });

    it('admin-only -> 403', async () => {
      await authRequest(ctx.app, issuerManagerToken).get('/admin-only').expect(403);
    });
  });

  // ─── Combo #5: ADMIN + isManager=false ─────────────────────────────
  describe('Combo #5: ADMIN + isManager=false', () => {
    it('profile -> 200', async () => {
      await authRequest(ctx.app, adminToken).get('/profile').expect(200);
    });

    it('manager-only -> 200 (ADMIN bypass)', async () => {
      // ADMIN gets 200 even with isManager=false — ManagerGuard always allows ADMIN
      await authRequest(ctx.app, adminToken).get('/manager-only').expect(200);
    });

    it('issuer-only -> 200 (ADMIN bypass)', async () => {
      await authRequest(ctx.app, adminToken).get('/issuer-only').expect(200);
    });

    it('admin-only -> 200', async () => {
      await authRequest(ctx.app, adminToken).get('/admin-only').expect(200);
    });
  });

  // ─── Combo #6: ADMIN + isManager=true ──────────────────────────────
  describe('Combo #6: ADMIN + isManager=true', () => {
    it('profile -> 200', async () => {
      await authRequest(ctx.app, adminManagerToken).get('/profile').expect(200);
    });

    it('manager-only -> 200', async () => {
      await authRequest(ctx.app, adminManagerToken).get('/manager-only').expect(200);
    });

    it('issuer-only -> 200', async () => {
      await authRequest(ctx.app, adminManagerToken).get('/issuer-only').expect(200);
    });

    it('admin-only -> 200', async () => {
      await authRequest(ctx.app, adminManagerToken).get('/admin-only').expect(200);
    });
  });

  // ─── JWT Backward Compatibility (AC #2) ────────────────────────────
  describe('JWT backward compatibility', () => {
    it('old token without isManager is treated as isManager=false', async () => {
      const employee = await ctx.userFactory.createEmployee();

      // Sign JWT without isManager claim (simulates pre-ADR-017 token)
      const jwtService = ctx.app.get(JwtService);
      const token = jwtService.sign({
        sub: employee.id,
        email: employee.email,
        role: employee.role,
        // Note: no isManager field
      });

      // Should be treated as non-manager -> 403 on manager-only
      await authRequest(ctx.app, token).get('/manager-only').expect(403);

      // Should NOT cause 500 — graceful degradation
      await authRequest(ctx.app, token).get('/profile').expect(200);
    });
  });

  // ─── Dashboard Endpoint Matrix (Full 6-combo symmetry) ─────────────
  describe('Dashboard endpoint matrix', () => {
    it('Combo #1 EMPLOYEE -> /api/dashboard/manager -> 403', async () => {
      await authRequest(ctx.app, employeeToken).get('/api/dashboard/manager').expect(403);
    });

    it('Combo #2 EMPLOYEE+manager -> /api/dashboard/manager -> 200', async () => {
      await authRequest(ctx.app, managerToken).get('/api/dashboard/manager').expect(200);
    });

    it('Combo #3 ISSUER -> /api/dashboard/manager -> 403', async () => {
      await authRequest(ctx.app, issuerToken).get('/api/dashboard/manager').expect(403);
    });

    it('Combo #4 ISSUER+manager -> /api/dashboard/manager -> 403', async () => {
      // ISSUER blocked by @Roles('EMPLOYEE','ADMIN') before ManagerGuard
      await authRequest(ctx.app, issuerManagerToken).get('/api/dashboard/manager').expect(403);
    });

    it('Combo #5 ADMIN -> /api/dashboard/manager -> 200 (bypass)', async () => {
      await authRequest(ctx.app, adminToken).get('/api/dashboard/manager').expect(200);
    });

    it('Combo #6 ADMIN+manager -> /api/dashboard/manager -> 200', async () => {
      await authRequest(ctx.app, adminManagerToken).get('/api/dashboard/manager').expect(200);
    });
  });
});
