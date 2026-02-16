/**
 * Teams Action Controller Tests
 *
 * Story 7.4 Task 5 / Story 11.25 AC-C2
 * Tests Adaptive Card action callbacks (Claim Badge) using claimToken auth.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TeamsActionController } from './teams-action.controller';
import { PrismaService } from '../../common/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BadgeStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

describe('TeamsActionController', () => {
  let controller: TeamsActionController;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  // Alias preserves jest.Mock types for .mockResolvedValue()
  const prismaService = mockPrismaService;

  const mockBadge = {
    id: 'badge-123',
    status: BadgeStatus.PENDING,
    recipientId: 'user-123',
    issuerId: 'issuer-456',
    templateId: 'template-789',
    claimToken: 'valid-claim-token-abc123',
    issuedAt: new Date('2026-01-30'),
    claimedAt: null,
    revokedAt: null,
    template: {
      id: 'template-789',
      name: 'Excellence Award',
      description: 'Awarded for outstanding performance',
      imageUrl: 'https://example.com/badge.png',
    },
    recipient: {
      id: 'user-123',
      email: 'user@test.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    issuer: {
      id: 'issuer-456',
      email: 'issuer@test.com',
      firstName: 'Manager',
      lastName: 'Smith',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsActionController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<TeamsActionController>(TeamsActionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Story 11.25 AC-C2: Decorator metadata guard
  describe('Decorator metadata guards', () => {
    it('POST /claim-badge should be @Public()', () => {
      const isPublic = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        TeamsActionController.prototype.claimBadge,
      ) as boolean | undefined;
      expect(isPublic).toBe(true);
    });
  });

  describe('claimBadge', () => {
    const claimDto = {
      claimToken: 'valid-claim-token-abc123',
    };

    it('should claim badge successfully with valid claimToken', async () => {
      // Arrange
      prismaService.badge.findUnique.mockResolvedValue(mockBadge);
      prismaService.badge.update.mockResolvedValue({
        ...mockBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date('2026-01-30T12:00:00Z'),
        claimToken: null,
      });

      // Act
      const result = await controller.claimBadge(claimDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Badge claimed successfully!');
      expect(result.badge.id).toBe('badge-123');
      expect(result.badge.status).toBe(BadgeStatus.CLAIMED);
      expect(result.badge.claimedAt).toBeDefined();

      // Verify lookup by claimToken
      expect(prismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { claimToken: 'valid-claim-token-abc123' },
        include: {
          template: true,
          recipient: true,
          issuer: true,
        },
      });

      // Verify token cleared on claim (one-time use)
      expect(prismaService.badge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            status: BadgeStatus.CLAIMED,
            claimToken: null,
          }),
        }),
      );
    });

    it('should return updated Adaptive Card', async () => {
      // Arrange
      const claimedDate = new Date('2026-01-30T12:00:00Z');
      prismaService.badge.findUnique.mockResolvedValue(mockBadge);
      prismaService.badge.update.mockResolvedValue({
        ...mockBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: claimedDate,
        claimToken: null,
      });

      // Act
      const result = await controller.claimBadge(claimDto);

      // Assert
      expect(result.adaptiveCard).toBeDefined();
      expect(result.adaptiveCard.type).toBe('AdaptiveCard');
      expect(result.adaptiveCard.version).toBe('1.4');
      expect(result.adaptiveCard.body).toBeDefined();
      expect(result.adaptiveCard.actions).toBeDefined();

      // Check for claimed status in card
      const factSet = result.adaptiveCard.body.find(
        (item: { type?: string }) => item.type === 'FactSet',
      );
      expect(factSet).toBeDefined();
      const statusFact = factSet!.facts!.find(
        (fact: { title: string; value: string }) => fact.title === 'Status',
      );
      expect(statusFact!.value).toContain('CLAIMED');
    });

    it('should throw NotFoundException for invalid claimToken', async () => {
      // Arrange
      prismaService.badge.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.claimBadge({ claimToken: 'invalid-token' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.claimBadge({ claimToken: 'invalid-token' }),
      ).rejects.toThrow('invalid or has already been used');
    });

    it('should throw BadRequestException if badge already claimed', async () => {
      // Arrange
      const claimedBadge = {
        ...mockBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date('2026-01-29'),
      };
      prismaService.badge.findUnique.mockResolvedValue(claimedBadge);

      // Act & Assert
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        'Badge has already been claimed',
      );
    });

    it('should throw BadRequestException if badge is revoked', async () => {
      // Arrange
      const revokedBadge = {
        ...mockBadge,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date('2026-01-29'),
      };
      prismaService.badge.findUnique.mockResolvedValue(revokedBadge);

      // Act & Assert
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        'Badge has been revoked and cannot be claimed',
      );
    });

    it('should throw BadRequestException if badge status is not PENDING', async () => {
      // Arrange
      const expiredBadge = {
        ...mockBadge,
        status: 'EXPIRED' as BadgeStatus,
      };
      prismaService.badge.findUnique.mockResolvedValue(expiredBadge);

      // Act & Assert
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        'Badge status is EXPIRED, expected PENDING',
      );
    });
  });
});
