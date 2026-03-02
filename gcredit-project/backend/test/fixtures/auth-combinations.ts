/**
 * Auth Test Fixtures — Story 15.4 (CROSS-003)
 *
 * Reusable 6-combo fixture factory for role×isManager E2E testing.
 * Used by dashboard-combination.e2e-spec.ts.
 *
 * Strategy:
 * - Combos #1–#5: real login via createAndLoginUser + createIssuer/createEmployee
 * - Combo #6: JwtService.sign() to avoid exceeding login rate limit (5/min)
 *
 * Env: THROTTLE_TTL_SECONDS=1 THROTTLE_LIMIT=1000 (from Story 15.13)
 * relaxes rate limits for test environment.
 */

export interface AuthCombo {
  label: string;
  role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN';
  isManager: boolean;
  expected: {
    employee: number; // /api/dashboard/employee
    manager: number; // /api/dashboard/manager
    issuer: number; // /api/dashboard/issuer
    admin: number; // /api/dashboard/admin
    dashboardTabs: string[];
    sidebarGroups: string[];
    permissions: {
      canViewTeam: boolean;
      canIssueBadges: boolean;
      canManageUsers: boolean;
    };
  };
}

export const AUTH_COMBINATIONS: AuthCombo[] = [
  {
    label: 'EMPLOYEE + isManager=false',
    role: 'EMPLOYEE',
    isManager: false,
    expected: {
      employee: 200,
      manager: 403,
      issuer: 403,
      admin: 403,
      dashboardTabs: ['my-badges'],
      sidebarGroups: ['base'],
      permissions: {
        canViewTeam: false,
        canIssueBadges: false,
        canManageUsers: false,
      },
    },
  },
  {
    label: 'EMPLOYEE + isManager=true',
    role: 'EMPLOYEE',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 403,
      admin: 403,
      dashboardTabs: ['my-badges', 'team'],
      sidebarGroups: ['base', 'team'],
      permissions: {
        canViewTeam: true,
        canIssueBadges: false,
        canManageUsers: false,
      },
    },
  },
  {
    label: 'ISSUER + isManager=false',
    role: 'ISSUER',
    isManager: false,
    expected: {
      employee: 200,
      manager: 403,
      issuer: 200,
      admin: 403,
      dashboardTabs: ['my-badges', 'issuance'],
      sidebarGroups: ['base', 'issuance'],
      permissions: {
        canViewTeam: false,
        canIssueBadges: true,
        canManageUsers: false,
      },
    },
  },
  {
    label: 'ISSUER + isManager=true',
    role: 'ISSUER',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 403,
      dashboardTabs: ['my-badges', 'team', 'issuance'],
      sidebarGroups: ['base', 'team', 'issuance'],
      permissions: {
        canViewTeam: true,
        canIssueBadges: true,
        canManageUsers: false,
      },
    },
  },
  {
    label: 'ADMIN + isManager=false',
    role: 'ADMIN',
    isManager: false,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 200,
      dashboardTabs: ['my-badges', 'issuance', 'admin'],
      sidebarGroups: ['base', 'issuance', 'admin'],
      permissions: {
        canViewTeam: false,
        canIssueBadges: true,
        canManageUsers: true,
      },
    },
  },
  {
    label: 'ADMIN + isManager=true',
    role: 'ADMIN',
    isManager: true,
    expected: {
      employee: 200,
      manager: 200,
      issuer: 200,
      admin: 200,
      dashboardTabs: ['my-badges', 'team', 'issuance', 'admin'],
      sidebarGroups: ['base', 'team', 'issuance', 'admin'],
      permissions: {
        canViewTeam: true,
        canIssueBadges: true,
        canManageUsers: true,
      },
    },
  },
];
