/**
 * StatusBadge Component - Story 8.10
 *
 * Badge for displaying user active/inactive status.
 */

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        className
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default StatusBadge;
