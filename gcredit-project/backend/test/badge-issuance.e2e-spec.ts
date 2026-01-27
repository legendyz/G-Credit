import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
});
