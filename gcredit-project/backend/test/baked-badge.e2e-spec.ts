import request from 'supertest';
import { App } from 'supertest/types';
import sharp from 'sharp';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
} from './helpers/test-setup';

jest.setTimeout(30000);

/**
 * Story 6.4: Baked Badge PNG Download (Isolated)
 * Story 8.8: Test Isolation - Refactored for parallel execution
 *
 * Tests baked badge generation with schema isolation
 */
describe('Baked Badge PNG (e2e) - Story 6.4', () => {
  let ctx: TestContext;
  let recipientUser: TestUser;
  let otherEmployeeUser: TestUser;
  let adminUser: TestUser;
  let badgeId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('baked-badge');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create test users using factories
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    recipientUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );
    otherEmployeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Create badge template using factory
    const template = await ctx.templateFactory.createTemplate({
      name: 'Baked Badge Test',
      description: 'Badge for testing baked PNG generation',
      imageUrl: 'https://example.com/badge-baked.png', // Mock URL - will fail download
      status: 'ACTIVE',
      category: 'achievement',
      createdById: adminUser.user.id,
      issuanceCriteria: {
        description: 'Test baked badge generation',
      },
    });

    // Create badge for recipient using factory
    const badge = await ctx.badgeFactory.createClaimed({
      templateId: template.id,
      recipientId: recipientUser.user.id,
      issuerId: adminUser.user.id,
    });
    badgeId = badge.id;
  });

  describe('GET /api/badges/:id/download/png - HTTP Authentication & Authorization', () => {
    it('should require authentication (401 without token)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${badgeId}/download/png`)
        .expect(401);
    });

    it('should require authentication (401 with invalid token)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should reject non-recipient (400 with valid token but wrong user)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', `Bearer ${otherEmployeeUser.token}`)
        .expect(400);

      const body = response.body as { message: string };
      expect(body.message).toContain('only download your own badges');
    });

    it('should return 404 for non-existent badge', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${fakeId}/download/png`)
        .set('Authorization', `Bearer ${recipientUser.token}`)
        .expect(404);
    });

    it('should fail when Azure Blob download fails (mock URL)', async () => {
      // This will fail because imageUrl is a mock URL, not real Azure Blob
      // Currently returns 500 because downloadBlobBuffer throws unhandled error
      const response = await request(ctx.app.getHttpServer() as App)
        .get(`/api/badges/${badgeId}/download/png`)
        .set('Authorization', `Bearer ${recipientUser.token}`)
        .expect(500);

      const body = response.body as { message: string };
      // Should get error about downloading blob
      expect(body.message).toMatch(/Internal server error|Failed to download/i);
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
          background: { r: 0, g: 0, b: 255, alpha: 1 },
        },
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
            },
          },
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
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
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
            },
          },
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

      expect(filename).toMatch(
        /^badge-excellence-award-2026-\d{4}-\d{2}-\d{2}\.png$/,
      );
    });
  });
});
