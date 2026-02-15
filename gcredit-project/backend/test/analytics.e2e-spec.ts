import request from 'supertest';
import { App } from 'supertest/types';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
  extractCookieToken,
} from './helpers/test-setup';

jest.setTimeout(30000);

/**
 * Story 8.4: Analytics API (E2E Tests)
 *
 * Tests for:
 * - AC1: System Overview API (Admin only)
 * - AC2: Issuance Trends API (Admin + Issuer)
 * - AC3: Top Performers API (Admin + Manager)
 * - AC4: Skills Distribution API (Admin only)
 * - AC5: Recent Activity API (Admin only)
 */
describe('Analytics API (e2e) - Story 8.4', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let managerUser: TestUser;
  let employeeUser: TestUser;

  beforeAll(async () => {
    ctx = await setupE2ETest('analytics-api');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create test users with different roles
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    managerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'manager');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Update manager with department for AC3 testing
    await ctx.prisma.user.update({
      where: { id: managerUser.user.id },
      data: { department: 'Engineering' },
    });

    // Create test template
    const template = await ctx.templateFactory.createTemplate({
      name: 'Analytics Test Badge',
      description: 'Badge for analytics testing',
      imageUrl: 'https://example.com/badge.png',
      status: 'ACTIVE',
      category: 'technical',
      createdById: issuerUser.user.id,
      issuanceCriteria: { description: 'Test' },
    });

    // Create test badge for trends
    await ctx.badgeFactory.createClaimed({
      templateId: template.id,
      recipientId: employeeUser.user.id,
      issuerId: issuerUser.user.id,
    });

    // Create audit log entry for AC5
    await ctx.prisma.auditLog.create({
      data: {
        entityType: 'Badge',
        entityId: 'test-badge-id',
        action: 'ISSUED',
        actorId: issuerUser.user.id,
        actorEmail: issuerUser.user.email,
        metadata: {
          recipientName: 'Test User',
          templateName: 'Analytics Test Badge',
        },
      },
    });
  });

  describe('AC1: GET /api/analytics/system-overview', () => {
    it('should return system overview for Admin', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/system-overview')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        users: { total: number; byRole: unknown };
        badges: { totalIssued: number; claimRate: number };
        badgeTemplates: unknown;
        systemHealth: { status: string };
      };
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('badges');
      expect(body).toHaveProperty('badgeTemplates');
      expect(body).toHaveProperty('systemHealth');

      // Validate structure
      expect(body.users).toHaveProperty('total');
      expect(body.users).toHaveProperty('byRole');
      expect(body.badges).toHaveProperty('totalIssued');
      expect(body.badges).toHaveProperty('claimRate');
      expect(body.systemHealth.status).toBe('healthy');
    });

    it('should reject non-admin users (403)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/system-overview')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);

      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/system-overview')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });
  });

  describe('AC2: GET /api/analytics/issuance-trends', () => {
    it('should return trends for Admin with period parameter', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/issuance-trends?period=30')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        period: string;
        dataPoints: unknown[];
        totals: unknown;
      };
      expect(body.period).toBe('last30days');
      expect(body).toHaveProperty('dataPoints');
      expect(body).toHaveProperty('totals');
      expect(Array.isArray(body.dataPoints)).toBe(true);
    });

    it('should allow Issuer to view their own trends', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/issuance-trends?period=7')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(200);

      const body = response.body as { period: string };
      expect(body.period).toBe('last7days');
    });

    it('should reject Employee access (403)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/issuance-trends?period=30')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });
  });

  describe('AC3: GET /api/analytics/top-performers', () => {
    it('should return top performers for Admin', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/top-performers?limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        topPerformers: unknown[];
        period: string;
      };
      expect(body).toHaveProperty('topPerformers');
      expect(body.period).toBe('allTime');
      expect(Array.isArray(body.topPerformers)).toBe(true);
    });

    it('should allow Manager to view team performers', async () => {
      // Create a new manager with a department
      const freshManagerUser = await ctx.userFactory.createManager({
        password: 'TestPassword123!',
        department: 'Marketing',
      });

      // Login the manager
      const loginResponse = await request(ctx.app.getHttpServer() as App)
        .post('/api/auth/login')
        .send({ email: freshManagerUser.email, password: 'TestPassword123!' })
        .expect(200);

      // Story 11.25: Extract token from Set-Cookie header (no longer in body)
      const freshManagerToken = extractCookieToken(
        loginResponse,
        'access_token',
      );

      // Manager can access their own team
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/top-performers?limit=5')
        .set('Authorization', `Bearer ${freshManagerToken}`)
        .expect(200);

      const body = response.body as { topPerformers: unknown[] };
      expect(body).toHaveProperty('topPerformers');
    });

    it('should reject Employee access (403)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/top-performers')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });
  });

  describe('AC4: GET /api/analytics/skills-distribution', () => {
    it('should return skills distribution for Admin', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/skills-distribution')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        totalSkills: number;
        topSkills: unknown[];
        skillsByCategory: unknown;
      };
      expect(body).toHaveProperty('totalSkills');
      expect(body).toHaveProperty('topSkills');
      expect(body).toHaveProperty('skillsByCategory');
      expect(Array.isArray(body.topSkills)).toBe(true);
    });

    it('should reject non-admin users (403)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/skills-distribution')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);

      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/skills-distribution')
        .set('Authorization', `Bearer ${managerUser.token}`)
        .expect(403);
    });
  });

  describe('AC5: GET /api/analytics/recent-activity', () => {
    it('should return paginated activity feed for Admin', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/recent-activity?limit=20&offset=0')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        activities: Array<{ type: string; actor: string; timestamp: string }>;
        pagination: { total: number; limit: number; offset: number };
      };
      expect(body).toHaveProperty('activities');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.activities)).toBe(true);
      expect(body.pagination).toHaveProperty('total');
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.offset).toBe(0);

      // Should have at least the audit log we created
      if (body.activities.length > 0) {
        expect(body.activities[0]).toHaveProperty('type');
        expect(body.activities[0]).toHaveProperty('actor');
        expect(body.activities[0]).toHaveProperty('timestamp');
      }
    });

    it('should reject non-admin users (403)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get('/api/analytics/recent-activity')
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .expect(403);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        '/api/analytics/system-overview',
        '/api/analytics/issuance-trends',
        '/api/analytics/top-performers',
        '/api/analytics/skills-distribution',
        '/api/analytics/recent-activity',
      ];

      for (const endpoint of endpoints) {
        await request(ctx.app.getHttpServer() as App)
          .get(endpoint)
          .expect(401);
      }
    });
  });
});
