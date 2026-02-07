/**
 * Badge Issuance E2E Tests (Refactored with Story 8.8 Isolation)
 *
 * Uses schema-based isolation to prevent data conflicts in parallel execution.
 */
import request from 'supertest';
import { App } from 'supertest/types';
import { RevocationReason } from '../src/badge-issuance/dto/revoke-badge.dto';
import {
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestContext,
  TestUser,
} from './helpers';

// Increase timeout for email sending tests
jest.setTimeout(30000);

const SUITE_NAME = 'badge_issuance_main';

describe('Badge Issuance (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let employeeUser: TestUser;
  let recipientUser: TestUser;
  let issuerUser: TestUser;
  let templateId: string;

  beforeAll(async () => {
    // Setup isolated test environment
    ctx = await setupE2ETest(SUITE_NAME);

    // Create test users
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );
    recipientUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');

    // Create badge template
    const template = await ctx.templateFactory.createActive({
      createdById: adminUser.user.id,
      name: 'Test Achievement',
      description: 'Test badge for E2E testing',
    });
    templateId = template.id;
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  describe('POST /api/badges', () => {
    it('should issue badge successfully when authorized as ADMIN', () => {
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          evidenceUrl: 'https://example.com/evidence.pdf',
          expiresIn: 365,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as {
            id: string;
            status: string;
            claimToken: string;
            claimUrl: string;
            assertionUrl: string;
            template: { id: string };
            recipient: { id: string };
            expiresAt: string;
          };
          expect(body).toHaveProperty('id');
          expect(body.status).toBe('PENDING');
          expect(body.claimToken).toHaveLength(32);
          expect(body).toHaveProperty('claimUrl');
          expect(body).toHaveProperty('assertionUrl');
          expect(body.template.id).toBe(templateId);
          expect(body.recipient.id).toBe(recipientUser.user.id);
          expect(body).toHaveProperty('expiresAt');
        });
    });

    it('should return 403 when unauthorized user (EMPLOYEE) tries to issue badge', () => {
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(403);
    });

    it('should return 404 when invalid template ID is provided', () => {
      const invalidTemplateId = '00000000-0000-0000-0000-000000000000';
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: invalidTemplateId,
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(404)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('not found');
        });
    });

    it('should return 400 when validation fails (invalid UUID)', () => {
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: 'invalid-uuid',
          recipientId: recipientUser.user.id,
          expiresIn: 365,
        })
        .expect(400);
    });

    it('should return 400 when expiresIn is out of range', () => {
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
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
      // Issue a fresh badge for each claim test
      const issueResponse = await request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          evidenceUrl: 'https://example.com/evidence.pdf',
          expiresIn: 365,
        });

      const issueBody = issueResponse.body as {
        id: string;
        claimToken: string;
      };
      validBadgeId = issueBody.id;
      validClaimToken = issueBody.claimToken;
    });

    it('should claim badge with valid token (PUBLIC endpoint - no auth required)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(201);

      const body = response.body as {
        status: string;
        claimedAt: string;
        badge: { name: string };
        message: string;
        assertionUrl: string;
      };
      expect(body.status).toBe('CLAIMED');
      expect(body.claimedAt).toBeDefined();
      expect(body.badge.name).toBe('Test Achievement');
      expect(body.message).toContain('successfully');
      expect(body.assertionUrl).toContain(validBadgeId);
    });

    it('should return 400 for invalid claim token', () => {
      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: 'invalid-token-' + 'x'.repeat(19), // 32 chars total
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toBeDefined();
        });
    });

    it('should return 404 when trying to use already-claimed token (one-time use)', async () => {
      // Claim once
      await request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(201);

      // Try to claim again with same token (should fail - token is cleared after claim)
      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(404)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('Invalid claim token');
        });
    });

    it('should return 410 for expired claim token (>7 days)', async () => {
      // Manually set badge issuedAt to 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      await ctx.prisma.badge.update({
        where: { id: validBadgeId },
        data: { issuedAt: eightDaysAgo },
      });

      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(410)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('Claim token has expired');
        });
    });
  });

  describe('GET /api/badges/my-badges', () => {
    let badge1Id: string;

    beforeAll(async () => {
      // Issue 2 badges to recipient
      const issueResponse1 = await request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          evidenceUrl: 'https://example.com/evidence1.pdf',
          expiresIn: 365,
        });
      const issue1Body = issueResponse1.body as {
        id: string;
        claimToken: string;
      };
      badge1Id = issue1Body.id;

      await request(ctx.app.getHttpServer() as App)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          templateId: templateId,
          recipientId: recipientUser.user.id,
          evidenceUrl: 'https://example.com/evidence2.pdf',
          expiresIn: 365,
        });

      // Claim one badge
      await request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badge1Id}/claim`)
        .send({
          claimToken: issue1Body.claimToken,
        })
        .expect(201);
    });

    it('should return paginated badges for current user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/badges/my-badges')
        .set('Authorization', `Bearer ${recipientUser.token}`)
        .expect(200);

      const body = response.body as {
        data: Array<{
          id: string;
          status: string;
          issuedAt: string;
          template: { name: string };
          issuer: { name: string };
        }>;
        pagination: { page: number; limit: number; totalCount: number };
      };
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.totalCount).toBeGreaterThanOrEqual(2);

      // Check badge structure
      const badge = body.data[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('status');
      expect(badge).toHaveProperty('issuedAt');
      expect(badge).toHaveProperty('template');
      expect(badge.template).toHaveProperty('name');
      expect(badge).toHaveProperty('issuer');
      expect(badge.issuer).toHaveProperty('name');
    });

    it('should filter badges by status', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/badges/my-badges')
        .query({ status: 'CLAIMED' })
        .set('Authorization', `Bearer ${recipientUser.token}`)
        .expect(200);

      const body = response.body as {
        data: Array<{ status: string }>;
      };
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(1);

      // All badges should be CLAIMED
      body.data.forEach((badge: { status: string }) => {
        expect(badge.status).toBe('CLAIMED');
      });
    });
  });

  describe('GET /api/badges/issued', () => {
    // Uses badges created in previous tests - no additional setup needed

    it('should return badges issued by ADMIN user', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get('/api/badges/issued')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const body = response.body as {
        badges: Array<{
          id: string;
          status: string;
          recipient: { email: string };
        }>;
        total: number;
      };
      expect(body.badges).toBeInstanceOf(Array);
      expect(body.badges.length).toBeGreaterThanOrEqual(1);
      expect(body).toHaveProperty('total');

      // Check badge structure includes recipient
      const badge = body.badges[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('status');
      expect(badge).toHaveProperty('recipient');
      expect(badge.recipient).toHaveProperty('email');
    });

    it('should return 403 for EMPLOYEE trying to access issued badges', async () => {
      return request(ctx.app.getHttpServer() as App)
        .get('/api/badges/issued')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .expect(403);
    });
  });

  describe('POST /api/badges/:id/revoke', () => {
    let badgeToRevoke: string;

    beforeEach(async () => {
      // Use factory to create badge directly (avoids rate limiting)
      const badge = await ctx.badgeFactory.createPending({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
      badgeToRevoke = badge.id;
    });

    it('should revoke badge successfully (ADMIN)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          reason: RevocationReason.ISSUED_IN_ERROR,
          notes: 'Badge issued in error - recipient did not meet criteria',
        })
        .expect(200);

      const body = response.body as {
        badge: { status: string; revokedAt: string; revocationReason: string };
        message: string;
      };
      expect(body.badge.status).toBe('REVOKED');
      expect(body.badge.revokedAt).toBeDefined();
      expect(body.badge.revocationReason).toBe(
        RevocationReason.ISSUED_IN_ERROR,
      );
      expect(body.message).toContain('revoked successfully');
    });

    it('should return 403 for non-ADMIN user (ISSUER trying to revoke others badge)', async () => {
      // ISSUER should get 403 when trying to revoke another issuer's badge
      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${issuerUser.token}`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
          notes: "Attempting to revoke another issuer's badge",
        })
        .expect(403);
    });

    it('should return 200 with alreadyRevoked flag if badge already revoked (idempotency)', async () => {
      // Revoke once
      await request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
        })
        .expect(200);

      // Try to revoke again - should return 200 OK with alreadyRevoked flag
      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          reason: RevocationReason.DUPLICATE,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            message: string;
            badge: { alreadyRevoked: boolean };
          };
          expect(body.message).toContain('already revoked');
          expect(body.badge.alreadyRevoked).toBe(true);
        });
    });

    it('should return 400 if notes exceed max length', async () => {
      return request(ctx.app.getHttpServer() as App)
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          reason: RevocationReason.OTHER,
          notes: 'a'.repeat(1001), // Exceeds 1000 char limit
        })
        .expect(400);
    });
  });

  describe('GET /api/badges/:id/assertion', () => {
    it('should return assertion for active badge (PUBLIC)', async () => {
      // Use factory to create badge directly (avoids rate limiting)
      const activeBadge = await ctx.badgeFactory.createPending({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
      });
      const activeBadgeId = activeBadge.id;

      const response = await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${activeBadgeId}/assertion`)
        .expect(200);

      const body = response.body as {
        '@context': string;
        type: string;
        id: string;
        badge: string;
        recipient: {
          type: string;
          hashed: boolean;
          salt: string;
          identity: string;
        };
        verification: { type: string; verificationUrl: string };
        issuedOn: string;
      };
      // Sprint 5 Story 6.1: Validate Open Badges 2.0 JSON-LD structure
      expect(body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
      expect(body).toHaveProperty('type', 'Assertion');
      expect(body).toHaveProperty('id');
      expect(body.id).toMatch(/\/api\/badges\/.+\/assertion$/);

      // Badge should be URL string (not embedded object)
      expect(body).toHaveProperty('badge');
      expect(typeof body.badge).toBe('string');
      expect(body.badge).toMatch(/\/api\/badge-templates\/.+$/);

      // Recipient should be hashed
      expect(body.recipient).toHaveProperty('type', 'email');
      expect(body.recipient).toHaveProperty('hashed', true);
      expect(body.recipient).toHaveProperty('salt');
      expect(body.recipient).toHaveProperty('identity');
      expect(body.recipient.identity).toMatch(/^sha256\$/);

      // Verification (hosted type)
      expect(body.verification).toHaveProperty('type', 'hosted');
      expect(body.verification).toHaveProperty('verificationUrl');
      expect(body.verification.verificationUrl).toMatch(/\/verify\/.+$/);

      // Issuance date
      expect(body).toHaveProperty('issuedOn');
      expect(new Date(body.issuedOn).getTime()).toBeGreaterThan(0);
    });

    it('should return 410 for revoked badge', async () => {
      // Use factory to create revoked badge directly (avoids rate limiting)
      const revokedBadge = await ctx.badgeFactory.createRevoked({
        templateId: templateId,
        recipientId: recipientUser.user.id,
        issuerId: adminUser.user.id,
        revocationReason: 'Test revocation for assertion endpoint',
      });
      const revokedBadgeId = revokedBadge.id;

      return request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${revokedBadgeId}/assertion`)
        .expect(410)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('revoked');
        });
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${fakeId}/assertion`)
        .expect(404);
    });
  });

  describe('POST /api/badges/bulk', () => {
    it('should issue badges from valid CSV', async () => {
      // Create CSV content with 2 valid badges using actual test user emails
      const csvContent = `recipientEmail,templateId,evidenceUrl,expiresIn
${recipientUser.user.email},${templateId},https://example.com/evidence1.pdf,365
${employeeUser.user.email},${templateId},https://example.com/evidence2.pdf,730`;

      const response = await request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .attach('file', Buffer.from(csvContent), 'badges.csv')
        .expect(201);

      const body = response.body as {
        total: number;
        successful: number;
        failed: number;
        results: { success: boolean; badgeId?: string }[];
      };
      expect(body.total).toBe(2);
      expect(body.successful).toBe(2);
      expect(body.failed).toBe(0);
      expect(body.results).toHaveLength(2);
      expect(body.results[0].success).toBe(true);
      expect(body.results[0].badgeId).toBeDefined();
      expect(body.results[1].success).toBe(true);
    });

    it('should reject invalid CSV format (missing headers)', async () => {
      const csvContent = `email,template
test@example.com,${templateId}`;

      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv')
        .expect(400)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('CSV parsing failed');
          expect(body.message).toContain('Missing required headers');
        });
    });

    it('should handle partial failures gracefully', async () => {
      const csvContent = `recipientEmail,templateId,evidenceUrl
${recipientUser.user.email},${templateId},https://example.com/valid.pdf
nonexistent-${Date.now()}@test.com,${templateId},https://example.com/fail.pdf
${employeeUser.user.email},00000000-0000-0000-0000-000000000000,https://example.com/badtemplate.pdf`;

      const response = await request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .attach('file', Buffer.from(csvContent), 'mixed.csv')
        .expect(201);

      const body = response.body as {
        total: number;
        successful: number;
        failed: number;
        results: {
          success: boolean;
          email?: string;
          badgeId?: string;
          error?: string;
        }[];
      };
      expect(body.total).toBe(3);
      expect(body.successful).toBe(1);
      expect(body.failed).toBe(2);

      // Check successful row
      const successRow = body.results.find(
        (r: { success: boolean }) => r.success,
      );
      expect(successRow).toBeDefined();
      expect(successRow!.email).toBe(recipientUser.user.email);
      expect(successRow!.badgeId).toBeDefined();

      // Check failed rows have error messages
      const failedRows = body.results.filter(
        (r: { success: boolean }) => !r.success,
      );
      expect(failedRows).toHaveLength(2);
      expect(failedRows[0].error).toBeDefined();
      expect(failedRows[1].error).toBeDefined();
    });

    it('should return 403 for non-authorized user (EMPLOYEE)', async () => {
      const csvContent = `recipientEmail,templateId
test@example.com,${templateId}`;

      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${employeeUser.token}`)
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(403);
    });

    it('should return 400 when no file is uploaded', async () => {
      return request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(400)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('CSV file is required');
        });
    });

    it('should validate email format in CSV', async () => {
      const csvContent = `recipientEmail,templateId
invalid-email,${templateId}
${recipientUser.user.email},${templateId}`;

      const response = await request(ctx.app.getHttpServer() as App)
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .attach('file', Buffer.from(csvContent), 'invalid-email.csv')
        .expect(400);

      const body = response.body as { message: string };
      expect(body.message).toContain('CSV parsing failed');
      expect(body.message).toContain('Invalid email');
    });
  });
});
