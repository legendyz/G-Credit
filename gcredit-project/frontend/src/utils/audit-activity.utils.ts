/**
 * Shared Audit Activity Utilities
 *
 * Single source of truth for activity-type icons, verbs, and description
 * formatting. Used by RecentActivityFeed (Analytics) and AdminDashboard.
 */

import type { ActivityType } from '../types/analytics';

// ---------------------------------------------------------------------------
// 1. Activity configuration (icon + verb per type)
// ---------------------------------------------------------------------------

export interface ActivityConfig {
  icon: string;
  verb: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  BADGE_ISSUED: { icon: '🏅', verb: 'issued' },
  BADGE_CLAIMED: { icon: '✅', verb: 'claimed' },
  BADGE_REVOKED: { icon: '🚫', verb: 'revoked' },
  BADGE_SHARED: { icon: '📤', verb: 'shared' },
  TEMPLATE_CREATED: { icon: '📝', verb: 'created template' },
  TEMPLATE_UPDATED: { icon: '✏️', verb: 'updated template' },
  USER_REGISTERED: { icon: '👤', verb: 'registered' },
  USER_UPDATED: { icon: '🔧', verb: 'updated user' },
};

/** Return the icon for a given activity type, with a fallback for unknown types. */
export function getActivityIcon(type: string): string {
  return (ACTIVITY_CONFIG as Record<string, ActivityConfig>)[type]?.icon ?? '📋';
}

// ---------------------------------------------------------------------------
// 2. Description builder (guards against empty fields)
// ---------------------------------------------------------------------------

interface ActivityLike {
  type: string;
  actor: { name: string };
  target?: {
    name?: string;
    badgeTemplateName?: string;
    templateName?: string;
  };
}

/**
 * Build a human-readable description for an activity item.
 * Safely handles missing template names (no empty `""`) and
 * missing target names (no dangling "to" / "from").
 */
export function buildActivityDescription(activity: ActivityLike): string {
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
