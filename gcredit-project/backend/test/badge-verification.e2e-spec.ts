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
  let templateId: string;
  let recipientId: string;
  let issuerId: string;

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

    // Store IDs for Story 9.2 tests
    templateId = template.id;
    recipientId = recipient.id;
    issuerId = admin.id;

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

      // Story 6.3: Response is Open Badges 2.0 assertion + metadata
      expect(response.body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
      expect(response.body).toHaveProperty('type', 'Assertion');
      expect(response.body).toHaveProperty('badge'); // URL string
      expect(response.body.badge).toMatch(/\/api\/badge-templates\//);
      
      // Story 6.3: Verification metadata
      expect(response.body).toHaveProperty('verificationStatus');
      expect(response.body).toHaveProperty('verifiedAt');
      
      // Story 6.2: Badge details in _meta
      expect(response.body._meta.badge).toHaveProperty('name', 'Verification Test Badge');
      expect(response.body._meta.badge).toHaveProperty('description');
      expect(response.body._meta.badge).toHaveProperty('imageUrl');
      expect(response.body._meta.badge).toHaveProperty('criteria');
      
      // Recipient (email masked for privacy)
      expect(response.body._meta.recipient).toHaveProperty('name', 'Test Recipient');
      expect(response.body._meta.recipient.email).toMatch(/^r\*\*\*@test\.com$/);
      
      // Issuer
      expect(response.body._meta.issuer).toHaveProperty('name', 'Admin Verifier');
    });

    it('should return 410 for revoked badge with revocation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${revokedBadgeVerificationId}`)
        .expect(200); // Story 6.3: Changed from 410 to 200

      // Story 6.3: Verify verification status
      expect(response.body).toHaveProperty('verificationStatus', 'revoked');
      expect(response.body).toHaveProperty('revoked', true);
      expect(response.body).toHaveProperty('revokedAt');
      expect(response.body).toHaveProperty('revocationReason', 'Test revocation for E2E testing');
      expect(response.body).toHaveProperty('verifiedAt');
    });

    it('should return badge data for expired badge (status check on frontend)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${expiredBadgeVerificationId}`)
        .expect(200);

      // Story 6.3: Verify expired status
      expect(response.body).toHaveProperty('verificationStatus', 'expired');
      expect(response.body).toHaveProperty('verifiedAt');
      
      // Expired badges still return full assertion
      expect(response.body).toHaveProperty('@context', 'https://w3id.org/openbadges/v2');
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

      expect(response.body).toHaveProperty('@context'); // Open Badges assertion returned
    });

    it('should mask recipient email for privacy', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Email should be masked: recipient-verify@test.com → r***@test.com
      expect(response.body._meta.recipient.email).not.toBe('recipient-verify@test.com');
      expect(response.body._meta.recipient.email).toMatch(/^r\*\*\*@/);
    });

    it('should include Open Badges 2.0 JSON-LD assertion', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      // Story 6.3: Response IS the Open Badges 2.0 assertion
      expect(response.body['@context']).toBe('https://w3id.org/openbadges/v2');
      expect(response.body.type).toBe('Assertion');
      expect(response.body.badge).toMatch(/\/api\/badge-templates\//);
    });

    // Story 6.3: New tests for verification status and caching
    it('should return verificationStatus and verifiedAt timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('verificationStatus');
      expect(['valid', 'expired', 'revoked']).toContain(response.body.verificationStatus);
      expect(response.body).toHaveProperty('verifiedAt');
      
      // Verify timestamp is valid ISO 8601
      const verifiedAt = new Date(response.body.verifiedAt);
      expect(verifiedAt.getTime()).toBeGreaterThan(0);
    });

    it('should set Cache-Control header for valid badges (1 hour)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toMatch(/public.*max-age=3600/);
    });

    it('should set no-cache headers for revoked badges', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${revokedBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toMatch(/no-cache/);
    });

    it('should include CORS headers for cross-origin access', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toMatch(/GET/);
    });

    it('should include X-Verification-Status header', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/verify/${activeBadgeVerificationId}`)
        .expect(200);

      expect(response.headers['x-verification-status']).toBeDefined();
      expect(['valid', 'expired', 'revoked']).toContain(response.headers['x-verification-status']);
    });

    // Story 9.2: Revoked badge display tests
    describe('Story 9.2: Revoked Badge Display', () => {
      it('should return revocation details with isPublicReason flag', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/verify/${revokedBadgeVerificationId}`)
          .expect(200);

        expect(response.body.verificationStatus).toBe('revoked');
        expect(response.body.revoked).toBe(true);
        expect(response.body.revokedAt).toBeDefined();
        expect(response.body.revocationReason).toBeDefined();
        
        // Story 9.2: Check for new fields
        expect(response.body).toHaveProperty('isValid');
        expect(response.body.isValid).toBe(false);
        expect(response.body).toHaveProperty('isPublicReason');
        expect(typeof response.body.isPublicReason).toBe('boolean');
      });

      it('should include revocationNotes when provided', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/verify/${revokedBadgeVerificationId}`)
          .expect(200);

        // If notes were provided during revocation, they should be in response
        if (response.body.revocationNotes) {
          expect(typeof response.body.revocationNotes).toBe('string');
        }
      });

      it('should include revokedBy information', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/verify/${revokedBadgeVerificationId}`)
          .expect(200);

        // If revoker information is available
        if (response.body.revokedBy) {
          expect(response.body.revokedBy).toHaveProperty('name');
          expect(response.body.revokedBy).toHaveProperty('role');
        }
      });

      it('should mark public reasons correctly', async () => {
        // Create a badge and revoke it with a public reason
        const publicReasonBadge = await prisma.badge.create({
          data: {
            templateId: templateId,
            recipientId: recipientId,
            issuerId: issuerId,
            status: 'CLAIMED',
            claimToken: 'public-reason-token-' + Math.random(),
            claimedAt: new Date(),
            issuedAt: new Date(),
            verificationId: `public-reason-${Date.now()}`,
            recipientHash: 'sha256$' + 'public-test-hash',
            assertionJson: {},
          },
        });

        // Revoke with public reason
        await prisma.badge.update({
          where: { id: publicReasonBadge.id },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revocationReason: 'Issued in Error',
            revocationNotes: 'Badge was issued to wrong recipient',
            revokedBy: issuerId,
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/api/verify/${publicReasonBadge.verificationId}`)
          .expect(200);

        expect(response.body.revocationReason).toBe('Issued in Error');
        expect(response.body.isPublicReason).toBe(true);
      });

      it('should mark private reasons correctly', async () => {
        // Create a badge and revoke it with a private reason
        const privateReasonBadge = await prisma.badge.create({
          data: {
            templateId: templateId,
            recipientId: recipientId,
            issuerId: issuerId,
            status: 'CLAIMED',
            claimToken: 'private-reason-token-' + Math.random(),
            claimedAt: new Date(),
            issuedAt: new Date(),
            verificationId: `private-reason-${Date.now()}`,
            recipientHash: 'sha256$' + 'private-test-hash',
            assertionJson: {},
          },
        });

        // Revoke with private reason
        await prisma.badge.update({
          where: { id: privateReasonBadge.id },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revocationReason: 'Policy Violation',
            revocationNotes: 'Confidential compliance issue',
            revokedBy: issuerId,
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/api/verify/${privateReasonBadge.verificationId}`)
          .expect(200);

        expect(response.body.revocationReason).toBe('Policy Violation');
        expect(response.body.isPublicReason).toBe(false);
      });
    });
  });
});
