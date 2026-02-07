import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  MilestoneTriggerType,
} from './dto/milestone.dto';
import { MilestoneType } from '@prisma/client';
import type { MilestoneConfig, Prisma } from '@prisma/client';

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);
  private milestoneConfigsCache: MilestoneConfig[] = [];
  private lastCacheRefresh = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * AC 2.4: Create milestone configuration (Admin only)
   */
  async createMilestone(dto: CreateMilestoneDto, adminId: string) {
    // Convert DTO type to Prisma enum
    const typeMapping: Record<string, MilestoneType> = {
      badge_count: MilestoneType.BADGE_COUNT,
      skill_track: MilestoneType.SKILL_TRACK,
      anniversary: MilestoneType.ANNIVERSARY,
    };

    return this.prisma.milestoneConfig.create({
      data: {
        type: typeMapping[dto.type] || MilestoneType.BADGE_COUNT,
        title: dto.title,
        description: dto.description,
        trigger: dto.trigger as unknown as Prisma.JsonValue,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        createdBy: adminId,
      },
    });
  }

  /**
   * AC 2.5: List all milestone configurations (Admin only)
   */
  async getAllMilestones() {
    return this.prisma.milestoneConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * AC 2.6: Update milestone configuration (Admin only)
   */
  async updateMilestone(id: string, dto: UpdateMilestoneDto) {
    const milestone = await this.prisma.milestoneConfig.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone config ${id} not found`);
    }

    return this.prisma.milestoneConfig.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.trigger && {
          trigger: dto.trigger as unknown as Prisma.JsonValue,
        }),
        ...(dto.icon && { icon: dto.icon }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * AC 2.7: Soft delete milestone (set isActive=false)
   */
  async deleteMilestone(id: string) {
    const milestone = await this.prisma.milestoneConfig.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone config ${id} not found`);
    }

    return this.prisma.milestoneConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * AC 2.11: Get user's milestone achievements
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
   * AC 2.8: Check and award milestones for a user
   * Called asynchronously after badge issuance/claiming
   */
  async checkMilestones(userId: string): Promise<void> {
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

        // Evaluate trigger
        const triggerMet = await this.evaluateTrigger(
          userId,
          config.trigger as {
            type: MilestoneTriggerType;
            value?: number;
            categoryId?: string;
            requiredBadgeCount?: number;
            months?: number;
          },
        );

        if (triggerMet) {
          // Create achievement record
          await this.prisma.milestoneAchievement.create({
            data: {
              userId,
              milestoneId: config.id,
            },
          });

          this.logger.log(
            `✅ Milestone achieved: ${config.title} by user ${userId}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      // AC 2.9: Ensure detection runs in <500ms
      if (duration > 500) {
        this.logger.warn(
          `⚠️ Milestone detection took ${duration}ms (target: <500ms)`,
        );
      } else {
        this.logger.debug(`Milestone detection completed in ${duration}ms`);
      }
    } catch (error: unknown) {
      // AC 2.10: Log failures but don't block badge operations
      this.logger.error(
        `❌ Milestone detection failed for user ${userId}: ${(error as Error).message}`,
      );
      // Don't throw - milestone detection is non-critical
    }
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

  /**
   * Evaluate milestone trigger for a user
   * AC 2.8: Support BADGE_COUNT, SKILL_TRACK, ANNIVERSARY triggers
   */
  private async evaluateTrigger(
    userId: string,
    trigger: {
      type: MilestoneTriggerType;
      value?: number;
      categoryId?: string;
      requiredBadgeCount?: number;
      months?: number;
    },
  ): Promise<boolean> {
    switch (trigger.type) {
      case MilestoneTriggerType.BADGE_COUNT:
        return this.evaluateBadgeCountTrigger(userId, trigger.value ?? 0);

      case MilestoneTriggerType.SKILL_TRACK:
        return this.evaluateSkillTrackTrigger(
          userId,
          trigger.categoryId ?? '',
          trigger.requiredBadgeCount ?? 0,
        );

      case MilestoneTriggerType.ANNIVERSARY:
        return this.evaluateAnniversaryTrigger(userId, trigger.months ?? 0);

      default:
        this.logger.warn(`Unknown trigger type: ${String(trigger.type)}`);
        return false;
    }
  }

  /**
   * Evaluate BADGE_COUNT trigger: Count user's claimed badges
   */
  private async evaluateBadgeCountTrigger(
    userId: string,
    requiredCount: number,
  ): Promise<boolean> {
    const count = await this.prisma.badge.count({
      where: {
        recipientId: userId,
        status: 'CLAIMED',
      },
    });

    return count >= requiredCount;
  }

  /**
   * Evaluate SKILL_TRACK trigger: Count claimed badges in specific category
   */
  private async evaluateSkillTrackTrigger(
    userId: string,
    categoryId: string,
    requiredCount: number,
  ): Promise<boolean> {
    const count = await this.prisma.badge.count({
      where: {
        recipientId: userId,
        status: 'CLAIMED',
        template: {
          category: categoryId,
        },
      },
    });

    return count >= requiredCount;
  }

  /**
   * Evaluate ANNIVERSARY trigger: Check user registration date
   */
  private async evaluateAnniversaryTrigger(
    userId: string,
    requiredMonths: number,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      return false;
    }

    const monthsSinceRegistration = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );

    return monthsSinceRegistration >= requiredMonths;
  }
}
