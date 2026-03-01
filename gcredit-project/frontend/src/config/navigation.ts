/**
 * Navigation Configuration — Story 15.3 (TD-035-C)
 *
 * Centralized navigation item definitions for the sidebar.
 * Each item maps to a route, icon, and permission group.
 *
 * Group visibility is computed by `computeSidebarGroups()` from
 * `utils/permissions.ts` (CROSS-001 parity with backend).
 *
 * @see ADR-016 DEC-016-02 (Sidebar navigation groups)
 * @see Story 15.3 Task 5
 */

import {
  LayoutDashboard,
  Wallet,
  Users,
  Award,
  FileStack,
  Upload,
  BarChart3,
  Settings,
  Tag,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { SidebarGroup } from '@/utils/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: SidebarGroup;
}

/**
 * Complete route-to-sidebar mapping. Every user-facing route must appear here.
 *
 * NOTE: `/admin/badges` appears in both Team and Issuance groups — this mirrors
 * the current Navbar behavior where EMPLOYEE+isManager can access badge management.
 *
 * Routes NOT in sidebar (sub-pages accessed via in-page navigation):
 * - /admin/badges/issue
 * - /admin/templates/new, /admin/templates/:id/edit
 * - /admin/bulk-issuance/preview/:sessionId
 */
export const navigationItems: NavItem[] = [
  // Base group (always visible)
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'base' },
  { label: 'Wallet', href: '/wallet', icon: Wallet, group: 'base' },

  // Team group (isManager === true)
  { label: 'Team Overview', href: '/admin/badges', icon: Users, group: 'team' },

  // Issuance group (ISSUER | ADMIN)
  { label: 'Templates', href: '/admin/templates', icon: FileStack, group: 'issuance' },
  { label: 'Badges', href: '/admin/badges', icon: Award, group: 'issuance' },
  { label: 'Bulk Issue', href: '/admin/bulk-issuance', icon: Upload, group: 'issuance' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, group: 'issuance' },

  // Admin group (ADMIN only)
  { label: 'Users', href: '/admin/users', icon: Settings, group: 'admin' },
  { label: 'Categories', href: '/admin/skills/categories', icon: Tag, group: 'admin' },
  { label: 'Skills', href: '/admin/skills', icon: Award, group: 'admin' },
  { label: 'Milestones', href: '/admin/milestones', icon: Target, group: 'admin' },
];

/** Group header labels. Empty string = no header (base group). */
export const groupLabels: Record<SidebarGroup, string> = {
  base: '',
  team: 'Team',
  issuance: 'Issuance',
  admin: 'Admin',
};
