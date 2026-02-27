import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@prisma/client';

export interface ShareStatsDto {
  badgeId: string;
  total: number;
  byPlatform: {
    email: number;
    teams: number;
    widget: number;
    linkedin: number;
  };
}

export interface ShareHistoryDto {
  id: string;
  platform: string;
  sharedAt: Date;
  sharedBy: string | null;
  recipientEmail: string | null;
  metadata: Record<string, any> | null;
}

@Injectable()
export class BadgeAnalyticsService {
  private readonly logger = new Logger(BadgeAnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a badge share event
   * @param badgeId Badge ID that was shared
   * @param platform Platform where badge was shared ('email', 'teams', 'widget', 'linkedin')
   * @param userId User ID who initiated the share (nullable for anonymous widget embeds)
   * @param metadata Platform-specific metadata (e.g., team/channel IDs, referrer URL, recipient email)
   * @returns Created BadgeShare record
   */
  async recordShare(
    badgeId: string,
    platform: 'email' | 'teams' | 'widget' | 'linkedin',
    userId: string | null,
    metadata?: {
      recipientEmail?: string;
      teamId?: string;
      channelId?: string;
      channelName?: string;
      referrerUrl?: string;
    },
  ) {
    // Verify badge exists and fetch ownership info
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      select: { id: true, recipientId: true, issuerId: true },
    });

    if (!badge) {
      throw new Error(`Badge with ID ${badgeId} not found`);
    }

    // F-NEW-1: Verify ownership — authenticated users can only share their own badges
    if (userId && badge.recipientId !== userId && badge.issuerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to share this badge',
      );
    }

    // Create share record
    const metadataToStore: Record<string, unknown> | null = metadata
      ? Object.keys(metadata)
          .filter((key) => key !== 'recipientEmail')
          .reduce<Record<string, unknown>>((acc, key) => {
            const value = metadata[key as keyof typeof metadata];
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {})
      : null;

    return this.prisma.badgeShare.create({
      data: {
        badgeId,
        platform,
        sharedBy: userId,
        recipientEmail: metadata?.recipientEmail || null,
        metadata: (metadataToStore && Object.keys(metadataToStore).length > 0
          ? metadataToStore
          : Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
      },
    });
  }

  /**
   * Get share statistics for a badge
   * @param badgeId Badge ID
   * @param userId User ID requesting stats (for authorization)
   * @returns Share counts by platform
   */
  async getShareStats(badgeId: string, userId: string): Promise<ShareStatsDto> {
    // Verify user is authorized (badge owner or issuer)
    await this.verifyAuthorization(badgeId, userId);

    // Get all shares for this badge
    const shares = await this.prisma.badgeShare.findMany({
      where: { badgeId },
      select: { platform: true },
    });

    // Count by platform
    const byPlatform = {
      email: shares.filter((s) => s.platform === 'email').length,
      teams: shares.filter((s) => s.platform === 'teams').length,
      widget: shares.filter((s) => s.platform === 'widget').length,
      linkedin: shares.filter((s) => s.platform === 'linkedin').length,
    };

    return {
      badgeId,
      total: shares.length,
      byPlatform,
    };
  }

  /**
   * Get recent share history for a badge
   * @param badgeId Badge ID
   * @param userId User ID requesting history (for authorization)
   * @param limit Maximum number of records to return (default: 10)
   * @returns Array of recent shares
   */
  async getShareHistory(
    badgeId: string,
    userId: string,
    limit: number = 10,
  ): Promise<ShareHistoryDto[]> {
    // Verify user is authorized (badge owner or issuer)
    await this.verifyAuthorization(badgeId, userId);

    // Get recent shares
    const shares = await this.prisma.badgeShare.findMany({
      where: { badgeId },
      orderBy: { sharedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        platform: true,
        sharedAt: true,
        sharedBy: true,
        recipientEmail: true,
        metadata: true,
      },
    });

    return shares.map((share) => ({
      ...share,
      metadata: share.metadata as Record<string, any> | null,
    }));
  }

  /**
   * Verify user is authorized to view badge analytics
   * Authorization: Badge owner (recipient) or issuer only
   * @param badgeId Badge ID
   * @param userId User ID requesting access
   * @throws ForbiddenException if user is not authorized
   */
  private async verifyAuthorization(
    badgeId: string,
    userId: string,
  ): Promise<void> {
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      select: {
        recipientId: true,
        issuerId: true,
      },
    });

    if (!badge) {
      throw new Error(`Badge with ID ${badgeId} not found`);
    }

    // Check if user is badge owner or issuer
    if (badge.recipientId !== userId && badge.issuerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view analytics for this badge',
      );
    }
  }
}
