/**
 * Unit tests for TeamsSharingController
 * Story 7.4 - Microsoft Teams Notifications
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TeamsSharingController } from './teams-sharing.controller';
import { TeamsBadgeNotificationService } from '../../microsoft-graph/teams/teams-badge-notification.service';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';
import { PrismaService } from '../../common/prisma.service';
import { ShareBadgeTeamsDto } from '../dto/share-badge-teams.dto';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('TeamsSharingController - Story 7.4', () => {
  let controller: TeamsSharingController;
  let teamsNotificationService: TeamsBadgeNotificationService;
  let badgeAnalyticsService: BadgeAnalyticsService;
  let prismaService: PrismaService;

  const mockTeamsNotificationService = {
    sendBadgeIssuanceNotification: jest.fn(),
  };

  const mockBadgeAnalyticsService = {
    recordShare: jest.fn(),
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
    status: 'CLAIMED',
    issuerId: 'issuer-789',
    recipientId: 'user-123',
    template: {
      id: 'template-001',
      name: 'Full-Stack Developer',
    },
    issuer: {
      id: 'issuer-789',
      name: 'Tech University',
    },
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
          provide: BadgeAnalyticsService,
          useValue: mockBadgeAnalyticsService,
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
    badgeAnalyticsService = module.get<BadgeAnalyticsService>(BadgeAnalyticsService);
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
        include: { template: true, issuer: true },
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
        issuerId: 'different-issuer',
        recipientId: 'different-recipient',
        issuer: {
          id: 'different-issuer',
          name: 'Other University',
        },
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(differentBadge);

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

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle Teams notification service errors', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockRejectedValue(
        new Error('Teams API rate limit exceeded'),
      );

      await expect(
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest as any),
      ).rejects.toThrow('Teams API rate limit exceeded');
    });
  });
});
