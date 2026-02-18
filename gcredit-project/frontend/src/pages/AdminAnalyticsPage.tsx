/**
 * Admin Analytics Dashboard Page
 * Story 10.5: Connect admin analytics to real API data
 *
 * Each section fetches independently — a single failure does not block others.
 */

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSystemOverview,
  useIssuanceTrends,
  useTopPerformers,
  useSkillsDistribution,
  useRecentActivity,
} from '../hooks/useAnalytics';
import IssuanceTrendChart from '../components/analytics/IssuanceTrendChart';
import SkillsDistributionChart from '../components/analytics/SkillsDistributionChart';
import TopPerformersTable from '../components/analytics/TopPerformersTable';
import RecentActivityFeed from '../components/analytics/RecentActivityFeed';
import {
  KpiRowSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ActivitySkeleton,
} from '../components/analytics/AnalyticsSkeleton';
import { PageTemplate } from '../components/layout/PageTemplate';
import { useUserRole } from '../stores/authStore';
import { exportAnalyticsCsv } from '../lib/analyticsApi';

// ─── Period selector config ────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '1 Year', value: 365 },
] as const;

// ─── Reusable error card ───────────────────────────────────────────────
interface SectionErrorProps {
  message: string;
  onRetry: () => void;
}

const SectionError: React.FC<SectionErrorProps> = ({ message, onRetry }) => (
  <div className="bg-error-light border border-red-200 rounded-lg p-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-error text-lg">⚠️</span>
      <p className="text-sm text-error">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="px-3 py-1.5 text-sm font-medium text-error bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
    >
      Retry
    </button>
  </div>
);

// ─── Health status indicator ───────────────────────────────────────────
function healthColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-success';
    case 'degraded':
      return 'bg-warning';
    default:
      return 'bg-error';
  }
}

