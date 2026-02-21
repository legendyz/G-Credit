import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../common/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  CreateMilestoneDto,
  MilestoneMetric,
  MilestoneScope,
} from './dto/milestone.dto';
import { MilestoneType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Mock PrismaService (all models used by the unified evaluator)
// ---------------------------------------------------------------------------
const mockPrismaService = {
  milestoneConfig: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  milestoneAchievement: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  badge: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  skill: {
    findMany: jest.fn(),
  },
  skillCategory: {
    findMany: jest.fn(),
  },
};

describe('MilestonesService', () => {
  let service: MilestonesService;

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

    // Reset all mocks (including implementations) and cache between tests
    jest.resetAllMocks();
    // Force cache expiry so each test starts fresh
    service['lastCacheRefresh'] = 0;
  });

  // =========================================================================
  // CRUD operations
  // =========================================================================

  describe('createMilestone', () => {
    it('should create BADGE_COUNT milestone with trigger JSON', async () => {
      const createDto: CreateMilestoneDto = {
        type: MilestoneType.BADGE_COUNT,
        title: 'Badge Collector',
        description: 'Earn 10 badges',
        trigger: {
          metric: MilestoneMetric.BADGE_COUNT,
          scope: MilestoneScope.GLOBAL,
          threshold: 10,
        },
        icon: '',
      };

      const expected = {
        id: 'ms-1',
        ...createDto,
        isActive: true,
        createdBy: 'admin-1',
        createdAt: new Date(),
      };

      mockPrismaService.milestoneConfig.create.mockResolvedValue(expected);

      const result = await service.createMilestone(createDto, 'admin-1');

      expect(result).toEqual(expected);
      expect(mockPrismaService.milestoneConfig.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          trigger: createDto.trigger,
          createdBy: 'admin-1',
        }),
      });
    });

    it('should create CATEGORY_COUNT milestone', async () => {
      const createDto: CreateMilestoneDto = {
        type: MilestoneType.CATEGORY_COUNT,
        title: 'Well-Rounded',
        description: 'Earn badges in 3 categories',
        trigger: {
          metric: MilestoneMetric.CATEGORY_COUNT,
          scope: MilestoneScope.GLOBAL,
          threshold: 3,
        },
        icon: '',
      };

      const expected = {
        id: 'ms-2',
        ...createDto,
        isActive: true,
        createdBy: 'admin-1',
        createdAt: new Date(),
      };

      mockPrismaService.milestoneConfig.create.mockResolvedValue(expected);

      const result = await service.createMilestone(createDto, 'admin-1');
      expect(result.type).toEqual(MilestoneType.CATEGORY_COUNT);
    });

    it('should invalidate config cache after create', async () => {
      mockPrismaService.milestoneConfig.create.mockResolvedValue({
        id: 'ms-3',
      });

      service['lastCacheRefresh'] = Date.now(); // Pretend cache is fresh
      await service.createMilestone(
        {
          type: MilestoneType.BADGE_COUNT,
          title: 'T',
          description: 'D',
          trigger: {
            metric: MilestoneMetric.BADGE_COUNT,
            scope: MilestoneScope.GLOBAL,
            threshold: 1,
          },
          icon: '',
        } as CreateMilestoneDto,
        'admin',
      );

      expect(service['lastCacheRefresh']).toBe(0);
    });
  });

  describe('getAllMilestones', () => {
    it('should return milestones with achievement count', async () => {
      const mockMilestones = [
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          _count: { achievements: 5 },
        },
      ];

      mockPrismaService.milestoneConfig.findMany.mockResolvedValue(
        mockMilestones,
      );

      const result = await service.getAllMilestones();

      expect(result).toEqual(mockMilestones);
      expect(mockPrismaService.milestoneConfig.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { achievements: true } } },
      });
    });
  });

  describe('updateMilestone', () => {
    const existing = {
      id: 'ms-1',
      type: MilestoneType.BADGE_COUNT,
      title: 'Old Title',
      description: 'Old desc',
      trigger: { metric: 'badge_count', scope: 'global', threshold: 10 },
      icon: '',
      isActive: true,
      createdBy: 'admin',
      createdAt: new Date(),
    };

    it('should update title and description', async () => {
      const updateDto = { title: 'New Title', description: 'New desc' };
      const updated = { ...existing, ...updateDto };

      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(existing);
      mockPrismaService.milestoneConfig.update.mockResolvedValue(updated);

      const result = await service.updateMilestone('ms-1', updateDto);
      expect(result.title).toBe('New Title');
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(null);
      await expect(
        service.updateMilestone('no-id', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should invalidate cache after update', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(existing);
      mockPrismaService.milestoneConfig.update.mockResolvedValue(existing);
      service['lastCacheRefresh'] = Date.now();

      await service.updateMilestone('ms-1', { title: 'X' });
      expect(service['lastCacheRefresh']).toBe(0);
    });
  });

  describe('deleteMilestone', () => {
    it('should soft delete by setting isActive=false', async () => {
      const milestone = {
        id: 'ms-1',
        type: MilestoneType.BADGE_COUNT,
        title: 'T',
        isActive: true,
      };

      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(milestone);
      mockPrismaService.milestoneConfig.update.mockResolvedValue({
        ...milestone,
        isActive: false,
      });

      const result = await service.deleteMilestone('ms-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.milestoneConfig.update).toHaveBeenCalledWith({
        where: { id: 'ms-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue(null);
      await expect(service.deleteMilestone('no-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should invalidate cache after delete', async () => {
      mockPrismaService.milestoneConfig.findUnique.mockResolvedValue({
        id: 'ms-1',
      });
      mockPrismaService.milestoneConfig.update.mockResolvedValue({
        id: 'ms-1',
        isActive: false,
      });
      service['lastCacheRefresh'] = Date.now();

      await service.deleteMilestone('ms-1');
      expect(service['lastCacheRefresh']).toBe(0);
    });
  });

  describe('getUserAchievements', () => {
    it('should return achievements with milestone details', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          userId: 'user-1',
          milestoneId: 'ms-1',
          achievedAt: new Date(),
          milestone: {
            id: 'ms-1',
            type: MilestoneType.BADGE_COUNT,
            title: 'Badge Collector',
            description: 'Earn 10 badges',
            icon: '',
          },
        },
      ];

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue(
        mockAchievements,
      );

      const result = await service.getUserAchievements('user-1');

      expect(result).toEqual(mockAchievements);
      expect(
        mockPrismaService.milestoneAchievement.findMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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

  // =========================================================================
  // Unified metric x scope evaluator - checkMilestones
  // =========================================================================

  describe('checkMilestones', () => {
    it('should detect badge_count x global milestone and return new achievements', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          description: 'Earn 10 badges',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 10,
          },
        },
      ]);

      // No previous achievements
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // User has 10 CLAIMED badges
      mockPrismaService.badge.count.mockResolvedValue(10);

      mockPrismaService.milestoneAchievement.create.mockResolvedValue({
        id: 'ach-1',
        userId: 'user-1',
        milestoneId: 'ms-1',
        achievedAt: new Date(),
      });

      const result = await service.checkMilestones('user-1');

      // Should return the new achievement
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'ms-1',
          title: 'Badge Collector',
          icon: '',
        }),
      );

      // badge.count called with global scope (no template filter)
      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-1',
          status: 'CLAIMED',
        },
      });

      expect(
        mockPrismaService.milestoneAchievement.create,
      ).toHaveBeenCalledWith({
        data: { userId: 'user-1', milestoneId: 'ms-1' },
      });
    });

    it('should detect badge_count x category milestone with scope filter', async () => {
      // Category-scoped milestone
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-cat',
          type: MilestoneType.BADGE_COUNT,
          title: 'Cloud Master',
          description: '5 cloud badges',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'category',
            threshold: 5,
            categoryId: 'cat-cloud',
            includeSubCategories: false,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // Skills in the cloud category
      mockPrismaService.skill.findMany.mockResolvedValue([
        { id: 'skill-az' },
        { id: 'skill-aws' },
      ]);

      // User has 5 badges matching those skills
      mockPrismaService.badge.count.mockResolvedValue(5);

      mockPrismaService.milestoneAchievement.create.mockResolvedValue({
        id: 'ach-2',
      });

      const result = await service.checkMilestones('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Cloud Master');

      // badge.count should include template.skillIds filter
      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-1',
          status: 'CLAIMED',
          template: {
            skillIds: { hasSome: ['skill-az', 'skill-aws'] },
          },
        },
      });
    });

    it('should detect badge_count x category with includeSubCategories', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-sub',
          type: MilestoneType.BADGE_COUNT,
          title: 'Tech Guru',
          description: '10 tech badges (with sub-categories)',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'category',
            threshold: 10,
            categoryId: 'cat-tech',
            includeSubCategories: true,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // BFS: cat-tech has children cat-frontend, cat-backend;
      // cat-frontend has child cat-react; cat-backend and cat-react have none
      mockPrismaService.skillCategory.findMany
        .mockResolvedValueOnce([{ id: 'cat-frontend' }, { id: 'cat-backend' }]) // children of cat-tech
        .mockResolvedValueOnce([{ id: 'cat-react' }]) // children of cat-frontend + cat-backend
        .mockResolvedValueOnce([]); // children of cat-react (none -> stop)

      // Skills in all those categories
      mockPrismaService.skill.findMany.mockResolvedValue([
        { id: 'sk-1' },
        { id: 'sk-2' },
        { id: 'sk-3' },
      ]);

      mockPrismaService.badge.count.mockResolvedValue(12);
      mockPrismaService.milestoneAchievement.create.mockResolvedValue({
        id: 'ach-3',
      });

      const result = await service.checkMilestones('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tech Guru');

      // skill.findMany should receive ALL descendant category IDs
      expect(mockPrismaService.skill.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: {
            in: ['cat-tech', 'cat-frontend', 'cat-backend', 'cat-react'],
          },
        },
        select: { id: true },
      });
    });

    it('should detect category_count x global milestone', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-cc',
          type: MilestoneType.CATEGORY_COUNT,
          title: 'Well-Rounded',
          description: 'Badges in 3 categories',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'category_count',
            scope: 'global',
            threshold: 3,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // User's claimed badges with their template skillIds
      mockPrismaService.badge.findMany.mockResolvedValue([
        { template: { skillIds: ['sk-a', 'sk-b'] } },
        { template: { skillIds: ['sk-c'] } },
      ]);

      // Skills belong to 3 distinct categories
      mockPrismaService.skill.findMany.mockResolvedValue([
        { categoryId: 'cat-1' },
        { categoryId: 'cat-2' },
        { categoryId: 'cat-3' },
      ]);

      mockPrismaService.milestoneAchievement.create.mockResolvedValue({
        id: 'ach-4',
      });

      const result = await service.checkMilestones('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Well-Rounded');
    });

    it('should NOT create duplicate achievements', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          description: 'D',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 10,
          },
        },
      ]);

      // User already achieved this milestone
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([
        { milestoneId: 'ms-1' },
      ]);

      const result = await service.checkMilestones('user-1');

      expect(result).toHaveLength(0);
      expect(
        mockPrismaService.milestoneAchievement.create,
      ).not.toHaveBeenCalled();
    });

    it('should return empty array when threshold not met', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'T',
          description: 'D',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 10,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.badge.count.mockResolvedValue(5); // Below threshold

      const result = await service.checkMilestones('user-1');

      expect(result).toHaveLength(0);
      expect(
        mockPrismaService.milestoneAchievement.create,
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and return empty array', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'T',
          description: 'D',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 10,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.checkMilestones('user-1');

      // Should not throw - returns empty array
      expect(result).toEqual([]);
    });

    it('should use cached configs within TTL', async () => {
      // Use non-empty configs so cache is actually populated
      // (empty cache triggers re-fetch due to length === 0 guard)
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-cached',
          type: MilestoneType.BADGE_COUNT,
          title: 'Cached',
          description: 'D',
          icon: 'X',
          isActive: true,
          trigger: { metric: 'badge_count', scope: 'global', threshold: 999 },
        },
      ]);
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.badge.count.mockResolvedValue(0);

      // First call populates cache
      await service.checkMilestones('user-1');
      expect(mockPrismaService.milestoneConfig.findMany).toHaveBeenCalledTimes(
        1,
      );

      // Clear call counts only (implementations preserved)
      jest.clearAllMocks();

      // Re-mock achievement query for second call (clearAllMocks preserves impl
      // but resetAllMocks in beforeEach would have cleared it — our mid-test
      // clearAllMocks keeps the implementation from above)

      // Second call within TTL should use cache
      await service.checkMilestones('user-1');
      expect(mockPrismaService.milestoneConfig.findMany).not.toHaveBeenCalled();
    });

    it('should handle empty skill results for category scope gracefully', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-empty',
          type: MilestoneType.BADGE_COUNT,
          title: 'Empty cat',
          description: 'D',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'category',
            threshold: 1,
            categoryId: 'cat-empty',
            includeSubCategories: false,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.skill.findMany.mockResolvedValue([]); // No skills in category
      mockPrismaService.badge.count.mockResolvedValue(0); // Explicit: no badges match

      const result = await service.checkMilestones('user-1');

      // Should not crash; milestone not achieved (no skills -> no-match sentinel)
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // getNextMilestone (dashboard integration)
  // =========================================================================

  describe('getNextMilestone', () => {
    it('should return next un-achieved badge_count milestone with progress', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-5',
          type: MilestoneType.BADGE_COUNT,
          title: 'First Five',
          description: 'Earn 5 badges',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 5,
          },
        },
        {
          id: 'ms-10',
          type: MilestoneType.BADGE_COUNT,
          title: 'Badge Collector',
          description: 'Earn 10 badges',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 10,
          },
        },
      ]);

      // User already achieved ms-5
      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([
        { milestoneId: 'ms-5' },
      ]);

      // User has 7 badges (progress toward 10)
      mockPrismaService.badge.count.mockResolvedValue(7);

      const result = await service.getNextMilestone('user-1');

      expect(result).toEqual({
        title: 'Badge Collector',
        progress: 7,
        target: 10,
        percentage: 70,
        icon: '',
      });
    });

    it('should return next category_count milestone with progress', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-cc',
          type: MilestoneType.CATEGORY_COUNT,
          title: 'Explorer',
          description: 'Badges in 3 categories',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'category_count',
            scope: 'global',
            threshold: 3,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);

      // User's badges
      mockPrismaService.badge.findMany.mockResolvedValue([
        { template: { skillIds: ['sk-1'] } },
      ]);

      // 1 distinct category
      mockPrismaService.skill.findMany.mockResolvedValue([
        { categoryId: 'cat-1' },
      ]);

      const result = await service.getNextMilestone('user-1');

      expect(result).toEqual({
        title: 'Explorer',
        progress: 1,
        target: 3,
        percentage: 33,
        icon: '',
      });
    });

    it('should return null when all milestones achieved', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'T',
          description: 'D',
          icon: '',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 1,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([
        { milestoneId: 'ms-1' },
      ]);

      const result = await service.getNextMilestone('user-1');
      expect(result).toBeNull();
    });

    it('should return null when no configs exist', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([]);

      const result = await service.getNextMilestone('user-1');
      expect(result).toBeNull();
    });

    it('should pick the lowest-threshold un-achieved milestone', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-20',
          type: MilestoneType.BADGE_COUNT,
          title: 'Twenty',
          description: 'D',
          icon: '2',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 20,
          },
        },
        {
          id: 'ms-5',
          type: MilestoneType.BADGE_COUNT,
          title: 'Five',
          description: 'D',
          icon: '5',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 5,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.badge.count.mockResolvedValue(3);

      const result = await service.getNextMilestone('user-1');

      expect(result!.title).toBe('Five');
      expect(result!.target).toBe(5);
    });

    it('should cap percentage at 100', async () => {
      mockPrismaService.milestoneConfig.findMany.mockResolvedValue([
        {
          id: 'ms-1',
          type: MilestoneType.BADGE_COUNT,
          title: 'One',
          description: 'D',
          icon: '1',
          isActive: true,
          trigger: {
            metric: 'badge_count',
            scope: 'global',
            threshold: 3,
          },
        },
      ]);

      mockPrismaService.milestoneAchievement.findMany.mockResolvedValue([]);
      mockPrismaService.badge.count.mockResolvedValue(5); // Over threshold

      const result = await service.getNextMilestone('user-1');
      expect(result!.percentage).toBe(100);
    });
  });

  // =========================================================================
  // Private evaluator helpers (white-box)
  // =========================================================================

  describe('evaluateBadgeCount (private)', () => {
    it('should return true when count >= threshold', async () => {
      mockPrismaService.badge.count.mockResolvedValue(10);

      const result = await service['evaluateBadgeCount']('user-1', {}, 10);
      expect(result).toBe(true);
    });

    it('should return false when count < threshold', async () => {
      mockPrismaService.badge.count.mockResolvedValue(5);

      const result = await service['evaluateBadgeCount']('user-1', {}, 10);
      expect(result).toBe(false);
    });

    it('should include scope filter in query', async () => {
      mockPrismaService.badge.count.mockResolvedValue(3);

      const scopeFilter = {
        template: { skillIds: { hasSome: ['sk-1', 'sk-2'] } },
      };

      await service['evaluateBadgeCount']('user-1', scopeFilter, 1);

      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-1',
          status: 'CLAIMED',
          template: { skillIds: { hasSome: ['sk-1', 'sk-2'] } },
        },
      });
    });
  });

  describe('evaluateCategoryCount (private)', () => {
    it('should return true when distinct categories >= threshold', async () => {
      mockPrismaService.badge.findMany.mockResolvedValue([
        { template: { skillIds: ['sk-1', 'sk-2'] } },
        { template: { skillIds: ['sk-3'] } },
      ]);

      mockPrismaService.skill.findMany.mockResolvedValue([
        { categoryId: 'cat-1' },
        { categoryId: 'cat-2' },
        { categoryId: 'cat-3' },
      ]);

      const result = await service['evaluateCategoryCount']('user-1', {}, 3);
      expect(result).toBe(true);
    });

    it('should return false when no badges', async () => {
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service['evaluateCategoryCount']('user-1', {}, 1);
      expect(result).toBe(false);
    });
  });

  describe('buildScopeFilter (private)', () => {
    it('should return empty object for global scope', async () => {
      const result = await service['buildScopeFilter']({
        scope: 'global',
      });
      expect(result).toEqual({});
    });

    it('should return skillIds filter for category scope', async () => {
      mockPrismaService.skill.findMany.mockResolvedValue([{ id: 'sk-1' }]);
      // includeSubCategories defaults to true -> BFS needed
      mockPrismaService.skillCategory.findMany.mockResolvedValue([]); // No children

      const result = await service['buildScopeFilter']({
        scope: 'category',
        categoryId: 'cat-1',
        includeSubCategories: true,
      });

      expect(result).toEqual({
        template: { skillIds: { hasSome: ['sk-1'] } },
      });
    });

    it('should return no-match sentinel when category has no skills', async () => {
      mockPrismaService.skill.findMany.mockResolvedValue([]);
      mockPrismaService.skillCategory.findMany.mockResolvedValue([]);

      const result = await service['buildScopeFilter']({
        scope: 'category',
        categoryId: 'cat-empty',
        includeSubCategories: false,
      });

      expect(result).toEqual({ id: 'no-match' });
    });
  });

  describe('getDescendantCategoryIds (private)', () => {
    it('should return root + all descendants via BFS', async () => {
      mockPrismaService.skillCategory.findMany
        .mockResolvedValueOnce([{ id: 'child-1' }, { id: 'child-2' }])
        .mockResolvedValueOnce([{ id: 'grandchild-1' }])
        .mockResolvedValueOnce([]);

      const result = await service['getDescendantCategoryIds']('root');

      expect(result).toEqual(['root', 'child-1', 'child-2', 'grandchild-1']);
    });

    it('should return only root when no children', async () => {
      mockPrismaService.skillCategory.findMany.mockResolvedValue([]);

      const result = await service['getDescendantCategoryIds']('leaf');
      expect(result).toEqual(['leaf']);
    });
  });
});
