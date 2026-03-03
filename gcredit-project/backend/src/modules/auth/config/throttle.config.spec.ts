/**
 * ThrottleConfigService Unit Tests — Story 15.13 (TD-038)
 *
 * AC #2: THROTTLE_TTL_SECONDS and THROTTLE_LIMIT env vars parsed correctly
 * AC #3: Default values match production (null when env vars not set)
 * AC #7: Minimum floor of 5 enforced on THROTTLE_LIMIT
 * AC #8: ConfigService injection and default fallback
 */
import { ConfigService } from '@nestjs/config';
import {
  ThrottleConfigService,
  THROTTLE_LIMIT_MIN_FLOOR,
} from './throttle.config';

describe('ThrottleConfigService', () => {
  function createService(
    env: Record<string, unknown> = {},
  ): ThrottleConfigService {
    const configService = {
      get: jest.fn((key: string) => env[key]),
    } as unknown as ConfigService;
    return new ThrottleConfigService(configService);
  }

  describe('when no env vars are set (production default)', () => {
    it('returns null for overrideTtl', () => {
      const svc = createService();
      expect(svc.getOverrideTtl()).toBeNull();
    });

    it('returns null for overrideLimit', () => {
      const svc = createService();
      expect(svc.getOverrideLimit()).toBeNull();
    });

    it('isOverrideActive returns false', () => {
      const svc = createService();
      expect(svc.isOverrideActive()).toBe(false);
    });
  });

  describe('when THROTTLE_TTL_SECONDS is set', () => {
    it('converts seconds to milliseconds', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: 120 });
      expect(svc.getOverrideTtl()).toBe(120_000);
    });

    it('isOverrideActive returns true', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: 60 });
      expect(svc.isOverrideActive()).toBe(true);
    });
  });

  describe('when THROTTLE_LIMIT is set', () => {
    it('uses the provided limit when above floor', () => {
      const svc = createService({ THROTTLE_LIMIT: 1000 });
      expect(svc.getOverrideLimit()).toBe(1000);
    });

    it('isOverrideActive returns true', () => {
      const svc = createService({ THROTTLE_LIMIT: 100 });
      expect(svc.isOverrideActive()).toBe(true);
    });

    it('enforces minimum floor of 5 (AC #7)', () => {
      const svc = createService({ THROTTLE_LIMIT: 2 });
      expect(svc.getOverrideLimit()).toBe(THROTTLE_LIMIT_MIN_FLOOR);
    });

    it('allows exactly the floor value', () => {
      const svc = createService({ THROTTLE_LIMIT: 5 });
      expect(svc.getOverrideLimit()).toBe(5);
    });

    it('enforces floor for THROTTLE_LIMIT=0', () => {
      const svc = createService({ THROTTLE_LIMIT: 0 });
      expect(svc.getOverrideLimit()).toBe(THROTTLE_LIMIT_MIN_FLOOR);
    });

    it('enforces floor for negative values', () => {
      const svc = createService({ THROTTLE_LIMIT: -10 });
      expect(svc.getOverrideLimit()).toBe(THROTTLE_LIMIT_MIN_FLOOR);
    });
  });

  describe('when both env vars are set', () => {
    it('returns both overrides', () => {
      const svc = createService({
        THROTTLE_TTL_SECONDS: 300,
        THROTTLE_LIMIT: 50,
      });
      expect(svc.getOverrideTtl()).toBe(300_000);
      expect(svc.getOverrideLimit()).toBe(50);
      expect(svc.isOverrideActive()).toBe(true);
    });
  });

  describe('invalid / NaN guardrails', () => {
    it('ignores NaN THROTTLE_TTL_SECONDS (string)', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: 'abc' });
      expect(svc.getOverrideTtl()).toBeNull();
      expect(svc.isOverrideActive()).toBe(false);
    });

    it('ignores zero THROTTLE_TTL_SECONDS', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: 0 });
      expect(svc.getOverrideTtl()).toBeNull();
    });

    it('ignores negative THROTTLE_TTL_SECONDS', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: -5 });
      expect(svc.getOverrideTtl()).toBeNull();
    });

    it('ignores empty string THROTTLE_TTL_SECONDS', () => {
      const svc = createService({ THROTTLE_TTL_SECONDS: '' });
      expect(svc.getOverrideTtl()).toBeNull();
    });

    it('ignores NaN THROTTLE_LIMIT (string)', () => {
      const svc = createService({ THROTTLE_LIMIT: 'xyz' });
      expect(svc.getOverrideLimit()).toBeNull();
      expect(svc.isOverrideActive()).toBe(false);
    });

    it('ignores empty string THROTTLE_LIMIT', () => {
      const svc = createService({ THROTTLE_LIMIT: '' });
      expect(svc.getOverrideLimit()).toBeNull();
    });
  });

  describe('THROTTLE_LIMIT_MIN_FLOOR constant', () => {
    it('is 5', () => {
      expect(THROTTLE_LIMIT_MIN_FLOOR).toBe(5);
    });
  });
});
