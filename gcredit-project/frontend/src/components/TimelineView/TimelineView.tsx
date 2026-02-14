import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useSkills } from '../../hooks/useSkills';
import { useBadgeSearch } from '../../hooks/useBadgeSearch';
import { TimelineLine } from './TimelineLine';
import { BadgeTimelineCard } from './BadgeTimelineCard';
import { DateGroupHeader } from './DateGroupHeader';
import { DateNavigationSidebar } from './DateNavigationSidebar';
import { ViewToggle } from './ViewToggle';
import EmptyState, { detectEmptyStateScenario } from '../BadgeWallet/EmptyState';
import BadgeDetailModal from '../BadgeDetailModal/BadgeDetailModal';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import { BadgeSearchBar } from '../search/BadgeSearchBar';
import { PageTemplate } from '../layout/PageTemplate';
import type { BadgeForFilter } from '../../utils/searchFilters';

export type ViewMode = 'timeline' | 'grid';

export function TimelineView() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  // Fetch all badges initially (status filter will be handled by search)
  const { data, isLoading, error } = useWallet({});

  // Fetch available skills for filter dropdown
  const { data: skills = [] } = useSkills();

  // Convert badges to BadgeForFilter format for client-side filtering
  const badgesForFilter: BadgeForFilter[] = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((badge) => ({
      id: badge.id,
      template: {
        id: badge.template.id,
        name: badge.template.name,
        // Story 8.2: Use actual skillIds from API
        skillIds: badge.template.skillIds || [],
        category: badge.template.category,
      },
      issuer: {
        id: badge.issuer.id,
        firstName: badge.issuer.firstName,
        lastName: badge.issuer.lastName,
        email: badge.issuer.email,
      },
      issuedAt: badge.issuedAt,
      claimedAt: badge.claimedAt,
      status: badge.status,
    }));
  }, [data]);

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

  // Story 8.2: Badge search hook
  const {
    searchTerm,
    setSearchTerm,
    selectedSkills,
    setSelectedSkills,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    filteredBadges,
    hasFilters,
    filterChips,
    clearAllFilters,
    removeFilter,
    isSearching,
  } = useBadgeSearch({
    allBadges: badgesForFilter,
    totalCount: data?.meta?.total,
    skillNames,
  });

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
  }, [setStatusFilter]);

  // Map filtered badges back to original badge objects for display
  const displayBadges = useMemo(() => {
    if (!data?.data) return [];
    const filteredIds = new Set(filteredBadges.map((b) => b.id));
    return data.data.filter((badge) => filteredIds.has(badge.id));
  }, [data, filteredBadges]);

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

  if (!data || data.data.length === 0) {
    // AC 6.14: Detect which empty state scenario to display
    // Calculate badge counts for scenario detection
    const totalBadges = data?.meta?.total || 0;
    const badges = data?.data ?? [];
    const claimedBadges = badges.filter((b) => b.status === 'CLAIMED').length;
    const pendingBadges = badges.filter((b) => b.status === 'PENDING').length;
    const revokedBadges = badges.filter((b) => b.status === 'REVOKED').length;
    const hasActiveFilter = hasFilters;

    const emptyScenario = detectEmptyStateScenario(
      totalBadges,
      claimedBadges,
      pendingBadges,
      revokedBadges,
      hasActiveFilter
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
    <PageTemplate title="My Badges" actions={<ViewToggle mode={viewMode} onChange={setViewMode} />}>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Date Navigation Sidebar - AC 1.6 (hidden on mobile, visible on desktop) */}
        <DateNavigationSidebar
          dateGroups={dateGroups}
          className="hidden lg:block w-60 flex-shrink-0"
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Story 8.2 AC1 & AC4: Badge Search Bar with sticky positioning */}
          <div className="sticky top-0 z-10 bg-white pb-4 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 shadow-sm">
            <BadgeSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearchClear={() => setSearchTerm('')}
              isSearchLoading={isSearching}
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

          {/* Search results count - Story 8.2 */}
          {hasFilters && !showNoResults && (
            <p className="text-sm text-neutral-500 mb-4">
              Showing {displayBadges.length} of {data.data.length} badges
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
                {searchTerm
                  ? `No badges found for "${searchTerm}"`
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
          {viewMode === 'grid' && !showNoResults && <GridView badges={displayBadges} />}
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
    template: {
      imageUrl?: string;
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
            <p className="text-xs md:text-sm text-neutral-500 text-center">
              {badge.template.category}
            </p>
          </div>
        );
      })}
    </div>
  );
}
