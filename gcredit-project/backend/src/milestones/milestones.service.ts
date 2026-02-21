import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/milestone.dto';
import type { MilestoneConfig, Prisma } from '@prisma/client';

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);
  private milestoneConfigsCache: MilestoneConfig[] = [];
  private lastCacheRefresh = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Create milestone configuration (Admin only)
   * DTO now sends MilestoneType enum directly — no typeMapping needed.
   */
  async createMilestone(dto: CreateMilestoneDto, adminId: string) {
    const result = await this.prisma.milestoneConfig.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        trigger: dto.trigger as unknown as Prisma.InputJsonValue,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        createdBy: adminId,
      },
    });

    // Invalidate cache
    this.lastCacheRefresh = 0;
    return result;
  }

  /**
   * List all milestone configurations with achievement count (Admin only)
   */
  async getAllMilestones() {
    return this.prisma.milestoneConfig.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { achievements: true },
        },
      },
    });
  }

  /**
   * Update milestone configuration (Admin only)
   */
  async updateMilestone(id: string, dto: UpdateMilestoneDto) {
    const milestone = await this.prisma.milestoneConfig.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone config ${id} not found`);
    }

    const result = await this.prisma.milestoneConfig.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.trigger && {
          trigger: dto.trigger as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.icon && { icon: dto.icon }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      } as Prisma.MilestoneConfigUpdateInput,
    });

    // Invalidate cache
    this.lastCacheRefresh = 0;
    return result;
  }

  /**
   * Soft delete milestone (set isActive=false)
   */
  async deleteMilestone(id: string) {
    const milestone = await this.prisma.milestoneConfig.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone config ${id} not found`);
    }

    const result = await this.prisma.milestoneConfig.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    this.lastCacheRefresh = 0;
    return result;
  }

  /**
   * Get user's milestone achievements
   */
  async getUserAchievements(userId: string) {
    return this.prisma.milestoneAchievement.findMany({
      where: { userId },
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
  }

  /**
   * Check and award milestones for a user.
   * Returns newly achieved milestones so callers can include them in responses.
   */
  async checkMilestones(
    userId: string,
  ): Promise<
    Array<{ id: string; title: string; description: string; icon: string }>
  > {
    const newAchievements: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }> = [];

    try {
      const startTime = Date.now();

      // Get active milestone configs (with cache)
      const configs = await this.getActiveMilestoneConfigs();

      // Get user's existing achievements to avoid duplicates
      const existingAchievements =
        await this.prisma.milestoneAchievement.findMany({
          where: { userId },
          select: { milestoneId: true },
        });

      const achievedMilestoneIds = new Set(
        existingAchievements.map((a) => a.milestoneId),
      );

      // Evaluate each milestone config
      for (const config of configs) {
        // Skip if user already achieved this milestone
        if (achievedMilestoneIds.has(config.id)) {
          continue;
        }

        // Evaluate trigger with unified metric × scope engine
        // Normalize legacy trigger format { type, value } → { metric, scope, threshold }
        const rawTrigger = config.trigger as Record<string, unknown>;
        const trigger = {
          metric: (rawTrigger.metric ??
            rawTrigger.type ??
            'badge_count') as string,
          scope: (rawTrigger.scope ?? 'global') as string,
          threshold: (rawTrigger.threshold ?? rawTrigger.value ?? 1) as number,
          categoryId: rawTrigger.categoryId as string | undefined,
          includeSubCategories: rawTrigger.includeSubCategories as
            | boolean
            | undefined,
        };

        const triggerMet = await this.evaluateTrigger(userId, trigger);

        if (triggerMet) {
          // Create achievement record
          await this.prisma.milestoneAchievement.create({
            data: {
              userId,
              milestoneId: config.id,
            },
          });

          newAchievements.push({
            id: config.id,
            title: config.title,
            description: config.description,
            icon: config.icon,
          });

          this.logger.log(
            `✅ Milestone achieved: ${config.title} by user ${userId}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      if (duration > 500) {
        this.logger.warn(
          `⚠️ Milestone detection took ${duration}ms (target: <500ms)`,
        );
      } else {
        this.logger.debug(`Milestone detection completed in ${duration}ms`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `❌ Milestone detection failed for user ${userId}: ${(error as Error).message}`,
      );
      // Don't throw - milestone detection is non-critical
    }

    return newAchievements;
  }

  /**
   * Get the next un-achieved milestone for a user with progress data.
   * Used by dashboard to show milestone progress.
   */
  async getNextMilestone(userId: string): Promise<{
    title: string;
    progress: number;
    target: number;
    percentage: number;
    icon: string;
  } | null> {
    const configs = await this.getActiveMilestoneConfigs();

    if (configs.length === 0) return null;

    // Get user's existing achievements
    const existingAchievements =
      await this.prisma.milestoneAchievement.findMany({
        where: { userId },
        select: { milestoneId: true },
      });

    const achievedMilestoneIds = new Set(
      existingAchievements.map((a) => a.milestoneId),
    );

    // Find un-achieved milestones, sorted by threshold (lowest first)
    const unachieved = configs
      .filter((c) => !achievedMilestoneIds.has(c.id))
      .sort((a, b) => {
        const ta = (a.trigger as { threshold: number }).threshold;
        const tb = (b.trigger as { threshold: number }).threshold;
        return ta - tb;
      });

    if (unachieved.length === 0) return null;

    const next = unachieved[0];
    const rawTrigger = next.trigger as Record<string, unknown>;
    const trigger = {
      metric: (rawTrigger.metric ?? rawTrigger.type ?? 'badge_count') as string,
      scope: (rawTrigger.scope ?? 'global') as string,
      threshold: (rawTrigger.threshold ?? rawTrigger.value ?? 1) as number,
      categoryId: rawTrigger.categoryId as string | undefined,
      includeSubCategories: rawTrigger.includeSubCategories as
        | boolean
        | undefined,
    };

    // Calculate current progress
    let progress = 0;
    const scopeFilter = await this.buildScopeFilter(trigger);

    if (trigger.metric === 'badge_count') {
      progress = await this.prisma.badge.count({
        where: {
          recipientId: userId,
          status: 'CLAIMED',
          ...scopeFilter,
        },
      });
    } else if (trigger.metric === 'category_count') {
      // Count distinct categories
      const badges = await this.prisma.badge.findMany({
        where: {
          recipientId: userId,
          status: 'CLAIMED',
          ...scopeFilter,
        },
        select: {
          template: { select: { skillIds: true } },
        },
      });

      const allSkillIds = new Set<string>();
      for (const badge of badges) {
        for (const skillId of badge.template.skillIds) {
          allSkillIds.add(skillId);
        }
      }

      if (allSkillIds.size > 0) {
        const categories = await this.prisma.skill.findMany({
          where: { id: { in: Array.from(allSkillIds) } },
          select: { categoryId: true },
          distinct: ['categoryId'],
        });
        progress = categories.length;
      }
    }

    const percentage = Math.min(
      100,
      Math.round((progress / trigger.threshold) * 100),
    );

    return {
      title: next.title,
      progress,
      target: trigger.threshold,
      percentage,
      icon: next.icon,
    };
  }

  /**
   * Get active milestone configs with 5-minute cache
   */
  private async getActiveMilestoneConfigs(): Promise<MilestoneConfig[]> {
    const now = Date.now();

    if (
      now - this.lastCacheRefresh > this.CACHE_TTL ||
      this.milestoneConfigsCache.length === 0
    ) {
      this.milestoneConfigsCache = await this.prisma.milestoneConfig.findMany({
        where: { isActive: true },
      });
      this.lastCacheRefresh = now;
      this.logger.debug(
        `Milestone configs cache refreshed (${this.milestoneConfigsCache.length} configs)`,
      );
    }

    return this.milestoneConfigsCache;
  }

  // ========== Unified metric × scope evaluator ==========

  /**
   * Evaluate milestone trigger using orthogonal metric × scope dispatch.
   */
  private async evaluateTrigger(
    userId: string,
    trigger: {
      metric: string;
      scope: string;
      threshold: number;
      categoryId?: string;
      includeSubCategories?: boolean;
    },
  ): Promise<boolean> {
    const scopeFilter = await this.buildScopeFilter(trigger);

    switch (trigger.metric) {
      case 'badge_count':
        return this.evaluateBadgeCount(userId, scopeFilter, trigger.threshold);
      case 'category_count':
        return this.evaluateCategoryCount(
          userId,
          scopeFilter,
          trigger.threshold,
        );
      default:
        this.logger.warn(`Unknown metric: ${trigger.metric}`);
        return false;
    }
  }

  /**
   * Build a Prisma where-clause filter based on scope.
   * Global → no filter. Category → resolves category → skill IDs.
   */
  private async buildScopeFilter(trigger: {
    scope: string;
    categoryId?: string;
    includeSubCategories?: boolean;
  }): Promise<Record<string, unknown>> {
    if (!trigger.scope || trigger.scope === 'global') {
      return {};
    }

    // Category scope: resolve skill IDs through category → skill chain
    const categoryIds =
      trigger.includeSubCategories !== false
        ? await this.getDescendantCategoryIds(trigger.categoryId!)
        : [trigger.categoryId!];

    const skillIds = await this.getSkillIdsByCategories(categoryIds);

    if (skillIds.length === 0) {
      return { id: 'no-match' }; // No skills in category → no badges can match
    }

    return {
      template: {
        skillIds: { hasSome: skillIds },
      },
    };
  }

  /**
   * BFS traversal to get all descendant category IDs (including root).
   */
  private async getDescendantCategoryIds(rootId: string): Promise<string[]> {
    const allIds: string[] = [rootId];
    let currentLevel = [rootId];

    while (currentLevel.length > 0) {
      const children = await this.prisma.skillCategory.findMany({
        where: { parentId: { in: currentLevel } },
        select: { id: true },
      });

      const childIds = children.map((c) => c.id);
      allIds.push(...childIds);
      currentLevel = childIds;
    }

    return allIds;
  }

  /**
   * Get skill IDs belonging to the given categories.
   */
  private async getSkillIdsByCategories(
    categoryIds: string[],
  ): Promise<string[]> {
    const skills = await this.prisma.skill.findMany({
      where: { categoryId: { in: categoryIds } },
      select: { id: true },
    });
    return skills.map((s) => s.id);
  }

  /**
   * Count claimed badges matching scope filter, compare to threshold.
   */
  private async evaluateBadgeCount(
    userId: string,
    scopeFilter: Record<string, unknown>,
    threshold: number,
  ): Promise<boolean> {
    const count = await this.prisma.badge.count({
      where: {
        recipientId: userId,
        status: 'CLAIMED',
        ...scopeFilter,
      },
    });
    return count >= threshold;
  }

  /**
   * Count distinct categories across user's claimed badges via skill chain.
   */
  private async evaluateCategoryCount(
    userId: string,
    scopeFilter: Record<string, unknown>,
    threshold: number,
  ): Promise<boolean> {
    const badges = await this.prisma.badge.findMany({
      where: {
        recipientId: userId,
        status: 'CLAIMED',
        ...scopeFilter,
      },
      select: {
        template: {
          select: { skillIds: true },
        },
      },
    });

    // Collect all skill IDs from badges
    const allSkillIds = new Set<string>();
    for (const badge of badges) {
      for (const skillId of badge.template.skillIds) {
        allSkillIds.add(skillId);
      }
    }

    if (allSkillIds.size === 0) return false;

    // Find distinct categories for those skills
    const categories = await this.prisma.skill.findMany({
      where: { id: { in: Array.from(allSkillIds) } },
      select: { categoryId: true },
      distinct: ['categoryId'],
    });

    return categories.length >= threshold;
  }
}
