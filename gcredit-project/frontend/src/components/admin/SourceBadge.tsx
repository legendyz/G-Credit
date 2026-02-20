/**
 * SourceBadge Component - Story 12.3b
 *
 * Displays user source (M365 or Local) as a styled badge.
 * M365: Blue badge with Microsoft icon
 * Local: Gray/neutral badge
 */

import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  source: 'M365' | 'LOCAL';
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const isM365 = source === 'M365';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isM365
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        className
      )}
      data-testid={`source-badge-${source.toLowerCase()}`}
    >
      {isM365 ? (
        <>
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z" />
          </svg>
          M365
        </>
      ) : (
        <>Local</>
      )}
    </span>
  );
}

export default SourceBadge;
