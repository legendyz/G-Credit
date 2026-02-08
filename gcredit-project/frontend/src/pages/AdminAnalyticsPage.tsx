/**
 * Admin Analytics Dashboard Page
 * Sprint 6 - Story 7.5: Aggregate sharing analytics for administrators
 */

import React, { useEffect, useState } from 'react';

interface PlatformStats {
  email: number;
  teams: number;
  widget: number;
}

interface TopBadge {
  badgeId: string;
  badgeName: string;
  shareCount: number;
  platforms: PlatformStats;
}

interface AdminAnalyticsData {
  totalShares: number;
  platformDistribution: PlatformStats;
  topBadges: TopBadge[];
  recentActivity: {
    date: string;
    shares: number;
  }[];
}

const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Analytics data provided via mock — real sharing-analytics endpoint integration deferred to Story 10.5
      // The existing backend /api/analytics/system-overview returns user/badge/template stats,
      // not sharing analytics (totalShares, platformDistribution, topBadges) needed here.
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData: AdminAnalyticsData = {
        totalShares: 1247,
        platformDistribution: {
          email: 542,
          teams: 389,
          widget: 316,
        },
        topBadges: [
          {
            badgeId: 'badge-1',
            badgeName: 'TypeScript Expert',
            shareCount: 156,
            platforms: { email: 68, teams: 52, widget: 36 },
          },
          {
            badgeId: 'badge-2',
            badgeName: 'Leadership Excellence',
            shareCount: 142,
            platforms: { email: 61, teams: 48, widget: 33 },
          },
          {
            badgeId: 'badge-3',
            badgeName: 'Innovation Award',
            shareCount: 128,
            platforms: { email: 55, teams: 42, widget: 31 },
          },
          {
            badgeId: 'badge-4',
            badgeName: 'Team Collaboration',
            shareCount: 115,
            platforms: { email: 49, teams: 39, widget: 27 },
          },
          {
            badgeId: 'badge-5',
            badgeName: 'Code Review Master',
            shareCount: 98,
            platforms: { email: 42, teams: 33, widget: 23 },
          },
        ],
        recentActivity: [
          { date: '2026-01-31', shares: 45 },
          { date: '2026-01-30', shares: 52 },
          { date: '2026-01-29', shares: 38 },
          { date: '2026-01-28', shares: 41 },
          { date: '2026-01-27', shares: 35 },
          { date: '2026-01-26', shares: 29 },
          { date: '2026-01-25', shares: 33 },
        ],
      };

      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxActivity = Math.max(...data.recentActivity.map(a => a.shares));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Badge Sharing Analytics
          </h1>
          <p className="text-gray-600">
            Administrator dashboard for monitoring badge sharing across the platform
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                  timeRange === range
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {range === '7d' && 'Last 7 Days'}
                {range === '30d' && 'Last 30 Days'}
                {range === '90d' && 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900">{data.totalShares}</div>
            <div className="text-sm text-gray-600 mt-1">Total Shares</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900">{data.platformDistribution.email}</div>
            <div className="text-sm text-gray-600 mt-1">📧 Email Shares</div>
            <div className="text-xs text-gray-500 mt-2">
              {calculatePercentage(data.platformDistribution.email, data.totalShares)}% of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-gray-900">{data.platformDistribution.teams}</div>
            <div className="text-sm text-gray-600 mt-1">👥 Teams Shares</div>
            <div className="text-xs text-gray-500 mt-2">
              {calculatePercentage(data.platformDistribution.teams, data.totalShares)}% of total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-gray-900">{data.platformDistribution.widget}</div>
            <div className="text-sm text-gray-600 mt-1">🔗 Widget Embeds</div>
            <div className="text-xs text-gray-500 mt-2">
              {calculatePercentage(data.platformDistribution.widget, data.totalShares)}% of total
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Platform Distribution Pie Chart (Visual) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Distribution</h2>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">📧 Email</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.platformDistribution.email} ({calculatePercentage(data.platformDistribution.email, data.totalShares)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculatePercentage(data.platformDistribution.email, data.totalShares)}%` }}
                  />
                </div>
              </div>

              {/* Teams */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">👥 Teams</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.platformDistribution.teams} ({calculatePercentage(data.platformDistribution.teams, data.totalShares)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculatePercentage(data.platformDistribution.teams, data.totalShares)}%` }}
                  />
                </div>
              </div>

              {/* Widget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">🔗 Widget</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.platformDistribution.widget} ({calculatePercentage(data.platformDistribution.widget, data.totalShares)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculatePercentage(data.platformDistribution.widget, data.totalShares)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-3">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500 w-20">
                    {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${(activity.shares / maxActivity) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">{activity.shares}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Shared Badges */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🏆 Top Shared Badges</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Badge Name</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Shares</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">📧 Email</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">👥 Teams</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">🔗 Widget</th>
                </tr>
              </thead>
              <tbody>
                {data.topBadges.map((badge, index) => (
                  <tr
                    key={badge.badgeId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                        {index > 2 && <span className="text-gray-500 font-medium">#{index + 1}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">{badge.badgeName}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {badge.shareCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">{badge.platforms.email}</td>
                    <td className="py-4 px-4 text-center text-gray-700">{badge.platforms.teams}</td>
                    <td className="py-4 px-4 text-center text-gray-700">{badge.platforms.widget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mock Data Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Demo Mode: This page is currently displaying mock data
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                To connect to real analytics data, implement the admin analytics aggregation endpoint in the backend API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
