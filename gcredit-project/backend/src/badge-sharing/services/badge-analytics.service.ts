import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface ShareStatsDto {
  badgeId: string;
  total: number;
  byPlatform: {
    email: number;
    teams: number;
    widget: number;
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a badge share event
   * @param badgeId Badge ID that was shared
   * @param platform Platform where badge was shared ('email', 'teams', 'widget')
   * @param userId User ID who initiated the share (nullable for anonymous widget embeds)
   * @param metadata Platform-specific metadata (e.g., team/channel IDs, referrer URL, recipient email)
   * @returns Created BadgeShare record
   */
  async recordShare(
    badgeId: string,
    platform: 'email' | 'teams' | 'widget',
    userId: string | null,
    metadata?: {
      recipientEmail?: string;
      teamId?: string;
      channelId?: string;
      channelName?: string;
      referrerUrl?: string;
    },
  ) {
    // Verify badge exists
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new Error(`Badge with ID ${badgeId} not found`);
    }

    // Create share record
    const metadataToStore: Record<string, any> | null = metadata
      ? Object.keys(metadata)
          .filter((key) => key !== 'recipientEmail')
          .reduce<Record<string, any>>((acc, key) => {
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
          : null) as any,
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
