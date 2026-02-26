/**
 * Dashboard Service - Story 8.1
 *
 * Provides role-specific dashboard data for Employee, Issuer, Manager, and Admin.
 * Resolves technical debt: UX-P1-001 (celebration), UX-P1-002 (loading), UX-P1-003 (retry)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  formatAuditDescription,
  resolveActivityType,
  buildActorMap,
} from '../common/utils/audit-log.utils';
import { MilestonesService } from '../milestones/milestones.service';
import {
  EmployeeDashboardDto,
  IssuerDashboardDto,
  ManagerDashboardDto,
  AdminDashboardDto,
  BadgePreviewDto,
  IssuanceActivityDto,
  TopPerformerDto,
  RevocationAlertDto,
  AdminActivityDto,
} from './dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly milestonesService: MilestonesService,
  ) {}

  /**
   * AC1: Get Employee Dashboard data
   * Shows badge summary, milestones, and recent badges
   */
  async getEmployeeDashboard(userId: string): Promise<EmployeeDashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get badge counts for this user
    const [totalBadges, claimedThisMonth, pendingBadges, recentBadgesRaw] =
      await Promise.all([
        // Total badges
        this.prisma.badge.count({
          where: { recipientId: userId },
        }),
        // Claimed this month
        this.prisma.badge.count({
          where: {
            recipientId: userId,
            status: 'CLAIMED',
            claimedAt: { gte: startOfMonth },
          },
        }),
        // Pending badges
        this.prisma.badge.count({
          where: {
            recipientId: userId,
            status: 'PENDING',
          },
        }),
        // Recent badges (last 5)
        this.prisma.badge.findMany({
          where: { recipientId: userId },
          orderBy: { issuedAt: 'desc' },
          take: 5,
          include: {
            template: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        }),
      ]);

    // Transform recent badges to DTOs
    const recentBadges: BadgePreviewDto[] = recentBadgesRaw.map((badge) => ({
      id: badge.id,
      templateName: badge.template.name,
      imageUrl: badge.template.imageUrl || undefined,
      status: badge.status,
      issuedAt: badge.issuedAt,
      claimedAt: badge.claimedAt || undefined,
    }));

    // Get latest badge for preview
    const latestBadge = recentBadges.length > 0 ? recentBadges[0] : undefined;

    // Get real milestone progress from MilestonesService
    // NB2: wrap in try/catch so milestone DB failure doesn't fail entire dashboard
    let milestoneData: Awaited<
      ReturnType<MilestonesService['getNextMilestone']>
    > = null;
    try {
      milestoneData = await this.milestonesService.getNextMilestone(userId);
    } catch (error: unknown) {
      this.logger.error(
        `Milestone progress fetch failed for ${userId}: ${(error as Error).message}`,
      );
    }

    const currentMilestone = milestoneData ?? {
      title: 'All milestones achieved!',
      progress: 0,
      target: 0,
      percentage: 100,
      icon: '🏆',
    };

    // Get achieved milestones (already filtered by isActive)
    let achievedMilestones: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      achievedAt: Date;
    }> = [];
    try {
      const achievements =
        await this.milestonesService.getUserAchievements(userId);
      achievedMilestones = achievements.map((a) => ({
        id: a.id,
        title: a.milestone.title,
        description: a.milestone.description,
        icon: a.milestone.icon,
        achievedAt: a.achievedAt,
      }));
    } catch (error: unknown) {
      this.logger.error(
        `Achieved milestones fetch failed for ${userId}: ${(error as Error).message}`,
      );
    }

    return {
      badgeSummary: {
        total: totalBadges,
        claimedThisMonth,
        pendingCount: pendingBadges,
        latestBadge,
      },
      currentMilestone,
      achievedMilestones,
      recentBadges,
    };
  }

  /**
   * AC2: Get Issuer Dashboard data
   * Shows issuance summary and recent activity
   */
  async getIssuerDashboard(userId: string): Promise<IssuerDashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get issuance statistics
    const [
      issuedThisMonth,
      pendingClaims,
      totalIssued,
      claimedCount,
      recentIssuances,
    ] = await Promise.all([
      // Badges issued this month by this issuer
      this.prisma.badge.count({
        where: {
          issuerId: userId,
          issuedAt: { gte: startOfMonth },
        },
      }),
      // Pending claims
      this.prisma.badge.count({
        where: {
          issuerId: userId,
          status: 'PENDING',
        },
      }),
      // Total badges issued by this issuer
      this.prisma.badge.count({
        where: { issuerId: userId },
      }),
      // Total claimed badges
      this.prisma.badge.count({
        where: {
          issuerId: userId,
          status: 'CLAIMED',
        },
      }),
      // Recent issuances
      this.prisma.badge.findMany({
        where: { issuerId: userId },
        orderBy: { issuedAt: 'desc' },
        take: 5,
        include: {
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          template: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Get unique recipients count
    const uniqueRecipients = await this.prisma.badge.groupBy({
      by: ['recipientId'],
      where: { issuerId: userId },
    });

    // Calculate claim rate
    const claimRate =
      totalIssued > 0
        ? Math.round((claimedCount / totalIssued) * 100) / 100
        : 0;

    // Transform recent issuances to DTOs
    const recentActivity: IssuanceActivityDto[] = recentIssuances.map(
      (badge) => ({
        badgeId: badge.id,
        recipientName:
          `${badge.recipient.firstName || ''} ${badge.recipient.lastName || ''}`.trim() ||
          badge.recipient.email,
        recipientEmail: badge.recipient.email,
        templateName: badge.template.name,
        status: badge.status,
        issuedAt: badge.issuedAt,
      }),
    );

    return {
      issuanceSummary: {
        issuedThisMonth,
        pendingClaims,
        totalRecipients: uniqueRecipients.length,
        claimRate,
      },
      recentActivity,
    };
  }

  /**
   * AC3: Get Manager Dashboard data
   * Shows team insights and revocation alerts
   */
  async getManagerDashboard(userId: string): Promise<ManagerDashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get direct reports (managerId-based scoping — Story 12.3a)
    const teamMembers = await this.prisma.user.findMany({
      where: {
        managerId: userId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    // Get team badges this month
    const teamBadgesThisMonth =
      teamMemberIds.length > 0
        ? await this.prisma.badge.count({
            where: {
              recipientId: { in: teamMemberIds },
              issuedAt: { gte: startOfMonth },
            },
          })
        : 0;

    // Get top performers (by badge count)
    const topPerformersRaw =
      teamMemberIds.length > 0
        ? await this.prisma.badge.groupBy({
            by: ['recipientId'],
            where: {
              recipientId: { in: teamMemberIds },
              status: 'CLAIMED',
            },
            _count: true,
            orderBy: {
              _count: {
                recipientId: 'desc',
              },
            },
            take: 5,
          })
        : [];

    // Map to TopPerformerDto
    const topPerformers: TopPerformerDto[] = topPerformersRaw.map((item) => {
      const member = teamMembers.find((m) => m.id === item.recipientId);
      return {
        userId: item.recipientId,
        name: member
          ? `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
            member.email
          : 'Unknown',
        email: member?.email || '',
        badgeCount: item._count,
      };
    });

    // Get recent revocations for team members
    const revocationAlertsRaw =
      teamMemberIds.length > 0
        ? await this.prisma.badge.findMany({
            where: {
              recipientId: { in: teamMemberIds },
              status: 'REVOKED',
              revokedAt: { not: null },
            },
            orderBy: { revokedAt: 'desc' },
            take: 5,
            include: {
              recipient: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              template: {
                select: {
                  name: true,
                },
              },
            },
          })
        : [];

    const revocationAlerts: RevocationAlertDto[] = revocationAlertsRaw.map(
      (badge) => ({
        badgeId: badge.id,
        recipientName:
          `${badge.recipient.firstName || ''} ${badge.recipient.lastName || ''}`.trim() ||
          badge.recipient.email,
        templateName: badge.template.name,
        reason: badge.revocationReason || 'Not specified',
        revokedAt: badge.revokedAt!,
      }),
    );

    return {
      teamInsights: {
        teamMembersCount: teamMembers.length,
        teamBadgesThisMonth,
        topPerformers,
      },
      revocationAlerts,
    };
  }

  /**
   * AC4: Get Admin Dashboard data
   * Shows system overview and recent activity
   */
  async getAdminDashboard(): Promise<AdminDashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get system statistics
    const [
      totalUsers,
      activeUsersThisMonth,
      newUsersThisMonth,
      totalBadgesIssued,
      activeBadgeTemplates,
      recentActivityRaw,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count(),
      // Active users this month
      this.prisma.user.count({
        where: {
          lastLoginAt: { gte: startOfMonth },
          isActive: true,
        },
      }),
      // New users this month
      this.prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      // Total badges issued
      this.prisma.badge.count(),
      // Active badge templates
      this.prisma.badgeTemplate.count({
        where: { status: 'ACTIVE' },
      }),
      // Recent audit log entries
      this.prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    // Fetch actor names for audit logs
    const actorIds = [...new Set(recentActivityRaw.map((log) => log.actorId))];
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const actorMap = buildActorMap(actors);

    // Transform audit logs to activity DTOs
    const recentActivity: AdminActivityDto[] = recentActivityRaw.map((log) => ({
      id: log.id,
      type: resolveActivityType(log.action, log.entityType),
      description: formatAuditDescription(
        log.action,
        log.metadata as Record<string, unknown>,
      ),
      actorName: actorMap.get(log.actorId) || 'System',
      timestamp: log.timestamp,
    }));

    return {
      systemOverview: {
        totalUsers,
        totalBadgesIssued,
        activeBadgeTemplates,
        systemHealth: await this.checkSystemHealth(),
        activeUsersThisMonth,
        newUsersThisMonth,
      },
      recentActivity,
      notifications: await this.getAdminNotifications(),
    };
  }

  /**
   * Generate admin notifications — two independent triggers (either one → notify):
   *   Trigger 1 (time):  No full sync ever, or last full sync > 24h ago
   *   Trigger 2 (mini):  Mini-sync happened AFTER the last full sync
   * Notification disappears right after a successful full sync and only
   * reappears when either trigger fires again.
   */
  private async getAdminNotifications() {
    const notifications: Array<{
      type: string;
      severity: 'info' | 'warning' | 'critical';
      message: string;
      detail?: string;
      timestamp: Date;
    }> = [];

    // ── 1. Last successful full sync ────────────────────────────────
    const lastFullSync = await this.prisma.m365SyncLog.findFirst({
      where: {
        syncType: 'FULL',
        status: { in: ['SUCCESS', 'PARTIAL_SUCCESS'] },
      },
      orderBy: { syncDate: 'desc' },
      select: { syncDate: true },
    });

    const hoursSinceFullSync = lastFullSync
      ? Math.floor(
          (Date.now() - lastFullSync.syncDate.getTime()) / (1000 * 60 * 60),
        )
      : null;

    // Trigger 1: time-based — no full sync ever, or >24h since last one
    const timeTrigger =
      !lastFullSync || (hoursSinceFullSync !== null && hoursSinceFullSync > 24);

    // ── 2. Mini-sync since last full sync ───────────────────────────
    // syncDate records the start of the full sync; users processed during
    // it get lastSyncAt slightly later. A 10-min buffer avoids false
    // positives from users updated as part of the full sync itself.
    const cutoffDate = lastFullSync
      ? new Date(lastFullSync.syncDate.getTime() + 10 * 60 * 1000)
      : new Date(0); // no full sync → any mini-synced user counts

    const miniSyncedCount = await this.prisma.user.count({
      where: {
        azureId: { not: null },
        lastSyncAt: { gt: cutoffDate },
      },
    });

    // Trigger 2: mini-sync — SSO user(s) synced after last full sync
    const miniSyncTrigger = miniSyncedCount > 0;

    // ── 3. Build notification if either trigger fires ───────────────
    if (timeTrigger || miniSyncTrigger) {
      // Severity: warning if never done or >72h; otherwise info
      const severity: 'info' | 'warning' =
        !lastFullSync || (hoursSinceFullSync && hoursSinceFullSync > 72)
          ? 'warning'
          : 'info';

      // Compose reason parts
      const reasons: string[] = [];
      if (miniSyncTrigger) {
        reasons.push(
          `${miniSyncedCount} SSO user(s) updated by login-time mini-sync since last full sync`,
        );
      }
      if (!lastFullSync) {
        reasons.push('no full M365 sync has ever been run');
      } else if (timeTrigger) {
        reasons.push(`last full sync was ${hoursSinceFullSync} hours ago`);
      }

      notifications.push({
        type: 'M365_SYNC_RECOMMENDED',
        severity,
        message: `Strongly recommend running a full M365 sync — ${reasons.join('; ')}`,
        detail:
          'Mini-sync only updates individual user profiles at login. A full sync ensures all organizational data (roles, departments, managers) is complete and consistent.',
        timestamp: new Date(),
      });
    }

    return notifications;
  }

  private async checkSystemHealth(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'healthy';
    } catch {
      return 'degraded';
    }
  }
}
