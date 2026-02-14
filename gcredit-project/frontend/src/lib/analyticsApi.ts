/**
 * Analytics API Client - Story 10.5
 *
 * Functions to fetch data from the 5 analytics endpoints.
 * Follows the same pattern as adminUsersApi.ts.
 */

import { apiFetch } from './apiFetch';
import type {
  SystemOverviewDto,
  IssuanceTrendsDto,
  TopPerformersDto,
  SkillsDistributionDto,
  RecentActivityDto,
} from '../types/analytics';

/**
 * Helper to handle response errors consistently
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch system overview — users, badges, templates, health
 * GET /api/analytics/system-overview
 */
export async function getSystemOverview(): Promise<SystemOverviewDto> {
  const response = await apiFetch('/analytics/system-overview');
  return handleResponse<SystemOverviewDto>(response);
}

/**
 * Fetch issuance trends over a given period
 * GET /api/analytics/issuance-trends?period=30
 */
export async function getIssuanceTrends(period: number = 30): Promise<IssuanceTrendsDto> {
  const params = new URLSearchParams({ period: period.toString() });
  const response = await apiFetch(`/analytics/issuance-trends?${params}`);
  return handleResponse<IssuanceTrendsDto>(response);
}

/**
 * Fetch top performers (employees with most badges)
 * GET /api/analytics/top-performers?limit=10
 */
export async function getTopPerformers(limit: number = 10): Promise<TopPerformersDto> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await apiFetch(`/analytics/top-performers?${params}`);
  return handleResponse<TopPerformersDto>(response);
}

/**
 * Fetch skills distribution — top skills and category breakdown
 * GET /api/analytics/skills-distribution
 */
export async function getSkillsDistribution(): Promise<SkillsDistributionDto> {
  const response = await apiFetch('/analytics/skills-distribution');
  return handleResponse<SkillsDistributionDto>(response);
}

/**
 * Fetch recent activity feed
 * GET /api/analytics/recent-activity?limit=20&offset=0
 */
export async function getRecentActivity(
  limit: number = 10,
  offset: number = 0
): Promise<RecentActivityDto> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const response = await apiFetch(`/analytics/recent-activity?${params}`);
  return handleResponse<RecentActivityDto>(response);
}

/**
 * Export analytics data as CSV file
 * GET /api/analytics/export?format=csv
 */
export async function exportAnalyticsCsv(): Promise<Blob> {
  const response = await apiFetch('/analytics/export?format=csv');
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Export failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.blob();
}
