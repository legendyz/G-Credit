/**
 * Recent Activity Feed - Story 10.5
 *
 * Timeline list of latest system activities (badge issuance, claims, etc.)
 */

import React from 'react';
import type { ActivityItem, ActivityType } from '../../types/analytics';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; verb: string }> = {
  BADGE_ISSUED: { icon: '🏅', verb: 'issued' },
  BADGE_CLAIMED: { icon: '✅', verb: 'claimed' },
  BADGE_REVOKED: { icon: '🚫', verb: 'revoked' },
  BADGE_SHARED: { icon: '📤', verb: 'shared' },
  TEMPLATE_CREATED: { icon: '📝', verb: 'created template' },
  TEMPLATE_UPDATED: { icon: '✏️', verb: 'updated template' },
  USER_REGISTERED: { icon: '👤', verb: 'registered' },
  USER_UPDATED: { icon: '🔧', verb: 'updated user' },
};

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

function buildDescription(activity: ActivityItem): string {
  const actor = activity.actor.name;
  const templateName = activity.target?.badgeTemplateName || activity.target?.templateName || '';
  const targetName = activity.target?.name || '';

  switch (activity.type) {
    case 'BADGE_ISSUED':
      return templateName && targetName
        ? `${actor} issued "${templateName}" to ${targetName}`
        : templateName
          ? `${actor} issued "${templateName}"`
          : `${actor} issued a badge`;
    case 'BADGE_CLAIMED':
      return templateName ? `${actor} claimed "${templateName}"` : `${actor} claimed a badge`;
    case 'BADGE_REVOKED':
      return templateName && targetName
        ? `${actor} revoked "${templateName}" from ${targetName}`
        : templateName
          ? `${actor} revoked "${templateName}"`
          : `${actor} revoked a badge`;
    case 'BADGE_SHARED':
      return templateName
        ? `${actor} shared "${templateName}" via email`
        : `${actor} shared a badge via email`;
    case 'TEMPLATE_CREATED':
      return templateName
        ? `${actor} created template "${templateName}"`
        : `${actor} created a template`;
    case 'TEMPLATE_UPDATED':
      return templateName
        ? `${actor} updated template "${templateName}"`
        : `${actor} updated a template`;
    case 'USER_REGISTERED':
      return `${actor} registered`;
    case 'USER_UPDATED':
      return `${actor} updated user settings`;
    default:
      return `${actor} performed ${activity.type}`;
  }
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
        const config = ACTIVITY_CONFIG[activity.type] || { icon: '📌' };
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{buildDescription(activity)}</p>
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
