/**
 * Badge Search Filters Utility - Story 8.2 (AC5)
 *
 * Client-side filtering logic for badges.
 * Used when badge count < 50 for instant response.
 *
 * Filtering strategy:
 * - <50 badges: client-side filtering (this file)
 * - ≥50 badges: server-side search (API call)
 */

export interface BadgeForFilter {
  id: string;
  template: {
    id: string;
    name: string;
    skillIds?: string[];
    category?: string;
  };
  issuer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  recipient?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  issuedAt: string | Date;
  claimedAt?: string | Date | null;
  status: string;
}

export interface BadgeSearchFilters {
  /** Search term for name/issuer matching */
  search?: string;
  /** Skill IDs to filter by (OR logic - badge has any of these skills) */
  skills?: string[];
  /** Minimum issue date (inclusive) */
  fromDate?: string | null;
  /** Maximum issue date (inclusive) */
  toDate?: string | null;
  /** Badge status filter */
  status?: string;
  /** Issuer ID filter (Admin only) */
  issuerId?: string;
}

/**
 * Filter badges by search criteria (client-side)
 * Uses AND logic for different filter types
 *
 * @param badges - Array of badges to filter
 * @param filters - Filter criteria
 * @returns Filtered badges array
 */
export function filterBadges<T extends BadgeForFilter>(
  badges: T[],
  filters: BadgeSearchFilters
): T[] {
  return badges.filter((badge) => {
    // Search filter (fuzzy match on name, issuer name, issuer email)
    if (filters.search && filters.search.trim().length >= 2) {
      const searchLower = filters.search.toLowerCase().trim();
      const templateName = badge.template.name.toLowerCase();
      const issuerName = getFullName(badge.issuer).toLowerCase();
      const issuerEmail = badge.issuer.email.toLowerCase();

      const matchesSearch =
        templateName.includes(searchLower) ||
        issuerName.includes(searchLower) ||
        issuerEmail.includes(searchLower);

      if (!matchesSearch) {
        return false;
      }
    }

    // Skills filter (OR logic - badge has any of the selected skills)
    if (filters.skills && filters.skills.length > 0) {
      const badgeSkillIds = badge.template.skillIds || [];
      const hasMatchingSkill = filters.skills.some((skillId) => badgeSkillIds.includes(skillId));

      if (!hasMatchingSkill) {
        return false;
      }
    }

    // Date range filter (fromDate)
    if (filters.fromDate) {
      const badgeDate = new Date(badge.issuedAt);
      const fromDate = new Date(filters.fromDate);
      // Set time to start of day for comparison
      fromDate.setHours(0, 0, 0, 0);

      if (badgeDate < fromDate) {
        return false;
      }
    }

    // Date range filter (toDate)
    if (filters.toDate) {
      const badgeDate = new Date(badge.issuedAt);
      const toDate = new Date(filters.toDate);
      // Set time to end of day for comparison
      toDate.setHours(23, 59, 59, 999);

      if (badgeDate > toDate) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (badge.status !== filters.status) {
        return false;
      }
    }

    // Issuer filter
    if (filters.issuerId) {
      if (badge.issuer.id !== filters.issuerId) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get full name from user object
 */
function getFullName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email;
}

/**
 * Determine if client-side or server-side filtering should be used
 *
 * @param totalBadges - Total number of badges
 * @param threshold - Threshold for switching to server-side (default: 50)
 * @returns true if server-side search should be used
 */
export function shouldUseServerSearch(totalBadges: number, threshold: number = 50): boolean {
  return totalBadges >= threshold;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: BadgeSearchFilters): boolean {
  return !!(
    (filters.search && filters.search.trim().length >= 2) ||
    (filters.skills && filters.skills.length > 0) ||
    filters.fromDate ||
    filters.toDate ||
    (filters.status && filters.status !== 'all') ||
    filters.issuerId
  );
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: BadgeSearchFilters): number {
  let count = 0;

  if (filters.search && filters.search.trim().length >= 2) count++;
  if (filters.skills && filters.skills.length > 0) count++;
  // Date range counts as one filter
  if (filters.fromDate || filters.toDate) count++;
  if (filters.status && filters.status !== 'all') count++;
  if (filters.issuerId) count++;

  return count;
}

/**
 * Convert filters to FilterChip array for UI display
 */
export function filtersToChips(
  filters: BadgeSearchFilters,
  options?: {
    skillNames?: Record<string, string>;
    issuerNames?: Record<string, string>;
  }
): Array<{ id: string; label: string; category?: string }> {
  const chips: Array<{ id: string; label: string; category?: string }> = [];

  if (filters.search && filters.search.trim().length >= 2) {
    chips.push({
      id: 'search',
      label: `"${filters.search}"`,
      category: 'Search',
    });
  }

  if (filters.skills && filters.skills.length > 0) {
    const skillLabels = filters.skills.map((id) => options?.skillNames?.[id] || id);
    chips.push({
      id: 'skills',
      label:
        skillLabels.length > 2
          ? `${skillLabels.slice(0, 2).join(', ')} +${skillLabels.length - 2}`
          : skillLabels.join(', '),
      category: 'Skills',
    });
  }

  if (filters.fromDate && filters.toDate) {
    chips.push({
      id: 'dateRange',
      label: `${formatDateShort(filters.fromDate)} - ${formatDateShort(filters.toDate)}`,
      category: 'Date',
    });
  } else if (filters.fromDate) {
    chips.push({
      id: 'fromDate',
      label: `From ${formatDateShort(filters.fromDate)}`,
      category: 'Date',
    });
  } else if (filters.toDate) {
    chips.push({
      id: 'toDate',
      label: `Until ${formatDateShort(filters.toDate)}`,
      category: 'Date',
    });
  }

  if (filters.status && filters.status !== 'all') {
    chips.push({
      id: 'status',
      label: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
      category: 'Status',
    });
  }

  if (filters.issuerId) {
    chips.push({
      id: 'issuer',
      label: options?.issuerNames?.[filters.issuerId] || 'Selected issuer',
      category: 'Issuer',
    });
  }

  return chips;
}

/**
 * Format date for chip display
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
