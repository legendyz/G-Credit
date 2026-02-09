/**
 * Analytics API Client - Story 10.5
 *
 * Functions to fetch data from the 5 analytics endpoints.
 * Follows the same pattern as adminUsersApi.ts.
 */

import { API_BASE_URL } from './apiConfig';
import type {
  SystemOverviewDto,
  IssuanceTrendsDto,
  TopPerformersDto,
  SkillsDistributionDto,
  RecentActivityDto,
} from '../types/analytics';

const ANALYTICS_BASE = `${API_BASE_URL}/analytics`;

/**
 * Helper to get auth headers with Bearer token
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
  const response = await fetch(`${ANALYTICS_BASE}/system-overview`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SystemOverviewDto>(response);
}

/**
 * Fetch issuance trends over a given period
 * GET /api/analytics/issuance-trends?period=30
 */
export async function getIssuanceTrends(period: number = 30): Promise<IssuanceTrendsDto> {
  const params = new URLSearchParams({ period: period.toString() });
  const response = await fetch(`${ANALYTICS_BASE}/issuance-trends?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<IssuanceTrendsDto>(response);
}

/**
 * Fetch top performers (employees with most badges)
 * GET /api/analytics/top-performers?limit=10
 */
export async function getTopPerformers(limit: number = 10): Promise<TopPerformersDto> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${ANALYTICS_BASE}/top-performers?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TopPerformersDto>(response);
}

/**
 * Fetch skills distribution — top skills and category breakdown
 * GET /api/analytics/skills-distribution
 */
export async function getSkillsDistribution(): Promise<SkillsDistributionDto> {
  const response = await fetch(`${ANALYTICS_BASE}/skills-distribution`, {
    headers: getAuthHeaders(),
  });
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
  const response = await fetch(`${ANALYTICS_BASE}/recent-activity?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<RecentActivityDto>(response);
}
