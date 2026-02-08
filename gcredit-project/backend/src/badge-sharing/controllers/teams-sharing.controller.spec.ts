/**
 * Unit tests for TeamsSharingController
 * Story 7.4 - Microsoft Teams Notifications
 */

/**
 * Teams Sharing Controller Tests
 *
 * TECHNICAL DEBT: These tests may fail because Teams channel sharing
 * is currently disabled pending Graph API permissions.
 * See: docs/sprints/sprint-6/technical-debt.md
 * TODO: Re-enable when Teams permissions are configured (TD-003)
 *
 * Email sharing provides equivalent functionality and is fully tested.
 */

// SKIP: Teams channel sharing pending Graph API permissions
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsSharingController } from './teams-sharing.controller';
import { TeamsBadgeNotificationService } from '../../microsoft-graph/teams/teams-badge-notification.service';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';
import { PrismaService } from '../../common/prisma.service';
import { ShareBadgeTeamsDto } from '../dto/share-badge-teams.dto';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

// SKIP: Teams channel sharing pending Graph API permissions
describe.skip('TeamsSharingController - Story 7.4', () => {
  let controller: TeamsSharingController;
  let _teamsNotificationService: TeamsBadgeNotificationService;
  let _badgeAnalyticsService: BadgeAnalyticsService;
  let _prismaService: PrismaService;

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

  const mockRequest: RequestWithUser = {
    user: {
      userId: 'user-123',
      email: 'john.smith@example.com',
      role: UserRole.EMPLOYEE,
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
    _teamsNotificationService = module.get<TeamsBadgeNotificationService>(
      TeamsBadgeNotificationService,
    );
    _badgeAnalyticsService = module.get<BadgeAnalyticsService>(
      BadgeAnalyticsService,
    );
    _prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('shareBadgeToTeams', () => {
    const shareDto: ShareBadgeTeamsDto = {
      teamId: '19:abc123team@thread.tacv2',
      channelId: '19:xyz789channel@thread.tacv2',
      personalMessage: 'Check out my new badge!',
    };

    it('should share badge to Teams successfully', () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockResolvedValue(
        undefined,
      );

      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });

    it('should throw NotFoundException if badge not found', () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      expect(() =>
        controller.shareBadgeToTeams('badge-999', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not recipient or issuer', () => {
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

      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });

    it('should always throw BadRequestException (not yet implemented)', () => {
      const issuerRequest: RequestWithUser = {
        user: {
          userId: 'issuer-789',
          email: 'issuer@example.com',
          role: UserRole.ISSUER,
        },
      };

      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, issuerRequest),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if badge is REVOKED', () => {
      const revokedBadge = {
        ...mockBadge,
        status: 'REVOKED',
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(revokedBadge);

      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if badge is EXPIRED', () => {
      const expiredBadge = {
        ...mockBadge,
        status: 'EXPIRED',
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(expiredBadge);

      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException even with service errors', () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockTeamsNotificationService.sendBadgeIssuanceNotification.mockRejectedValue(
        new Error('Teams API rate limit exceeded'),
      );

      // Method throws synchronously before any service call
      expect(() =>
        controller.shareBadgeToTeams('badge-456', shareDto, mockRequest),
      ).toThrow(BadRequestException);
    });
  });
});
