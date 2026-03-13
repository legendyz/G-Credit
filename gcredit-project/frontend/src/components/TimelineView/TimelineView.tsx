import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useInfiniteWallet } from '../../hooks/useInfiniteWallet';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useSkills } from '../../hooks/useSkills';
import { TimelineLine } from './TimelineLine';
import { BadgeTimelineCard } from './BadgeTimelineCard';
// Story 12.4: MilestoneTimelineCard wired for rendering milestone achievements in timeline
import { MilestoneTimelineCard } from './MilestoneTimelineCard';
import { DateGroupHeader } from './DateGroupHeader';
import { DateNavigationSidebar } from './DateNavigationSidebar';
import { ViewToggle } from './ViewToggle';
import EmptyState, { detectEmptyStateScenario } from '../BadgeWallet/EmptyState';
import BadgeDetailModal from '../BadgeDetailModal/BadgeDetailModal';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import { BadgeSearchBar } from '../search/BadgeSearchBar';
import { StatusBadge } from '../ui/StatusBadge';
import { PageTemplate } from '../layout/PageTemplate';
import type { FilterChip } from '../search/FilterChips';
import type { DateRange } from '../search/DateRangePicker';
import type { Badge, Milestone } from '../../hooks/useWallet';

export type ViewMode = 'timeline' | 'grid';

/**
 * Type guard: distinguish Badge from Milestone in wallet items.
 *
 * Story 12.4: MilestoneTimelineCard is now wired in for rendering.
 * Milestones are still excluded from search/filter (they lack template data),
 * but they render inline in the timeline when present in wallet data.
 */
function isBadge(item: { type?: string }): item is Badge {
  return !('type' in item) || item.type !== 'milestone';
}

