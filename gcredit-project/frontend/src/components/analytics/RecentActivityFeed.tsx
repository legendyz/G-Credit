/**
 * Recent Activity Feed - Story 10.5
 *
 * Timeline list of latest system activities (badge issuance, claims, etc.)
 */

import React from 'react';
import type { ActivityItem } from '../../types/analytics';
import { getActivityIcon, buildActivityDescription } from '../../utils/audit-activity.utils';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

function formatRelativeTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No recent activity. Actions will appear here as users interact with the system.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">
                {buildActivityDescription(activity)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivityFeed;
