/**
 * ConfigurableThrottlerGuard — Story 15.13 (TD-038)
 *
 * Extends NestJS ThrottlerGuard to support runtime rate limit overrides
 * via THROTTLE_TTL_SECONDS and THROTTLE_LIMIT environment variables.
 *
 * When override env vars are set:
 *   - All @Throttle() decorator limits are replaced with env values
 *   - This enables test environments to use relaxed limits (AC #5)
 *
 * When override env vars are NOT set:
 *   - Standard behavior: @Throttle() decorator values are used as-is
 *   - Production behavior is unchanged (AC #6)
 *
 * Registered globally via APP_GUARD in app.module.ts, replacing the
 * stock ThrottlerGuard.
 *
 * @see ThrottleConfigService for env var parsing and floor enforcement
 */
import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';
import { THROTTLE_LIMIT_MIN_FLOOR } from './throttle.config';

@Injectable()
export class ConfigurableThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(ConfigurableThrottlerGuard.name);
  private overrideTtl: number | null = null;
  private overrideLimit: number | null = null;

  /**
   * Initialize override values from environment.
   * Called after ConfigModule.forRoot() has populated process.env,
   * so .env / .env.test values are available.
   */
  async onModuleInit(): Promise<void> {
    await super.onModuleInit();

    const ttlSecondsStr = process.env.THROTTLE_TTL_SECONDS;
    const limitStr = process.env.THROTTLE_LIMIT;

    if (ttlSecondsStr != null && ttlSecondsStr !== '') {
      const ttlSeconds = Number(ttlSecondsStr);
      if (!isNaN(ttlSeconds) && ttlSeconds > 0) {
        this.overrideTtl = ttlSeconds * 1000; // seconds → ms
      }
    }

    if (limitStr != null && limitStr !== '') {
      const parsed = Number(limitStr);
      if (!isNaN(parsed)) {
        // AC #7: Enforce minimum floor to prevent accidental disablement
        this.overrideLimit = Math.max(parsed, THROTTLE_LIMIT_MIN_FLOOR);
        if (parsed < THROTTLE_LIMIT_MIN_FLOOR) {
          this.logger.warn(
            `THROTTLE_LIMIT=${parsed} is below minimum floor (${THROTTLE_LIMIT_MIN_FLOOR}). ` +
              `Using ${THROTTLE_LIMIT_MIN_FLOOR} instead.`,
          );
        }
      }
    }

    if (this.overrideTtl != null || this.overrideLimit != null) {
      this.logger.log(
        `Throttle override active: TTL=${this.overrideTtl ?? 'default'}ms, ` +
          `Limit=${this.overrideLimit ?? 'default'}`,
      );
    }
  }

  /**
   * Override handleRequest to substitute limit/ttl from env vars when set.
   * The requestProps.limit and requestProps.ttl come from either:
   *   1. The @Throttle() decorator metadata (per-endpoint overrides), or
   *   2. The global ThrottlerModule config (default tier)
   *
   * When THROTTLE_LIMIT / THROTTLE_TTL_SECONDS are set, we replace them
   * before delegating to the stock ThrottlerGuard logic.
   */
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    if (this.overrideTtl != null) {
      requestProps.ttl = this.overrideTtl;
    }
    if (this.overrideLimit != null) {
      requestProps.limit = this.overrideLimit;
    }

    return super.handleRequest(requestProps);
  }
}
