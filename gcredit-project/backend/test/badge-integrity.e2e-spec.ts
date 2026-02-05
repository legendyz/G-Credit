import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole, BadgeStatus } from '@prisma/client';
import { AssertionGeneratorService } from '../src/badge-issuance/services/assertion-generator.service';
import * as bcrypt from 'bcrypt';

jest.setTimeout(30000);

describe('Badge Integrity (e2e) - Story 6.5', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let assertionGenerator: AssertionGeneratorService;
  let adminToken: string;
  let recipientToken: string;
  let badgeId: string;

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
    assertionGenerator = app.get<AssertionGeneratorService>(
      AssertionGeneratorService,
    );

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
        email: 'admin-integrity@test.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'Integrity',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    // Create recipient employee
    const recipientPassword = await bcrypt.hash('Recipient123!', 10);
    const recipient = await prisma.user.create({
      data: {
        email: 'recipient-integrity@test.com',
        passwordHash: recipientPassword,
        firstName: 'Recipient',
        lastName: 'Test',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });

    // Login to get tokens
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-integrity@test.com',
        password: 'Admin123!',
      })
      .expect(200);
    adminToken = adminLoginResponse.body.accessToken;

    const recipientLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'recipient-integrity@test.com',
        password: 'Recipient123!',
      })
      .expect(200);
    recipientToken = recipientLoginResponse.body.accessToken;

    // Create badge template
    const template = await prisma.badgeTemplate.create({
      data: {
        name: 'Integrity Test Badge',
        description: 'Badge for testing integrity verification',
        imageUrl: 'https://example.com/badge-integrity.png',
        status: 'ACTIVE',
        category: 'achievement',
        issuanceCriteria: {
          description: 'Test integrity verification',
        },
        creator: {
          connect: { id: admin.id },
        },
      },
    });

    // Create badge directly (Story 6.1 already generates assertion with hash)
    const assertionJson = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: `http://localhost:3000/api/badges/test-badge/assertion`,
      badge: `http://localhost:3000/api/badge-templates/${template.id}`,
      recipient: {
        type: 'email',
        hashed: true,
        salt: 'test-salt',
        identity: 'sha256$hash',
      },
      issuedOn: '2026-01-20T10:00:00Z',
      verification: {
        type: 'hosted',
        verificationUrl: `http://localhost:3000/verify/test-verification-id`,
      },
    };

    // Compute correct metadataHash
    const metadataHash = assertionGenerator.computeAssertionHash(assertionJson);

    const badge = await prisma.badge.create({
      data: {
        templateId: template.id,
        recipientId: recipient.id,
        issuerId: admin.id,
        status: BadgeStatus.CLAIMED,
        recipientHash: 'sha256$test-hash',
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: new Date('2027-01-20T10:00:00Z'),
        claimedAt: new Date('2026-01-21T12:00:00Z'),
        assertionJson,
        metadataHash,
      },
    });

    badgeId = badge.id;
  }

  describe('GET /api/badges/:id/integrity - Public Integrity Verification', () => {
    it('should verify integrity for unmodified badge (no auth required)', async () => {
      // First, update the badge with correct hash (simulating proper badge creation)
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: { assertionJson: true },
      });

      const correctHash = assertionGenerator.computeAssertionHash(
        badge!.assertionJson,
      );

      await prisma.badge.update({
        where: { id: badgeId },
        data: { metadataHash: correctHash },
      });

      // Now verify integrity
      const response = await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/integrity`)
        .expect(200);

      expect(response.body).toHaveProperty('integrityVerified', true);
      expect(response.body).toHaveProperty('storedHash');
      expect(response.body).toHaveProperty('computedHash');
      expect(response.body.storedHash).toBe(response.body.computedHash);
      expect(response.body).toHaveProperty('tampered', false);

      // SHA-256 hash should be 64 hex characters
      expect(response.body.storedHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should detect tampering when assertion modified', async () => {
      // Manually tamper with badge assertion in database
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: { assertionJson: true },
      });

      const tamperedAssertion = {
        ...(badge!.assertionJson as any),
        issuedOn: '1999-01-01T00:00:00.000Z', // Tamper with date
      };

      await prisma.badge.update({
        where: { id: badgeId },
        data: {
          assertionJson: tamperedAssertion,
          // Keep original metadataHash (simulating tampering)
        },
      });

      // Verify integrity should now fail
      const response = await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/integrity`)
        .expect(200);

      expect(response.body.integrityVerified).toBe(false);
      expect(response.body.tampered).toBe(true);
      expect(response.body.storedHash).not.toBe(response.body.computedHash);

      // Restore original assertion for other tests
      await prisma.badge.update({
        where: { id: badgeId },
        data: {
          assertionJson: badge!.assertionJson,
        },
      });
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/badges/${fakeId}/integrity`)
        .expect(404);
    });
  });

  describe('Badge Verification API - Integrity Status Included', () => {
    it('should include integrity status in _meta field of verification response', async () => {
      // Get verificationId
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: { verificationId: true },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/verify/${badge!.verificationId}`)
        .expect(200);

      // Verification API returns Open Badges 2.0 assertion as top level
      // with _meta containing additional info
      expect(response.body).toHaveProperty(
        '@context',
        'https://w3id.org/openbadges/v2',
      );
      expect(response.body).toHaveProperty('_meta');

      // Story 6.5: Integrity status should be in _meta
      expect(response.body._meta).toHaveProperty('integrity');
      expect(response.body._meta.integrity).toHaveProperty('verified', true);
      expect(response.body._meta.integrity).toHaveProperty('hash');
      expect(response.body._meta.integrity.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Badge Issuance - Metadata Hash Generation', () => {
    it('should have metadataHash populated in database', async () => {
      // Check the badge we created has metadataHash
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: {
          metadataHash: true,
          assertionJson: true,
        },
      });

      expect(badge!.metadataHash).toBeDefined();
      expect(badge!.metadataHash).toMatch(/^[a-f0-9]{64}$/);
      expect(badge!.assertionJson).toBeDefined();
    });
  });
});
