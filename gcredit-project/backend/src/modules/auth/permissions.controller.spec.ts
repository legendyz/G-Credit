/**
 * permissions.controller.spec.ts
 *
 * Story 15.2 — Task 4: Unit tests
 * Tests all 6 role×manager combinations and verifies no database calls occur.
 *
 * NOTE: 401 authentication tests are covered in test/permissions.e2e-spec.ts
 * (real HTTP integration test with supertest, not mocked here).
 *
 * AC #6: Response is fast (<50ms) — no database queries
 * AC #9: Unit tests cover all 6 role×manager combinations
 * AC #10: Backend computation logic mirrors frontend utils/permissions.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { UserPermissionsDto } from './dto/user-permissions.dto';
import {
  computePermissions,
  computeDashboardTabs,
  computeSidebarGroups,
  computeFlatPermissions,
} from './utils/compute-permissions';
import type { AuthenticatedUser } from '../../common/interfaces/request-with-user.interface';
import { UserRole } from '@prisma/client';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/users/me/permissions', () => {
    /**
     * Helper: create a mock AuthenticatedUser from JWT claims.
     * Note: controller receives already-authenticated user from JwtAuthGuard.
     */
    function mockUser(role: UserRole, isManager: boolean): AuthenticatedUser {
      return {
        userId: 'user-id-hidden', // Present on req.user but NOT in response
        email: 'hidden@example.com', // Present on req.user but NOT in response
        role,
        isManager,
      };
    }

    // --- AC #9: Test all 6 role×manager combinations ---

    it('EMPLOYEE + non-manager → [my-badges] tabs, [base] sidebar', () => {
      const user = mockUser(UserRole.EMPLOYEE, false);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('EMPLOYEE');
      expect(result.isManager).toBe(false);
      expect(result.dashboardTabs).toEqual(['my-badges']);
      expect(result.sidebarGroups).toEqual(['base']);
      expect(result.permissions).toEqual({
        canViewTeam: false,
        canIssueBadges: false,
        canManageUsers: false,
      });
    });

    it('EMPLOYEE + manager → [my-badges, team] tabs, [base, team] sidebar', () => {
      const user = mockUser(UserRole.EMPLOYEE, true);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('EMPLOYEE');
      expect(result.isManager).toBe(true);
      expect(result.dashboardTabs).toEqual(['my-badges', 'team']);
      expect(result.sidebarGroups).toEqual(['base', 'team']);
      expect(result.permissions).toEqual({
        canViewTeam: true,
        canIssueBadges: false,
        canManageUsers: false,
      });
    });

    it('ISSUER + non-manager → [my-badges, issuance] tabs, [base, issuance] sidebar', () => {
      const user = mockUser(UserRole.ISSUER, false);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('ISSUER');
      expect(result.isManager).toBe(false);
      expect(result.dashboardTabs).toEqual(['my-badges', 'issuance']);
      expect(result.sidebarGroups).toEqual(['base', 'issuance']);
      expect(result.permissions).toEqual({
        canViewTeam: false,
        canIssueBadges: true,
        canManageUsers: false,
      });
    });

    it('ISSUER + manager → [my-badges, team, issuance] tabs, [base, team, issuance] sidebar', () => {
      const user = mockUser(UserRole.ISSUER, true);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('ISSUER');
      expect(result.isManager).toBe(true);
      expect(result.dashboardTabs).toEqual(['my-badges', 'team', 'issuance']);
      expect(result.sidebarGroups).toEqual(['base', 'team', 'issuance']);
      expect(result.permissions).toEqual({
        canViewTeam: true,
        canIssueBadges: true,
        canManageUsers: false,
      });
    });

    it('ADMIN + non-manager → [my-badges, issuance, admin] tabs, [base, issuance, admin] sidebar', () => {
      const user = mockUser(UserRole.ADMIN, false);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('ADMIN');
      expect(result.isManager).toBe(false);
      expect(result.dashboardTabs).toEqual(['my-badges', 'issuance', 'admin']);
      expect(result.sidebarGroups).toEqual(['base', 'issuance', 'admin']);
      expect(result.permissions).toEqual({
        canViewTeam: false,
        canIssueBadges: true,
        canManageUsers: true,
      });
    });

    it('ADMIN + manager → [my-badges, team, issuance, admin] tabs, [base, team, issuance, admin] sidebar', () => {
      const user = mockUser(UserRole.ADMIN, true);
      const result: UserPermissionsDto = controller.getPermissions(user);

      expect(result.role).toBe('ADMIN');
      expect(result.isManager).toBe(true);
      expect(result.dashboardTabs).toEqual([
        'my-badges',
        'team',
        'issuance',
        'admin',
      ]);
      expect(result.sidebarGroups).toEqual([
        'base',
        'team',
        'issuance',
        'admin',
      ]);
      expect(result.permissions).toEqual({
        canViewTeam: true,
        canIssueBadges: true,
        canManageUsers: true,
      });
    });

    // --- AC #7: Response does NOT include PII ---

    it('response does NOT include email, userId, or any PII', () => {
      const user = mockUser(UserRole.EMPLOYEE, false);
      const result = controller.getPermissions(user);

      // Verify the response shape only contains expected keys
      const keys = Object.keys(result);
      expect(keys).toEqual([
        'role',
        'isManager',
        'dashboardTabs',
        'sidebarGroups',
        'permissions',
      ]);

      // Explicitly verify no PII leakage
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('id');
    });

    // --- AC #6: Verify no database calls (pure computation) ---

    it('does not involve any database/PrismaService calls', () => {
      // The controller has NO PrismaService injected.
      // No providers at all are needed — the controller just calls
      // computePermissions() which is a pure function.
      // If PrismaService were required, the TestingModule creation
      // above would fail without providing a mock.
      const user = mockUser(UserRole.ISSUER, true);
      const result = controller.getPermissions(user);
      expect(result).toBeDefined();
      expect(result.role).toBe('ISSUER');
    });
  });
});

