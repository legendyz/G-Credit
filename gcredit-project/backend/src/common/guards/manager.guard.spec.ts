import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ManagerGuard } from './manager.guard';
import {
  RequireManager,
  REQUIRE_MANAGER_KEY,
} from '../decorators/require-manager.decorator';

describe('ManagerGuard (ADR-017 §4.5)', () => {
  let guard: ManagerGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ManagerGuard(reflector);
  });

  function createMockContext(user: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  describe('when @RequireManager() is NOT applied', () => {
    it('should allow access (passthrough)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = createMockContext({
        userId: 'u1',
        role: 'EMPLOYEE',
        isManager: false,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @RequireManager() IS applied', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    });

    it('should allow EMPLOYEE with isManager: true', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'EMPLOYEE',
        isManager: true,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny EMPLOYEE with isManager: false', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'EMPLOYEE',
        isManager: false,
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny EMPLOYEE when isManager is undefined (old token)', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'EMPLOYEE',
      });
      expect(() => guard.canActivate(ctx)).toThrow('Manager access required');
    });

    it('should allow ADMIN regardless of isManager (bypass)', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'ADMIN',
        isManager: false,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow ISSUER with isManager: true', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'ISSUER',
        isManager: true,
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny ISSUER with isManager: false', () => {
      const ctx = createMockContext({
        userId: 'u1',
        role: 'ISSUER',
        isManager: false,
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});

describe('RequireManager decorator', () => {
  it('should set requireManager metadata to true', () => {
    @RequireManager()
    class TestHandler {}

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const metadata = Reflect.getMetadata(REQUIRE_MANAGER_KEY, TestHandler);
    expect(metadata).toBe(true);
  });
});
