import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  SystemOverviewDto,
  IssuanceTrendsDto,
  TopPerformersDto,
  SkillsDistributionDto,
  RecentActivityDto,
  TrendDataPointDto,
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * AC1: Get system-wide overview statistics
   * Only ADMIN can access
   */
  async getSystemOverview(): Promise<SystemOverviewDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for performance
    const [
      usersByRole,
      activeUsersThisMonth,
      newUsersThisMonth,
      badgesByStatus,
      templatesByStatus,
    ] = await Promise.all([
      // Users grouped by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      // Active users this month (logged in)
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
      // Badges grouped by status
      this.prisma.badge.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Templates grouped by status
      this.prisma.badgeTemplate.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Transform user counts
    const userRoleCounts = {
      ADMIN: 0,
      ISSUER: 0,
      MANAGER: 0,
      EMPLOYEE: 0,
    };
    let totalUsers = 0;
    for (const item of usersByRole) {
      userRoleCounts[item.role] = item._count;
      totalUsers += item._count;
    }

    // Transform badge counts
    const badgeCounts = {
      totalIssued: 0,
      claimedCount: 0,
      pendingCount: 0,
      revokedCount: 0,
    };
    for (const item of badgesByStatus) {
      badgeCounts.totalIssued += item._count;
      if (item.status === 'CLAIMED') badgeCounts.claimedCount = item._count;
      if (item.status === 'PENDING') badgeCounts.pendingCount = item._count;
      if (item.status === 'REVOKED') badgeCounts.revokedCount = item._count;
    }
    const claimRate =
      badgeCounts.totalIssued > 0
        ? Math.round(
            (badgeCounts.claimedCount / badgeCounts.totalIssued) * 100,
          ) / 100
        : 0;

    // Transform template counts
    const templateCounts = {
      total: 0,
      active: 0,
      draft: 0,
      archived: 0,
    };
    for (const item of templatesByStatus) {
      templateCounts.total += item._count;
      if (item.status === 'ACTIVE') templateCounts.active = item._count;
      if (item.status === 'DRAFT') templateCounts.draft = item._count;
      if (item.status === 'ARCHIVED') templateCounts.archived = item._count;
    }

    return {
      users: {
        total: totalUsers,
        activeThisMonth: activeUsersThisMonth,
        newThisMonth: newUsersThisMonth,
        byRole: userRoleCounts,
      },
      badges: {
        ...badgeCounts,
        claimRate,
      },
      badgeTemplates: templateCounts,
      systemHealth: {
        status: 'healthy',
        lastSync: now.toISOString(),
        apiResponseTime: '120ms', // Mock for MVP
      },
    };
  }

  /**
   * Issuer-scoped overview: only badges issued by this user
   */
  async getIssuerOverview(issuerId: string): Promise<SystemOverviewDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [badgesByStatus, recipientCount, badgesThisMonth] = await Promise.all(
      [
        this.prisma.badge.groupBy({
          by: ['status'],
          where: { issuerId },
          _count: true,
        }),
        this.prisma.badge
          .findMany({
            where: { issuerId },
            select: { recipientId: true },
            distinct: ['recipientId'],
          })
          .then((r) => r.length),
        this.prisma.badge.count({
          where: { issuerId, issuedAt: { gte: startOfMonth } },
        }),
      ],
    );

    // Badge counts scoped to this issuer
    const badgeCounts = {
      totalIssued: 0,
      claimedCount: 0,
      pendingCount: 0,
      revokedCount: 0,
    };
    for (const item of badgesByStatus) {
      badgeCounts.totalIssued += item._count;
      if (item.status === 'CLAIMED') badgeCounts.claimedCount = item._count;
      if (item.status === 'PENDING') badgeCounts.pendingCount = item._count;
      if (item.status === 'REVOKED') badgeCounts.revokedCount = item._count;
    }
    const claimRate =
      badgeCounts.totalIssued > 0
        ? Math.round(
            (badgeCounts.claimedCount / badgeCounts.totalIssued) * 100,
          ) / 100
        : 0;

    return {
      users: {
        total: recipientCount,
        activeThisMonth: badgesThisMonth,
        newThisMonth: badgesThisMonth,
        byRole: { ADMIN: 0, ISSUER: 0, MANAGER: 0, EMPLOYEE: recipientCount },
      },
      badges: {
        ...badgeCounts,
        claimRate,
      },
      badgeTemplates: { total: 0, active: 0, draft: 0, archived: 0 },
      systemHealth: {
        status: 'healthy',
        lastSync: now.toISOString(),
        apiResponseTime: '120ms',
      },
    };
  }

  /**
   * AC2: Get badge issuance trends over time
   * ADMIN and ISSUER can access
   * @param period - Number of days (7, 30, 90, 365)
   * @param issuerId - Optional filter (Admin only)
   * @param currentUserId - Current user ID for ISSUER filtering
   * @param currentUserRole - Current user role
   */
  async getIssuanceTrends(
    period: number,
    issuerId?: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<IssuanceTrendsDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // ISSUER can only see their own data
    let filterIssuerId = issuerId;
    if (currentUserRole === 'ISSUER') {
      filterIssuerId = currentUserId;
    }

    // Query badges in the period
    const badges = await this.prisma.badge.findMany({
      where: {
        issuedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filterIssuerId && { issuerId: filterIssuerId }),
      },
      select: {
        issuedAt: true,
        status: true,
        claimedAt: true,
        revokedAt: true,
      },
    });

    // Group by date
    const dataPointsMap = new Map<string, TrendDataPointDto>();

    // Initialize all dates in period
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split('T')[0];
      dataPointsMap.set(dateKey, {
        date: dateKey,
        issued: 0,
        claimed: 0,
        revoked: 0,
      });
    }

    // Count badges by date
    let totalIssued = 0;
    let totalClaimed = 0;
    let totalRevoked = 0;

    for (const badge of badges) {
      const issuedDate = badge.issuedAt.toISOString().split('T')[0];
      const point = dataPointsMap.get(issuedDate);
      if (point) {
        point.issued++;
        totalIssued++;

        if (badge.status === 'CLAIMED' && badge.claimedAt) {
          point.claimed++;
          totalClaimed++;
        }
        if (badge.status === 'REVOKED') {
          point.revoked++;
          totalRevoked++;
        }
      }
    }

    const dataPoints = Array.from(dataPointsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      period: `last${period}days`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dataPoints,
      totals: {
        issued: totalIssued,
        claimed: totalClaimed,
        revoked: totalRevoked,
        claimRate:
          totalIssued > 0
            ? Math.round((totalClaimed / totalIssued) * 100) / 100
            : 0,
      },
    };
  }

  /**
   * AC3: Get top performers by badge count
   * MANAGER can only see their own team, ADMIN sees all
   * @param teamId - Optional team filter (department)
   * @param limit - Max results (default 10)
   * @param currentUserId - Current user ID
   * @param currentUserRole - Current user role
   */
  async getTopPerformers(
    teamId?: string,
    limit: number = 10,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<TopPerformersDto> {
    // Story 12.3a: MANAGER scoped to direct reports (managerId-based)
    let filterManagerId: string | undefined;
    let filterDepartment: string | undefined;

    if (currentUserRole === 'MANAGER') {
      // Manager can only see their direct reports
      filterManagerId = currentUserId;
      if (teamId) {
        throw new ForbiddenException('You can only view your own team');
      }
    } else if (teamId) {
      // ADMIN can filter by any department
      filterDepartment = teamId;
    }

    // Query users with badge counts
    const usersWithBadges = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(filterManagerId && { managerId: filterManagerId }),
        ...(filterDepartment && { department: filterDepartment }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        badgesReceived: {
          where: {
            status: 'CLAIMED',
          },
          select: {
            id: true,
            claimedAt: true,
            template: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            claimedAt: 'desc',
          },
        },
      },
    });

    // Sort by badge count and take top N
    const performers = usersWithBadges
      .map((user) => ({
        userId: user.id,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        badgeCount: user.badgesReceived.length,
        latestBadge: user.badgesReceived[0]
          ? {
              templateName: user.badgesReceived[0].template.name,
              claimedAt: user.badgesReceived[0].claimedAt?.toISOString() || '',
            }
          : undefined,
      }))
      .sort((a, b) => b.badgeCount - a.badgeCount)
      .slice(0, limit);

    return {
      teamId: filterManagerId || filterDepartment,
      teamName: filterManagerId ? 'Direct Reports' : filterDepartment, // Story 12.3a
      period: 'allTime',
      topPerformers: performers,
    };
  }

  /**
   * AC4: Get skills distribution across badges
   * Only ADMIN can access
   */
  async getSkillsDistribution(): Promise<SkillsDistributionDto> {
    // Get all skills with their categories
    const skills = await this.prisma.skill.findMany({
      include: {
        category: true,
      },
    });

    // Get all claimed badges with their templates (for skill counts)
    const claimedBadges = await this.prisma.badge.findMany({
      where: {
        status: 'CLAIMED',
      },
      select: {
        recipientId: true,
        template: {
          select: {
            skillIds: true,
          },
        },
      },
    });

    // Count badges and employees per skill
    const skillStats = new Map<
      string,
      {
        skillId: string;
        skillName: string;
        categoryName: string;
        badgeCount: number;
        employees: Set<string>;
      }
    >();

    for (const skill of skills) {
      skillStats.set(skill.id, {
        skillId: skill.id,
        skillName: skill.name,
        categoryName: skill.category.nameEn || skill.category.name,
        badgeCount: 0,
        employees: new Set(),
      });
    }

    // Count badges per skill
    for (const badge of claimedBadges) {
      const skillIds = badge.template.skillIds || [];
      for (const skillId of skillIds) {
        const stat = skillStats.get(skillId);
        if (stat) {
          stat.badgeCount++;
          stat.employees.add(badge.recipientId);
        }
      }
    }

    // Transform to DTO
    const topSkills = Array.from(skillStats.values())
      .map((stat) => ({
        skillId: stat.skillId,
        skillName: stat.skillName,
        badgeCount: stat.badgeCount,
        employeeCount: stat.employees.size,
      }))
      .sort((a, b) => b.badgeCount - a.badgeCount)
      .slice(0, 20);

    // Group by category
    const skillsByCategory: Record<string, number> = {};
    for (const stat of skillStats.values()) {
      const categoryName = stat.categoryName;
      skillsByCategory[categoryName] =
        (skillsByCategory[categoryName] || 0) + stat.badgeCount;
    }

    return {
      totalSkills: skills.length,
      topSkills,
      skillsByCategory,
    };
  }

  /**
   * AC5: Get recent activity feed from audit log
   * Only ADMIN can access
   * @param limit - Max results (default 20)
   * @param offset - Pagination offset
   */
  async getRecentActivity(
    limit: number = 20,
    offset: number = 0,
  ): Promise<RecentActivityDto> {
    // Query total count
    const total = await this.prisma.auditLog.count();

    // Query audit logs with pagination
    const auditLogs = await this.prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Collect unique actor IDs to batch-fetch user names
    const actorIds = [...new Set(auditLogs.map((log) => log.actorId))];
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const actorMap = new Map(
      actors.map((u) => [
        u.id,
        `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      ]),
    );

    // Transform to activity items
    const activities = auditLogs.map((log) => {
      // Map action to activity type
      const typeMap: Record<string, string> = {
        ISSUED: 'BADGE_ISSUED',
        CLAIMED: 'BADGE_CLAIMED',
        REVOKED: 'BADGE_REVOKED',
        SHARED: 'BADGE_SHARED',
        CREATED:
          log.entityType === 'Template'
            ? 'TEMPLATE_CREATED'
            : 'USER_REGISTERED',
      };

      const metadata = log.metadata as Record<string, unknown> | null;

      return {
        id: log.id,
        type: typeMap[log.action] || log.action,
        actor: {
          userId: log.actorId,
          name: actorMap.get(log.actorId) || log.actorEmail || 'Unknown',
        },
        target: metadata
          ? {
              userId: metadata.recipientId as string | undefined,
              name: metadata.recipientName as string | undefined,
              badgeTemplateName: metadata.templateName as string | undefined,
              templateName: metadata.templateName as string | undefined,
            }
          : undefined,
        timestamp: log.timestamp.toISOString(),
      };
    });

    return {
      activities,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  /**
   * Generate CSV export of analytics data
   * Combines system overview, issuance trends, top performers, and skills distribution
   * @param userId - Current user ID for RBAC filtering
   */
  async generateCsvExport(userId: string): Promise<string> {
    const [overview, trends, performers, skills] = await Promise.all([
      this.getSystemOverview(),
      this.getIssuanceTrends(30, undefined, userId, 'ADMIN'),
      this.getTopPerformers(undefined, 50, userId, 'ADMIN'),
      this.getSkillsDistribution(),
    ]);

    const lines: string[] = [];

    // Section 1: System Overview
    lines.push('Section,Metric,Value');
    lines.push(`System Overview,Total Users,${overview.users.total}`);
    lines.push(
      `System Overview,Active Users This Month,${overview.users.activeThisMonth}`,
    );
    lines.push(
      `System Overview,New Users This Month,${overview.users.newThisMonth}`,
    );
    lines.push(`System Overview,Badges Issued,${overview.badges.totalIssued}`);
    lines.push(
      `System Overview,Badges Claimed,${overview.badges.claimedCount}`,
    );
    lines.push(`System Overview,Claim Rate,${overview.badges.claimRate}%`);
    lines.push(
      `System Overview,Active Templates,${overview.badgeTemplates.active}`,
    );
    lines.push('');

    // Section 2: Issuance Trends (last 30 days)
    lines.push('Date,Issued,Claimed,Revoked');
    for (const point of trends.dataPoints) {
      lines.push(
        `${point.date},${point.issued},${point.claimed},${point.revoked}`,
      );
    }
    lines.push('');

    // Section 3: Top Performers
    lines.push('Rank,Employee,Badge Count');
    performers.topPerformers.forEach((p, i) => {
      // RFC 4180: double-quote fields that may contain commas; escape quotes with ""
      const name = `"${(p.name || '').replace(/"/g, '""')}"`;
      lines.push(`${i + 1},${name},${p.badgeCount}`);
    });
    lines.push('');

    // Section 4: Skills Distribution
    lines.push('Skill,Badge Count,Employee Count');
    for (const skill of skills.topSkills) {
      const skillName = `"${(skill.skillName || '').replace(/"/g, '""')}"`;
      lines.push(`${skillName},${skill.badgeCount},${skill.employeeCount}`);
    }

    return lines.join('\n');
  }
}
