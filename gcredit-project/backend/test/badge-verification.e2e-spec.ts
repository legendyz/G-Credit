import request from 'supertest';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
} from './helpers/test-setup';

/**
 * Badge Verification E2E Tests - Story 6.2, 6.3, 9.2 (Isolated)
 * 
 * Story 8.8: Test Isolation - Refactored for parallel execution
 * 
 * Tests:
 * - Story 6.2: Public badge verification endpoint
 * - Story 6.3: Open Badges 2.0 JSON-LD response format
 * - Story 9.2: Revoked badge display
 */
describe('Badge Verification E2E (Isolated)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let recipientUser: TestUser;
  
  // Badge IDs for tests
  let templateId: string;
  let activeBadgeVerificationId: string;
  let revokedBadgeVerificationId: string;
  let expiredBadgeVerificationId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('badge-verification');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create users
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    recipientUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'employee');

    // Create badge template
    const template = await ctx.templateFactory.createActive({
      createdById: adminUser.user.id,
      name: 'Verification Test Badge',
      description: 'Badge for testing public verification',
    });
    templateId = template.id;

    // Create active badge
    const activeBadge = await ctx.badgeFactory.createClaimed({
      templateId: template.id,
      recipientId: recipientUser.user.id,
      issuerId: adminUser.user.id,
    });
    activeBadgeVerificationId = activeBadge.verificationId;

    // Create revoked badge
    const revokedBadge = await ctx.badgeFactory.createRevoked({
      templateId: template.id,
      recipientId: recipientUser.user.id,
      issuerId: adminUser.user.id,
      revocationReason: 'Test revocation for E2E testing',
    });
    revokedBadgeVerificationId = revokedBadge.verificationId;

    // Create expired badge
    const expiredBadge = await ctx.badgeFactory.createExpired({
      templateId: template.id,
      recipientId: recipientUser.user.id,
      issuerId: adminUser.user.id,
    });
    expiredBadgeVerificationId = expiredBadge.verificationId;
  });

  describe('GET /api/verify/:verificationId', () => {
    it('should verify active badge (PUBLIC - no auth)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Story 6.3: Response is Open Badges 2.0 assertion + metadata
      expect(response.body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
      expect(response.body).toHaveProperty('type', 'Assertion');
      expect(response.body).toHaveProperty('badge');
      expect(response.body.badge).toMatch(/\/api\/badge-templates\//);
      
      // Story 6.3: Verification metadata
      expect(response.body).toHaveProperty('verificationStatus');
      expect(response.body).toHaveProperty('verifiedAt');
      
      // Story 6.2: Badge details in _meta
      expect(response.body._meta.badge).toHaveProperty('name');
      expect(response.body._meta.badge).toHaveProperty('description');
    });

    it('should return 410 for revoked badge with revocation details', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${revokedBadgeVerificationId}`)
        .expect(200); // Story 6.3: Returns 200 with revoked status

      expect(response.body).toHaveProperty('verificationStatus', 'revoked');
      expect(response.body).toHaveProperty('revoked', true);
      expect(response.body).toHaveProperty('revokedAt');
      expect(response.body).toHaveProperty('revocationReason', 'Test revocation for E2E testing');
      expect(response.body).toHaveProperty('verifiedAt');
    });

    it('should return badge data for expired badge', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${expiredBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('verificationStatus', 'expired');
      expect(response.body).toHaveProperty('verifiedAt');
      expect(response.body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
    });

    it('should return 404 for invalid verificationId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should not require authentication (PUBLIC endpoint)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('@context');
    });

    it('should mask recipient email for privacy', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Email should be masked
      expect(response.body._meta.recipient.email).toMatch(/\*\*\*/);
    });

    it('should include Open Badges 2.0 JSON-LD assertion', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body['@context']).toBe('https://w3id.org/openbadges/v2');
      expect(response.body.type).toBe('Assertion');
      expect(response.body.badge).toMatch(/\/api\/badge-templates\//);
    });

    it('should return verificationStatus and verifiedAt timestamp', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('verificationStatus');
      expect(['valid', 'expired', 'revoked']).toContain(response.body.verificationStatus);
      expect(response.body).toHaveProperty('verifiedAt');
      
      const verifiedAt = new Date(response.body.verifiedAt);
      expect(verifiedAt.getTime()).toBeGreaterThan(0);
    });

    it('should set Cache-Control header for valid badges', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toMatch(/public.*max-age=3600/);
    });

    it('should set no-cache headers for revoked badges', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/api/verify/${revokedBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toMatch(/no-cache/);
      
      // Story 9.2: Also verify revocation details are returned
      expect(response.body.verificationStatus).toBe('revoked');
      expect(response.body.revoked).toBe(true);
      expect(response.body.revokedAt).toBeDefined();
      expect(response.body.revocationReason).toBeDefined();
      expect(response.body).toHaveProperty('isValid');
      expect(response.body.isValid).toBe(false);
      expect(response.body).toHaveProperty('isPublicReason');
      expect(typeof response.body.isPublicReason).toBe('boolean');
    });
  });
});