// --- Utility function unit tests ---

describe('computePermissions utilities', () => {
  describe('computeDashboardTabs', () => {
    it.each([
      ['EMPLOYEE', false, ['my-badges']],
      ['EMPLOYEE', true, ['my-badges', 'team']],
      ['ISSUER', false, ['my-badges', 'issuance']],
      ['ISSUER', true, ['my-badges', 'team', 'issuance']],
      ['ADMIN', false, ['my-badges', 'issuance', 'admin']],
      ['ADMIN', true, ['my-badges', 'team', 'issuance', 'admin']],
    ] as const)('%s + isManager=%s → %j', (role, isManager, expected) => {
      expect(computeDashboardTabs(role, isManager)).toEqual(expected);
    });
  });

  describe('computeSidebarGroups', () => {
    it.each([
      ['EMPLOYEE', false, ['base']],
      ['EMPLOYEE', true, ['base', 'team']],
      ['ISSUER', false, ['base', 'issuance']],
      ['ISSUER', true, ['base', 'team', 'issuance']],
      ['ADMIN', false, ['base', 'issuance', 'admin']],
      ['ADMIN', true, ['base', 'team', 'issuance', 'admin']],
    ] as const)('%s + isManager=%s → %j', (role, isManager, expected) => {
      expect(computeSidebarGroups(role, isManager)).toEqual(expected);
    });
  });

  describe('computeFlatPermissions', () => {
    it.each([
      [
        'EMPLOYEE',
        false,
        { canViewTeam: false, canIssueBadges: false, canManageUsers: false },
      ],
      [
        'EMPLOYEE',
        true,
        { canViewTeam: true, canIssueBadges: false, canManageUsers: false },
      ],
      [
        'ISSUER',
        false,
        { canViewTeam: false, canIssueBadges: true, canManageUsers: false },
      ],
      [
        'ISSUER',
        true,
        { canViewTeam: true, canIssueBadges: true, canManageUsers: false },
      ],
      [
        'ADMIN',
        false,
        { canViewTeam: false, canIssueBadges: true, canManageUsers: true },
      ],
      [
        'ADMIN',
        true,
        { canViewTeam: true, canIssueBadges: true, canManageUsers: true },
      ],
    ] as const)('%s + isManager=%s → %j', (role, isManager, expected) => {
      expect(computeFlatPermissions(role, isManager)).toEqual(expected);
    });
  });

  describe('computePermissions (integrated)', () => {
    it('returns the full shape with all fields', () => {
      const result = computePermissions('ISSUER', true);
      expect(result).toEqual({
        role: 'ISSUER',
        isManager: true,
        dashboardTabs: ['my-badges', 'team', 'issuance'],
        sidebarGroups: ['base', 'team', 'issuance'],
        permissions: {
          canViewTeam: true,
          canIssueBadges: true,
          canManageUsers: false,
        },
      });
    });
  });
});
