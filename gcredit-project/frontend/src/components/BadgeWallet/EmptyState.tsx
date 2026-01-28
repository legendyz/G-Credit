import React from 'react';
import NewEmployeeEmptyState from './EmptyStateScenarios/NewEmployeeEmptyState';
import PendingBadgesEmptyState from './EmptyStateScenarios/PendingBadgesEmptyState';
import AllRevokedEmptyState from './EmptyStateScenarios/AllRevokedEmptyState';
import FilteredEmptyState from './EmptyStateScenarios/FilteredEmptyState';

export type EmptyStateScenario = 
  | 'new-employee'
  | 'pending-badges'
  | 'all-revoked'
  | 'filtered-empty';

interface EmptyStateProps {
  scenario: EmptyStateScenario;
  pendingCount?: number;
  currentFilter?: string | null;
  onExploreCatalog?: () => void;
  onLearnMore?: () => void;
  onViewPending?: () => void;
  onContactSupport?: () => void;
  onViewPolicy?: () => void;
  onClearFilters?: () => void;
}

/**
 * AC 6.13: Empty state wrapper component
 * Automatically displays the correct scenario based on props
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  scenario,
  pendingCount = 0,
  currentFilter = null,
  onExploreCatalog = () => window.location.href = '/badges/templates',
  onLearnMore = () => window.location.href = '/docs/help/earning-badges',
  onViewPending = () => console.log('Switch to Pending tab'),
  onContactSupport = () => {
    // AC 6.8: Pre-filled mailto with subject
    window.location.href = 'mailto:g-credit@outlook.com?subject=Badge%20Revocation%20Inquiry';
  },
  onViewPolicy = () => window.location.href = '/policies/revocation',
  onClearFilters = () => console.log('Clear filters'),
}) => {
  // AC 6.14: Automatic scenario detection and rendering
  switch (scenario) {
    case 'new-employee':
      // AC 6.1-6.3: New employee with no badges
      return (
        <NewEmployeeEmptyState
          onExploreCatalog={onExploreCatalog}
          onLearnMore={onLearnMore}
        />
      );

    case 'pending-badges':
      // AC 6.4-6.6: User has pending badges but 0 claimed
      return (
        <PendingBadgesEmptyState
          pendingCount={pendingCount}
          onViewPending={onViewPending}
        />
      );

    case 'all-revoked':
      // AC 6.7-6.9: All badges revoked (sensitive scenario)
      return (
        <AllRevokedEmptyState
          onContactSupport={onContactSupport}
          onViewPolicy={onViewPolicy}
        />
      );

    case 'filtered-empty':
      // AC 6.10-6.12: Badges exist but filter returns 0 results
      return (
        <FilteredEmptyState
          currentFilter={currentFilter}
          onClearFilters={onClearFilters}
        />
      );

    default:
      return null;
  }
};

/**
 * Helper function to determine which empty state scenario to display
 * AC 6.14: Automatic detection based on wallet API response
 */
export const detectEmptyStateScenario = (
  totalBadges: number,
  claimedBadges: number,
  pendingBadges: number,
  revokedBadges: number,
  hasActiveFilter: boolean,
): EmptyStateScenario | null => {
  // Scenario 4: User has badges but filter returns 0 results
  if (hasActiveFilter && totalBadges > 0) {
    return 'filtered-empty';
  }

  // Scenario 3: All badges are revoked
  if (totalBadges > 0 && revokedBadges === totalBadges && claimedBadges === 0) {
    return 'all-revoked';
  }

  // Scenario 2: User has pending badges but 0 claimed
  if (pendingBadges > 0 && claimedBadges === 0) {
    return 'pending-badges';
  }

  // Scenario 1: New employee with no badges ever
  if (totalBadges === 0) {
    return 'new-employee';
  }

  // No empty state needed (user has badges to display)
  return null;
};

export default EmptyState;