// ─── Main page component ──────────────────────────────────────────────
const AdminAnalyticsPage: React.FC = () => {
  const role = useUserRole();
  const isIssuer = role === 'ISSUER';
  const queryClient = useQueryClient();
  const [trendPeriod, setTrendPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Independent hooks — each section loads/errors separately
  const overview = useSystemOverview();
  const trends = useIssuanceTrends(trendPeriod);
  const performers = useTopPerformers(10, !isIssuer);
  const skills = useSkillsDistribution(!isIssuer);
  const activity = useRecentActivity(10, !isIssuer);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportAnalyticsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gcredit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Analytics exported successfully');
    } catch {
      toast.error('Failed to export analytics');
    } finally {
      setExporting(false);
    }
  }, []);

  // Derive last-updated from the most recent dataUpdatedAt
  const lastUpdated = [
    overview.dataUpdatedAt,
    trends.dataUpdatedAt,
    performers.dataUpdatedAt,
    skills.dataUpdatedAt,
    activity.dataUpdatedAt,
  ]
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <PageTemplate
      title={isIssuer ? 'Issuer Analytics' : 'Admin Analytics'}
      description={
        isIssuer
          ? 'Overview of badges you have issued, claim rates, and activity'
          : 'System-wide overview of users, badges, skills, and activity'
      }
      actions={
        !isIssuer ? (
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        ) : undefined
      }
    >
      {/* ─── Section A: KPI Overview Cards ────────────────────── */}
      {overview.isLoading ? (
        <KpiRowSkeleton />
      ) : overview.isError ? (
        <SectionError
          message={overview.error?.message || 'Failed to load overview'}
          onRetry={() => overview.refetch()}
        />
      ) : overview.data ? (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${isIssuer ? '' : 'lg:grid-cols-4'} gap-6`}
        >
          {/* Total Users / Recipients */}
          <div className="bg-white rounded-lg shadow-elevation-1 p-6 border-l-4 border-brand-500">
            <div className="text-3xl font-bold text-neutral-900">{overview.data.users.total}</div>
            <div className="text-sm text-neutral-600 mt-1">
              {isIssuer ? 'Recipients' : 'Total Users'}
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              {isIssuer
                ? `${overview.data.users.activeThisMonth} issued this month`
                : `${overview.data.users.activeThisMonth} active this month`}
            </div>
          </div>

          {/* Badges Issued */}
          <div className="bg-white rounded-lg shadow-elevation-1 p-6 border-l-4 border-success">
            <div className="text-3xl font-bold text-neutral-900">
              {overview.data.badges.totalIssued}
            </div>
            <div className="text-sm text-neutral-600 mt-1">Badges Issued</div>
            <div className="text-xs text-neutral-500 mt-2">
              {(overview.data.badges.claimRate * 100).toFixed(0)}% claim rate
            </div>
          </div>

          {/* Active Templates — Admin only */}
          {!isIssuer && (
            <div className="bg-white rounded-lg shadow-elevation-1 p-6 border-l-4 border-brand-700">
              <div className="text-3xl font-bold text-neutral-900">
                {overview.data.badgeTemplates.active}
              </div>
              <div className="text-sm text-neutral-600 mt-1">Active Templates</div>
              <div className="text-xs text-neutral-500 mt-2">
                {overview.data.badgeTemplates.total} total
              </div>
            </div>
          )}

          {/* System Health — Admin only */}
          {!isIssuer && (
            <div className="bg-white rounded-lg shadow-elevation-1 p-6 border-l-4 border-neutral-300">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${healthColor(overview.data.systemHealth.status)}`}
                />
                <span className="text-xl font-bold text-neutral-900 capitalize">
                  {overview.data.systemHealth.status}
                </span>
              </div>
              <div className="text-sm text-neutral-600 mt-1">System Health</div>
              <div className="text-xs text-neutral-500 mt-2">
                Response: {overview.data.systemHealth.apiResponseTime}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ─── Section B: Issuance Trends ───────────────────────── */}
      <div className="mt-8">
        {trends.isLoading ? (
          <ChartSkeleton />
        ) : trends.isError ? (
          <div className="bg-white rounded-lg shadow-elevation-1 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Issuance Trends</h2>
            <SectionError
              message={trends.error?.message || 'Failed to load trends'}
              onRetry={() => trends.refetch()}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-elevation-1 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Issuance Trends</h2>
              <div className="flex gap-2 mt-3 sm:mt-0">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTrendPeriod(opt.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      trendPeriod === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Totals summary */}
            {trends.data?.totals && (
              <div className="flex gap-6 mb-4 text-sm">
                <span className="text-brand-600 font-medium">
                  Issued: {trends.data.totals.issued}
                </span>
                <span className="text-success font-medium">
                  Claimed: {trends.data.totals.claimed}
                </span>
                <span className="text-error font-medium">
                  Revoked: {trends.data.totals.revoked}
                </span>
              </div>
            )}

            <IssuanceTrendChart dataPoints={trends.data?.dataPoints || []} />
          </div>
        )}
      </div>

      {/* ─── Section C & D: Performers + Skills (Admin/Manager only) ── */}
      {!isIssuer && (
        <div className="mt-8 grid lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div>
            {performers.isLoading ? (
              <TableSkeleton />
            ) : performers.isError ? (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Top Performers</h2>
                <SectionError
                  message={performers.error?.message || 'Failed to load performers'}
                  onRetry={() => performers.refetch()}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">🏆 Top Performers</h2>
                <TopPerformersTable performers={performers.data?.topPerformers || []} />
              </div>
            )}
          </div>

          {/* Skills Distribution */}
          <div>
            {skills.isLoading ? (
              <ChartSkeleton />
            ) : skills.isError ? (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Skills Distribution</h2>
                <SectionError
                  message={skills.error?.message || 'Failed to load skills'}
                  onRetry={() => skills.refetch()}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Skills Distribution</h2>
                <SkillsDistributionChart
                  topSkills={skills.data?.topSkills || []}
                  skillsByCategory={skills.data?.skillsByCategory || {}}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Section E: Recent Activity (Admin only) ──────────── */}
      {!isIssuer && (
        <div className="mt-8">
          {activity.isLoading ? (
            <ActivitySkeleton />
          ) : activity.isError ? (
            <div className="bg-white rounded-lg shadow-elevation-1 p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Activity</h2>
              <SectionError
                message={activity.error?.message || 'Failed to load activity'}
                onRetry={() => activity.refetch()}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-elevation-1 p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Activity</h2>
              <RecentActivityFeed activities={activity.data?.activities || []} />
            </div>
          )}
        </div>
      )}

      {/* ─── Section F: Footer / Last Updated ─────────────────── */}
      <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {lastUpdated
            ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`
            : 'Loading...'}
        </span>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </PageTemplate>
  );
};

export default AdminAnalyticsPage;
