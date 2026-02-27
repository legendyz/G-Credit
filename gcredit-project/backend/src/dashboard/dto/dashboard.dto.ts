/**
 * Dashboard DTOs - Story 8.1
 *
 * Data Transfer Objects for all dashboard endpoints.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Shared Types ============

export class BadgePreviewDto {
  @ApiProperty({ description: 'Badge ID' })
  id: string;

  @ApiProperty({ description: 'Badge template name' })
  templateName: string;

  @ApiPropertyOptional({ description: 'Template image URL' })
  imageUrl?: string;

  @ApiProperty({
    description: 'Badge status',
    enum: ['PENDING', 'CLAIMED', 'REVOKED', 'EXPIRED'],
  })
  status: string;

  @ApiProperty({ description: 'When the badge was issued' })
  issuedAt: Date;

  @ApiPropertyOptional({ description: 'When the badge was claimed' })
  claimedAt?: Date;
}

export class RecentActivityItemDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'When the activity occurred' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Associated badge ID' })
  badgeId?: string;

  @ApiPropertyOptional({ description: 'Associated user ID' })
  userId?: string;
}

// ============ Employee Dashboard ============

export class BadgeSummaryDto {
  @ApiProperty({ description: 'Total badges earned', example: 12 })
  total: number;

  @ApiProperty({ description: 'Badges claimed this month', example: 3 })
  claimedThisMonth: number;

  @ApiProperty({
    description: 'Pending badges waiting to be claimed',
    example: 1,
  })
  pendingCount: number;

  @ApiPropertyOptional({
    description: 'Latest badge preview',
    type: BadgePreviewDto,
  })
  latestBadge?: BadgePreviewDto;
}

export class MilestoneProgressDto {
  @ApiProperty({ description: 'Milestone title', example: 'Badge Collector' })
  title: string;

  @ApiProperty({ description: 'Current progress', example: 12 })
  progress: number;

  @ApiProperty({ description: 'Target to complete', example: 15 })
  target: number;

  @ApiProperty({ description: 'Progress percentage', example: 80 })
  percentage: number;

  @ApiPropertyOptional({ description: 'Milestone icon', example: '🏆' })
  icon?: string;
}

export class AchievedMilestoneDto {
  @ApiProperty({ description: 'Achievement record ID' })
  id: string;

  @ApiProperty({ description: 'Milestone title', example: 'First Badge' })
  title: string;

  @ApiProperty({ description: 'Milestone description' })
  description: string;

  @ApiPropertyOptional({ description: 'Milestone icon', example: '🏆' })
  icon?: string;

  @ApiProperty({ description: 'When the milestone was achieved' })
  achievedAt: Date;
}

export class EmployeeDashboardDto {
  @ApiProperty({
    description: 'Badge summary statistics',
    type: BadgeSummaryDto,
  })
  badgeSummary: BadgeSummaryDto;

  @ApiPropertyOptional({
    description: 'Current milestone progress',
    type: MilestoneProgressDto,
  })
  currentMilestone?: MilestoneProgressDto;

  @ApiProperty({
    description: 'Milestones the user has already achieved (active only)',
    type: [AchievedMilestoneDto],
  })
  achievedMilestones: AchievedMilestoneDto[];

  @ApiProperty({
    description: 'Recent badge activity',
    type: [BadgePreviewDto],
  })
  recentBadges: BadgePreviewDto[];
}

// ============ Issuer Dashboard ============

export class IssuanceSummaryDto {
  @ApiProperty({ description: 'Badges issued this month', example: 45 })
  issuedThisMonth: number;

  @ApiProperty({ description: 'Pending claims count', example: 8 })
  pendingClaims: number;

  @ApiProperty({ description: 'Total unique recipients', example: 120 })
  totalRecipients: number;

  @ApiProperty({ description: 'Claim rate (0-1)', example: 0.82 })
  claimRate: number;
}

export class IssuanceActivityDto {
  @ApiProperty({ description: 'Badge ID' })
  badgeId: string;

  @ApiProperty({ description: 'Recipient name' })
  recipientName: string;

  @ApiProperty({ description: 'Recipient email' })
  recipientEmail: string;

  @ApiProperty({ description: 'Template name' })
  templateName: string;

  @ApiProperty({ description: 'Badge status' })
  status: string;

  @ApiProperty({ description: 'Issued date' })
  issuedAt: Date;
}

export class IssuerDashboardDto {
  @ApiProperty({
    description: 'Issuance summary statistics',
    type: IssuanceSummaryDto,
  })
  issuanceSummary: IssuanceSummaryDto;

  @ApiProperty({
    description: 'Recent issuance activity',
    type: [IssuanceActivityDto],
  })
  recentActivity: IssuanceActivityDto[];
}

// ============ Manager Dashboard ============

export class TopPerformerDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Badge count', example: 8 })
  badgeCount: number;
}

export class TeamInsightsDto {
  @ApiProperty({ description: 'Team members count', example: 15 })
  teamMembersCount: number;

  @ApiProperty({ description: 'Team badges this month', example: 28 })
  teamBadgesThisMonth: number;

  @ApiProperty({
    description: 'Top performers by badge count',
    type: [TopPerformerDto],
  })
  topPerformers: TopPerformerDto[];
}

export class RevocationAlertDto {
  @ApiProperty({ description: 'Badge ID' })
  badgeId: string;

  @ApiProperty({ description: 'Recipient name' })
  recipientName: string;

  @ApiProperty({ description: 'Template name' })
  templateName: string;

  @ApiProperty({ description: 'Revocation reason' })
  reason: string;

  @ApiProperty({ description: 'Revocation date' })
  revokedAt: Date;
}

export class ManagerDashboardDto {
  @ApiProperty({
    description: 'Team insights statistics',
    type: TeamInsightsDto,
  })
  teamInsights: TeamInsightsDto;

  @ApiProperty({
    description: 'Recent revocation alerts',
    type: [RevocationAlertDto],
  })
  revocationAlerts: RevocationAlertDto[];
}

// ============ Admin Dashboard ============

export class SystemOverviewDto {
  @ApiProperty({ description: 'Total users in system', example: 450 })
  totalUsers: number;

  @ApiProperty({ description: 'Total badges issued', example: 1234 })
  totalBadgesIssued: number;

  @ApiProperty({ description: 'Active badge templates', example: 23 })
  activeBadgeTemplates: number;

  @ApiProperty({
    description: 'System health status',
    enum: ['healthy', 'degraded', 'down'],
  })
  systemHealth: string;

  @ApiProperty({ description: 'Active users this month', example: 320 })
  activeUsersThisMonth: number;

  @ApiProperty({ description: 'New users this month', example: 25 })
  newUsersThisMonth: number;
}

export class AdminActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    enum: [
      'BADGE_ISSUED',
      'BADGE_CLAIMED',
      'BADGE_REVOKED',
      'BADGE_SHARED',
      'TEMPLATE_CREATED',
      'TEMPLATE_UPDATED',
      'USER_REGISTERED',
      'USER_UPDATED',
    ],
  })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Actor name (who performed the action)' })
  actorName: string;

  @ApiProperty({ description: 'When the activity occurred' })
  timestamp: Date;
}

export class AdminNotificationDto {
  @ApiProperty({
    description: 'Notification type',
    enum: ['M365_SYNC_RECOMMENDED', 'SYSTEM_WARNING'],
  })
  type: string;

  @ApiProperty({
    description: 'Notification severity',
    enum: ['info', 'warning', 'critical'],
  })
  severity: 'info' | 'warning' | 'critical';

  @ApiProperty({ description: 'User-friendly notification message' })
  message: string;

  @ApiProperty({
    description: 'Detailed description or suggested action',
    required: false,
  })
  detail?: string;

  @ApiProperty({ description: 'When the notification was generated' })
  timestamp: Date;
}

export class AdminDashboardDto {
  @ApiProperty({
    description: 'System overview statistics',
    type: SystemOverviewDto,
  })
  systemOverview: SystemOverviewDto;

  @ApiProperty({
    description: 'Recent system activity',
    type: [AdminActivityDto],
  })
  recentActivity: AdminActivityDto[];

  @ApiProperty({
    description: 'Admin notifications (sync reminders, warnings)',
    type: [AdminNotificationDto],
    required: false,
  })
  notifications?: AdminNotificationDto[];
}
