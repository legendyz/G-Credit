/**
 * JwtAuthGuard Unit Tests
 *
 * Story 11.25 AC-C1: Verify @Public() routes correctly check
 * both httpOnly cookie and Bearer header for best-effort user identification.
 */

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

// Helper to create a mock ExecutionContext
function createMockContext(overrides: {
  cookies?: Record<string, string>;
  authorization?: string;
}): ExecutionContext {
  const request = {
    headers: {
      authorization: overrides.authorization,
    },
    cookies: overrides.cookies ?? {},
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('@Public() routes', () => {
    beforeEach(() => {
      // Make all routes public for these tests
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    });

    it('should pass and attempt auth when cookie token is present', async () => {
      const context = createMockContext({
        cookies: { access_token: 'valid-jwt-token' },
      });

      // Mock super.canActivate to simulate successful JWT validation
      const superActivate = jest
        .spyOn(JwtAuthGuard.prototype, 'canActivate')
        .mockImplementationOnce(() => Promise.resolve(true));

      // Since we're testing the guard's own canActivate, we need to restore
      // and call the real implementation
      superActivate.mockRestore();

      // For this test, we verify the guard returns true (allows access)
      // The actual JWT validation happens in super.canActivate (Passport)
      // We mock it at the prototype level
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalled();
      parentCanActivate.mockRestore();
    });

    it('should pass and attempt auth when Bearer header is present', async () => {
      const context = createMockContext({
        authorization: 'Bearer some-jwt-token',
      });

      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalled();
      parentCanActivate.mockRestore();
    });

    it('should pass without auth attempt when no token is present', () => {
      const context = createMockContext({});

      const parentCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      );

      const result = guard.canActivate(context);
      expect(result).toBe(true);
      expect(parentCanActivate).not.toHaveBeenCalled();
      parentCanActivate.mockRestore();
    });

    it('should pass even when cookie token is invalid (no 401)', async () => {
      const context = createMockContext({
        cookies: { access_token: 'invalid-token' },
      });

      // Simulate JWT validation failure
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(context);
      // Should still pass — @Public() routes always allow access
      expect(result).toBe(true);
      parentCanActivate.mockRestore();
    });

    it('should pass even when Bearer token is invalid (no 401)', async () => {
      const context = createMockContext({
        authorization: 'Bearer invalid-token',
      });

      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      parentCanActivate.mockRestore();
    });
  });

  describe('Non-public routes', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    });

    it('should delegate to super.canActivate()', () => {
      const context = createMockContext({
        cookies: { access_token: 'valid-jwt-token' },
      });

      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalledWith(context);
      parentCanActivate.mockRestore();
    });
  });
});
