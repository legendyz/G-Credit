/**
 * useBadgeSearch Hook - Story 8.2
 *
 * Unified hook for badge searching with:
 * - Automatic client/server search switching
 * - Debounced search input
 * - Filter state management
 * - Loading states
 *
 * Strategy:
 * - <50 badges: client-side filtering (instant)
 * - ≥50 badges: server-side search (API call)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import {
  filterBadges,
  shouldUseServerSearch,
  hasActiveFilters,
  countActiveFilters,
  filtersToChips,
  type BadgeSearchFilters,
  type BadgeForFilter,
} from '@/utils/searchFilters';
import type { FilterChip } from '@/components/search/FilterChips';
import type { DateRange } from '@/components/search/DateRangePicker';

export interface UseBadgeSearchOptions {
  /** All badges (for client-side filtering) */
  allBadges: BadgeForFilter[];
  /** Total badge count (for determining search strategy) */
  totalCount?: number;
  /** Threshold for switching to server search (default: 50) */
  serverSearchThreshold?: number;
  /** Debounce delay for search input (default: 500ms) */
  debounceDelay?: number;
  /** Callback for server-side search */
  onServerSearch?: (filters: BadgeSearchFilters) => Promise<void>;
  /** Skill names map for chip display */
  skillNames?: Record<string, string>;
  /** Issuer names map for chip display */
  issuerNames?: Record<string, string>;
}

export interface UseBadgeSearchReturn {
  /** Current search term (raw input) */
  searchTerm: string;
  /** Set search term */
  setSearchTerm: (term: string) => void;
  /** Debounced search term */
  debouncedSearchTerm: string;
  /** Selected skill IDs */
  selectedSkills: string[];
  /** Set selected skills */
  setSelectedSkills: (skills: string[]) => void;
  /** Date range filter */
  dateRange: DateRange;
  /** Set date range */
  setDateRange: (range: DateRange) => void;
  /** Status filter */
  statusFilter: string;
  /** Set status filter */
  setStatusFilter: (status: string) => void;
  /** Issuer filter (Admin only) */
  issuerFilter: string | undefined;
  /** Set issuer filter */
  setIssuerFilter: (issuerId: string | undefined) => void;
  /** Current active filters object */
  activeFilters: BadgeSearchFilters;
  /** Filtered badges (client-side result) */
  filteredBadges: BadgeForFilter[];
  /** Whether any filters are active */
  hasFilters: boolean;
  /** Number of active filters */
  filterCount: number;
  /** Active filters as chips for UI */
  filterChips: FilterChip[];
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Remove a specific filter by chip ID */
  removeFilter: (chipId: string) => void;
  /** Whether using server-side search */
  isServerSearch: boolean;
  /** Whether a search is in progress */
  isSearching: boolean;
}

export function useBadgeSearch({
  allBadges,
  totalCount,
  serverSearchThreshold = 50,
  debounceDelay = 500,
  onServerSearch,
  skillNames = {},
  issuerNames = {},
}: UseBadgeSearchOptions): UseBadgeSearchReturn {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [issuerFilter, setIssuerFilter] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  
  // Track if initial mount to skip first server search trigger
  const isInitialMount = useRef(true);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Determine search strategy
  const effectiveTotalCount = totalCount ?? allBadges.length;
  const isServerSearch = shouldUseServerSearch(effectiveTotalCount, serverSearchThreshold);

  // Build active filters object
  const activeFilters: BadgeSearchFilters = useMemo(
    () => ({
      search: debouncedSearchTerm,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      fromDate: dateRange.from,
      toDate: dateRange.to,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      issuerId: issuerFilter,
    }),
    [debouncedSearchTerm, selectedSkills, dateRange, statusFilter, issuerFilter]
  );

  // Story 8.2 AC5: Trigger server search when filters change (for large datasets)
  useEffect(() => {
    // Skip initial mount - we don't want to trigger search on first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only trigger server search if we're in server search mode and have a callback
    if (isServerSearch && onServerSearch && hasActiveFilters(activeFilters)) {
      setIsSearching(true);
      onServerSearch(activeFilters)
        .finally(() => setIsSearching(false));
    }
  }, [activeFilters, isServerSearch, onServerSearch]);

  // Client-side filtered badges
  const filteredBadges = useMemo(() => {
    if (isServerSearch) {
      // Server search - return allBadges as-is (server already filtered)
      return allBadges;
    }
    // Client-side filtering
    return filterBadges(allBadges, activeFilters);
  }, [allBadges, activeFilters, isServerSearch]);

  // Filter status helpers
  const hasFilters = hasActiveFilters(activeFilters);
  const filterCount = countActiveFilters(activeFilters);

  // Convert filters to chips
  const filterChips = useMemo(
    () => filtersToChips(activeFilters, { skillNames, issuerNames }),
    [activeFilters, skillNames, issuerNames]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSkills([]);
    setDateRange({ from: null, to: null });
    setStatusFilter('all');
    setIssuerFilter(undefined);
  }, []);

  // Remove specific filter by chip ID
  const removeFilter = useCallback((chipId: string) => {
    switch (chipId) {
      case 'search':
        setSearchTerm('');
        break;
      case 'skills':
        setSelectedSkills([]);
        break;
      case 'dateRange':
      case 'fromDate':
      case 'toDate':
        setDateRange({ from: null, to: null });
        break;
      case 'status':
        setStatusFilter('all');
        break;
      case 'issuer':
        setIssuerFilter(undefined);
        break;
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    selectedSkills,
    setSelectedSkills,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    issuerFilter,
    setIssuerFilter,
    activeFilters,
    filteredBadges,
    hasFilters,
    filterCount,
    filterChips,
    clearAllFilters,
    removeFilter,
    isServerSearch,
    isSearching,
  };
}

export default useBadgeSearch;
