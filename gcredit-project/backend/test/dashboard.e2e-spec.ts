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
  let templateId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('dashboard');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create users with different roles
    employeeUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    managerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');

    // Create badge template
    const template = await ctx.templateFactory.createActive({
      createdById: adminUser.user.id,
      name: 'Dashboard Test Badge',
      description: 'Badge for dashboard testing',
    });
    templateId = template.id;

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
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('badgeSummary');
      expect(response.body.badgeSummary).toHaveProperty('total');
      expect(response.body.badgeSummary).toHaveProperty('claimedThisMonth');
      expect(response.body.badgeSummary).toHaveProperty('pendingCount');
      expect(response.body).toHaveProperty('currentMilestone');
      expect(response.body).toHaveProperty('recentBadges');
      expect(Array.isArray(response.body.recentBadges)).toBe(true);
    });

    it('should include badge summary data', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(200);

      expect(response.body.badgeSummary.total).toBeGreaterThanOrEqual(2);
      expect(response.body.badgeSummary.pendingCount).toBeGreaterThanOrEqual(1);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('badgeSummary');
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/employee')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/issuer', () => {
    it('should return issuer dashboard for issuer user', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('issuanceSummary');
      expect(response.body.issuanceSummary).toHaveProperty('issuedThisMonth');
      expect(response.body.issuanceSummary).toHaveProperty('pendingClaims');
      expect(response.body.issuanceSummary).toHaveProperty('totalRecipients');
      expect(response.body.issuanceSummary).toHaveProperty('claimRate');
      expect(response.body).toHaveProperty('recentActivity');
      expect(Array.isArray(response.body.recentActivity)).toBe(true);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('issuanceSummary');
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/issuer')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/issuer')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/manager', () => {
    it('should return manager dashboard for manager user', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${managerUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('teamInsights');
      expect(response.body.teamInsights).toHaveProperty('teamMembersCount');
      expect(response.body.teamInsights).toHaveProperty('teamBadgesThisMonth');
      expect(response.body.teamInsights).toHaveProperty('topPerformers');
      expect(response.body).toHaveProperty('revocationAlerts');
      expect(Array.isArray(response.body.revocationAlerts)).toBe(true);
    });

    it('should be accessible by admin users', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('teamInsights');
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should deny access to issuer users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/manager')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/admin', () => {
    it('should return admin dashboard for admin user', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('systemOverview');
      expect(response.body.systemOverview).toHaveProperty('totalUsers');
      expect(response.body.systemOverview).toHaveProperty('totalBadgesIssued');
      expect(response.body.systemOverview).toHaveProperty('activeBadgeTemplates');
      expect(response.body.systemOverview).toHaveProperty('systemHealth');
      expect(response.body.systemOverview).toHaveProperty('activeUsersThisMonth');
      expect(response.body.systemOverview).toHaveProperty('newUsersThisMonth');
      expect(response.body).toHaveProperty('recentActivity');
      expect(Array.isArray(response.body.recentActivity)).toBe(true);
    });

    it('should deny access to employee users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });

    it('should deny access to issuer users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);
    });

    it('should deny access to manager users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${managerUser.token}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/dashboard/admin')
        .expect(401);
    });
  });
});
