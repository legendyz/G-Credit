/**
 * Throttle Configuration — Story 15.13 (TD-038)
 *
 * Provides configurable rate limit values for @Throttle() endpoints.
 * Production uses strict per-endpoint defaults; test environments can
 * override all endpoints globally via two env vars.
 *
 * Env vars (AC #2 — NOTE-15.13-001):
 * - THROTTLE_TTL_SECONDS: TTL window in seconds (converted to ms internally)
 * - THROTTLE_LIMIT: Max requests per TTL window (min floor: 5 — AC #7)
 *
 * When these env vars are set, they override every @Throttle() decorator's
 * hardcoded values at runtime via ConfigurableThrottlerGuard.
 * When NOT set, per-endpoint production defaults (Story 8.6) are used.
 *
 * @see Sprint 14 Retrospective Action Item #1
 * @see Story 8.6 SEC-P1-004
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Minimum floor for THROTTLE_LIMIT (AC #7: prevent accidental disablement) */
export const THROTTLE_LIMIT_MIN_FLOOR = 5;

@Injectable()
export class ThrottleConfigService {
  private readonly logger = new Logger(ThrottleConfigService.name);
  private readonly overrideTtl: number | null;
  private readonly overrideLimit: number | null;

  constructor(private readonly config: ConfigService) {
    // Read override env vars (null = use per-endpoint defaults)
    const ttlSeconds = this.config.get<number>('THROTTLE_TTL_SECONDS');
    const limit = this.config.get<number>('THROTTLE_LIMIT');

    this.overrideTtl = ttlSeconds != null ? ttlSeconds * 1000 : null; // Convert seconds → ms

    if (limit != null) {
      const parsed = Number(limit);
      // AC #7: Enforce minimum floor
      this.overrideLimit = Math.max(parsed, THROTTLE_LIMIT_MIN_FLOOR);
      if (parsed < THROTTLE_LIMIT_MIN_FLOOR) {
        this.logger.warn(
          `THROTTLE_LIMIT=${parsed} is below minimum floor (${THROTTLE_LIMIT_MIN_FLOOR}). ` +
            `Using ${THROTTLE_LIMIT_MIN_FLOOR} instead.`,
        );
      }
    } else {
      this.overrideLimit = null;
    }

    if (this.overrideTtl != null || this.overrideLimit != null) {
      this.logger.log(
        `Throttle override active: TTL=${this.overrideTtl ?? 'default'}ms, ` +
          `Limit=${this.overrideLimit ?? 'default'}`,
      );
    }
  }

  /** Whether any override is active */
  isOverrideActive(): boolean {
    return this.overrideTtl != null || this.overrideLimit != null;
  }

  /** Get the override TTL in ms, or null if using per-endpoint defaults */
  getOverrideTtl(): number | null {
    return this.overrideTtl;
  }

  /** Get the override limit, or null if using per-endpoint defaults */
  getOverrideLimit(): number | null {
    return this.overrideLimit;
  }
}
