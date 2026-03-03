/**
 * Auth Test Fixtures — Story 15.4 (CROSS-003)
 *
 * Reusable auth combination fixtures for frontend unit tests.
 * Used by DashboardPage.test.tsx and permissions.test.ts (already have inline versions).
 *
 * This centralizes the 6-combo definition so future tests don't duplicate it.
 */
import type { UserRole, DashboardTab, SidebarGroup, FlatPermissions } from '@/utils/permissions';

export interface AuthCombination {
  role: UserRole;
  isManager: boolean;
  expectedTabs: DashboardTab[];
  expectedGroups: SidebarGroup[];
  expectedPermissions: FlatPermissions;
}

export const AUTH_COMBINATIONS: AuthCombination[] = [
  {
    role: 'EMPLOYEE',
    isManager: false,
    expectedTabs: ['my-badges'],
    expectedGroups: ['base'],
    expectedPermissions: {
      canViewTeam: false,
      canIssueBadges: false,
      canManageUsers: false,
    },
  },
  {
    role: 'EMPLOYEE',
    isManager: true,
    expectedTabs: ['my-badges', 'team'],
    expectedGroups: ['base', 'team'],
    expectedPermissions: {
      canViewTeam: true,
      canIssueBadges: false,
      canManageUsers: false,
    },
  },
  {
    role: 'ISSUER',
    isManager: false,
    expectedTabs: ['my-badges', 'issuance'],
    expectedGroups: ['base', 'issuance'],
    expectedPermissions: {
      canViewTeam: false,
      canIssueBadges: true,
      canManageUsers: false,
    },
  },
  {
    role: 'ISSUER',
    isManager: true,
    expectedTabs: ['my-badges', 'team', 'issuance'],
    expectedGroups: ['base', 'team', 'issuance'],
    expectedPermissions: {
      canViewTeam: true,
      canIssueBadges: true,
      canManageUsers: false,
    },
  },
  {
    role: 'ADMIN',
    isManager: false,
    expectedTabs: ['my-badges', 'issuance', 'admin'],
    expectedGroups: ['base', 'issuance', 'admin'],
    expectedPermissions: {
      canViewTeam: false,
      canIssueBadges: true,
      canManageUsers: true,
    },
  },
  {
    role: 'ADMIN',
    isManager: true,
    expectedTabs: ['my-badges', 'team', 'issuance', 'admin'],
    expectedGroups: ['base', 'team', 'issuance', 'admin'],
    expectedPermissions: {
      canViewTeam: true,
      canIssueBadges: true,
      canManageUsers: true,
    },
  },
];
