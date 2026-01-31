import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BadgeAnalyticsService } from './badge-analytics.service';
import { PrismaService } from '../../common/prisma.service';

describe('BadgeAnalyticsService', () => {
  let service: BadgeAnalyticsService;
  let prisma: PrismaService;

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
      metadata: { teamId: 'team-1', channelId: 'channel-1', channelName: 'General' },
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeAnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            badge: {
              findUnique: jest.fn(),
            },
            badgeShare: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BadgeAnalyticsService>(BadgeAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordShare', () => {
    it('should record an email share', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      const createdShare = { ...mockShares[0] };
      jest.spyOn(prisma.badgeShare, 'create').mockResolvedValue(createdShare as any);

      const result = await service.recordShare(
        'badge-123',
        'email',
        'user-recipient',
        { recipientEmail: 'john@example.com' },
      );

      expect(result.platform).toEqual('email');
      expect(result.recipientEmail).toEqual('john@example.com');
      expect(prisma.badgeShare.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            badgeId: 'badge-123',
            platform: 'email',
            sharedBy: 'user-recipient',
            recipientEmail: 'john@example.com',
          }),
        }),
      );
    });

    it('should record a Teams share with metadata', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      const createdShare = { ...mockShares[1] };
      jest.spyOn(prisma.badgeShare, 'create').mockResolvedValue(createdShare as any);

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
      expect(result.metadata).toEqual({ teamId: 'team-1', channelId: 'channel-1', channelName: 'General' });
      expect(prisma.badgeShare.create).toHaveBeenCalledWith({
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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      const createdShare = { ...mockShares[2] };
      jest.spyOn(prisma.badgeShare, 'create').mockResolvedValue(createdShare as any);

      const result = await service.recordShare(
        'badge-123',
        'widget',
        null, // Anonymous
        { referrerUrl: 'https://johndoe.com/portfolio' },
      );

      expect(result.platform).toEqual('widget');
      expect(result.sharedBy).toBeNull();
      expect(prisma.badgeShare.create).toHaveBeenCalledWith({
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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(null);

      await expect(
        service.recordShare('invalid-badge', 'email', 'user-123'),
      ).rejects.toThrow('Badge with ID invalid-badge not found');
    });

    it('should record share without metadata', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'create').mockResolvedValue({
        id: 'share-5',
        badgeId: 'badge-123',
        platform: 'email',
        sharedAt: new Date(),
        sharedBy: 'user-123',
        recipientEmail: null,
        metadata: null,
      } as any);

      const result = await service.recordShare(
        'badge-123',
        'email',
        'user-123',
      );

      expect(prisma.badgeShare.create).toHaveBeenCalledWith({
        data: {
          badgeId: 'badge-123',
          platform: 'email',
          sharedBy: 'user-123',
          recipientEmail: null,
          metadata: null,
        },
      });
    });
  });

  describe('getShareStats', () => {
    it('should return share statistics for badge owner', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue(mockShares as any);

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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue(mockShares as any);

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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);

      await expect(
        service.getShareStats('badge-123', 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return zero counts for badge with no shares', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue([]);

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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      // Remove badgeId from shares since it's not in the select
      const sharesWithoutBadgeId = mockShares.map(({ badgeId, ...rest }) => rest);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue(sharesWithoutBadgeId as any);

      const result = await service.getShareHistory('badge-123', 'user-recipient');

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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      const limitedShares = mockShares.slice(0, 2).map(({ badgeId, ...rest }) => rest);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue(limitedShares as any);

      await service.getShareHistory('badge-123', 'user-recipient', 2);

      expect(prisma.badgeShare.findMany).toHaveBeenCalledWith({
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
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue([]);

      await service.getShareHistory('badge-123', 'user-issuer');

      expect(prisma.badgeShare.findMany).toHaveBeenCalledWith({
        where: { badgeId: 'badge-123' },
        orderBy: { sharedAt: 'desc' },
        take: 10,
        select: expect.any(Object),
      });
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);

      await expect(
        service.getShareHistory('badge-123', 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty array for badge with no shares', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue([]);

      const result = await service.getShareHistory('badge-123', 'user-recipient');

      expect(result).toEqual([]);
    });
  });

  describe('Authorization', () => {
    it('should allow badge recipient to view analytics', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue([]);

      await expect(
        service.getShareStats('badge-123', 'user-recipient'),
      ).resolves.toBeDefined();
    });

    it('should allow badge issuer to view analytics', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);
      jest.spyOn(prisma.badgeShare, 'findMany').mockResolvedValue([]);

      await expect(
        service.getShareStats('badge-123', 'user-issuer'),
      ).resolves.toBeDefined();
    });

    it('should deny other users from viewing analytics', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(mockBadge as any);

      await expect(
        service.getShareStats('badge-123', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error if badge not found during authorization', async () => {
      jest.spyOn(prisma.badge, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getShareStats('invalid-badge', 'user-123'),
      ).rejects.toThrow('Badge with ID invalid-badge not found');
    });
  });
});
