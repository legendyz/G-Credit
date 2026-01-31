/**
 * Teams Action Controller Tests
 * 
 * Story 7.4 Task 5
 * Tests Adaptive Card action callbacks (Claim Badge)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TeamsActionController } from './teams-action.controller';
import { PrismaService } from '../../common/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { BadgeStatus } from '@prisma/client';

describe('TeamsActionController', () => {
  let controller: TeamsActionController;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockBadge = {
    id: 'badge-123',
    status: BadgeStatus.PENDING,
    recipientId: 'user-123',
    issuerId: 'issuer-456',
    templateId: 'template-789',
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
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('claimBadge', () => {
    const claimDto = {
      badgeId: 'badge-123',
      userId: 'user-123',
    };

    it('should claim badge successfully', async () => {
      // Arrange
      prismaService.badge.findUnique.mockResolvedValue(mockBadge);
      prismaService.badge.update.mockResolvedValue({
        ...mockBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date('2026-01-30T12:00:00Z'),
      });

      // Act
      const result = await controller.claimBadge(claimDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Badge claimed successfully!');
      expect(result.badge.id).toBe('badge-123');
      expect(result.badge.status).toBe(BadgeStatus.CLAIMED);
      expect(result.badge.claimedAt).toBeDefined();

      // Verify Prisma calls
      expect(prismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        include: {
          template: true,
          recipient: true,
          issuer: true,
        },
      });

      expect(prismaService.badge.update).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        data: {
          status: BadgeStatus.CLAIMED,
          claimedAt: expect.any(Date),
        },
        include: {
          template: true,
          recipient: true,
          issuer: true,
        },
      });
    });

    it('should return updated Adaptive Card', async () => {
      // Arrange
      const claimedDate = new Date('2026-01-30T12:00:00Z');
      prismaService.badge.findUnique.mockResolvedValue(mockBadge);
      prismaService.badge.update.mockResolvedValue({
        ...mockBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: claimedDate,
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
      const factSet = result.adaptiveCard.body.find((item: any) => item.type === 'FactSet');
      expect(factSet).toBeDefined();
      const statusFact = factSet.facts.find((fact: any) => fact.title === 'Status');
      expect(statusFact.value).toContain('CLAIMED');

      // Check for success message
      const successContainer = result.adaptiveCard.body.find(
        (item: any) => item.type === 'Container' && item.style === 'accent',
      );
      expect(successContainer).toBeDefined();
      expect(successContainer.items[0].text).toContain('claimed successfully');
    });

    it('should throw NotFoundException if badge not found', async () => {
      // Arrange
      prismaService.badge.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(NotFoundException);
      await expect(controller.claimBadge(claimDto)).rejects.toThrow('Badge badge-123 not found');
    });

    it('should throw ForbiddenException if user is not recipient', async () => {
      // Arrange
      prismaService.badge.findUnique.mockResolvedValue(mockBadge);
      const wrongUserDto = {
        badgeId: 'badge-123',
        userId: 'other-user-999',
      };

      // Act & Assert
      await expect(controller.claimBadge(wrongUserDto)).rejects.toThrow(ForbiddenException);
      await expect(controller.claimBadge(wrongUserDto)).rejects.toThrow(
        'Only the badge recipient can claim this badge',
      );
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
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(BadRequestException);
      await expect(controller.claimBadge(claimDto)).rejects.toThrow('Badge has already been claimed');
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
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(BadRequestException);
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        'Badge has been revoked and cannot be claimed',
      );
    });

    it('should throw BadRequestException if badge status is not PENDING', async () => {
      // Arrange - badge in some other status
      const expiredBadge = {
        ...mockBadge,
        status: 'EXPIRED' as BadgeStatus,
      };
      prismaService.badge.findUnique.mockResolvedValue(expiredBadge);

      // Act & Assert
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(BadRequestException);
      await expect(controller.claimBadge(claimDto)).rejects.toThrow(
        'Badge status is EXPIRED, expected PENDING',
      );
    });
  });
});
