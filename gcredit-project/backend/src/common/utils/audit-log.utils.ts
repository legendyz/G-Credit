/**
 * Shared Audit Log Utilities
 *
 * Centralised helpers for mapping, enriching, and formatting audit-log entries.
 * Used by both AnalyticsService and DashboardService so that the action→type
 * mapping, metadata key resolution, and human-readable description logic live
 * in exactly one place.
 */

// ---------------------------------------------------------------------------
// 1. Action → Display-type mapping
// ---------------------------------------------------------------------------

/**
 * Map a raw DB action + entityType to a normalised display type.
 *
 * Raw actions stored in the `audit_logs` table: ISSUED, CLAIMED, REVOKED,
 * SHARED, CREATED, UPDATED, NOTIFICATION_SENT, NOTIFICATION_FAILED, etc.
 *
 * Display types used by frontend: BADGE_ISSUED, BADGE_CLAIMED, etc.
 */
export function resolveActivityType(
  action: string,
  entityType: string,
): string {
  switch (action) {
    case 'ISSUED':
      return 'BADGE_ISSUED';
    case 'CLAIMED':
      return 'BADGE_CLAIMED';
    case 'REVOKED':
      return 'BADGE_REVOKED';
    case 'SHARED':
      return 'BADGE_SHARED';
    case 'CREATED':
      return entityType === 'BadgeTemplate' || entityType === 'Template'
        ? 'TEMPLATE_CREATED'
        : 'USER_REGISTERED';
    case 'UPDATED':
      return entityType === 'BadgeTemplate' || entityType === 'Template'
        ? 'TEMPLATE_UPDATED'
        : 'USER_UPDATED';
    default:
      return action; // NOTIFICATION_SENT etc. pass through
  }
}

// ---------------------------------------------------------------------------
// 2. Metadata helpers
// ---------------------------------------------------------------------------

type AuditMetadata = Record<string, unknown> | null;

/** Read a string value from metadata, returning '' when absent / wrong type. */
function str(metadata: AuditMetadata, key: string): string {
  if (!metadata) return '';
  const val = metadata[key];
  return typeof val === 'string' ? val : '';
}

/** Resolve the badge / template display name from metadata. */
export function resolveTemplateName(metadata: AuditMetadata): string {
  return str(metadata, 'badgeName') || str(metadata, 'templateName');
}

/** Resolve the recipient display name from metadata. */
export function resolveRecipientName(metadata: AuditMetadata): string {
  return str(metadata, 'recipientName');
}

/** Resolve the recipient email from metadata. */
export function resolveRecipientEmail(metadata: AuditMetadata): string {
  return str(metadata, 'recipientEmail');
}

// ---------------------------------------------------------------------------
// 3. Human-readable description (server-side pre-rendered)
// ---------------------------------------------------------------------------

/**
 * Build a complete, human-readable description for an audit-log entry.
 * Guards against empty fields so callers never see `""` or dangling "to".
 *
 * This is the single source of truth for audit description text.
 */
export function formatAuditDescription(
  action: string,
  metadata: AuditMetadata,
): string {
  if (!metadata) return action;

  const name = resolveTemplateName(metadata);
  const recipient =
    resolveRecipientName(metadata) || resolveRecipientEmail(metadata);

  switch (action) {
    case 'ISSUED':
      return name && recipient
        ? `Badge "${name}" issued to ${recipient}`
        : name
          ? `Badge "${name}" issued`
          : action;

    case 'CLAIMED':
      return name
        ? `Badge "${name}" claimed`
        : `Badge status changed: ${str(metadata, 'oldStatus') || '?'} → ${str(metadata, 'newStatus') || '?'}`;

    case 'REVOKED':
      return name
        ? `Revoked "${name}" — ${str(metadata, 'reason') || 'no reason given'}`
        : action;

    case 'SHARED':
      return name ? `Shared "${name}" via email` : action;

    case 'NOTIFICATION_SENT': {
      const type = str(metadata, 'notificationType');
      const email = str(metadata, 'recipientEmail');
      return type && email ? `${type} notification sent to ${email}` : action;
    }

    case 'CREATED': {
      const tplName = str(metadata, 'templateName');
      return tplName ? `Template "${tplName}" created` : action;
    }

    case 'UPDATED': {
      const tplName = str(metadata, 'templateName');
      return tplName ? `Template "${tplName}" updated` : action;
    }

    default:
      return action;
  }
}

// ---------------------------------------------------------------------------
// 4. Actor-map builder (shared between analytics & dashboard)
// ---------------------------------------------------------------------------

interface MinimalUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

/** Build a Map<userId, displayName> from a list of user records. */
export function buildActorMap(users: MinimalUser[]): Map<string, string> {
  return new Map(
    users.map((u) => [
      u.id,
      `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    ]),
  );
}
