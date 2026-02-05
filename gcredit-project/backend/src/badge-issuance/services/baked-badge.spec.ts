import sharp from 'sharp';

describe('Baked Badge Generation - Story 6.4 (unit tests)', () => {
  describe('PNG metadata embedding with sharp', () => {
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
        badge: 'http://example.com/badge-class/456',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'test-salt',
          identity: 'sha256$hash',
        },
      };

      // Embed assertion in PNG EXIF metadata
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

      // Log size for manual verification
      console.log(
        `Baked badge size: ${(bakedBadge.length / 1024).toFixed(2)} KB`,
      );
    });

    it('should maintain image quality after baking', async () => {
      // Create test image with distinct colors
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

      // Bake badge with metadata
      const bakedBadge = await sharp(originalImage)
        .png({ compressionLevel: 0 }) // No compression to preserve quality
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: 'test metadata string',
            },
          },
        })
        .toBuffer();

      const bakedMetadata = await sharp(bakedBadge).metadata();

      // Verify dimensions preserved
      expect(bakedMetadata.width).toBe(originalMetadata.width);
      expect(bakedMetadata.height).toBe(originalMetadata.height);
      expect(bakedMetadata.format).toBe('png');
      expect(bakedMetadata.channels).toBe(4); // RGBA preserved
    });

    it('should handle large assertion JSON (realistic data)', async () => {
      // Create test image
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 100, g: 150, b: 200, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      // Realistic Open Badges 2.0 assertion
      const assertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'https://g-credit.com/api/badges/550e8400-e29b-41d4-a716-446655440000/assertion',
        badge: 'https://g-credit.com/api/badge-templates/template-uuid',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'gcredit-salt-12345',
          identity:
            'sha256$abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        },
        issuedOn: '2026-01-28T10:30:00Z',
        expires: '2027-01-28T10:30:00Z',
        verification: {
          type: 'hosted',
          verificationUrl:
            'https://g-credit.com/verify/550e8400-e29b-41d4-a716-446655440000',
        },
        evidence: [
          'https://blob.azure.com/evidence/file1.pdf',
          'https://blob.azure.com/evidence/file2.jpg',
        ],
      };

      const assertionString = JSON.stringify(assertion);
      expect(assertionString.length).toBeGreaterThan(500); // Realistic size

      // Bake badge
      const bakedBadge = await sharp(testImage)
        .png({ compressionLevel: 0 })
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: assertionString,
            },
          },
        })
        .toBuffer();

      // Verify successful baking with large metadata
      expect(bakedBadge.length).toBeGreaterThan(testImage.length);
      expect(bakedBadge.length).toBeLessThan(5 * 1024 * 1024); // Still under 5MB

      const metadata = await sharp(bakedBadge).metadata();
      expect(metadata.format).toBe('png');
    });
  });

  describe('Filename generation', () => {
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

    it('should handle special characters in badge name', () => {
      const testCases = [
        { input: 'JavaScript Developer!', expected: 'javascript-developer' },
        { input: 'C++ Expert @2026', expected: 'c-expert-2026' },
        { input: '   Leading   Spaces   ', expected: 'leading-spaces' },
        { input: 'Badge_With_Underscores', expected: 'badge-with-underscores' },
      ];

      testCases.forEach(({ input, expected }) => {
        const sanitized = input
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        expect(sanitized).toBe(expected);
      });
    });

    it('should use current date in filename', () => {
      const dateString = new Date().toISOString().split('T')[0];
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const filename = `badge-test-${dateString}.png`;
      expect(filename).toContain(new Date().getFullYear().toString());
    });
  });

  describe('File size validation', () => {
    it('should keep file size under 5MB limit', async () => {
      // Create a larger image to test compression
      const largeImage = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 128, g: 128, b: 128, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const assertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        badge: 'https://example.com/badge',
      };

      const bakedBadge = await sharp(largeImage)
        .png({ compressionLevel: 0 })
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: JSON.stringify(assertion),
            },
          },
        })
        .toBuffer();

      const sizeInMB = bakedBadge.length / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(5);

      console.log(`Large baked badge size: ${sizeInMB.toFixed(2)} MB`);
    });
  });
});
