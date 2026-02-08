/**
 * Dashboard Service - Story 8.1
 *
 * Provides role-specific dashboard data for Employee, Issuer, Manager, and Admin.
 * Resolves technical debt: UX-P1-001 (celebration), UX-P1-002 (loading), UX-P1-003 (retry)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {}

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

    // Calculate milestone progress (simple: every 5 badges is a milestone)
    const milestoneProgress = totalBadges % 5 || (totalBadges > 0 ? 5 : 0);
    const milestonePercentage = Math.round((milestoneProgress / 5) * 100);

    return {
      badgeSummary: {
        total: totalBadges,
        claimedThisMonth,
        pendingCount: pendingBadges,
        latestBadge,
      },
      currentMilestone: {
        title: `Badge Collector Level ${Math.ceil(totalBadges / 5) || 1}`,
        progress: milestoneProgress,
        target: 5,
        percentage: milestonePercentage,
        icon: '🏆',
      },
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

    // Get manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });

    const department = manager?.department || null;

    // Get team members (same department) - if no department, show empty
    const teamMembers = department
      ? await this.prisma.user.findMany({
          where: {
            department,
            role: 'EMPLOYEE',
            isActive: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

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
    const actorMap = new Map(
      actors.map((a) => [
        a.id,
        `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
      ]),
    );

    // Transform audit logs to activity DTOs
    const recentActivity: AdminActivityDto[] = recentActivityRaw.map((log) => ({
      id: log.id,
      type: log.action,
      description: log.metadata ? JSON.stringify(log.metadata) : log.action,
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
    };
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