export function TimelineView() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDateGroup, setSelectedDateGroup] = useState<string | null>(null);

  // Story 15.8: Local filter state (replaces useBadgeSearch client-side filtering)
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Story 15.8: Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Story 15.8: Cursor-based infinite scroll via useInfiniteWallet
  const {
    data: infiniteData,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteWallet({
    limit: 20,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    fromDate: dateRange.from || undefined,
    toDate: dateRange.to || undefined,
  });

  // Story 15.8: IntersectionObserver sentinel for auto-loading
  // Scroll container ref for container-level scrolling (badges only)
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    setScrollContainer(node);
  }, []);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    root: scrollContainer,
  });

  // Fetch available skills for filter dropdown
  const { data: skills = [] } = useSkills();

  // Create skill names map for chip display
  const skillNames = useMemo(() => {
    return skills.reduce(
      (acc, skill) => {
        acc[skill.id] = skill.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [skills]);

  // Story 15.8: Flatten all pages into a single array
  const allItems = useMemo(() => {
    return infiniteData?.pages.flatMap((page) => page.data) ?? [];
  }, [infiniteData]);

  // Total from first page
  const total = infiniteData?.pages[0]?.total ?? 0;

  // Separate badges from milestones
  const displayBadges: Badge[] = useMemo(() => {
    return allItems.filter(isBadge);
  }, [allItems]);

  // Story 15.8: Generate filter chips directly (no useBadgeSearch)
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (debouncedSearch) chips.push({ id: 'search', label: `"${debouncedSearch}"` });
    if (statusFilter) chips.push({ id: 'status', label: statusFilter });
    selectedSkills.forEach((id) => {
      chips.push({ id: `skill-${id}`, label: skillNames[id] || id, category: 'skill' });
    });
    if (dateRange.from) chips.push({ id: 'dateFrom', label: `From ${dateRange.from}` });
    if (dateRange.to) chips.push({ id: 'dateTo', label: `To ${dateRange.to}` });
    return chips;
  }, [debouncedSearch, statusFilter, selectedSkills, dateRange, skillNames]);

  const hasFilters = filterChips.length > 0;

  // Story 15.8: Remove individual filter chip
  const removeFilter = useCallback((chipId: string) => {
    if (chipId === 'search') setLocalSearch('');
    else if (chipId === 'status') setStatusFilter('');
    else if (chipId === 'dateFrom') setDateRange((prev) => ({ ...prev, from: null }));
    else if (chipId === 'dateTo') setDateRange((prev) => ({ ...prev, to: null }));
    else if (chipId.startsWith('skill-')) {
      const skillId = chipId.replace('skill-', '');
      setSelectedSkills((prev) => prev.filter((s) => s !== skillId));
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setLocalSearch('');
    setStatusFilter('');
    setSelectedSkills([]);
    setDateRange({ from: null, to: null });
  }, []);

  // Story 9.3 AC4: Persist status filter to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('badgeWalletFilter', statusFilter || 'all');
  }, [statusFilter]);

  // Restore status filter from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('badgeWalletFilter');
    if (saved && saved !== 'all') {
      setStatusFilter(saved);
    }
  }, []);

  // Grid view: further filter by selected date group
  const gridDisplayBadges: Badge[] = useMemo(() => {
    if (!selectedDateGroup) return displayBadges;
    return displayBadges.filter((badge) => {
      const date = new Date(badge.issuedAt);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      return label === selectedDateGroup;
    });
  }, [displayBadges, selectedDateGroup]);

  // Handle date group click: scroll in timeline mode, filter in grid mode
  const handleDateGroupClick = useCallback(
    (label: string) => {
      if (viewMode === 'grid') {
        setSelectedDateGroup((prev) => (prev === label ? null : label));
      } else {
        const element = document.getElementById(`group-${label}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [viewMode]
  );

  // Clear date group selection when switching view modes
  useEffect(() => {
    setSelectedDateGroup(null);
  }, [viewMode]);

  // Story 12.4: Extract milestone items from wallet data for timeline rendering
  const milestoneItems: Milestone[] = useMemo(() => {
    if (!allItems.length) return [];
    return allItems.filter(
      (item): item is Milestone => 'type' in item && item.type === 'milestone'
    );
  }, [allItems]);

  // Group badges by date for timeline display
  const dateGroups = useMemo(() => {
    if (!displayBadges.length) return [];

    const groups: Array<{ label: string; count: number; startIndex: number }> = [];
    let currentLabel = '';

    displayBadges.forEach((badge, index) => {
      const date = new Date(badge.issuedAt);
      const label = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });

      if (label !== currentLabel) {
        groups.push({ label, count: 1, startIndex: index });
        currentLabel = label;
      } else if (groups.length > 0) {
        groups[groups.length - 1].count++;
      }
    });

    return groups;
  }, [displayBadges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading your badges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-light border border-red-200 rounded-lg p-4">
        <p className="text-error">Failed to load badges. Please try again.</p>
      </div>
    );
  }

  if (!isLoading && !error && allItems.length === 0 && !hasFilters) {
    // AC 6.14: Detect which empty state scenario to display
    const totalBadges = total;
    const badges = allItems.filter(isBadge);
    const claimedBadges = badges.filter((b) => b.status === 'CLAIMED').length;
    const pendingBadges = badges.filter((b) => b.status === 'PENDING').length;
    const revokedBadges = badges.filter((b) => b.status === 'REVOKED').length;

    const emptyScenario = detectEmptyStateScenario(
      totalBadges,
      claimedBadges,
      pendingBadges,
      revokedBadges,
      false
    );

    if (emptyScenario) {
      return (
        <EmptyState
          scenario={emptyScenario}
          pendingCount={pendingBadges}
          currentFilter={hasFilters ? 'Active filters' : null}
          onExploreCatalog={() => {
            window.location.href = '/wallet';
          }}
          onLearnMore={() => {
            window.location.href = '/wallet';
          }}
          onViewPending={() => {
            setStatusFilter('PENDING');
          }}
          onClearFilters={clearAllFilters}
        />
      );
    }

    // Fallback if no scenario matches
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg">No badges found</p>
        <p className="text-neutral-400 mt-2">Start earning badges to see them here!</p>
      </div>
    );
  }

  // Story 8.2: Empty state when filters return no results
  const showNoResults = displayBadges.length === 0 && hasFilters;

  return (
    <PageTemplate
      title="My Badge Wallet"
      actions={<ViewToggle mode={viewMode} onChange={setViewMode} />}
      stickyHeader={true}
    >
      <div className="flex flex-col lg:flex-row lg:gap-6 h-full">
        {/* Date Navigation Sidebar - AC 1.6 (hidden on mobile, visible on desktop) */}
        <DateNavigationSidebar
          dateGroups={dateGroups}
          selectedLabel={selectedDateGroup}
          onSelect={handleDateGroupClick}
          className="hidden lg:block w-60 flex-shrink-0"
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Story 8.2 AC1 & AC4: Badge Search Bar - fixed above scroll area */}
          <div className="relative flex-shrink-0 bg-white mb-2 z-sticky">
            <BadgeSearchBar
              searchTerm={localSearch}
              onSearchChange={setLocalSearch}
              onSearchClear={() => setLocalSearch('')}
              isSearchLoading={isLoading}
              skills={skills}
              selectedSkills={selectedSkills}
              onSkillsChange={setSelectedSkills}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              filterChips={filterChips}
              onRemoveFilter={removeFilter}
              onClearAllFilters={clearAllFilters}
              placeholder="Search your badges..."
            />
          </div>

          {/* Scrollable content area - only badges scroll */}
          <div ref={scrollContainerRef} className="relative z-0 flex-1 overflow-y-auto min-h-0">
            {/* Search results count - Story 8.2 */}
            {hasFilters && !showNoResults && (
              <p className="text-sm text-neutral-500 mb-4">
                Showing {displayBadges.length} of {total} badges
              </p>
            )}

            {/* No results state - Story 8.2 AC1: Include query and suggestions */}
            {showNoResults && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-neutral-700 text-lg font-medium">
                  {localSearch
                    ? `No badges found for "${localSearch}"`
                    : 'No badges match your filters'}
                </p>
                <ul className="text-neutral-500 mt-3 space-y-1">
                  <li>• Try different keywords</li>
                  <li>• Check your spelling</li>
                  {hasFilters && <li>• Remove some filters</li>}
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  {hasFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                      Clear all filters
                    </button>
                  )}
                  <a
                    href="/wallet"
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Browse all badges
                  </a>
                </div>
              </div>
            )}

            {/* Timeline View - AC 1.1-1.4 */}
            {viewMode === 'timeline' && !showNoResults && (
              <div className="relative">
                <TimelineLine />
                {/* Story 12.4: Render milestone achievements at the top of the timeline */}
                {milestoneItems.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {milestoneItems.map((milestone) => (
                      <MilestoneTimelineCard key={milestone.milestoneId} milestone={milestone} />
                    ))}
                  </div>
                )}
                <div className="space-y-8">
                  {dateGroups.map((group) => {
                    const groupBadges = displayBadges.slice(
                      group.startIndex,
                      group.startIndex + group.count
                    );

                    return (
                      <div key={group.label} id={`group-${group.label}`}>
                        <DateGroupHeader label={group.label} count={group.count} />
                        <div className="space-y-4 mt-4">
                          {groupBadges.map((badge) => (
                            <BadgeTimelineCard key={badge.id} badge={badge} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid View - With keyboard navigation (Story 8.3 UX-P1-005) */}
            {viewMode === 'grid' && !showNoResults && (
              <>
                {milestoneItems.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {milestoneItems.map((m) => (
                      <div
                        key={m.milestoneId}
                        className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5"
                        title={`${m.description}\nAchieved ${new Date(m.achievedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                      >
                        <span className="text-lg">{m.icon || '🏅'}</span>
                        <span className="text-sm font-medium text-amber-800">{m.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                <GridView badges={gridDisplayBadges} />
              </>
            )}

            {/* Story 15.8: Infinite scroll sentinel */}
            {!showNoResults && <div ref={sentinelRef} className="h-px" />}

            {/* Story 15.8: Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                <span className="sr-only">Loading more badges...</span>
              </div>
            )}

            {/* Story 15.8: End of list indicator */}
            {!hasNextPage && allItems.length > 0 && !isFetchingNextPage && (
              <div className="text-center py-6 text-neutral-400 text-sm">
                You've seen all your badges
              </div>
            )}
          </div>
        </div>

        {/* Badge Detail Modal - renders via Portal to document.body */}
        <BadgeDetailModal />
      </div>
    </PageTemplate>
  );
}

/**
 * Grid View with Keyboard Navigation (Story 8.3 - AC1, UX-P1-005)
 * WCAG 2.1.1 - Arrow keys navigate between cards
 * Enter/Space activates selected card
 */
interface GridViewProps {
  badges: Array<{
    id: string;
    status: string;
    template: {
      imageUrl?: string | null;
      name: string;
      category: string;
    };
  }>;
}

/**
 * Hook to detect responsive column count
 * Returns current number of grid columns based on screen width
 * Story 8.5: AC1 (1 col), AC2 (2 col), AC3 (3-4 col)
 */
function useResponsiveColumns(): number {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      // Match Tailwind breakpoints: md=768, lg=1024, xl=1280
      if (window.innerWidth >= 1280) {
        setColumns(4); // xl:grid-cols-4
      } else if (window.innerWidth >= 1024) {
        setColumns(3); // lg:grid-cols-3
      } else if (window.innerWidth >= 768) {
        setColumns(2); // md:grid-cols-2
      } else {
        setColumns(1); // grid-cols-1 (mobile)
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

function GridView({ badges }: GridViewProps) {
  const openModal = useBadgeDetailModal((s) => s.openModal);
  const columns = useResponsiveColumns(); // Story 8.3: Dynamic column count

  const handleActivate = useCallback(
    (badge: GridViewProps['badges'][0]) => {
      openModal(badge.id);
    },
    [openModal]
  );

  const { focusedIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
    items: badges,
    columns, // Dynamic columns based on screen width
    onActivate: handleActivate,
  });

  return (
    <div
      role="grid"
      aria-label="Badge collection grid"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
    >
      {badges.map((badge, index) => {
        const itemProps = getItemProps(index);
        const isInactive = badge.status === 'REVOKED' || badge.status === 'EXPIRED';
        return (
          <div
            key={badge.id}
            role="gridcell"
            {...itemProps}
            data-keyboard-nav-index={index}
            onClick={() => handleActivate(badge)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivate(badge);
              }
            }}
            className={`
              border rounded-lg p-3 md:p-4 cursor-pointer
              transition-all duration-150
              min-h-[44px]
              hover:border-brand-400 hover:shadow-md
              active:bg-neutral-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
              ${focusedIndex === index ? 'border-brand-400 shadow-md' : 'border-neutral-200'}
              ${isInactive ? 'opacity-50' : ''}
            `}
          >
            <img
              src={badge.template.imageUrl || '/placeholder-badge.png'}
              alt={`Badge: ${badge.template.name}`}
              loading="lazy"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-2 md:mb-3 object-contain"
            />
            <h3 className="font-semibold text-center text-sm md:text-base">
              {badge.template.name}
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 text-center mb-2">
              {badge.template.category}
            </p>
            <div className="flex justify-center">
              <StatusBadge status={badge.status as 'CLAIMED' | 'PENDING' | 'REVOKED' | 'EXPIRED'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
