/**
 * Analytics Hooks Tests - Story 10.5
 *
 * Tests for the 5 TanStack Query hooks (loading → success, error states).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useSystemOverview,
  useIssuanceTrends,
  useTopPerformers,
  useSkillsDistribution,
  useRecentActivity,
} from '../useAnalytics';

// Mock the API module
vi.mock('../../lib/analyticsApi', () => ({
  getSystemOverview: vi.fn(),
  getIssuanceTrends: vi.fn(),
  getTopPerformers: vi.fn(),
  getSkillsDistribution: vi.fn(),
  getRecentActivity: vi.fn(),
}));

import {
  getSystemOverview,
  getIssuanceTrends,
  getTopPerformers,
  getSkillsDistribution,
  getRecentActivity,
} from '../../lib/analyticsApi';

const mockedGetSystemOverview = vi.mocked(getSystemOverview);
const mockedGetIssuanceTrends = vi.mocked(getIssuanceTrends);
const mockedGetTopPerformers = vi.mocked(getTopPerformers);
const mockedGetSkillsDistribution = vi.mocked(getSkillsDistribution);
const mockedGetRecentActivity = vi.mocked(getRecentActivity);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useSystemOverview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns data on success', async () => {
    const mockData = {
      users: { total: 50, activeThisMonth: 20, newThisMonth: 3, byRole: {} },
      badges: {
        totalIssued: 100,
        claimedCount: 80,
        pendingCount: 15,
        revokedCount: 5,
        claimRate: 0.8,
      },
      badgeTemplates: { total: 10, active: 8, draft: 1, archived: 1 },
      systemHealth: {
        status: 'healthy' as const,
        lastSync: '2026-02-09T00:00:00Z',
        apiResponseTime: '90ms',
      },
    };
    mockedGetSystemOverview.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useSystemOverview(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on failure', async () => {
    mockedGetSystemOverview.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSystemOverview(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useIssuanceTrends', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls API with correct period', async () => {
    const mockData = {
      period: 'last90days',
      startDate: '2025-11-12',
      endDate: '2026-02-09',
      dataPoints: [],
      totals: { issued: 5, claimed: 3, revoked: 0, claimRate: 0.6 },
    };
    mockedGetIssuanceTrends.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useIssuanceTrends(90), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGetIssuanceTrends).toHaveBeenCalledWith(90);
    expect(result.current.data).toEqual(mockData);
  });

  it('handles error', async () => {
    mockedGetIssuanceTrends.mockRejectedValueOnce(new Error('Forbidden'));

    const { result } = renderHook(() => useIssuanceTrends(30), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTopPerformers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns performer data', async () => {
    const mockData = {
      period: 'allTime',
      topPerformers: [{ userId: 'u1', name: 'Alice', badgeCount: 10 }],
    };
    mockedGetTopPerformers.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useTopPerformers(10), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.topPerformers).toHaveLength(1);
  });
});

describe('useSkillsDistribution', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns skills data', async () => {
    const mockData = {
      totalSkills: 5,
      topSkills: [{ skillId: 's1', skillName: 'TypeScript', badgeCount: 15, employeeCount: 8 }],
      skillsByCategory: { Technical: 15 },
    };
    mockedGetSkillsDistribution.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useSkillsDistribution(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalSkills).toBe(5);
  });
});

describe('useRecentActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns activity data', async () => {
    const mockData = {
      activities: [
        {
          id: 'a1',
          type: 'BADGE_ISSUED' as const,
          actor: { userId: 'u1', name: 'Admin' },
          target: { name: 'Bob', badgeTemplateName: 'Excellence' },
          timestamp: '2026-02-09T10:00:00Z',
        },
      ],
      pagination: { limit: 10, offset: 0, total: 1 },
    };
    mockedGetRecentActivity.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useRecentActivity(10), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.activities).toHaveLength(1);
  });

  it('handles error state', async () => {
    mockedGetRecentActivity.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useRecentActivity(10), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
