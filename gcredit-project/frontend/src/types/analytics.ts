/**
 * Analytics API Types - Story 10.5
 *
 * TypeScript interfaces matching the backend analytics DTO responses.
 */

// --- Endpoint 1: GET /api/analytics/system-overview ---

export interface SystemOverviewDto {
  users: {
    total: number;
    activeThisMonth: number;
    newThisMonth: number;
    byRole: {
      ADMIN: number;
      ISSUER: number;
      MANAGER: number;
      EMPLOYEE: number;
    };
  };
  badges: {
    totalIssued: number;
    claimedCount: number;
    pendingCount: number;
    revokedCount: number;
    claimRate: number; // 0.0 - 1.0
  };
  badgeTemplates: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSync: string; // ISO timestamp
    apiResponseTime: string; // e.g. '120ms'
  };
}

// --- Endpoint 2: GET /api/analytics/issuance-trends ---

export interface IssuanceTrendDataPoint {
  date: string;
  issued: number;
  claimed: number;
  revoked: number;
}

export interface IssuanceTrendsDto {
  period: string; // e.g. 'last30days'
  startDate: string; // '2026-01-10'
  endDate: string;
  dataPoints: IssuanceTrendDataPoint[];
  totals: {
    issued: number;
    claimed: number;
    revoked: number;
    claimRate: number;
  };
}

// --- Endpoint 3: GET /api/analytics/top-performers ---

export interface TopPerformer {
  userId: string;
  name: string;
  badgeCount: number;
  latestBadge?: {
    templateName: string;
    claimedAt: string;
  };
}

export interface TopPerformersDto {
  teamId?: string;
  teamName?: string;
  period: string; // 'allTime'
  topPerformers: TopPerformer[];
}

// --- Endpoint 4: GET /api/analytics/skills-distribution ---

export interface SkillDistributionItem {
  skillId: string;
  skillName: string;
  badgeCount: number;
  employeeCount: number;
}

export interface SkillsDistributionDto {
  totalSkills: number;
  topSkills: SkillDistributionItem[]; // Top 20
  skillsByCategory: Record<string, number>; // e.g. { Technical: 180, 'Soft Skills': 95 }
}

// --- Endpoint 5: GET /api/analytics/recent-activity ---

export type ActivityType =
  | 'BADGE_ISSUED'
  | 'BADGE_CLAIMED'
  | 'BADGE_REVOKED'
  | 'BADGE_SHARED'
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'USER_REGISTERED'
  | 'USER_UPDATED';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: {
    userId: string;
    name: string;
  };
  target?: {
    userId?: string;
    name?: string;
    badgeTemplateName?: string;
    templateName?: string;
  };
  timestamp: string; // ISO
}

export interface RecentActivityDto {
  activities: ActivityItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
