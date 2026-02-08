/**
 * DateRangePicker Component - Story 8.2 (AC4)
 *
 * Date range picker with From/To inputs:
 * - Validation (from <= to)
 * - Clear button
 * - Responsive layout
 *
 * WCAG Compliance:
 * - Proper labels
 * - Error states
 * - Keyboard accessible
 */

import { useCallback, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface DatePreset {
  label: string;
  from: string;
  to: string;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange) => void;
  /** Label for the component */
  label?: string;
  /** Custom from date label */
  fromLabel?: string;
  /** Custom to date label */
  toLabel?: string;
  /** Whether to show inline or stacked */
  layout?: 'inline' | 'stacked';
  /** Whether to use compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Minimum selectable date (ISO string) */
  minDate?: string;
  /** Maximum selectable date (ISO string) */
  maxDate?: string;
  /** Disable future dates */
  disableFutureDates?: boolean;
  /** Date presets */
  presets?: DatePreset[];
}

export function DateRangePicker({
  value,
  onChange,
  label = 'Date range',
  fromLabel = 'From',
  toLabel = 'To',
  layout = 'inline',
  compact = false,
  className = '',
  disabled = false,
  minDate,
  maxDate,
  disableFutureDates = false,
  presets,
}: DateRangePickerProps) {
  // Derive validation error from current values (no useEffect needed)
  const error = useMemo(() => {
    if (value.from && value.to) {
      const fromDate = new Date(value.from);
      const toDate = new Date(value.to);
      if (fromDate > toDate) return 'From date cannot be after to date';
    }
    return null;
  }, [value.from, value.to]);

  // Calculate effective max date
  const effectiveMaxDate = useMemo(() => {
    if (disableFutureDates) {
      const today = new Date().toISOString().split('T')[0];
      return maxDate && maxDate < today ? maxDate : today;
    }
    return maxDate;
  }, [disableFutureDates, maxDate]);

  // Handle from date change
  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, from: e.target.value || null });
    },
    [value, onChange]
  );

  // Handle to date change
  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, to: e.target.value || null });
    },
    [value, onChange]
  );

  // Clear both dates
  const handleClear = useCallback(() => {
    onChange({ from: null, to: null });
  }, [onChange]);

  const hasValue = value.from || value.to;
  const layoutClasses = compact
    ? 'flex flex-col sm:flex-row items-center gap-2'
    : layout === 'inline'
      ? 'flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3'
      : 'flex flex-col gap-2';

  return (
    <div className={className}>
      {/* Label */}
      {label && !compact && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Presets */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ from: preset.from, to: preset.to })}
              disabled={disabled}
              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 
                         hover:bg-blue-50 rounded transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className={layoutClasses}>
        {/* From Date */}
        <div className={compact ? 'flex-1' : 'flex-1 min-w-0'}>
          {!compact && (
            <label
              htmlFor="date-from"
              className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
            >
              {fromLabel}
            </label>
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="date-from"
              value={value.from || ''}
              onChange={handleFromChange}
              disabled={disabled}
              min={minDate}
              max={value.to || effectiveMaxDate}
              aria-label={fromLabel}
              className={`
                w-full ${compact ? 'h-10' : 'h-11'} pl-10 pr-3
                border rounded-lg
                text-sm text-gray-900 dark:text-white
                bg-white dark:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              `}
              aria-invalid={!!error}
              aria-describedby={error ? 'date-range-error' : undefined}
            />
          </div>
        </div>

        {/* Separator */}
        {layout === 'inline' && !compact && (
          <span className="hidden sm:block text-gray-400 pb-2">to</span>
        )}
        {compact && <span className="text-gray-400 text-sm">-</span>}

        {/* To Date */}
        <div className={compact ? 'flex-1' : 'flex-1 min-w-0'}>
          {!compact && (
            <label
              htmlFor="date-to"
              className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
            >
              {toLabel}
            </label>
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="date-to"
              value={value.to || ''}
              onChange={handleToChange}
              disabled={disabled}
              min={value.from || minDate}
              max={effectiveMaxDate}
              aria-label={toLabel}
              className={`
                w-full ${compact ? 'h-10' : 'h-11'} pl-10 pr-3
                border rounded-lg
                text-sm text-gray-900 dark:text-white
                bg-white dark:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              `}
              aria-invalid={!!error}
              aria-describedby={error ? 'date-range-error' : undefined}
            />
          </div>
        </div>

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="
              flex items-center justify-center
              h-11 px-3
              text-sm text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-colors
            "
            aria-label="Clear date range"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id="date-range-error" className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default DateRangePicker;
