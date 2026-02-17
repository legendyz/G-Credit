/**
 * SearchInput Component - Story 8.2 (AC4)
 *
 * Reusable search input with:
 * - Debounced input (500ms delay, configurable)
 * - Minimum 2 character trigger
 * - Clear button (X icon, 44×44px touch target)
 * - Magnifying glass icon
 * - Mobile-optimized (type="search", sticky support)
 *
 * WCAG Compliance:
 * - 44×44px touch targets
 * - aria-label for accessibility
 * - Focus visible states
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchInputProps {
  /** Current value (controlled mode) */
  value?: string;
  /** Callback when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Callback when clear button clicked */
  onClear?: () => void;
  /** Callback on Enter key press */
  onSearch?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Minimum characters to trigger search (default: 2) */
  minSearchLength?: number;
  /** Label above input */
  label?: string;
  /** Whether to show as sticky on mobile */
  sticky?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** aria-label for accessibility */
  ariaLabel?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Whether search is in progress */
  isLoading?: boolean;
  /** Story 8.2 AC1: Callback when focus state changes (for mobile UX) */
  onFocusChange?: (isFocused: boolean) => void;
  /** Story 8.2 AC1: Expand to full width on mobile focus */
  expandOnMobileFocus?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onClear,
  placeholder = 'Search by name, issuer, or skill...',
  debounceMs = 500,
  minSearchLength = 2,
  label,
  sticky = false,
  className = '',
  ariaLabel = 'Search',
  disabled = false,
  isLoading = false,
  onFocusChange,
  expandOnMobileFocus = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Story 8.2 AC1: Notify parent of focus state changes
  const handleFocusChange = useCallback(
    (focused: boolean) => {
      setIsFocused(focused);
      onFocusChange?.(focused);
    },
    [onFocusChange]
  );

  // Always use internalValue for display to ensure immediate keystroke feedback.
  // In controlled mode, debounce triggers onChange to parent; display stays responsive.
  const value = internalValue;
  const debouncedValue = useDebounce(value, debounceMs);

  // Sync internal value with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    // Only call onChange if value meets minimum character requirement or is empty (to clear)
    if (debouncedValue.length >= minSearchLength || debouncedValue.length === 0) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, minSearchLength, onChange]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    // In both modes, let debounce handle the onChange callback.
    // Don't call onChange immediately to avoid double-fire in controlled mode.
  }, []);

  // Handle clear button click
  const handleClear = useCallback(() => {
    setInternalValue('');
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  }, [onClear, onChange]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
        inputRef.current?.blur();
      }
    },
    [handleClear]
  );

  const stickyClasses = sticky ? 'sticky top-0 z-10 bg-white dark:bg-gray-900 py-2' : '';

  // Story 8.2 AC1: Expand to full width on mobile when focused
  // Only apply absolute positioning on mobile (< sm breakpoint) to avoid
  // breaking desktop layout where the input is already full-width inside a Card.
  const mobileExpandClasses =
    expandOnMobileFocus && isFocused
      ? 'max-sm:absolute max-sm:left-0 max-sm:right-0 max-sm:mx-4 max-sm:z-20'
      : '';

  const focusClasses = isFocused
    ? 'ring-2 ring-blue-500 border-transparent'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div
      className={`${stickyClasses} ${mobileExpandClasses} ${className} transition-all duration-200`}
      data-testid="search-container"
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={`
          relative flex items-center min-h-[44px] h-12 
          bg-white dark:bg-gray-800 
          border rounded-lg 
          transition-all duration-200
          ${focusClasses}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Search Icon - 44×44px touch target (visually smaller) */}
        <div className="flex items-center justify-center w-11 h-11 flex-shrink-0">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onFocus={() => handleFocusChange(true)}
          onBlur={() => handleFocusChange(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          className="
            flex-1 h-full bg-transparent
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none
            text-base
            pr-2
          "
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Clear Button or Loading Spinner - 44×44px touch target */}
        {isLoading ? (
          <div
            className="flex items-center justify-center w-11 h-11 flex-shrink-0"
            data-testid="search-loading"
          >
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        ) : value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="
              flex items-center justify-center 
              w-11 h-11 flex-shrink-0
              text-gray-400 hover:text-gray-600 
              dark:hover:text-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
              rounded-r-lg
              transition-colors
            "
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Helper text for minimum characters */}
      {value.length > 0 && value.length < minSearchLength && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter at least {minSearchLength} characters to search
        </p>
      )}
    </div>
  );
}

export default SearchInput;
