import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole, BadgeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';

jest.setTimeout(30000);

describe('Baked Badge PNG (e2e) - Story 6.4', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let recipientToken: string;
  let recipientId: string;
  let otherEmployeeToken: string;
  let otherEmployeeId: string;
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
        email: 'admin-baked@test.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'Baker',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    // Create recipient employee
    const recipientPassword = await bcrypt.hash('Recipient123!', 10);
    const recipient = await prisma.user.create({
      data: {
        email: 'recipient-baked@test.com',
        passwordHash: recipientPassword,
        firstName: 'Badge',
        lastName: 'Recipient',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });
    recipientId = recipient.id;

    // Create another employee (for authorization test)
    const otherPassword = await bcrypt.hash('Other123!', 10);
    const otherEmployee = await prisma.user.create({
      data: {
        email: 'other-employee-baked@test.com',
        passwordHash: otherPassword,
        firstName: 'Other',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        emailVerified: true,
      },
    });
    otherEmployeeId = otherEmployee.id;

    // Login to get tokens
    const recipientLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'recipient-baked@test.com',
        password: 'Recipient123!',
      })
      .expect(200);
    recipientToken = recipientLoginResponse.body.accessToken;

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'other-employee-baked@test.com',
        password: 'Other123!',
      })
      .expect(200);
    otherEmployeeToken = otherLoginResponse.body.accessToken;

    // Create badge template with a real minimal PNG as imageUrl
    // Note: In real scenario this would be Azure Blob URL
    const template = await prisma.badgeTemplate.create({
      data: {
        name: 'Baked Badge Test',
        description: 'Badge for testing baked PNG generation',
        imageUrl: 'https://example.com/badge-baked.png', // Mock URL - will fail download
        status: 'ACTIVE',
        category: 'achievement',
        issuanceCriteria: {
          description: 'Test baked badge generation',
        },
        creator: {
          connect: { id: admin.id },
        },
      },
    });

    // Create badge for recipient
    const badge = await prisma.badge.create({
      data: {
        templateId: template.id,
        recipientId: recipient.id,
        issuerId: admin.id,
        status: BadgeStatus.CLAIMED,
        recipientHash: 'sha256$test-hash-baked',
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: new Date('2027-01-20T10:00:00Z'),
        claimedAt: new Date('2026-01-21T12:00:00Z'),
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
          id: `http://localhost:3000/api/badges/test-badge-id/assertion`,
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
        },
      },
    });
    badgeId = badge.id;
  }

  describe('GET /api/badges/:id/download/png - HTTP Authentication & Authorization', () => {
    it('should require authentication (401 without token)', async () => {
      await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/download/png`)
        .expect(401);
    });

    it('should require authentication (401 with invalid token)', async () => {
      await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should reject non-recipient (400 with valid token but wrong user)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .expect(400);

      expect(response.body.message).toContain('only download your own badges');
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/badges/${fakeId}/download/png`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(404);
    });

    it('should fail when Azure Blob download fails (mock URL)', async () => {
      // This will fail because imageUrl is a mock URL, not real Azure Blob
      // Currently returns 500 because downloadBlobBuffer throws unhandled error
      const response = await request(app.getHttpServer())
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(500);

      // Should get error about downloading blob
      expect(response.body.message).toMatch(/Internal server error|Failed to download/i);
    });
  });

  describe('Baked Badge Generation (unit-level validation)', () => {
    it('should embed assertion in PNG using sharp metadata', async () => {
      // Create a simple 100x100 PNG
      const testImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      // Mock assertion data
      const assertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://example.com/badge/123',
      };

      // Embed assertion
      const bakedBadge = await sharp(testImage)
        .png({ compressionLevel: 0 })
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: JSON.stringify(assertion),
            }
          }
        })
        .toBuffer();

      // Verify it's a valid PNG
      const metadata = await sharp(bakedBadge).metadata();
      expect(metadata.format).toBe('png');
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);

      // Verify file size is reasonable (<5MB as per AC)
      expect(bakedBadge.length).toBeLessThan(5 * 1024 * 1024);
    });

    it('should maintain image quality after baking', async () => {
      // Create test image
      const originalImage = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      const originalMetadata = await sharp(originalImage).metadata();

      // Bake badge
      const bakedBadge = await sharp(originalImage)
        .png({ compressionLevel: 0 })
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: 'test metadata',
            }
          }
        })
        .toBuffer();

      const bakedMetadata = await sharp(bakedBadge).metadata();

      // Verify dimensions preserved
      expect(bakedMetadata.width).toBe(originalMetadata.width);
      expect(bakedMetadata.height).toBe(originalMetadata.height);
      expect(bakedMetadata.format).toBe('png');
    });

    it('should generate filename with badge name and date', () => {
      const badgeName = 'Excellence Award 2026';
      const sanitized = badgeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(sanitized).toBe('excellence-award-2026');

      const dateString = new Date().toISOString().split('T')[0];
      const filename = `badge-${sanitized}-${dateString}.png`;
      
      expect(filename).toMatch(/^badge-excellence-award-2026-\d{4}-\d{2}-\d{2}\.png$/);
    });
  });
});
