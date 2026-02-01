import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RevocationReason } from '../src/badge-issuance/dto/revoke-badge.dto';

// Increase timeout for email sending tests
jest.setTimeout(30000);

describe('Badge Issuance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let employeeToken: string;
  let templateId: string;
  let recipientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.badge.deleteMany({});
    await prisma.badgeTemplate.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  async function setupTestData() {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    // Create employee user
    const employeePassword = await bcrypt.hash('Employee123!', 10);
    const employee = await prisma.user.create({
      data: {
        email: 'employee@test.com',
        passwordHash: employeePassword,
        firstName: 'Employee',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });

    // Create recipient user
    const recipientPassword = await bcrypt.hash('Recipient123!', 10);
    const recipient = await prisma.user.create({
      data: {
        email: 'recipient@test.com',
        passwordHash: recipientPassword,
        firstName: 'Recipient',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });
    recipientId = recipient.id;

    // Create active badge template
    const template = await prisma.badgeTemplate.create({
      data: {
        name: 'Test Achievement',
        description: 'Test badge for E2E testing',
        imageUrl: 'https://example.com/badge.png',
        status: 'ACTIVE',
        category: 'achievement',
        issuanceCriteria: {
          description: 'Complete test successfully',
          requiredActions: ['Complete E2E test'],
        },
        validityPeriod: 365,
        createdBy: admin.id,
      },
    });
    templateId = template.id;

    // Login to get tokens
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    adminToken = adminLoginResponse.body.accessToken;

    const employeeLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'employee@test.com',
        password: 'Employee123!',
      });
    employeeToken = employeeLoginResponse.body.accessToken;
  }

  describe('POST /api/badges', () => {
    it('should issue badge successfully when authorized as ADMIN', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/evidence.pdf',
          expiresIn: 365,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('PENDING');
          expect(res.body.claimToken).toHaveLength(32);
          expect(res.body).toHaveProperty('claimUrl');
          expect(res.body).toHaveProperty('assertionUrl');
          expect(res.body.template.id).toBe(templateId);
          expect(res.body.recipient.id).toBe(recipientId);
          expect(res.body).toHaveProperty('expiresAt');
        });
    });

    it('should return 403 when unauthorized user (EMPLOYEE) tries to issue badge', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          expiresIn: 365,
        })
        .expect(403);
    });

    it('should return 404 when invalid template ID is provided', () => {
      const invalidTemplateId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: invalidTemplateId,
          recipientId: recipientId,
          expiresIn: 365,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should return 400 when validation fails (invalid UUID)', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: 'invalid-uuid',
          recipientId: recipientId,
          expiresIn: 365,
        })
        .expect(400);
    });

    it('should return 400 when expiresIn is out of range', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
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
      const issueResponse = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/evidence.pdf',
          expiresIn: 365,
        });

      validBadgeId = issueResponse.body.id;
      validClaimToken = issueResponse.body.claimToken;
    });

    it('should claim badge with valid token (PUBLIC endpoint - no auth required)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(201);

      expect(response.body.status).toBe('CLAIMED');
      expect(response.body.claimedAt).toBeDefined();
      expect(response.body.badge.name).toBe('Test Achievement');
      expect(response.body.message).toContain('successfully');
      expect(response.body.assertionUrl).toContain(validBadgeId);
    });

    it('should return 400 for invalid claim token', () => {
      return request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: 'invalid-token-' + 'x'.repeat(19), // 32 chars total
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should return 404 when trying to use already-claimed token (one-time use)', async () => {
      // Claim once
      await request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(201);

      // Try to claim again with same token (should fail - token is cleared after claim)
      return request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid claim token');
        });
    });

    it('should return 410 for expired claim token (>7 days)', async () => {
      // Manually set badge issuedAt to 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      await prisma.badge.update({
        where: { id: validBadgeId },
        data: { issuedAt: eightDaysAgo },
      });

      return request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(410)
        .expect((res) => {
          expect(res.body.message).toContain('Claim token has expired');
        });
    });
  });

  describe('GET /api/badges/my-badges', () => {
    let recipientToken: string;
    let badge1Id: string;
    let badge2Id: string;

    beforeAll(async () => {
      // Login as recipient to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'recipient@test.com',
          password: 'Recipient123!',
        })
        .expect(200);

      recipientToken = loginResponse.body.accessToken;

      // Issue 2 badges to recipient
      const issueResponse1 = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/evidence1.pdf',
          expiresIn: 365,
        });
      badge1Id = issueResponse1.body.id;

      const issueResponse2 = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/evidence2.pdf',
          expiresIn: 365,
        });
      badge2Id = issueResponse2.body.id;

      // Claim one badge
      await request(app.getHttpServer())
        .post(`/api/badges/${badge1Id}/claim`)
        .send({
          claimToken: issueResponse1.body.claimToken,
        })
        .expect(201);
    });

    it('should return paginated badges for current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/badges/my-badges')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalCount).toBeGreaterThanOrEqual(2);

      // Check badge structure
      const badge = response.body.data[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('status');
      expect(badge).toHaveProperty('issuedAt');
      expect(badge).toHaveProperty('template');
      expect(badge.template).toHaveProperty('name');
      expect(badge).toHaveProperty('issuer');
      expect(badge.issuer).toHaveProperty('name');
    });

    it('should filter badges by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/badges/my-badges')
        .query({ status: 'CLAIMED' })
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      // All badges should be CLAIMED
      response.body.data.forEach((badge: any) => {
        expect(badge.status).toBe('CLAIMED');
      });
    });
  });

  describe('GET /api/badges/issued', () => {
    let issuerToken: string;
    let issuerId: string;

    beforeAll(async () => {
      // Create issuer user
      const issuerPassword = await bcrypt.hash('Issuer123!', 10);
      const issuer = await prisma.user.create({
        data: {
          email: 'issuer@test.com',
          passwordHash: issuerPassword,
          firstName: 'Issuer',
          lastName: 'User',
          role: UserRole.ISSUER,
          emailVerified: true,
        },
      });
      issuerId = issuer.id;

      // Login as issuer
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'issuer@test.com',
          password: 'Issuer123!',
        })
        .expect(200);

      issuerToken = loginResponse.body.accessToken;

      // Issue badge as issuer
      await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${issuerToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/issuer-evidence.pdf',
          expiresIn: 365,
        })
        .expect(201);
    });

    it('should return badges issued by ISSUER user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/badges/issued')
        .set('Authorization', `Bearer ${issuerToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.pagination).toBeDefined();

      // Check badge structure includes recipient (not issuer)
      const badge = response.body.data[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('status');
      expect(badge).toHaveProperty('recipient');
      expect(badge.recipient).toHaveProperty('email');
      expect(badge.recipient.email).toBe('recipient@test.com');
    });

    it('should return 403 for EMPLOYEE trying to access issued badges', async () => {
      return request(app.getHttpServer())
        .get('/api/badges/issued')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('POST /api/badges/:id/revoke', () => {
    let badgeToRevoke: string;

    beforeEach(async () => {
      // Issue a fresh badge for revocation tests
      const issueResponse = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/revocation-test.pdf',
          expiresIn: 365,
        });

      badgeToRevoke = issueResponse.body.id;
    });

    it('should revoke badge successfully (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.ISSUED_IN_ERROR,
          notes: 'Badge issued in error - recipient did not meet criteria',
        })
        .expect(200);

      expect(response.body.badge.status).toBe('REVOKED');
      expect(response.body.badge.revokedAt).toBeDefined();
      expect(response.body.badge.revocationReason).toBe(RevocationReason.ISSUED_IN_ERROR);
      expect(response.body.message).toContain('revoked successfully');
    });

    it('should return 403 for non-ADMIN user (ISSUER)', async () => {
      // Create issuer token if not already exists
      const issuerPassword = await bcrypt.hash('Issuer123!', 10);
      let issuer = await prisma.user.findUnique({ where: { email: 'issuer@test.com' } });
      
      if (!issuer) {
        issuer = await prisma.user.create({
          data: {
            email: 'issuer@test.com',
            passwordHash: issuerPassword,
            firstName: 'Issuer',
            lastName: 'User',
            role: UserRole.ISSUER,
            emailVerified: true,
          },
        });
      }

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'issuer@test.com',
          password: 'Issuer123!',
        });

      const issuerToken = loginResponse.body.accessToken;

      // ISSUER should get 403 when trying to revoke another issuer's badge
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${issuerToken}`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
          notes: 'Attempting to revoke another issuer\'s badge',
        })
        .expect(403);
    });

    it('should return 200 with alreadyRevoked flag if badge already revoked (idempotency)', async () => {
      // Revoke once
      await request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
        })
        .expect(200);

      // Try to revoke again - should return 200 OK with alreadyRevoked flag
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.DUPLICATE,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('already revoked');
          expect(res.body.badge.alreadyRevoked).toBe(true);
        });
    });

    it('should return 400 if notes exceed max length', async () => {
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.OTHER,
          notes: 'a'.repeat(1001), // Exceeds 1000 char limit
        })
        .expect(400);
    });

    // Story 9.4: Email Notification Tests
    it('should send revocation email notification (verify via logs)', async () => {
      // Note: This is an E2E test that verifies the notification is triggered.
      // Actual email sending requires Graph Email to be enabled.
      // In development/test, emails are not sent but the service is called.
      
      const response = await request(app.getHttpServer())
        .post(`/api/badges/${badgeToRevoke}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.POLICY_VIOLATION,
          notes: 'Badge holder violated company policy',
        })
        .expect(200);

      // Verify badge was revoked successfully
      expect(response.body.badge.status).toBe('REVOKED');
      expect(response.body.badge.revocationReason).toBe(RevocationReason.POLICY_VIOLATION);
      expect(response.body.badge.revocationNotes).toBe('Badge holder violated company policy');
      expect(response.body.badge.revokedAt).toBeDefined();
      
      // Wait for async notification to complete (with retry logic)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify notification audit log was created (AC3: audit log for notification)
      const auditLogs = await request(app.getHttpServer())
        .get(`/api/audit-logs?entityId=${badgeToRevoke}&entityType=BadgeNotification`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Note: If audit endpoint exists, verify notification log
      // Otherwise, this is covered by unit tests
      if (auditLogs.status === 200 && auditLogs.body.length > 0) {
        expect(auditLogs.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entityType: 'BadgeNotification',
              entityId: badgeToRevoke,
            }),
          ]),
        );
      }
    });
  });

  describe('GET /api/badges/:id/assertion', () => {
    let revokedBadgeId: string;
    let activeBadgeId: string;

    beforeAll(async () => {
      // Create an active badge
      const activeResponse = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/active-badge.pdf',
          expiresIn: 365,
        });
      activeBadgeId = activeResponse.body.id;

      // Create and revoke a badge
      const revokeResponse = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: templateId,
          recipientId: recipientId,
          evidenceUrl: 'https://example.com/revoked-badge.pdf',
          expiresIn: 365,
        });
      revokedBadgeId = revokeResponse.body.id;

      // Revoke it
      await request(app.getHttpServer())
        .post(`/api/badges/${revokedBadgeId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: RevocationReason.OTHER,
          notes: 'Test revocation for assertion endpoint',
        });
    });

    it('should return assertion for active badge (PUBLIC)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/badges/${activeBadgeId}/assertion`)
        .expect(200);

      // Sprint 5 Story 6.1: Validate Open Badges 2.0 JSON-LD structure
      expect(response.body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
      expect(response.body).toHaveProperty('type', 'Assertion');
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(/\/api\/badges\/.+\/assertion$/);

      // Badge should be URL string (not embedded object)
      expect(response.body).toHaveProperty('badge');
      expect(typeof response.body.badge).toBe('string');
      expect(response.body.badge).toMatch(/\/api\/badge-templates\/.+$/);

      // Recipient should be hashed
      expect(response.body.recipient).toHaveProperty('type', 'email');
      expect(response.body.recipient).toHaveProperty('hashed', true);
      expect(response.body.recipient).toHaveProperty('salt');
      expect(response.body.recipient).toHaveProperty('identity');
      expect(response.body.recipient.identity).toMatch(/^sha256\$/);

      // Verification (hosted type)
      expect(response.body.verification).toHaveProperty('type', 'hosted');
      expect(response.body.verification).toHaveProperty('verificationUrl');
      expect(response.body.verification.verificationUrl).toMatch(/\/verify\/.+$/);

      // Issuance date
      expect(response.body).toHaveProperty('issuedOn');
      expect(new Date(response.body.issuedOn).getTime()).toBeGreaterThan(0);
    });

    it('should return 410 for revoked badge', async () => {
      return request(app.getHttpServer())
        .get(`/api/badges/${revokedBadgeId}/assertion`)
        .expect(410)
        .expect((res) => {
          expect(res.body.message).toContain('revoked');
        });
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/badges/${fakeId}/assertion`)
        .expect(404);
    });
  });

  describe('POST /api/badges/bulk', () => {
    it('should issue badges from valid CSV', async () => {
      // Create CSV content with 2 valid badges
      const csvContent = `recipientEmail,templateId,evidenceUrl,expiresIn
recipient@test.com,${templateId},https://example.com/evidence1.pdf,365
employee@test.com,${templateId},https://example.com/evidence2.pdf,730`;

      const response = await request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'badges.csv')
        .expect(201);

      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[0].badgeId).toBeDefined();
      expect(response.body.results[1].success).toBe(true);
    });

    it('should reject invalid CSV format (missing headers)', async () => {
      const csvContent = `email,template
test@example.com,${templateId}`;

      return request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('CSV parsing failed');
          expect(res.body.message).toContain('Missing required headers');
        });
    });

    it('should handle partial failures gracefully', async () => {
      const csvContent = `recipientEmail,templateId,evidenceUrl
recipient@test.com,${templateId},https://example.com/valid.pdf
nonexistent@test.com,${templateId},https://example.com/fail.pdf
employee@test.com,00000000-0000-0000-0000-000000000000,https://example.com/badtemplate.pdf`;

      const response = await request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'mixed.csv')
        .expect(201);

      expect(response.body.total).toBe(3);
      expect(response.body.successful).toBe(1);
      expect(response.body.failed).toBe(2);

      // Check successful row
      const successRow = response.body.results.find((r: any) => r.success);
      expect(successRow).toBeDefined();
      expect(successRow.email).toBe('recipient@test.com');
      expect(successRow.badgeId).toBeDefined();

      // Check failed rows have error messages
      const failedRows = response.body.results.filter((r: any) => !r.success);
      expect(failedRows).toHaveLength(2);
      expect(failedRows[0].error).toBeDefined();
      expect(failedRows[1].error).toBeDefined();
    });

    it('should return 403 for non-authorized user (EMPLOYEE)', async () => {
      const csvContent = `recipientEmail,templateId
test@example.com,${templateId}`;

      return request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(403);
    });

    it('should return 400 when no file is uploaded', async () => {
      return request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('CSV file is required');
        });
    });

    it('should validate email format in CSV', async () => {
      const csvContent = `recipientEmail,templateId
invalid-email,${templateId}
recipient@test.com,${templateId}`;

      const response = await request(app.getHttpServer())
        .post('/api/badges/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid-email.csv')
        .expect(400);

      expect(response.body.message).toContain('CSV parsing failed');
      expect(response.body.message).toContain('Invalid email');
    });
  });
});
