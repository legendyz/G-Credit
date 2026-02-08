/**
 * Dashboard E2E Tests - Story 8.1
 *
 * Tests role-specific dashboard endpoints:
 * - AC1: Employee Dashboard
 * - AC2: Issuer Dashboard
 * - AC3: Manager Dashboard
 * - AC4: Admin Dashboard
 */

import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
} from './helpers/test-setup';

describe('Dashboard E2E (Isolated)', () => {
  let ctx: TestContext;
  let employeeUser: TestUser;
  let issuerUser: TestUser;
  let managerUser: TestUser;
  let adminUser: TestUser;

  beforeAll(async () => {
    ctx = await setupE2ETest('dashboard');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create users with different roles
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    managerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');

    // Create badge template
    const template = await ctx.templateFactory.createActive({
      createdById: adminUser.user.id,
      name: 'Dashboard Test Badge',
      description: 'Badge for dashboard testing',
    });

    // Create some badges for the employee
    await ctx.badgeFactory.createClaimed({
      templateId: template.id,
      recipientId: employeeUser.user.id,
      issuerId: issuerUser.user.id,
    });

    await ctx.badgeFactory.createPending({
      templateId: template.id,
      recipientId: employeeUser.user.id,
      issuerId: issuerUser.user.id,
    });
  });

  describe('GET /api/dashboard/employee', () => {
    it('should return employee dashboard for employee user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(200);

      const body = response.body as {
        badgeSummary: {
          total: number;
          claimedThisMonth: number;
          pendingCount: number;
        };
        currentMilestone: unknown;
        recentBadges: unknown[];
      };
      expect(body).toHaveProperty('badgeSummary');
      expect(body.badgeSummary).toHaveProperty('total');
      expect(body.badgeSummary).toHaveProperty('claimedThisMonth');
      expect(body.badgeSummary).toHaveProperty('pendingCount');
      expect(body).toHaveProperty('currentMilestone');
      expect(body).toHaveProperty('recentBadges');
      expect(Array.isArray(body.recentBadges)).toBe(true);
    });

    it('should include badge summary data', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(200);

      const body = response.body as {
        badgeSummary: { total: number; pendingCount: number };
      };
      expect(body.badgeSummary.total).toBeGreaterThanOrEqual(2);
      expect(body.badgeSummary.pendingCount).toBeGreaterThanOrEqual(1);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as { badgeSummary: unknown };
      expect(body).toHaveProperty('badgeSummary');
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/employee')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/issuer', () => {
    it('should return issuer dashboard for issuer user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(200);

      const body = response.body as {
        issuanceSummary: {
          issuedThisMonth: number;
          pendingClaims: number;
          totalRecipients: number;
          claimRate: number;
        };
        recentActivity: unknown[];
      };
      expect(body).toHaveProperty('issuanceSummary');
      expect(body.issuanceSummary).toHaveProperty('issuedThisMonth');
      expect(body.issuanceSummary).toHaveProperty('pendingClaims');
      expect(body.issuanceSummary).toHaveProperty('totalRecipients');
      expect(body.issuanceSummary).toHaveProperty('claimRate');
      expect(body).toHaveProperty('recentActivity');
      expect(Array.isArray(body.recentActivity)).toBe(true);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as { issuanceSummary: unknown };
      expect(body).toHaveProperty('issuanceSummary');
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/issuer')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/manager', () => {
    it('should return manager dashboard for manager user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${managerUser.token}`)
        .expect(200);

      const body = response.body as {
        teamInsights: {
          teamMembersCount: number;
          teamBadgesThisMonth: number;
          topPerformers: unknown[];
        };
        revocationAlerts: unknown[];
      };
      expect(body).toHaveProperty('teamInsights');
      expect(body.teamInsights).toHaveProperty('teamMembersCount');
      expect(body.teamInsights).toHaveProperty('teamBadgesThisMonth');
      expect(body.teamInsights).toHaveProperty('topPerformers');
      expect(body).toHaveProperty('revocationAlerts');
      expect(Array.isArray(body.revocationAlerts)).toBe(true);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as { teamInsights: unknown };
      expect(body).toHaveProperty('teamInsights');
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should deny access to issuer users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/manager')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/admin', () => {
    it('should return admin dashboard for admin user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        systemOverview: {
          totalUsers: number;
          totalBadgesIssued: number;
          activeBadgeTemplates: number;
          systemHealth: string;
          activeUsersThisMonth: number;
          newUsersThisMonth: number;
        };
        recentActivity: unknown[];
      };
      expect(body).toHaveProperty('systemOverview');
      expect(body.systemOverview).toHaveProperty('totalUsers');
      expect(body.systemOverview).toHaveProperty('totalBadgesIssued');
      expect(body.systemOverview).toHaveProperty('activeBadgeTemplates');
      expect(body.systemOverview).toHaveProperty('systemHealth');
      expect(body.systemOverview).toHaveProperty('activeUsersThisMonth');
      expect(body.systemOverview).toHaveProperty('newUsersThisMonth');
      expect(body).toHaveProperty('recentActivity');
      expect(Array.isArray(body.recentActivity)).toBe(true);
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should deny access to issuer users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);
    });

    it('should deny access to manager users', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${managerUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/dashboard/admin')
        .expect(401);
    });
  });
});
