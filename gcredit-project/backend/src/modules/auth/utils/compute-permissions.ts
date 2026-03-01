/**
 * compute-permissions.ts
 *
 * Pure permission computation from JWT claims (role + isManager).
 * No database queries — deterministic mapping per DEC-016-01 / DEC-016-02 matrix.
 *
 * CROSS-001: Must produce identical results to frontend utils/permissions.ts
 *            for the same (role, isManager) inputs.
 *
 * @see ADR-016 DEC-016-01 (Dashboard tab matrix)
 * @see ADR-016 DEC-016-02 (Sidebar navigation groups)
 * @see ADR-015/017 (Dual-dimension identity model)
 */
import { UserRole } from '@prisma/client';

export type DashboardTab = 'my-badges' | 'team' | 'issuance' | 'admin';

export type SidebarGroup = 'base' | 'team' | 'issuance' | 'admin';

export interface FlatPermissions {
  canViewTeam: boolean;
  canIssueBadges: boolean;
  canManageUsers: boolean;
}

export interface ComputedPermissions {
  role: UserRole;
  isManager: boolean;
  dashboardTabs: DashboardTab[];
  sidebarGroups: SidebarGroup[];
  permissions: FlatPermissions;
}

/**
 * Compute the dashboard tabs visible to the user.
 *
 * Matrix (DEC-016-01):
 * | Role     | isManager | Tabs                                    |
 * |----------|-----------|---------------------------------------|
 * | EMPLOYEE | false     | [my-badges]                            |
 * | EMPLOYEE | true      | [my-badges, team]                      |
 * | ISSUER   | false     | [my-badges, issuance]                  |
 * | ISSUER   | true      | [my-badges, team, issuance]            |
 * | ADMIN    | false     | [my-badges, issuance, admin]           |
 * | ADMIN    | true      | [my-badges, team, issuance, admin]     |
 */
export function computeDashboardTabs(
  role: UserRole,
  isManager: boolean,
): DashboardTab[] {
  const tabs: DashboardTab[] = ['my-badges'];

  if (isManager) {
    tabs.push('team');
  }

  if (role === 'ISSUER' || role === 'ADMIN') {
    tabs.push('issuance');
  }

  if (role === 'ADMIN') {
    tabs.push('admin');
  }

  return tabs;
}

/**
 * Compute the sidebar navigation groups visible to the user.
 *
 * Matrix (DEC-016-02):
 * | Role     | isManager | Groups                                  |
 * |----------|-----------|---------------------------------------|
 * | EMPLOYEE | false     | [base]                                 |
 * | EMPLOYEE | true      | [base, team]                           |
 * | ISSUER   | false     | [base, issuance]                       |
 * | ISSUER   | true      | [base, team, issuance]                 |
 * | ADMIN    | false     | [base, issuance, admin]                |
 * | ADMIN    | true      | [base, team, issuance, admin]          |
 */
export function computeSidebarGroups(
  role: UserRole,
  isManager: boolean,
): SidebarGroup[] {
  const groups: SidebarGroup[] = ['base'];

  if (isManager) {
    groups.push('team');
  }

  if (role === 'ISSUER' || role === 'ADMIN') {
    groups.push('issuance');
  }

  if (role === 'ADMIN') {
    groups.push('admin');
  }

  return groups;
}

/**
 * Compute flat permission booleans for convenience.
 */
export function computeFlatPermissions(
  role: UserRole,
  isManager: boolean,
): FlatPermissions {
  return {
    canViewTeam: isManager,
    canIssueBadges: role === 'ISSUER' || role === 'ADMIN',
    canManageUsers: role === 'ADMIN',
  };
}

/**
 * Compute all permissions for a given role and isManager flag.
 * Returns the full UserPermissionsDto-compatible shape.
 */
export function computePermissions(
  role: UserRole,
  isManager: boolean,
): ComputedPermissions {
  return {
    role,
    isManager,
    dashboardTabs: computeDashboardTabs(role, isManager),
    sidebarGroups: computeSidebarGroups(role, isManager),
    permissions: computeFlatPermissions(role, isManager),
  };
}
