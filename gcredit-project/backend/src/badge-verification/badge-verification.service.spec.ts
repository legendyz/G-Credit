import { Test, TestingModule } from '@nestjs/testing';
import { BadgeVerificationService } from './badge-verification.service';
import { PrismaService } from '../common/prisma.service';
import { BadgeStatus } from '@prisma/client';

describe('BadgeVerificationService - Story 6.3', () => {
  let service: BadgeVerificationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeVerificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BadgeVerificationService>(BadgeVerificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('verifyBadge()', () => {
    const mockVerificationId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return badge data for valid verificationId', async () => {
      // Arrange
      const mockBadge = {
        id: 'badge-uuid-123',
        verificationId: mockVerificationId,
        status: BadgeStatus.CLAIMED,
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: new Date('2027-01-20T10:00:00Z'),
        claimedAt: new Date('2026-01-21T12:00:00Z'),
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          type: 'Assertion',
          badge: 'https://g-credit.com/api/badge-templates/template-uuid',
        },
        template: {
          id: 'template-uuid',
          name: 'Excellence Badge',
          description: 'Awarded for outstanding work',
          imageUrl: 'https://cdn.example.com/badge.png',
          issuanceCriteria: { description: 'Complete advanced project' },
          category: 'achievement',
          skillIds: ['skill-1', 'skill-2'],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      // Act
      const result = await service.verifyBadge(mockVerificationId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.verificationId).toBe(mockVerificationId);
      expect(result?.badge.name).toBe('Excellence Badge');
      expect(result?.recipient.name).toBe('John Doe');
      expect(result?.recipient.email).toMatch(/^j\*\*\*@/); // Masked email
      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { verificationId: mockVerificationId },
        include: expect.any(Object),
      });
    });

    it('should return null for invalid verificationId', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.verifyBadge('invalid-uuid');

      // Assert
      expect(result).toBeNull();
    });

    it('should include revocation details for revoked badges', async () => {
      // Arrange
      const mockRevokedBadge = {
        id: 'badge-uuid-456',
        verificationId: mockVerificationId,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date('2026-01-22T15:30:00Z'),
        revocationReason: 'Requirements no longer met',
        issuedAt: new Date('2026-01-15T10:00:00Z'),
        expiresAt: null,
        claimedAt: new Date('2026-01-16T12:00:00Z'),
        assertionJson: {},
        template: {
          id: 'template-uuid',
          name: 'Test Badge',
          description: 'Test',
          imageUrl: 'https://example.com/badge.png',
          issuanceCriteria: {},
          category: 'test',
          skillIds: [],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockRevokedBadge);

      // Act
      const result = await service.verifyBadge(mockVerificationId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.status).toBe(BadgeStatus.REVOKED);
      expect(result?.revokedAt).toBeDefined();
      expect(result?.revocationReason).toBe('Requirements no longer met');
    });

    it('should mask recipient email for privacy', async () => {
      // Arrange
      const mockBadge = {
        id: 'badge-uuid',
        verificationId: mockVerificationId,
        status: BadgeStatus.CLAIMED,
        issuedAt: new Date(),
        expiresAt: null,
        claimedAt: new Date(),
        assertionJson: {},
        template: {
          id: 'template-uuid',
          name: 'Badge',
          description: 'Test badge',
          imageUrl: 'https://example.com/badge.png',
          issuanceCriteria: {},
          category: 'test',
          skillIds: [],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      // Act
      const result = await service.verifyBadge(mockVerificationId);

      // Assert
      expect(result?.recipient.email).not.toBe('test.user@example.com');
      expect(result?.recipient.email).toMatch(/^t\*\*\*@example\.com$/);
    });
  });
});
