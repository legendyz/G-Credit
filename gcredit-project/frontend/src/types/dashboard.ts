/**
 * Dashboard API Types - Story 8.1
 *
 * TypeScript types matching backend DTOs for dashboard endpoints.
 */

// Badge Preview (for recent badges lists)
export interface BadgePreview {
  id: string;
  templateName: string;
  imageUrl?: string;
  status: 'PENDING' | 'CLAIMED' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
  claimedAt?: string;
}

// Badge Summary (Employee dashboard)
export interface BadgeSummary {
  total: number;
  claimedThisMonth: number;
  pendingCount: number;
  latestBadge?: BadgePreview;
}

// Milestone Progress
export interface MilestoneProgress {
  title: string;
  progress: number;
  target: number;
  percentage: number;
  icon?: string;
}

// Recent Achievement (AC1 requirement)
export interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt: string;
}

// Achieved Milestone
export interface AchievedMilestone {
  id: string;
  title: string;
  description: string;
  icon?: string;
  achievedAt: string;
}

// Employee Dashboard
export interface EmployeeDashboard {
  badgeSummary: BadgeSummary;
  currentMilestone?: MilestoneProgress;
  achievedMilestones?: AchievedMilestone[];
  recentBadges: BadgePreview[];
  recentAchievements?: RecentAchievement[];
}

// Issuance Activity (Issuer dashboard)
export interface IssuanceActivity {
  badgeId: string;
  recipientName: string;
  recipientEmail: string;
  templateName: string;
  status: string;
  issuedAt: string;
}

// Issuance Summary (Issuer dashboard)
export interface IssuanceSummary {
  issuedThisMonth: number;
  pendingClaims: number;
  totalRecipients: number;
  claimRate: number;
}

// Issuer Dashboard
export interface IssuerDashboard {
  issuanceSummary: IssuanceSummary;
  recentActivity: IssuanceActivity[];
}

// Top Performer (Manager dashboard)
export interface TopPerformer {
  userId: string;
  name: string;
  email: string;
  badgeCount: number;
}

// Team Insights (Manager dashboard)
export interface TeamInsights {
  teamMembersCount: number;
  teamBadgesThisMonth: number;
  topPerformers: TopPerformer[];
}

// Revocation Alert (Manager dashboard)
export interface RevocationAlert {
  badgeId: string;
  recipientName: string;
  templateName: string;
  reason: string;
  revokedAt: string;
}

// Manager Dashboard
export interface ManagerDashboard {
  teamInsights: TeamInsights;
  revocationAlerts: RevocationAlert[];
}

// Admin Activity Log
export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  actorName: string;
  timestamp: string;
}

// System Overview (Admin dashboard)
export interface SystemOverview {
  totalUsers: number;
  totalBadgesIssued: number;
  activeBadgeTemplates: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
}

export interface AdminNotification {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  detail?: string;
  timestamp: string;
}

// Admin Dashboard
export interface AdminDashboard {
  systemOverview: SystemOverview;
  recentActivity: AdminActivity[];
  notifications?: AdminNotification[];
}
