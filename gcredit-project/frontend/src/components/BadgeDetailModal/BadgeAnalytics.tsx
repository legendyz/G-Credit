/**
 * Badge Analytics Section Component
 * Sprint 6 - Story 7.5: Display badge sharing analytics
 */

import React, { useEffect, useState } from 'react';
import { getBadgeShareStats, getBadgeShareHistory } from '../../lib/badgeShareApi';
import type { ShareStats, ShareHistoryItem } from '../../lib/badgeShareApi';

interface BadgeAnalyticsProps {
  badgeId: string;
  isOwner: boolean; // Only show analytics if user is badge owner or issuer
}

const BadgeAnalytics: React.FC<BadgeAnalyticsProps> = ({ badgeId, isOwner }) => {
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [history, setHistory] = useState<ShareHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isOwner) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsData, historyData] = await Promise.all([
          getBadgeShareStats(badgeId),
          getBadgeShareHistory(badgeId, 10),
        ]);

        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [badgeId, isOwner]);

  if (!isOwner) {
    return null; // Don't show analytics to non-owners
  }

  return (
    <section className="border-b last:border-b-0">
      <div className="px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Share Analytics
        </h2>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Share Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-xs text-blue-700 mt-1">Total Shares</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-900">{stats.byPlatform.email}</div>
                <div className="text-xs text-green-700 mt-1">📧 Email</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">{stats.byPlatform.teams}</div>
                <div className="text-xs text-purple-700 mt-1">👥 Teams</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-900">{stats.byPlatform.widget}</div>
                <div className="text-xs text-orange-700 mt-1">🔗 Widget</div>
              </div>
            </div>

            {/* Share History Toggle */}
            {history.length > 0 && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center border border-blue-200"
                >
                  {showHistory ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Hide Share History
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      View Share History ({history.length})
                    </>
                  )}
                </button>

                {/* Share History */}
                {showHistory && (
                  <div className="mt-4 space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.platform === 'email' && '📧 Email'}
                                {item.platform === 'teams' && '👥 Teams'}
                                {item.platform === 'widget' && '🔗 Widget'}
                              </span>
                              {item.recipientEmail && (
                                <span className="text-xs text-gray-500">
                                  → {item.recipientEmail}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(item.sharedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {stats.total === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">This badge hasn't been shared yet.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Click the "Share" button below to start sharing!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default BadgeAnalytics;
