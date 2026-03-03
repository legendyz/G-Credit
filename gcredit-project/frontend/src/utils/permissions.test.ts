/**
 * permissions.test.ts — CROSS-001 Parity Test
 *
 * Verifies that frontend permission computation matches the DEC-016-01 / DEC-016-02
 * matrix exactly. Backend has an identical matrix in compute-permissions.ts.
 *
 * If this test fails, the backend permissions.controller.spec.ts will also need updating
 * (and vice versa) to maintain CROSS-001 parity.
 *
 * @see Story 15.2 CROSS-001
 * @see backend/src/modules/auth/utils/compute-permissions.ts
 */
import { describe, it, expect } from 'vitest';
import {
  computeDashboardTabs,
  computeSidebarGroups,
  computeFlatPermissions,
  computePermissions,
} from './permissions';
import type { UserRole } from './permissions';

/**
 * CROSS-001 canonical matrix — the single source of truth.
 * Must match both backend and frontend implementations.
 */
const PERMISSION_MATRIX: Array<{
  role: UserRole;
  isManager: boolean;
  dashboardTabs: string[];
  sidebarGroups: string[];
  permissions: { canViewTeam: boolean; canIssueBadges: boolean; canManageUsers: boolean };
}> = [
  {
    role: 'EMPLOYEE',
    isManager: false,
    dashboardTabs: ['my-badges'],
    sidebarGroups: ['base'],
    permissions: { canViewTeam: false, canIssueBadges: false, canManageUsers: false },
  },
  {
    role: 'EMPLOYEE',
    isManager: true,
    dashboardTabs: ['my-badges', 'team'],
    sidebarGroups: ['base', 'team'],
    permissions: { canViewTeam: true, canIssueBadges: false, canManageUsers: false },
  },
  {
    role: 'ISSUER',
    isManager: false,
    dashboardTabs: ['my-badges', 'issuance'],
    sidebarGroups: ['base', 'issuance'],
    permissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: false },
  },
  {
    role: 'ISSUER',
    isManager: true,
    dashboardTabs: ['my-badges', 'team', 'issuance'],
    sidebarGroups: ['base', 'team', 'issuance'],
    permissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: false },
  },
  {
    role: 'ADMIN',
    isManager: false,
    dashboardTabs: ['my-badges', 'issuance', 'admin'],
    sidebarGroups: ['base', 'issuance', 'admin'],
    permissions: { canViewTeam: false, canIssueBadges: true, canManageUsers: true },
  },
  {
    role: 'ADMIN',
    isManager: true,
    dashboardTabs: ['my-badges', 'team', 'issuance', 'admin'],
    sidebarGroups: ['base', 'team', 'issuance', 'admin'],
    permissions: { canViewTeam: true, canIssueBadges: true, canManageUsers: true },
  },
];

describe('permissions.ts — CROSS-001 parity', () => {
  describe('computeDashboardTabs', () => {
    it.each(PERMISSION_MATRIX)(
      '$role + isManager=$isManager → $dashboardTabs',
      ({ role, isManager, dashboardTabs }) => {
        expect(computeDashboardTabs(role, isManager)).toEqual(dashboardTabs);
      }
    );
  });

  describe('computeSidebarGroups', () => {
    it.each(PERMISSION_MATRIX)(
      '$role + isManager=$isManager → $sidebarGroups',
      ({ role, isManager, sidebarGroups }) => {
        expect(computeSidebarGroups(role, isManager)).toEqual(sidebarGroups);
      }
    );
  });

  describe('computeFlatPermissions', () => {
    it.each(PERMISSION_MATRIX)(
      '$role + isManager=$isManager → $permissions',
      ({ role, isManager, permissions }) => {
        expect(computeFlatPermissions(role, isManager)).toEqual(permissions);
      }
    );
  });

  describe('computePermissions (integrated)', () => {
    it.each(PERMISSION_MATRIX)('$role + isManager=$isManager → full shape', (expected) => {
      const result = computePermissions(expected.role, expected.isManager);
      expect(result).toEqual(expected);
    });
  });
});
