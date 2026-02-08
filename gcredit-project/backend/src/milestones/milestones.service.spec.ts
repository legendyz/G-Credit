import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../common/prisma.service';
import { MilestoneType, BadgeStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('MilestonesService', () => {
  let service: MilestonesService;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    milestoneConfig: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    milestoneAchievement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    badge: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    _prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMilestone', () => {
    it('should create BADGE_COUNT milestone successfully', async () => {
      const createDto = {
        type: 'badge_count',
        title: 'Badge Collector',
        description: 'Earned 10 badges',
        trigger: { type: 'badge_count', value: 10 },
        icon: '🏆',
        isActive: true,
      };

      const expectedMilestone = {
        id: 'milestone-uuid',
        type: MilestoneType.BADGE_COUNT,
        title: createDto.title,
        description: createDto.description,
        trigger: createDto.trigger,
        icon: createDto.icon,
        isActive: true,
        createdBy: 'admin-uuid',
        createdAt: new Date(),
      };

      mockPrismaService.milestoneConfig.create.mockResolvedValue(
        expectedMilestone,
      );

      const result = await service.createMilestone(
        createDto as any,
        'admin-uuid',
      );

      expect(result).toEqual(expectedMilestone);
      expect(mockPrismaService.milestoneConfig.create).toHaveBeenCalledWith({
        data: {
          type: MilestoneType.BADGE_COUNT,
          title: createDto.title,
          description: createDto.description,
          trigger: createDto.trigger,
          icon: createDto.icon,
          isActive: true,
          createdBy: 'admin-uuid',
        },
      });
    });

    it('should create SKILL_TRACK milestone successfully', async () => {
      const createDto = {
        type: 'skill_track',
        title: 'Cloud Master',
        description: 'Earned 5 cloud badges',
        trigger: {
          type: 'skill_track',
          value: 5,
          categoryId: 'cloud-category-uuid',
        },
        icon: '☁️',
      };

      const expectedMilestone = {
        id: 'milestone-uuid-2',
        type: MilestoneType.SKILL_TRACK,
        title: createDto.title,
        description: createDto.description,
        trigger: createDto.trigger,
        icon: createDto.icon,
        isActive: true,
        createdBy: 'admin-uuid',
        createdAt: new Date(),
      };

      mockPrismaService.milestoneConfig.create.mockResolvedValue(
        expectedMilestone,
      );

      const result = await service.createMilestone(
        createDto as any,
        'admin-uuid',
      );

      expect(result.type).toEqual(MilestoneType.SKILL_TRACK);
      expect(mockPrismaService.milestoneConfig.create).toHaveBeenCalled();
    });

    it('should create ANNIVERSARY milestone successfully', async () => {
      const createDto = {
        type: 'anniversary',
        title: '1 Year Anniversary',
        description: 'Completed 1 year at the company',
        trigger: { type: 'anniversary', months: 12 },
        icon: '🎂',
      };

      const expectedMilestone = {
        id: 'milestone-uuid-3',
        type: MilestoneType.ANNIVERSARY,
        title: createDto.title,
        description: createDto.description,
        trigger: createDto.trigger,
        icon: createDto.icon,
        isActive: true,
        createdBy: 'admin-uuid',
        createdAt: new Date(),
      };

      mockPrismaService.milestoneConfig.create.mockResolvedValue(
        expectedMilestone,
      );

      const result = await service.createMilestone(
        createDto as any,
        'admin-uuid',
      );

      expect(result.type).toEqual(MilestoneType.ANNIVERSARY);
    });
  });

  describe('getAllMilestones', () => {
    it('should return all milestones sorted by creation date', async () => {
      const mockMilestones = [
        {
          id: 'milestone-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          description: 'Earned 10 badges',
          trigger: { type: 'badge_count', value: 10 },
          icon: '🏆',
          isActive: true,
          createdBy: 'admin-uuid',
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 'milestone-2',
          type: MilestoneType.ANNIVERSARY,
          title: '1 Year Anniversary',
          description: '1 year at company',
          trigger: { type: 'anniversary', months: 12 },
          icon: '🎂',
          isActive: true,
          createdBy: 'admin-uuid',
          createdAt: new Date('2026-01-10'),
        },
      ];

      mockPrismaService.milestoneConfig.findMany.mockResolvedValue(
        mockMilestones,
      );

      const result = await service.getAllMilestones();

      expect(result).toEqual(mockMilestones);
      expect(mockPrismaService.milestoneConfig.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone successfully', async () => {
      const existingMilestone = {
        id: 'milestone-uuid',
        type: MilestoneType.BADGE_COUNT,
        title: 'Badge Collector',
        description: 'Earned 10 badges',
        trigger: { type: 'badge_count', value: 10 },
        icon: '🏆',
        isActive: true,
        createdBy: 'admin-uuid',
        createdAt: new Date(),
      };

      const updateDto = {
        title: 'Super Collector',
        description: 'Earned 10 amazing badges!',
      };

      const updatedMilestone = { ...existingMilestone, ...updateDto };

      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(
        existingMilestone,
      );
      mockPrismaService.milestoneConfig.update.mockResolvedValue(
        updatedMilestone,
      );

      const result = await service.updateMilestone('milestone-uuid', updateDto);

      expect(result.title).toEqual('Super Collector');
      expect(mockPrismaService.milestoneConfig.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if milestone does not exist', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMilestone('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMilestone', () => {
    it('should soft delete milestone by setting isActive=false', async () => {
      const milestone = {
        id: 'milestone-uuid',
        type: MilestoneType.BADGE_COUNT,
        title: 'Badge Collector',
        isActive: true,
      };

      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(milestone);
      mockPrismaService.milestoneConfig.update.mockResolvedValue({
        ...milestone,
        isActive: false,
      });

      const result = await service.deleteMilestone('milestone-uuid');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.milestoneConfig.update).toHaveBeenCalledWith({
        where: { id: 'milestone-uuid' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if milestone does not exist', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(null);

      await expect(service.deleteMilestone('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements with milestone details', async () => {
      const mockAchievements = [
        {
          id: 'achievement-1',
          userId: 'user-uuid',
          milestoneId: 'milestone-1',
          achievedAt: new Date('2026-01-20'),
          milestone: {
            id: 'milestone-1',
            title: 'Badge Collector',
            description: 'Earned 10 badges',
            icon: '🏆',
          },
        },
      ];

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue(
        mockAchievements,
      );

      const result = await service.getUserAchievements('user-uuid');

      expect(result).toEqual(mockAchievements);
      expect(
        mockPrismaService.milestoneAchievement.findMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        include: {
          milestone: {
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              icon: true,
            },
          },
        },
        orderBy: { achievedAt: 'desc' },
      });
    });
  });

  describe('checkMilestones', () => {
    beforeEach(() => {
      // Mock active milestone configs
      const mockConfigs = [
        {
          id: 'milestone-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          description: 'Earned 10 badges',
          trigger: { type: 'badge_count', value: 10 },
          icon: '🏆',
          isActive: true,
          createdBy: 'admin-uuid',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.milestoneConfig.findMany.mockResolvedValue(mockConfigs);
    });

    it('should detect BADGE_COUNT milestone achievement', async () => {
      // Mock: User has exactly 10 CLAIMED badges
      mockPrismaService.badge.count.mockResolvedValue(10);

      // Mock: No previous achievement
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // Mock: Create achievement
      mockPrismaService.milestoneAchievement.create.mockResolvedValue({
        id: 'achievement-uuid',
        userId: 'user-uuid',
        milestoneId: 'milestone-1',
        achievedAt: new Date(),
      });

      await service.checkMilestones('user-uuid');

      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-uuid',
          status: BadgeStatus.CLAIMED,
        },
      });

      expect(
        mockPrismaService.milestoneAchievement.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid',
          milestoneId: 'milestone-1',
        },
      });
    });

    it('should NOT create duplicate achievements', async () => {
      mockPrismaService.badge.count.mockResolvedValue(10);

      // Mock: User already achieved this milestone
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([
        { milestoneId: 'milestone-1' },
      ]);

      await service.checkMilestones('user-uuid');

      // Should NOT call create
      expect(
        mockPrismaService.milestoneAchievement.create,
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      mockPrismaService.badge.count.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw - errors are caught internally
      await expect(service.checkMilestones('user-uuid')).resolves.not.toThrow();
    });

    it('should use cached milestone configs within TTL', async () => {
      // First call - should fetch configs
      await service.checkMilestones('user-uuid');
      expect(mockPrismaService.milestoneConfig.findMany).toHaveBeenCalledTimes(
        1,
      );

      jest.clearAllMocks();

      // Second call within 5 minutes - should use cache
      await service.checkMilestones('user-uuid');
      expect(mockPrismaService.milestoneConfig.findMany).not.toHaveBeenCalled();
    });
  });

  describe('evaluateBadgeCountTrigger', () => {
    it('should return true when badge count matches trigger value', async () => {
      mockPrismaService.badge.count.mockResolvedValue(25);

      const result = await service['evaluateBadgeCountTrigger'](
        'user-uuid',
        25,
      );

      expect(result).toBe(true);
    });

    it('should return false when badge count is below trigger value', async () => {
      mockPrismaService.badge.count.mockResolvedValue(5);

      const result = await service['evaluateBadgeCountTrigger'](
        'user-uuid',
        10,
      );

      expect(result).toBe(false);
    });
  });

  describe('evaluateSkillTrackTrigger', () => {
    it('should return true when category badge count matches', async () => {
      mockPrismaService.badge.count.mockResolvedValue(5);

      const result = await service['evaluateSkillTrackTrigger'](
        'user-uuid',
        'cloud-category-uuid',
        5,
      );

      expect(result).toBe(true);
      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-uuid',
          status: BadgeStatus.CLAIMED,
          template: {
            category: 'cloud-category-uuid',
          },
        },
      });
    });
  });

  describe('evaluateAnniversaryTrigger', () => {
    it('should return true when user tenure matches anniversary months', async () => {
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - 12); // 12 months ago

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        createdAt,
      });

      const result = await service['evaluateAnniversaryTrigger'](
        'user-uuid',
        12,
      );

      expect(result).toBe(true);
    });

    it('should return false when user tenure is less than required months', async () => {
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - 6); // Only 6 months ago

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        createdAt,
      });

      const result = await service['evaluateAnniversaryTrigger'](
        'user-uuid',
        12,
      );

      expect(result).toBe(false);
    });
  });
});
