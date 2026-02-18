/**
 * Dashboard API Hooks Tests - Story 8.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useEmployeeDashboard,
  useIssuerDashboard,
  useManagerDashboard,
  useAdminDashboard,
} from './useDashboard';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Create a mock fetch function
const mockFetch = vi.fn();

describe('useEmployeeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = mockFetch;
  });

  const mockEmployeeData = {
    badgeSummary: {
      total: 10,
      claimedThisMonth: 3,
      pendingCount: 2,
    },
    currentMilestone: {
      title: 'Badge Collector Level 2',
      progress: 3,
      target: 5,
      percentage: 60,
    },
    recentBadges: [],
  };

  it('fetches employee dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEmployeeData),
    });

    const { result } = renderHook(() => useEmployeeDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEmployeeData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dashboard/employee'),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    const { result } = renderHook(() => useEmployeeDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useIssuerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  const mockIssuerData = {
    issuanceSummary: {
      issuedThisMonth: 15,
      pendingClaims: 5,
      totalRecipients: 30,
      claimRate: 0.85,
    },
    recentActivity: [],
  };

  it('fetches issuer dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockIssuerData),
    });

    const { result } = renderHook(() => useIssuerDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIssuerData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dashboard/issuer'),
      expect.any(Object)
    );
  });
});

describe('useManagerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  const mockManagerData = {
    teamInsights: {
      teamMembersCount: 10,
      teamBadgesThisMonth: 25,
      topPerformers: [],
    },
    revocationAlerts: [],
  };

  it('fetches manager dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockManagerData),
    });

    const { result } = renderHook(() => useManagerDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockManagerData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dashboard/manager'),
      expect.any(Object)
    );
  });
});

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  const mockAdminData = {
    systemOverview: {
      totalUsers: 100,
      totalBadgesIssued: 500,
      activeBadgeTemplates: 20,
      systemHealth: 'healthy',
      activeUsersThisMonth: 80,
      newUsersThisMonth: 10,
    },
    recentActivity: [],
  };

  it('fetches admin dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdminData),
    });

    const { result } = renderHook(() => useAdminDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAdminData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dashboard/admin'),
      expect.any(Object)
    );
  });
});
