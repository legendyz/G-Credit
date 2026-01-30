import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BadgeAnalyticsController } from './badge-analytics.controller';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';

describe('BadgeAnalyticsController', () => {
  let controller: BadgeAnalyticsController;
  let service: BadgeAnalyticsService;

  const mockBadgeAnalyticsService = {
    getShareStats: jest.fn(),
    getShareHistory: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  const mockShareStats = {
    badgeId: 'badge-123',
    total: 15,
    byPlatform: {
      email: 6,
      teams: 5,
      widget: 4,
    },
  };

  const mockShareHistory = [
    {
      id: 'share-1',
      platform: 'teams',
      sharedAt: new Date('2026-01-30T14:30:00Z'),
      sharedBy: 'user-123',
      recipientEmail: null,
      metadata: { teamId: 'team-1', channelName: 'Engineering' },
    },
    {
      id: 'share-2',
      platform: 'email',
      sharedAt: new Date('2026-01-30T13:00:00Z'),
      sharedBy: 'user-123',
      recipientEmail: 'john@example.com',
      metadata: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeAnalyticsController],
      providers: [
        {
          provide: BadgeAnalyticsService,
          useValue: mockBadgeAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<BadgeAnalyticsController>(BadgeAnalyticsController);
    service = module.get<BadgeAnalyticsService>(BadgeAnalyticsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getShareStats', () => {
    it('should return share statistics for authorized user', async () => {
      jest.spyOn(service, 'getShareStats').mockResolvedValue(mockShareStats);

      const result = await controller.getShareStats('badge-123', mockRequest);

      expect(result).toEqual(mockShareStats);
      expect(service.getShareStats).toHaveBeenCalledWith('badge-123', 'user-123');
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      jest.spyOn(service, 'getShareStats').mockRejectedValue(
        new ForbiddenException('You are not authorized to view analytics for this badge'),
      );

      await expect(
        controller.getShareStats('badge-123', mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return zero counts for badge with no shares', async () => {
      const emptyStats = {
        badgeId: 'badge-123',
        total: 0,
        byPlatform: {
          email: 0,
          teams: 0,
          widget: 0,
        },
      };
      jest.spyOn(service, 'getShareStats').mockResolvedValue(emptyStats);

      const result = await controller.getShareStats('badge-123', mockRequest);

      expect(result.total).toBe(0);
      expect(result.byPlatform.email).toBe(0);
      expect(result.byPlatform.teams).toBe(0);
      expect(result.byPlatform.widget).toBe(0);
    });
  });

  describe('getShareHistory', () => {
    it('should return share history with default limit', async () => {
      jest.spyOn(service, 'getShareHistory').mockResolvedValue(mockShareHistory);

      const result = await controller.getShareHistory('badge-123', 10, mockRequest);

      expect(result).toEqual(mockShareHistory);
      expect(service.getShareHistory).toHaveBeenCalledWith('badge-123', 'user-123', 10);
    });

    it('should return share history with custom limit', async () => {
      const limitedHistory = [mockShareHistory[0]];
      jest.spyOn(service, 'getShareHistory').mockResolvedValue(limitedHistory);

      const result = await controller.getShareHistory('badge-123', 5, mockRequest);

      expect(result).toHaveLength(1);
      expect(service.getShareHistory).toHaveBeenCalledWith('badge-123', 'user-123', 5);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      jest.spyOn(service, 'getShareHistory').mockRejectedValue(
        new ForbiddenException('You are not authorized to view analytics for this badge'),
      );

      await expect(
        controller.getShareHistory('badge-123', 10, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty array for badge with no shares', async () => {
      jest.spyOn(service, 'getShareHistory').mockResolvedValue([]);

      const result = await controller.getShareHistory('badge-123', 10, mockRequest);

      expect(result).toEqual([]);
    });

    it('should handle large limit values', async () => {
      jest.spyOn(service, 'getShareHistory').mockResolvedValue(mockShareHistory);

      await controller.getShareHistory('badge-123', 100, mockRequest);

      expect(service.getShareHistory).toHaveBeenCalledWith('badge-123', 'user-123', 100);
    });

    it('should include metadata for Teams shares', async () => {
      const teamsShare = mockShareHistory.find((s) => s.platform === 'teams');
      jest.spyOn(service, 'getShareHistory').mockResolvedValue([teamsShare]);

      const result = await controller.getShareHistory('badge-123', 10, mockRequest);

      expect(result[0].metadata).toEqual({
        teamId: 'team-1',
        channelName: 'Engineering',
      });
    });

    it('should include recipientEmail for email shares', async () => {
      const emailShare = mockShareHistory.find((s) => s.platform === 'email');
      jest.spyOn(service, 'getShareHistory').mockResolvedValue([emailShare]);

      const result = await controller.getShareHistory('badge-123', 10, mockRequest);

      expect(result[0].recipientEmail).toBe('john@example.com');
      expect(result[0].metadata).toBeNull();
    });
  });
});
