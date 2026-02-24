import { Test, TestingModule } from '@nestjs/testing';
import { BadgeVerificationService } from './badge-verification.service';
import { PrismaService } from '../common/prisma.service';
import { BadgeStatus } from '@prisma/client';
import { AssertionGeneratorService } from '../badge-issuance/services/assertion-generator.service';
import { anyObject } from '../../test/helpers/jest-typed-matchers';

describe('BadgeVerificationService - Story 6.3', () => {
  let service: BadgeVerificationService;
  let _prisma: PrismaService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
    },
  };

  const mockAssertionGeneratorService = {
    computeAssertionHash: jest.fn(),
    verifyAssertionIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeVerificationService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: AssertionGeneratorService,
          useValue: mockAssertionGeneratorService,
        },
      ],
    }).compile();

    service = module.get<BadgeVerificationService>(BadgeVerificationService);
    _prisma = module.get<PrismaService>(PrismaService);

    // Story 11.18: Default skill.findMany to empty array
    mockPrismaService.skill.findMany.mockResolvedValue([]);
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
      mockPrismaService.skill.findMany.mockResolvedValue([
        { id: 'skill-1', name: 'JavaScript', category: { color: null } },
        { id: 'skill-2', name: 'TypeScript', category: { color: null } },
      ]);

      // Act
      const result = await service.verifyBadge(mockVerificationId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.verificationId).toBe(mockVerificationId);
      expect(result?.badge.name).toBe('Excellence Badge');
      // Story 11.18: Skills should be resolved objects, not UUIDs
      // Story 12.2: categoryColor added to skill resolution
      expect(result?.badge.skills).toEqual([
        { id: 'skill-1', name: 'JavaScript', categoryColor: null },
        { id: 'skill-2', name: 'TypeScript', categoryColor: null },
      ]);
      expect(result?.recipient.name).toBe('John Doe');
      expect(result?.recipient.email).toMatch(/^j\*\*\*@/); // Masked email
      expect(result?.issuer.email).toMatch(/^a\*\*\*@/); // Issuer email also masked
      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { verificationId: mockVerificationId },
        include: anyObject(),
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

    it('should mask issuer email for privacy', async () => {
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
      expect(result?.issuer.email).not.toBe('admin@gcredit.com');
      expect(result?.issuer.email).toMatch(/^a\*\*\*@gcredit\.com$/);
    });
  });

  describe('Story 9.2: Revocation Reason Categorization', () => {
    const mockVerificationId = '550e8400-e29b-41d4-a716-446655440000';

    it('should mark public reasons (Issued in Error) as isPublicReason=true', async () => {
      const mockBadge = {
        id: 'badge-uuid',
        verificationId: mockVerificationId,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date('2026-02-01T10:00:00Z'),
        revocationReason: 'Issued in Error',
        revocationNotes: 'Badge issued to wrong person',
        issuedAt: new Date(),
        expiresAt: null,
        claimedAt: null,
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
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        revoker: {
          id: 'admin-uuid',
          firstName: 'System',
          lastName: 'Admin',
          role: 'ADMIN',
        },
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const result = await service.verifyBadge(mockVerificationId);

      expect(result?.isValid).toBe(false);
      expect(result?.revocationReason).toBe('Issued in Error');
      expect(result?.isPublicReason).toBe(true);
      expect(result?.revocationNotes).toBe('Badge issued to wrong person');
      expect(result?.revokedBy).toEqual({
        name: 'System Admin',
        role: 'ADMIN',
      });
    });

    it('should mark private reasons (Policy Violation) as isPublicReason=false', async () => {
      const mockBadge = {
        id: 'badge-uuid',
        verificationId: mockVerificationId,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date('2026-02-01T10:00:00Z'),
        revocationReason: 'Policy Violation',
        revocationNotes: 'Confidential information',
        issuedAt: new Date(),
        expiresAt: null,
        claimedAt: null,
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
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        revoker: {
          id: 'admin-uuid',
          firstName: 'System',
          lastName: 'Admin',
          role: 'ADMIN',
        },
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const result = await service.verifyBadge(mockVerificationId);

      expect(result?.isPublicReason).toBe(false);
      expect(result?.revocationReason).toBe('Policy Violation');
    });

    it('should include isValid=false for revoked badges', async () => {
      const mockBadge = {
        id: 'badge-uuid',
        verificationId: mockVerificationId,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: 'Expired',
        issuedAt: new Date(),
        expiresAt: null,
        claimedAt: null,
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
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@gcredit.com',
        },
        revoker: null,
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const result = await service.verifyBadge(mockVerificationId);

      expect(result?.isValid).toBe(false);
      expect(result?.status).toBe(BadgeStatus.REVOKED);
    });

    it('should include isValid=true for active badges', async () => {
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
          name: 'Test Badge',
          description: 'Test',
          imageUrl: 'https://example.com/badge.png',
          issuanceCriteria: {},
          category: 'test',
          skillIds: [],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
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

      const result = await service.verifyBadge(mockVerificationId);

      expect(result?.isValid).toBe(true);
      expect(result?.status).toBe(BadgeStatus.CLAIMED);
    });

    // Story 11.4: PRIVATE badge returns null (404) on verification
    it('should return null for PRIVATE visibility badge', async () => {
      const mockBadge = {
        id: 'badge-uuid-private',
        verificationId: mockVerificationId,
        status: BadgeStatus.CLAIMED,
        visibility: 'PRIVATE',
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: null,
        claimedAt: new Date('2026-01-21T12:00:00Z'),
        assertionJson: {},
        metadataHash: null,
        template: {
          id: 'template-uuid',
          name: 'Test Badge',
          description: 'Test',
          imageUrl: null,
          issuanceCriteria: {},
          category: 'test',
          skillIds: [],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
        },
        revoker: null,
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const result = await service.verifyBadge(mockVerificationId);

      expect(result).toBeNull();
    });

    // Story 11.4 C-3: PUBLIC badge still returns verification data
    it('should return data for PUBLIC visibility badge', async () => {
      const mockBadge = {
        id: 'badge-uuid-public',
        verificationId: mockVerificationId,
        status: BadgeStatus.CLAIMED,
        visibility: 'PUBLIC',
        issuedAt: new Date('2026-01-20T10:00:00Z'),
        expiresAt: null,
        claimedAt: new Date('2026-01-21T12:00:00Z'),
        assertionJson: {},
        metadataHash: null,
        template: {
          id: 'template-uuid',
          name: 'Test Badge',
          description: 'Test',
          imageUrl: null,
          issuanceCriteria: {},
          category: 'test',
          skillIds: [],
        },
        recipient: {
          id: 'recipient-uuid',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        issuer: {
          id: 'issuer-uuid',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
        },
        revoker: null,
        evidenceFiles: [],
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const result = await service.verifyBadge(mockVerificationId);

      expect(result).not.toBeNull();
      expect(result?.badge.name).toBe('Test Badge');
    });
  });
});
