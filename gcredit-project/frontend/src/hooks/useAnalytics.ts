/**
 * Analytics TanStack Query Hooks - Story 10.5
 *
 * Provides loading/error/data states for each analytics section.
 * Each hook fetches independently so one failure doesn't block others.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getSystemOverview,
  getIssuanceTrends,
  getTopPerformers,
  getSkillsDistribution,
  getRecentActivity,
} from '../lib/analyticsApi';

/**
 * Configurable auto-refresh interval for analytics queries (AC7).
 * Change this single value to adjust refresh frequency across all analytics hooks.
 */
export const ANALYTICS_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/** Query key factory */
export const analyticsKeys = {
  all: ['analytics'] as const,
  systemOverview: () => [...analyticsKeys.all, 'system-overview'] as const,
  issuanceTrends: (period: number) => [...analyticsKeys.all, 'issuance-trends', period] as const,
  topPerformers: (limit: number) => [...analyticsKeys.all, 'top-performers', limit] as const,
  skillsDistribution: () => [...analyticsKeys.all, 'skills-distribution'] as const,
  recentActivity: (limit: number) => [...analyticsKeys.all, 'recent-activity', limit] as const,
};

/**
 * System overview — users, badges, templates, health
 * Auto-refreshes every 5 minutes (AC7)
 */
export function useSystemOverview() {
  return useQuery({
    queryKey: analyticsKeys.systemOverview(),
    queryFn: getSystemOverview,
    staleTime: ANALYTICS_REFRESH_MS,
    refetchInterval: ANALYTICS_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Issuance trends over a given period
 * Re-fetches when period changes via queryKey
 */
export function useIssuanceTrends(period: number = 30) {
  return useQuery({
    queryKey: analyticsKeys.issuanceTrends(period),
    queryFn: () => getIssuanceTrends(period),
    staleTime: ANALYTICS_REFRESH_MS,
    refetchInterval: ANALYTICS_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Top performers leaderboard
 */
export function useTopPerformers(limit: number = 10, enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.topPerformers(limit),
    queryFn: () => getTopPerformers(limit),
    staleTime: ANALYTICS_REFRESH_MS,
    refetchInterval: ANALYTICS_REFRESH_MS,
    refetchOnWindowFocus: true,
    enabled,
  });
}

/**
 * Skills distribution — top skills and category breakdown
 */
export function useSkillsDistribution(enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.skillsDistribution(),
    queryFn: getSkillsDistribution,
    staleTime: ANALYTICS_REFRESH_MS,
    refetchInterval: ANALYTICS_REFRESH_MS,
    refetchOnWindowFocus: true,
    enabled,
  });
}

/**
 * Recent activity feed
 */
export function useRecentActivity(limit: number = 10, enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.recentActivity(limit),
    queryFn: () => getRecentActivity(limit),
    staleTime: ANALYTICS_REFRESH_MS,
    refetchInterval: ANALYTICS_REFRESH_MS,
    refetchOnWindowFocus: true,
    enabled,
  });
}
