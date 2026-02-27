/**
 * Session configuration constants - Story 13.6
 */
export const SESSION_CONFIG = {
  /** Total idle timeout before auto-logout (ms) */
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  /** Warning appears this many ms before timeout */
  IDLE_WARNING_MS: 5 * 60 * 1000, // 5 minute warning
  /** Throttle interval for activity event listeners (ms) */
  ACTIVITY_THROTTLE_MS: 1_000, // 1 second
} as const;
