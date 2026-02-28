/**
 * JwtStrategy.validate() Unit Tests
 *
 * Story 14.3 CR follow-up: Verify backward compatibility for old tokens
 * without `isManager` claim.
 */

import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from './jwt.strategy';

import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  describe('validate()', () => {
    let strategy: JwtStrategy;

    beforeEach(() => {
      // Create strategy with a mock ConfigService providing a valid JWT_SECRET
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_SECRET') {
            return 'test-jwt-secret-at-least-32-chars-long!!';
          }
          return undefined;
        }),
      } as unknown as ConfigService;
      strategy = new JwtStrategy(mockConfig);
    });

    it('should return isManager: true when payload includes isManager: true', () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'mgr@test.com',
        role: 'EMPLOYEE',
        isManager: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-1',
        email: 'mgr@test.com',
        role: 'EMPLOYEE',
        isManager: true,
      });
    });

    it('should return isManager: false when payload includes isManager: false', () => {
      const payload: JwtPayload = {
        sub: 'user-2',
        email: 'emp@test.com',
        role: 'EMPLOYEE',
        isManager: false,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-2',
        email: 'emp@test.com',
        role: 'EMPLOYEE',
        isManager: false,
      });
    });

    it('should default isManager to false for old tokens without the claim (ADR-017 backward compat)', () => {
      // Simulate an old token payload that predates Story 14.3
      const oldPayload = {
        sub: 'user-3',
        email: 'old@test.com',
        role: 'ADMIN',
      } as JwtPayload; // cast: old tokens lack isManager

      const result = strategy.validate(oldPayload);

      expect(result).toEqual({
        userId: 'user-3',
        email: 'old@test.com',
        role: 'ADMIN',
        isManager: false,
      });
    });
  });
});
