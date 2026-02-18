import { Test, TestingModule } from '@nestjs/testing';
import { BadgeVerificationController } from './badge-verification.controller';
import { BadgeVerificationService } from './badge-verification.service';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

describe('BadgeVerificationController', () => {
  let controller: BadgeVerificationController;

  const mockVerificationService = {
    verifyBadge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeVerificationController],
      providers: [
        {
          provide: BadgeVerificationService,
          useValue: mockVerificationService,
        },
      ],
    }).compile();

    controller = module.get<BadgeVerificationController>(
      BadgeVerificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── Decorator Metadata Guard Tests ───────────────────────────────
  // Ensures @Public() is never accidentally removed from verification endpoint.
  // Pure metadata reflection — no DB, no HTTP, runs in milliseconds.

  describe('Decorator metadata guards', () => {
    const proto = BadgeVerificationController.prototype;

    it('GET /:verificationId (verifyBadge) should be @Public()', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, proto.verifyBadge) as
        | boolean
        | undefined;
      expect(isPublic).toBe(true);
    });
  });

  // ─── Cache-Control Behavior Test ──────────────────────────────────
  // Verifies correct cache headers. The controller sets max-age=60 for valid
  // badges and no-cache for revoked badges.

  describe('Cache-Control headers', () => {
    it('should set public, max-age=60 for valid (non-revoked) badges', async () => {
      const mockBadge = {
        id: 'badge-uuid',
        status: 'CLAIMED',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        claimedAt: new Date().toISOString(),
        isValid: true,
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
        },
        badge: { name: 'Test' },
        recipient: { name: 'User' },
        issuer: { name: 'Issuer' },
        evidenceFiles: [],
        revokedAt: null,
        revokedBy: null,
        revocationReason: null,
        revocationNotes: null,
        isPublicReason: false,
      };
      mockVerificationService.verifyBadge.mockResolvedValue(mockBadge);

      const headers: Record<string, string> = {};
      const mockResponse = {
        setHeader: jest.fn((key: string, value: string) => {
          headers[key] = value;
        }),
      };

      await controller.verifyBadge('test-uuid', mockResponse as never);

      expect(headers['Cache-Control']).toBe('public, max-age=60');
    });

    it('should set no-cache for revoked badges', async () => {
      const mockBadge = {
        id: 'badge-uuid',
        status: 'REVOKED',
        expiresAt: null,
        claimedAt: new Date().toISOString(),
        isValid: false,
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
        },
        badge: { name: 'Test' },
        recipient: { name: 'User' },
        issuer: { name: 'Issuer' },
        evidenceFiles: [],
        revokedAt: new Date().toISOString(),
        revokedBy: { name: 'Admin' },
        revocationReason: 'Policy violation',
        revocationNotes: 'Test',
        isPublicReason: true,
      };
      mockVerificationService.verifyBadge.mockResolvedValue(mockBadge);

      const headers: Record<string, string> = {};
      const mockResponse = {
        setHeader: jest.fn((key: string, value: string) => {
          headers[key] = value;
        }),
      };

      await controller.verifyBadge('test-uuid', mockResponse as never);

      expect(headers['Cache-Control']).toBe(
        'no-cache, no-store, must-revalidate',
      );
    });
  });
});
