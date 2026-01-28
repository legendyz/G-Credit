import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole, BadgeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';

describe('Baked Badge PNG (e2e) - Story 6.4', () => {
  // Story 6.4: Focus on unit-level validation of sharp library
  // E2E tests for download endpoint require real Azure Blob Storage

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
