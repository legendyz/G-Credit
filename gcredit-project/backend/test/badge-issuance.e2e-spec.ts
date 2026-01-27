import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
        .expect(200);

      expect(response.body.status).toBe('CLAIMED');
      expect(response.body.claimedAt).toBeDefined();
      expect(response.body.badge.name).toBe('Test Achievement');
      expect(response.body.message).toContain('successfully');
      expect(response.body.assertionUrl).toContain(validBadgeId);
    });

    it('should return 404 for invalid claim token', () => {
      return request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: 'invalid-token-' + 'x'.repeat(19), // 32 chars total
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid claim token');
        });
    });

    it('should return 400 if badge already claimed', async () => {
      // Claim once
      await request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(200);

      // Try to claim again
      return request(app.getHttpServer())
        .post(`/api/badges/${validBadgeId}/claim`)
        .send({
          claimToken: validClaimToken,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already been claimed');
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
});
