/**
 * RoleBadge Component - Story 8.10
 *
 * Color-coded badge for displaying user roles.
 * WCAG 1.4.3 compliant colors (4.5:1 contrast minimum).
 */

import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/adminUsersApi';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  ISSUER: {
    label: 'Issuer',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  EMPLOYEE: {
    label: 'Employee',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.EMPLOYEE;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export default RoleBadge;
