/**
 * Admin Analytics Page Tests - Story 10.5
 *
 * Tests for loading, data, error, and empty states.
 * All 5 hooks are mocked independently.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminAnalyticsPage from '../AdminAnalyticsPage';

// ─── Mock all 5 analytics hooks ─────────────────────────────────────

const mockOverview = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  dataUpdatedAt: 0,
  refetch: vi.fn(),
};

const mockTrends = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  dataUpdatedAt: 0,
  refetch: vi.fn(),
};

const mockPerformers = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  dataUpdatedAt: 0,
  refetch: vi.fn(),
};

const mockSkills = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  dataUpdatedAt: 0,
  refetch: vi.fn(),
};

const mockActivity = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  dataUpdatedAt: 0,
  refetch: vi.fn(),
};

vi.mock('../../hooks/useAnalytics', () => ({
  useSystemOverview: () => mockOverview,
  useIssuanceTrends: () => mockTrends,
  useTopPerformers: () => mockPerformers,
  useSkillsDistribution: () => mockSkills,
  useRecentActivity: () => mockActivity,
}));

// Mock recharts to avoid rendering issues in tests (ResponsiveContainer needs a DOM width)
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  Object.assign(mockOverview, {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  });
  Object.assign(mockTrends, {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  });
  Object.assign(mockPerformers, {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  });
  Object.assign(mockSkills, {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  });
  Object.assign(mockActivity, {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  });
}

const sampleOverview = {
  users: { total: 120, activeThisMonth: 80, newThisMonth: 5, byRole: {} },
  badges: {
    totalIssued: 300,
    claimedCount: 250,
    pendingCount: 40,
    revokedCount: 10,
    claimRate: 0.83,
  },
  badgeTemplates: { total: 25, active: 20, draft: 3, archived: 2 },
  systemHealth: {
    status: 'healthy',
    lastSync: '2026-02-09T10:00:00Z',
    apiResponseTime: '95ms',
  },
};

const sampleTrends = {
  period: 'last30days',
  startDate: '2026-01-10',
  endDate: '2026-02-09',
  dataPoints: [
    { date: '2026-02-08', issued: 5, claimed: 3, revoked: 0 },
    { date: '2026-02-09', issued: 8, claimed: 6, revoked: 1 },
  ],
  totals: { issued: 13, claimed: 9, revoked: 1, claimRate: 0.69 },
};

const samplePerformers = {
  period: 'allTime',
  topPerformers: [
    {
      userId: 'u1',
      name: 'Alice Johnson',
      badgeCount: 12,
      latestBadge: { templateName: 'Excellence', claimedAt: '2026-02-08T12:00:00Z' },
    },
    { userId: 'u2', name: 'Bob Smith', badgeCount: 8 },
  ],
};

const sampleSkills = {
  totalSkills: 10,
  topSkills: [
    { skillId: 's1', skillName: 'TypeScript', badgeCount: 20, employeeCount: 12 },
    { skillId: 's2', skillName: 'Leadership', badgeCount: 15, employeeCount: 10 },
  ],
  skillsByCategory: { Technical: 20, Leadership: 15 },
};

const sampleActivity = {
  activities: [
    {
      id: 'a1',
      type: 'BADGE_ISSUED' as const,
      actor: { userId: 'u1', name: 'Admin User' },
      target: { name: 'Bob Smith', badgeTemplateName: 'Excellence Award' },
      timestamp: new Date().toISOString(),
    },
  ],
  pagination: { limit: 10, offset: 0, total: 1 },
};

// ─── Tests ───────────────────────────────────────────────────────────

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Loading states', () => {
    it('renders KPI skeleton when overview is loading', () => {
      mockOverview.isLoading = true;
      const { container } = render(<AdminAnalyticsPage />);
      // Skeletons use animate-pulse
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('renders chart skeleton when trends is loading', () => {
      mockTrends.isLoading = true;
      const { container } = render(<AdminAnalyticsPage />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('renders table skeleton when performers is loading', () => {
      mockPerformers.isLoading = true;
      const { container } = render(<AdminAnalyticsPage />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('renders activity skeleton when activity is loading', () => {
      mockActivity.isLoading = true;
      const { container } = render(<AdminAnalyticsPage />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Data states', () => {
    it('renders KPI card values from overview data', () => {
      mockOverview.data = sampleOverview;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('120')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('300')).toBeInTheDocument(); // Badges Issued
      expect(screen.getByText('20')).toBeInTheDocument(); // Active Templates
      expect(screen.getByText('healthy')).toBeInTheDocument(); // System Health
    });

    it('renders active-this-month subtext', () => {
      mockOverview.data = sampleOverview;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('80 active this month')).toBeInTheDocument();
    });

    it('renders claim rate percentage', () => {
      mockOverview.data = sampleOverview;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('83% claim rate')).toBeInTheDocument();
    });

    it('renders trend totals summary', () => {
      mockTrends.data = sampleTrends;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText(/Issued: 13/)).toBeInTheDocument();
      expect(screen.getByText(/Claimed: 9/)).toBeInTheDocument();
      expect(screen.getByText(/Revoked: 1/)).toBeInTheDocument();
    });

    it('renders performer names', () => {
      mockPerformers.data = samplePerformers;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('renders skills distribution', () => {
      mockSkills.data = sampleSkills;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Skills Distribution')).toBeInTheDocument();
    });

    it('renders activity feed', () => {
      mockActivity.data = sampleActivity;
      render(<AdminAnalyticsPage />);

      expect(
        screen.getByText(/Admin User issued "Excellence Award" to Bob Smith/)
      ).toBeInTheDocument();
    });
  });

  describe('Error states', () => {
    it('shows error with retry button when overview fails', () => {
      mockOverview.isError = true;
      mockOverview.error = new Error('Network error');
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
      const retryBtn = screen.getAllByText('Retry')[0];
      expect(retryBtn).toBeInTheDocument();
    });

    it('calls refetch on retry click', () => {
      mockTrends.isError = true;
      mockTrends.error = new Error('Timeout');
      render(<AdminAnalyticsPage />);

      const retryBtn = screen.getAllByText('Retry')[0];
      fireEvent.click(retryBtn);
      expect(mockTrends.refetch).toHaveBeenCalled();
    });

    it('one section error does not affect other sections', () => {
      mockOverview.isError = true;
      mockOverview.error = new Error('Failed');
      mockPerformers.data = samplePerformers;
      render(<AdminAnalyticsPage />);

      // Overview shows error
      expect(screen.getByText('Failed')).toBeInTheDocument();
      // Performers still renders
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('shows empty message when performers list is empty', () => {
      mockPerformers.data = { period: 'allTime', topPerformers: [] };
      render(<AdminAnalyticsPage />);

      expect(screen.getByText(/No performers data yet/)).toBeInTheDocument();
    });

    it('shows empty message when activity list is empty', () => {
      mockActivity.data = {
        activities: [],
        pagination: { limit: 10, offset: 0, total: 0 },
      };
      render(<AdminAnalyticsPage />);

      expect(screen.getByText(/No recent activity/)).toBeInTheDocument();
    });

    it('shows empty message when trend data points are empty', () => {
      mockTrends.data = {
        period: 'last30days',
        startDate: '2026-01-10',
        endDate: '2026-02-09',
        dataPoints: [],
        totals: { issued: 0, claimed: 0, revoked: 0, claimRate: 0 },
      };
      render(<AdminAnalyticsPage />);

      expect(screen.getByText(/No trend data available/)).toBeInTheDocument();
    });
  });

  describe('Period selector', () => {
    it('renders period buttons', () => {
      mockTrends.data = sampleTrends;
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
      expect(screen.getByText('1 Year')).toBeInTheDocument();
    });
  });

  describe('Refresh button', () => {
    it('renders refresh button in footer', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls all refetch functions on refresh click', () => {
      render(<AdminAnalyticsPage />);

      fireEvent.click(screen.getByText('Refresh'));
      expect(mockOverview.refetch).toHaveBeenCalled();
      expect(mockTrends.refetch).toHaveBeenCalled();
      expect(mockPerformers.refetch).toHaveBeenCalled();
      expect(mockSkills.refetch).toHaveBeenCalled();
      expect(mockActivity.refetch).toHaveBeenCalled();
    });
  });

  describe('No mock data remnants', () => {
    it('does not render Demo Mode banner', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.queryByText(/Demo Mode/)).not.toBeInTheDocument();
    });

    it('does not render "Badge Sharing Analytics" title', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.queryByText(/Badge Sharing Analytics/)).not.toBeInTheDocument();
    });

    it('renders "Admin Analytics" as page title', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Admin Analytics')).toBeInTheDocument();
    });
  });
});
