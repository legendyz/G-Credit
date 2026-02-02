/**
 * Badge Issuance E2E Tests (Refactored - Story 8.8)
 * TD-001: Using schema isolation and factories for parallel safety
 *
 * This is the refactored version using the new test infrastructure.
 */

import request from 'supertest';
import { RevocationReason } from '../src/badge-issuance/dto/revoke-badge.dto';
import {
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
  TestContext,
  TestUser,
} from './helpers';

// Suite name for schema isolation
const SUITE_NAME = 'badge_issuance';

describe('Badge Issuance (e2e) - Isolated', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let employeeUser: TestUser;
  let recipientUser: TestUser;
  let templateId: string;

  beforeAll(async () => {
    // Setup isolated test environment
    ctx = await setupE2ETest(SUITE_NAME);

    // Create test users using factories
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Create recipient (without login)
    recipientUser = {
      user: await ctx.userFactory.createEmployee(),
      token: '',
      credentials: { email: '', password: '' },
    };

    // Create badge template using factory
    const template = await ctx.templateFactory.createActive({
      createdById: adminUser.user.id,
      name: 'Test Achievement Badge',
    });
    templateId = template.id;
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  describe('POST /api/badges', () => {
    it('should issue badge successfully when authorized as ADMIN', async () => {
      const response = await authRequest(ctx.app, adminUser.token)
        .post('/api/badges')
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          evidenceUrl: 'https://example.com/evidence.pdf',
          expiresIn: 365,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.claimToken).toHaveLength(32);
      expect(response.body).toHaveProperty('claimUrl');
      expect(response.body).toHaveProperty('assertionUrl');
      expect(response.body.template.id).toBe(templateId);
      expect(response.body.recipient.id).toBe(recipientUser.user.id);
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should return 403 when unauthorized user (EMPLOYEE) tries to issue badge', async () => {
      await authRequest(ctx.app, employeeUser.token)
        .post('/api/badges')
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(403);
    });

    it('should return 404 when invalid template ID is provided', async () => {
      const invalidTemplateId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(ctx.app, adminUser.token)
        .post('/api/badges')
        .send({
          templateId: invalidTemplateId,
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when validation fails (invalid UUID)', async () => {
      await authRequest(ctx.app, adminUser.token)
        .post('/api/badges')
        .send({
          templateId: 'invalid-uuid',
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(400);
    });

    it('should return 400 when expiresIn is out of range', async () => {
      await authRequest(ctx.app, adminUser.token)
        .post('/api/badges')
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          expiresIn: 5000, // Max is 3650
        })
        .expect(400);
    });
  });

  describe('POST /api/badges/:id/claim', () => {
    let validBadgeId: string;
    let validClaimToken: string;

    beforeEach(async () => {
      // Issue a fresh badge for each claim test using factory
      const badge = await ctx.badgeFactory.createPending({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
      validBadgeId = badge.id;
      validClaimToken = badge.claimToken;
    });

    it('should claim badge with valid token (PUBLIC endpoint - no auth required)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(201);

      expect(response.body.status).toBe('CLAIMED');
      expect(response.body.claimedAt).toBeDefined();
      expect(response.body.message).toContain('successfully');
      expect(response.body.assertionUrl).toContain(validBadgeId);
    });

    it('should return 400 for invalid claim token', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: 'invalid-token-' + 'x'.repeat(19), // 32 chars total
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 404 when badge claim token already used (one-time use)', async () => {
      // First claim
      await request(ctx.app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({ claimToken: validClaimToken })
        .expect(201);

      // Second claim attempt - token has been cleared
      const response = await request(ctx.app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({ claimToken: validClaimToken })
        .expect(404); // Token no longer exists in DB

      expect(response.body.message).toContain('Invalid claim token');
    });
  });

  describe('POST /api/badges/:id/revoke', () => {
    let claimedBadgeId: string;

    beforeEach(async () => {
      // Create a claimed badge using factory
      const badge = await ctx.badgeFactory.createClaimed({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
      claimedBadgeId = badge.id;
    });

    it('should revoke badge when authorized as ADMIN', async () => {
      const response = await authRequest(ctx.app, adminUser.token)
        .post(`/api/badges/${claimedBadgeId}/revoke`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
          notes: 'Test revocation reason',
        })
        .expect(200); // Story 9.1: Revoke returns 200 OK, not 201

      expect(response.body.badge.status).toBe('REVOKED');
      expect(response.body.badge.revokedAt).toBeDefined();
      expect(response.body.badge.revocationReason).toBe(
        RevocationReason.POLICY_VIOLATION,
      );
    });

    it('should return 403 when EMPLOYEE tries to revoke', async () => {
      await authRequest(ctx.app, employeeUser.token)
        .post(`/api/badges/${claimedBadgeId}/revoke`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
        })
        .expect(403);
    });

    it('should return 400 when reason is not provided', async () => {
      await authRequest(ctx.app, adminUser.token)
        .post(`/api/badges/${claimedBadgeId}/revoke`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/badges/issued', () => {
    beforeAll(async () => {
      // Create several badges for list testing
      await ctx.badgeFactory.createClaimed({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
      await ctx.badgeFactory.createPending({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
    });

    it('should return list of badges for ADMIN', async () => {
      const response = await authRequest(ctx.app, adminUser.token)
        .get('/api/badges/issued') // Correct endpoint
        .expect(200);

      // getIssuedBadges returns: { badges: [], total, page, limit, totalPages }
      expect(Array.isArray(response.body.badges)).toBe(true);
      expect(response.body.badges.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should return 403 for EMPLOYEE listing all badges', async () => {
      await authRequest(ctx.app, employeeUser.token)
        .get('/api/badges/issued') // Correct endpoint
        .expect(403);
    });
  });
});
