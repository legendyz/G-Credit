import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole, BadgeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Badge Verification (e2e) - Story 6.2', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let activeBadgeVerificationId: string;
  let revokedBadgeVerificationId: string;
  let expiredBadgeVerificationId: string;

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
    // Create test users
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin-verify@test.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'Verifier',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    const recipientPassword = await bcrypt.hash('Recipient123!', 10);
    const recipient = await prisma.user.create({
      data: {
        email: 'recipient-verify@test.com',
        passwordHash: recipientPassword,
        firstName: 'Test',
        lastName: 'Recipient',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });

    // Create badge template
    const template = await prisma.badgeTemplate.create({
      data: {
        name: 'Verification Test Badge',
        description: 'Badge for testing public verification',
        imageUrl: 'https://example.com/badge-verify.png',
        status: 'ACTIVE',
        category: 'achievement',
        issuanceCriteria: {
          description: 'Complete verification test successfully',
          requiredActions: ['Test public endpoint'],
        },
        creator: {
          connect: { id: admin.id },
        },
      },
    });

    // Create active badge
    const activeBadge = await prisma.badge.create({
      data: {
        templateId: template.id,
        recipientId: recipient.id,
        issuerId: admin.id,
        status: BadgeStatus.CLAIMED,
        recipientHash: 'sha256$' + 'test-hash-12345',
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: new Date('2027-01-20T10:00:00Z'),
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
          badge: `http://localhost:3000/api/badge-templates/${template.id}`,
        },
      },
    });
    activeBadgeVerificationId = activeBadge.verificationId;

    // Create revoked badge
    const revokedBadge = await prisma.badge.create({
      data: {
        templateId: template.id,
        recipientId: recipient.id,
        issuerId: admin.id,
        status: BadgeStatus.REVOKED,
        recipientHash: 'sha256$' + 'test-hash-67890',
        issuedAt: new Date('2026-01-15T10:00:00Z'),
        revokedAt: new Date('2026-01-22T15:30:00Z'),
        revocationReason: 'Test revocation for E2E testing',
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
          badge: `http://localhost:3000/api/badge-templates/${template.id}`,
        },
      },
    });
    revokedBadgeVerificationId = revokedBadge.verificationId;

    // Create expired badge
    const expiredBadge = await prisma.badge.create({
      data: {
        templateId: template.id,
        recipientId: recipient.id,
        issuerId: admin.id,
        status: BadgeStatus.CLAIMED,
        recipientHash: 'sha256$' + 'test-hash-abcde',
        issuedAt: new Date('2025-01-01T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'), // Expired
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
          badge: `http://localhost:3000/api/badge-templates/${template.id}`,
        },
      },
    });
    expiredBadgeVerificationId = expiredBadge.verificationId;
  }

  describe('GET /api/verify/:verificationId', () => {
    it('should verify active badge (PUBLIC - no auth)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('verificationId', activeBadgeVerificationId);
      expect(response.body.status).toBe('CLAIMED'); // Check exact value
      
      // Badge details
      expect(response.body.badge).toHaveProperty('name', 'Verification Test Badge');
      expect(response.body.badge).toHaveProperty('description');
      expect(response.body.badge).toHaveProperty('imageUrl');
      expect(response.body.badge).toHaveProperty('criteria');
      
      // Recipient (email masked for privacy)
      expect(response.body.recipient).toHaveProperty('name', 'Test Recipient');
      expect(response.body.recipient.email).toMatch(/^r\*\*\*@test\.com$/);
      
      // Issuer
      expect(response.body.issuer).toHaveProperty('name', 'Admin Verifier');
      
      // Dates
      expect(response.body).toHaveProperty('issuedAt');
      expect(response.body).toHaveProperty('expiresAt');
      
      // Open Badges 2.0 assertion
      expect(response.body.assertionJson).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
      expect(response.body.assertionJson).toHaveProperty('type', 'Assertion');
    });

    it('should return 410 for revoked badge with revocation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${revokedBadgeVerificationId}`)
        .expect(410);

      expect(response.body).toHaveProperty('statusCode', 410);
      expect(response.body.message).toContain('revoked');
      expect(response.body.badge).toHaveProperty('status', 'REVOKED');
      expect(response.body.badge).toHaveProperty('revokedAt');
      expect(response.body.badge).toHaveProperty('revocationReason', 'Test revocation for E2E testing');
    });

    it('should return badge data for expired badge (status check on frontend)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${expiredBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'CLAIMED');
      expect(response.body).toHaveProperty('expiresAt');
      
      // Frontend should check if expiresAt < now to show expired state
      const expiresAt = new Date(response.body.expiresAt);
      expect(expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it('should return 404 for invalid verificationId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should not require authentication (PUBLIC endpoint)', async () => {
      // No Authorization header
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('verificationId');
    });

    it('should mask recipient email for privacy', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Email should be masked: recipient-verify@test.com → r***@test.com
      expect(response.body.recipient.email).not.toBe('recipient-verify@test.com');
      expect(response.body.recipient.email).toMatch(/^r\*\*\*@/);
    });

    it('should include Open Badges 2.0 JSON-LD assertion', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body.assertionJson).toBeDefined();
      expect(response.body.assertionJson['@context']).toBe('https://w3id.org/openbadges/v2');
      expect(response.body.assertionJson.type).toBe('Assertion');
      expect(response.body.assertionJson.badge).toMatch(/\/api\/badge-templates\//);
    });
  });
});
