import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { BadgeStatus } from '../../types/badge';
import { TimelineLine } from './TimelineLine';
import { BadgeTimelineCard } from './BadgeTimelineCard';
import { DateGroupHeader } from './DateGroupHeader';
import { DateNavigationSidebar } from './DateNavigationSidebar';
import { ViewToggle } from './ViewToggle';
import EmptyState, { detectEmptyStateScenario } from '../BadgeWallet/EmptyState';
import BadgeDetailModal from '../BadgeDetailModal/BadgeDetailModal';

export type ViewMode = 'timeline' | 'grid';

export function TimelineView() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  // Story 9.3 AC4: Default filter to CLAIMED (Active badges only)
  const [statusFilter, setStatusFilter] = useState<BadgeStatus | undefined>(BadgeStatus.CLAIMED);
  const { data, isLoading, error } = useWallet({ status: statusFilter });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your badges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load badges. Please try again.</p>
      </div>
    );
  }

  if (!data || data.badges.length === 0) {
    // AC 6.14: Detect which empty state scenario to display
    // Calculate badge counts for scenario detection
    const totalBadges = data?.pagination?.total || 0;
    const claimedBadges = 0; // TODO: Get from API response if available
    const pendingBadges = 0; // TODO: Get from API response if available
    const revokedBadges = 0; // TODO: Get from API response if available
    const hasActiveFilter = statusFilter !== undefined;

    const emptyScenario = detectEmptyStateScenario(
      totalBadges,
      claimedBadges,
      pendingBadges,
      revokedBadges,
      hasActiveFilter,
    );

    if (emptyScenario) {
      return (
        <EmptyState
          scenario={emptyScenario}
          pendingCount={pendingBadges}
          currentFilter={statusFilter ? `Status: ${statusFilter}` : null}
          onExploreCatalog={() => {
            window.location.href = '/badges/templates';
          }}
          onLearnMore={() => {
            window.location.href = '/docs/help/earning-badges';
          }}
          onViewPending={() => {
            setStatusFilter(BadgeStatus.PENDING);
          }}
          onClearFilters={() => {
            setStatusFilter(undefined);
          }}
        />
      );
    }

    // Fallback if no scenario matches
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No badges found</p>
        <p className="text-gray-400 mt-2">Start earning badges to see them here!</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Date Navigation Sidebar - AC 1.6 */}
      <DateNavigationSidebar 
        dateGroups={data.dateGroups}
        className="w-60 flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header with View Toggle - AC 1.5 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Badge Wallet</h1>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Filter - Story 9.3 AC4 */}
        <div className="mb-6">
          <select
            value={statusFilter || 'ALL'}
            onChange={(e) => setStatusFilter(e.target.value === 'ALL' ? undefined : e.target.value as BadgeStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="ALL">All Badges</option>
            <option value={BadgeStatus.CLAIMED}>Active</option>
            <option value={BadgeStatus.PENDING}>Pending</option>
            <option value={BadgeStatus.REVOKED}>Revoked</option>
          </select>
        </div>

        {/* Timeline View - AC 1.1-1.4 */}
        {viewMode === 'timeline' && (
          <div className="relative">
            <TimelineLine />
            <div className="space-y-8">
              {data.dateGroups.map((group) => {
                const groupBadges = data.badges.slice(
                  group.startIndex,
                  group.startIndex + group.count
                );

                return (
                  <div key={group.label} id={`group-${group.label}`}>
                    <DateGroupHeader 
                      label={group.label} 
                      count={group.count} 
                    />
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

        {/* Grid View - Simple fallback */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.badges.map((badge) => (
              <div key={badge.id} className="border border-gray-200 rounded-lg p-4">
                <img 
                  src={badge.template.imageUrl} 
                  alt={badge.template.name}
                  className="w-32 h-32 mx-auto mb-3"
                />
                <h3 className="font-semibold text-center">{badge.template.name}</h3>
                <p className="text-sm text-gray-500 text-center">{badge.template.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Badge Detail Modal - renders via Portal to document.body */}
      <BadgeDetailModal />
    </div>
  );
}
