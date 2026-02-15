import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BadgeAnalyticsService } from './badge-analytics.service';
import { PrismaService } from '../../common/prisma.service';
import { containing } from '../../../test/helpers/jest-typed-matchers';

describe('BadgeAnalyticsService', () => {
  let service: BadgeAnalyticsService;
  let _prisma: PrismaService;

  const mockBadge = {
    id: 'badge-123',
    recipientId: 'user-recipient',
    issuerId: 'user-issuer',
    templateId: 'template-123',
    status: 'CLAIMED',
    issuedAt: new Date(),
  };

  const mockShares = [
    {
      id: 'share-1',
      badgeId: 'badge-123',
      platform: 'email',
      sharedAt: new Date('2026-01-30T10:00:00Z'),
      sharedBy: 'user-recipient',
      recipientEmail: 'john@example.com',
      metadata: null,
    },
    {
      id: 'share-2',
      badgeId: 'badge-123',
      platform: 'teams',
      sharedAt: new Date('2026-01-30T11:00:00Z'),
      sharedBy: 'user-recipient',
      recipientEmail: null,
      metadata: {
        teamId: 'team-1',
        channelId: 'channel-1',
        channelName: 'General',
      },
    },
    {
      id: 'share-3',
      badgeId: 'badge-123',
      platform: 'widget',
      sharedAt: new Date('2026-01-30T12:00:00Z'),
      sharedBy: null, // Anonymous widget embed
      recipientEmail: null,
      metadata: { referrerUrl: 'https://johndoe.com/portfolio' },
    },
    {
      id: 'share-4',
      badgeId: 'badge-123',
      platform: 'email',
      sharedAt: new Date('2026-01-30T13:00:00Z'),
      sharedBy: 'user-issuer',
      recipientEmail: 'jane@example.com',
      metadata: null,
    },
  ];

  const mockPrismaService: {
    badge: { findUnique: jest.Mock };
    badgeShare: { create: jest.Mock; findMany: jest.Mock };
  } = {
    badge: { findUnique: jest.fn() },
    badgeShare: { create: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BadgeAnalyticsService>(BadgeAnalyticsService);
    _prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordShare', () => {
    it('should record an email share', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      const createdShare = { ...mockShares[0] };
      mockPrismaService.badgeShare.create.mockResolvedValue(createdShare);

      const result = await service.recordShare(
        'badge-123',
        'email',
        'user-recipient',
        { recipientEmail: 'john@example.com' },
      );

      expect(result.platform).toEqual('email');
      expect(result.recipientEmail).toEqual('john@example.com');
      expect(mockPrismaService.badgeShare.create).toHaveBeenCalledWith(
        containing({
          data: containing({
            badgeId: 'badge-123',
            platform: 'email',
            sharedBy: 'user-recipient',
            recipientEmail: 'john@example.com',
          }),
        }),
      );
    });

    it('should record a Teams share with metadata', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      const createdShare = { ...mockShares[1] };
      mockPrismaService.badgeShare.create.mockResolvedValue(createdShare);

      const result = await service.recordShare(
        'badge-123',
        'teams',
        'user-recipient',
        {
          teamId: 'team-1',
          channelId: 'channel-1',
          channelName: 'General',
        },
      );

      expect(result.platform).toEqual('teams');
      expect(result.metadata).toEqual({
        teamId: 'team-1',
        channelId: 'channel-1',
        channelName: 'General',
      });
      expect(mockPrismaService.badgeShare.create).toHaveBeenCalledWith({
        data: {
          badgeId: 'badge-123',
          platform: 'teams',
          sharedBy: 'user-recipient',
          recipientEmail: null,
          metadata: {
            teamId: 'team-1',
            channelId: 'channel-1',
            channelName: 'General',
          },
        },
      });
    });

    it('should record an anonymous widget embed', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      const createdShare = { ...mockShares[2] };
      mockPrismaService.badgeShare.create.mockResolvedValue(createdShare);

      const result = await service.recordShare(
        'badge-123',
        'widget',
        null, // Anonymous
        { referrerUrl: 'https://johndoe.com/portfolio' },
      );

      expect(result.platform).toEqual('widget');
      expect(result.sharedBy).toBeNull();
      expect(mockPrismaService.badgeShare.create).toHaveBeenCalledWith({
        data: {
          badgeId: 'badge-123',
          platform: 'widget',
          sharedBy: null,
          recipientEmail: null,
          metadata: {
            referrerUrl: 'https://johndoe.com/portfolio',
          },
        },
      });
    });

    it('should throw error if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.recordShare('invalid-badge', 'email', 'user-123'),
      ).rejects.toThrow('Badge with ID invalid-badge not found');
    });

    it('should record share without metadata', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.create.mockResolvedValue({
        id: 'share-5',
        badgeId: 'badge-123',
        platform: 'email',
        sharedAt: new Date(),
        sharedBy: 'user-recipient',
        recipientEmail: null,
        metadata: null,
      });

      const _result = await service.recordShare(
        'badge-123',
        'email',
        'user-recipient',
      );

      expect(mockPrismaService.badgeShare.create).toHaveBeenCalledWith({
        data: {
          badgeId: 'badge-123',
          platform: 'email',
          sharedBy: 'user-recipient',
          recipientEmail: null,
          metadata: Prisma.JsonNull,
        },
      });
    });

    it('should throw ForbiddenException when user is not badge owner or issuer', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.recordShare('badge-123', 'linkedin', 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getShareStats', () => {
    it('should return share statistics for badge owner', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue(mockShares);

      const result = await service.getShareStats('badge-123', 'user-recipient');

      expect(result).toEqual({
        badgeId: 'badge-123',
        total: 4,
        byPlatform: {
          email: 2,
          teams: 1,
          widget: 1,
        },
      });
    });

    it('should return share statistics for badge issuer', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue(mockShares);

      const result = await service.getShareStats('badge-123', 'user-issuer');

      expect(result).toEqual({
        badgeId: 'badge-123',
        total: 4,
        byPlatform: {
          email: 2,
          teams: 1,
          widget: 1,
        },
      });
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.getShareStats('badge-123', 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return zero counts for badge with no shares', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue([]);

      const result = await service.getShareStats('badge-123', 'user-recipient');

      expect(result).toEqual({
        badgeId: 'badge-123',
        total: 0,
        byPlatform: {
          email: 0,
          teams: 0,
          widget: 0,
        },
      });
    });
  });

  describe('getShareHistory', () => {
    it('should return recent share history for badge owner', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      // Remove badgeId from shares since it's not in the select
      const sharesWithoutBadgeId = mockShares.map(
        ({ badgeId, ...rest }) => rest,
      );
      mockPrismaService.badgeShare.findMany.mockResolvedValue(
        sharesWithoutBadgeId,
      );

      const result = await service.getShareHistory(
        'badge-123',
        'user-recipient',
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        id: 'share-1',
        platform: 'email',
        sharedBy: 'user-recipient',
        recipientEmail: 'john@example.com',
        metadata: null,
      });
    });

    it('should limit results to specified limit', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      const limitedShares = mockShares
        .slice(0, 2)
        .map(({ badgeId, ...rest }) => rest);
      mockPrismaService.badgeShare.findMany.mockResolvedValue(limitedShares);

      await service.getShareHistory('badge-123', 'user-recipient', 2);

      expect(mockPrismaService.badgeShare.findMany).toHaveBeenCalledWith({
        where: { badgeId: 'badge-123' },
        orderBy: { sharedAt: 'desc' },
        take: 2,
        select: {
          id: true,
          platform: true,
          sharedAt: true,
          sharedBy: true,
          recipientEmail: true,
          metadata: true,
        },
      });
    });

    it('should default to 10 results if limit not specified', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue([]);

      await service.getShareHistory('badge-123', 'user-issuer');

      expect(mockPrismaService.badgeShare.findMany).toHaveBeenCalledWith({
        where: { badgeId: 'badge-123' },
        orderBy: { sharedAt: 'desc' },
        take: 10,
        select: containing({}),
      });
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.getShareHistory('badge-123', 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty array for badge with no shares', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue([]);

      const result = await service.getShareHistory(
        'badge-123',
        'user-recipient',
      );

      expect(result).toEqual([]);
    });
  });

  describe('Authorization', () => {
    it('should allow badge recipient to view analytics', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue([]);

      await expect(
        service.getShareStats('badge-123', 'user-recipient'),
      ).resolves.toBeDefined();
    });

    it('should allow badge issuer to view analytics', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badgeShare.findMany.mockResolvedValue([]);

      await expect(
        service.getShareStats('badge-123', 'user-issuer'),
      ).resolves.toBeDefined();
    });

    it('should deny other users from viewing analytics', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.getShareStats('badge-123', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error if badge not found during authorization', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.getShareStats('invalid-badge', 'user-123'),
      ).rejects.toThrow('Badge with ID invalid-badge not found');
    });
  });
});
