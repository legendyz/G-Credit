/**
 * BadgeSearchBar Component - Story 8.2
 *
 * Unified search bar for badge filtering with:
 * - Debounced search input
 * - Skills multi-select filter
 * - Date range picker
 * - Status filter
 * - Issuer filter (Admin only - AC2)
 * - Active filter chips
 * - Mobile focus UX (hide chips when focused)
 *
 * Used in Employee Wallet (AC1) and Badge Management (AC2)
 */

import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { FilterChips } from './FilterChips';
import { DateRangePicker } from './DateRangePicker';
import { SkillsFilter } from './SkillsFilter';
import type { FilterChip } from './FilterChips';
import type { DateRange } from './DateRangePicker';
import type { Skill } from './SkillsFilter';

export interface Issuer {
  id: string;
  name: string;
}

export interface BadgeSearchBarProps {
  /** Search term value */
  searchTerm: string;
  /** Search term change handler */
  onSearchChange: (term: string) => void;
  /** Clear search handler */
  onSearchClear?: () => void;
  /** Whether search is loading */
  isSearchLoading?: boolean;
  /** Available skills for filter */
  skills?: Skill[];
  /** Selected skill IDs */
  selectedSkills: string[];
  /** Skills change handler */
  onSkillsChange: (skills: string[]) => void;
  /** Date range value */
  dateRange: DateRange;
  /** Date range change handler */
  onDateRangeChange: (range: DateRange) => void;
  /** Status filter value */
  statusFilter: string;
  /** Status options */
  statusOptions?: Array<{ value: string; label: string }>;
  /** Status change handler */
  onStatusChange: (status: string) => void;
  /** Story 8.2 AC2: Available issuers for filter (Admin only) */
  issuers?: Issuer[];
  /** Selected issuer ID */
  selectedIssuer?: string;
  /** Issuer change handler */
  onIssuerChange?: (issuerId: string | undefined) => void;
  /** Active filter chips */
  filterChips: FilterChip[];
  /** Remove filter handler */
  onRemoveFilter: (chipId: string) => void;
  /** Clear all filters handler */
  onClearAllFilters: () => void;
  /** Whether to show as sticky header */
  sticky?: boolean;
  /** Placeholder for search input */
  placeholder?: string;
  /** Additional class names */
  className?: string;
}

const defaultStatusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'CLAIMED', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVOKED', label: 'Revoked' },
];

export function BadgeSearchBar({
  searchTerm,
  onSearchChange,
  onSearchClear,
  isSearchLoading,
  skills = [],
  selectedSkills,
  onSkillsChange,
  dateRange,
  onDateRangeChange,
  statusFilter,
  statusOptions = defaultStatusOptions,
  onStatusChange,
  issuers = [],
  selectedIssuer,
  onIssuerChange,
  filterChips,
  onRemoveFilter,
  onClearAllFilters,
  sticky = false,
  placeholder = 'Search badges...',
  className = '',
}: BadgeSearchBarProps) {
  // Story 8.2 AC1: Track search focus state for mobile UX
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const containerClasses = sticky
    ? 'sticky top-0 z-10 bg-white shadow-sm pb-3 pt-2 -mx-4 px-4 md:-mx-6 md:px-6'
    : '';

  return (
    <div
      className={`space-y-3 ${containerClasses} ${className}`}
      data-testid="badge-search-bar"
    >
      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input - Story 8.2 AC1: Mobile focus behavior */}
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onSearchClear}
            placeholder={placeholder}
            isLoading={isSearchLoading}
            minSearchLength={2}
            debounceMs={500}
            ariaLabel="Search badges by name or description"
            onFocusChange={setIsSearchFocused}
            expandOnMobileFocus
          />
        </div>

        {/* Filters - responsive layout, hidden on mobile when search focused */}
        <div className={`flex flex-wrap gap-2 sm:flex-nowrap ${isSearchFocused ? 'hidden sm:flex' : ''}`}>
          {/* Skills Filter */}
          {skills.length > 0 && (
            <div className="w-full sm:w-40 md:w-48">
              <SkillsFilter
                skills={skills}
                selectedSkills={selectedSkills}
                onChange={onSkillsChange}
                placeholder="Skills"
                searchable
                groupByCategory
              />
            </div>
          )}

          {/* Date Range Picker */}
          <div className="w-full sm:w-auto">
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              compact
              disableFutureDates
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-32">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg text-sm
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         cursor-pointer"
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Story 8.2 AC2: Issuer Filter (Admin only) */}
          {issuers.length > 0 && onIssuerChange && (
            <div className="w-full sm:w-40">
              <select
                value={selectedIssuer || ''}
                onChange={(e) => onIssuerChange(e.target.value || undefined)}
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg text-sm
                           bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           cursor-pointer"
                aria-label="Filter by issuer"
              >
                <option value="">All Issuers</option>
                {issuers.map((issuer) => (
                  <option key={issuer.id} value={issuer.id}>
                    {issuer.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips - Story 8.2 AC1: Hidden on mobile when search focused */}
      {filterChips.length > 0 && (
        <div className={isSearchFocused ? 'hidden sm:block' : ''}>
          <FilterChips
            chips={filterChips}
            onRemove={onRemoveFilter}
            onClearAll={onClearAllFilters}
          />
        </div>
      )}
    </div>
  );
}

export default BadgeSearchBar;
