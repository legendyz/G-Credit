/**
 * Unit tests for TeamsSharingController
 * Story 7.4 - Microsoft Teams Notifications
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TeamsSharingController } from './teams-sharing.controller';
import { TeamsBadgeNotificationService } from '../../microsoft-graph/teams/teams-badge-notification.service';
import { PrismaService } from '../../common/prisma.service';
import { ShareBadgeTeamsDto } from '../dto/share-badge-teams.dto';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('TeamsSharingController - Story 7.4', () => {
  let controller: TeamsSharingController;
  let teamsNotificationService: TeamsBadgeNotificationService;
  let prismaService: PrismaService;

  const mockTeamsNotificationService = {
    sendBadgeIssuanceNotification: jest.fn(),
  };

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
    credential: {
      findFirst: jest.fn(),
    },
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'john.smith@example.com',
    },
  };

  const mockBadge = {
    id: 'badge-456',
    name: 'Full-Stack Developer',
    status: 'ACTIVE',
    badgeTemplate: {
      issuer: {
        id: 'issuer-789',
      },
    },
  };

  const mockCredential = {
    id: 'credential-101',
    badgeId: 'badge-456',
    userId: 'user-123',
    status: 'CLAIMED',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsSharingController],
      providers: [
        {
          provide: TeamsBadgeNotificationService,
          useValue: mockTeamsNotificationService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<TeamsSharingController>(TeamsSharingController);
    teamsNotificationService = module.get<TeamsBadgeNotificationService>(
      TeamsBadgeNotificationService,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('shareBadgeToTeams', () => {
    const shareDto: ShareBadgeTeamsDto = {
      teamId: '19:abc123team@thread.tacv2',
      channelId: '19:xyz789channel@thread.tacv2',
      personalMessage: 'Check out my new badge!',
    };

    it('should share badge to Teams successfully', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockResolvedValue(
        undefined,
      );

      const result = await controller.shareBadgeToTeams(
        'badge-456',
        shareDto,
        mockRequest as any,
      );

      expect(result).toEqual({
        success: true,
        message: 'Badge shared to Microsoft Teams successfully',
        badgeId: 'badge-456',
        teamId: shareDto.teamId,
        channelId: shareDto.channelId,
      });

      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-456' },
        include: { badgeTemplate: { include: { issuer: true } } },
      });

      expect(mockPrismaService.credential.findFirst).toHaveBeenCalledWith({
        where: {
          badgeId: 'badge-456',
          userId: 'user-123',
        },
      });

      expect(
        mockTeamsNotificationService.sendBadgeIssuanceNotification,
      ).toHaveBeenCalledWith('badge-456', 'user-123');
    });

    it('should throw NotFoundException if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        controller.shareBadgeToTeams('badge-999', shareDto, mockRequest as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user is not recipient or issuer', async () => {
      const differentBadge = {
        ...mockBadge,
        badgeTemplate: {
          issuer: {
            id: 'different-issuer',
          },
        },
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(differentBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(null); // User is not recipient

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow issuer to share badge', async () => {
      const issuerRequest = {
        user: {
          id: 'issuer-789', // Same as badge issuer
          email: 'issuer@example.com',
        },
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(null); // Not recipient
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockResolvedValue(
        undefined,
      );

      const result = await controller.shareBadgeToTeams(
        'badge-456',
        shareDto,
        issuerRequest as any,
      );

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if badge is REVOKED', async () => {
      const revokedBadge = {
        ...mockBadge,
        status: 'REVOKED',
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(revokedBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if badge is EXPIRED', async () => {
      const expiredBadge = {
        ...mockBadge,
        status: 'EXPIRED',
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(expiredBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle Teams notification service errors', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockRejectedValue(
        new Error('Teams API rate limit exceeded'),
      );

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow('Teams API rate limit exceeded');
    });
  });
});
