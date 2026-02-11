/**
 * FilterChips Component - Story 8.2 (AC4)
 *
 * Displays active filters as removable chips/tags:
 * - Individual remove button per chip
 * - "Clear all" button when 2+ filters active
 * - Responsive layout (wraps on mobile)
 *
 * WCAG Compliance:
 * - 44×44px minimum touch targets
 * - Focus visible states
 * - Screen reader announcements
 */

import { X } from 'lucide-react';

export interface FilterChip {
  /** Unique identifier for the filter */
  id: string;
  /** Display label for the chip */
  label: string;
  /** Optional category for grouping (e.g., 'skill', 'date', 'issuer') */
  category?: string;
  /** Optional value (for tests/debugging) */
  value?: string;
}

export interface FilterChipsProps {
  /** Array of active filters */
  chips: FilterChip[];
  /** Callback when a filter is removed */
  onRemove: (filterId: string) => void;
  /** Callback when all filters are cleared */
  onClearAll?: () => void;
  /** Whether to show "Clear all" button (default: when 2+ filters) */
  showClearAll?: boolean;
  /** Whether to show filter count */
  showCount?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  showClearAll,
  showCount = false,
  className = '',
}: FilterChipsProps) {
  // Don't render if no chips
  if (chips.length === 0) {
    return null;
  }

  // Show clear all when 2+ chips by default
  const shouldShowClearAll = showClearAll ?? chips.length >= 2;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="list"
      aria-label="Active filters"
    >
      {/* Active filter count badge */}
      {showCount && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {chips.length} filter{chips.length !== 1 ? 's' : ''}
        </span>
      )}

      {/* Filter chips */}
      {chips.map((chip) => (
        <div
          key={chip.id}
          role="listitem"
          className="
            inline-flex items-center gap-1
            h-8 px-3
            bg-blue-100 dark:bg-blue-900/30
            text-blue-800 dark:text-blue-300
            rounded-full
            text-sm font-medium
          "
        >
          {/* Category prefix if provided */}
          {chip.category && (
            <span className="text-blue-600 dark:text-blue-400">{chip.category}:</span>
          )}

          {/* Filter label */}
          <span>{chip.label}</span>

          {/* Remove button - 44×44px touch target with visual 20×20px */}
          <button
            type="button"
            onClick={() => onRemove(chip.id)}
            className="
              flex items-center justify-center
              -mr-1 ml-1
              w-5 h-5
              rounded-full
              text-blue-600 dark:text-blue-400
              hover:bg-blue-200 dark:hover:bg-blue-800
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              transition-colors
            "
            aria-label={`Remove ${chip.category ? `${chip.category}: ` : ''}${chip.label} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Clear all button */}
      {shouldShowClearAll && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="
            h-8 px-3
            text-sm font-medium
            text-gray-600 dark:text-gray-400
            hover:text-gray-800 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-800
            rounded-full
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors
          "
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default FilterChips;
