/**
 * ConfigurableThrottlerGuard Unit Tests — Story 15.13 (TD-038)
 *
 * AC #1: @Throttle() decorators effectively use configurable values
 * AC #6: Unchanged production behavior when env vars not set
 * AC #7: Minimum floor enforcement
 * AC #8: Default fallback verification
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { ConfigurableThrottlerGuard } from './configurable-throttler.guard';
import type { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';
import { Logger } from '@nestjs/common';

describe('ConfigurableThrottlerGuard', () => {
  let guard: ConfigurableThrottlerGuard;
  let superHandleRequest: jest.SpyInstance;

  beforeEach(() => {
    // Create guard instance without DI (we'll test the override logic only)
    guard = Object.create(ConfigurableThrottlerGuard.prototype);
    // Initialize logger (normally done by NestJS DI)
    (guard as any).logger = new Logger('ConfigurableThrottlerGuard');

    // Mock super.handleRequest to capture what values are passed
    superHandleRequest = jest
      .spyOn(
        Object.getPrototypeOf(ConfigurableThrottlerGuard.prototype),
        'handleRequest',
      )
      .mockResolvedValue(true);
  });

  afterEach(() => {
    superHandleRequest.mockRestore();
    // Clean up env vars
    delete process.env.THROTTLE_TTL_SECONDS;
    delete process.env.THROTTLE_LIMIT;
  });

  function createRequestProps(
    overrides: Partial<ThrottlerRequest> = {},
  ): ThrottlerRequest {
    return {
      context: {} as any,
      limit: 5,
      ttl: 60000,
      throttler: { name: 'default', ttl: 60000, limit: 60 },
      blockDuration: 0,
      getTracker: jest.fn(),
      generateKey: jest.fn(),
      ...overrides,
    };
  }

  describe('when no env vars are set (production mode)', () => {
    it('passes original limit/ttl unchanged to super', async () => {
      // Explicitly set override fields to null (production default)
      (guard as any).overrideTtl = null;
      (guard as any).overrideLimit = null;

      const props = createRequestProps({ limit: 5, ttl: 60000 });
      await guard['handleRequest'](props);

      expect(superHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, ttl: 60000 }),
      );
    });

    it('preserves @Throttle register defaults (3/hour)', async () => {
      (guard as any).overrideTtl = null;
      (guard as any).overrideLimit = null;

      const props = createRequestProps({ limit: 3, ttl: 3600000 });
      await guard['handleRequest'](props);

      expect(superHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 3, ttl: 3600000 }),
      );
    });
  });

  describe('when THROTTLE_LIMIT is set', () => {
    it('overrides limit in requestProps', async () => {
      (guard as any).overrideTtl = null;
      (guard as any).overrideLimit = 1000;

      const props = createRequestProps({ limit: 5, ttl: 60000 });
      await guard['handleRequest'](props);

      expect(superHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 1000, ttl: 60000 }),
      );
    });
  });

  describe('when THROTTLE_TTL_SECONDS is set', () => {
    it('overrides ttl in requestProps', async () => {
      (guard as any).overrideTtl = 120000; // 120s in ms
      (guard as any).overrideLimit = null;

      const props = createRequestProps({ limit: 5, ttl: 60000 });
      await guard['handleRequest'](props);

      expect(superHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, ttl: 120000 }),
      );
    });
  });

  describe('when both env vars are set', () => {
    it('overrides both limit and ttl', async () => {
      (guard as any).overrideTtl = 300000;
      (guard as any).overrideLimit = 500;

      const props = createRequestProps({ limit: 3, ttl: 3600000 });
      await guard['handleRequest'](props);

      expect(superHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 500, ttl: 300000 }),
      );
    });
  });

  describe('onModuleInit env parsing', () => {
    // Mock super.onModuleInit to avoid ThrottlerGuard initialization
    let superInit: jest.SpyInstance;

    beforeEach(() => {
      superInit = jest
        .spyOn(
          Object.getPrototypeOf(ConfigurableThrottlerGuard.prototype),
          'onModuleInit',
        )
        .mockResolvedValue(undefined);
      // Initialize fields that class field initializers would set
      (guard as any).overrideTtl = null;
      (guard as any).overrideLimit = null;
    });

    afterEach(() => {
      superInit.mockRestore();
    });

    it('reads THROTTLE_TTL_SECONDS and converts to ms', async () => {
      process.env.THROTTLE_TTL_SECONDS = '120';
      await guard.onModuleInit();
      expect((guard as any).overrideTtl).toBe(120000);
    });

    it('reads THROTTLE_LIMIT', async () => {
      process.env.THROTTLE_LIMIT = '500';
      await guard.onModuleInit();
      expect((guard as any).overrideLimit).toBe(500);
    });

    it('enforces minimum floor on THROTTLE_LIMIT (AC #7)', async () => {
      process.env.THROTTLE_LIMIT = '2';
      await guard.onModuleInit();
      expect((guard as any).overrideLimit).toBe(5);
    });

    it('leaves overrides null when env vars not set', async () => {
      await guard.onModuleInit();
      expect((guard as any).overrideTtl).toBeNull();
      expect((guard as any).overrideLimit).toBeNull();
    });

    it('ignores empty string THROTTLE_TTL_SECONDS', async () => {
      process.env.THROTTLE_TTL_SECONDS = '';
      await guard.onModuleInit();
      expect((guard as any).overrideTtl).toBeNull();
    });

    it('ignores non-numeric THROTTLE_TTL_SECONDS', async () => {
      process.env.THROTTLE_TTL_SECONDS = 'abc';
      await guard.onModuleInit();
      expect((guard as any).overrideTtl).toBeNull();
    });

    it('ignores zero THROTTLE_TTL_SECONDS', async () => {
      process.env.THROTTLE_TTL_SECONDS = '0';
      await guard.onModuleInit();
      expect((guard as any).overrideTtl).toBeNull();
    });
  });
});
