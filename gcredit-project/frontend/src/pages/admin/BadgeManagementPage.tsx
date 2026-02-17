/**
 * Badge Management Page
 * Sprint 7 - Story 9.5: Admin Badge Revocation UI
 * Sprint 8 - Story 8.2: Badge Search & Filter Enhancement (AC2)
 *
 * Admin/Issuer page for managing badges with search, filter, and revocation.
 * Implements AC1, AC2, AC4, AC5
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Badge as BadgeType } from '@/lib/badgesApi';
import { BadgeStatus, getAllBadges, getIssuedBadges } from '@/lib/badgesApi';
import { RevokeBadgeModal } from '@/components/admin/RevokeBadgeModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldX,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { useBadgeSearch } from '@/hooks/useBadgeSearch';
import { BadgeSearchBar } from '@/components/search/BadgeSearchBar';
import { PageTemplate } from '@/components/layout/PageTemplate';
import type { BadgeForFilter } from '@/utils/searchFilters';
import { useCurrentUser } from '@/stores/authStore';

interface BadgeManagementPageProps {
  /** User role - determines which badges to show and actions available */
  userRole?: 'ADMIN' | 'ISSUER' | 'MANAGER';
  /** Current user ID - for checking badge ownership */
  userId?: string;
}

const PAGE_SIZE = 10;

/** Sortable column fields */
type SortField = 'badge' | 'recipient' | 'issuedBy' | 'issuedAt' | 'status';
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = {
  [BadgeStatus.CLAIMED]: 0,
  [BadgeStatus.PENDING]: 1,
  [BadgeStatus.EXPIRED]: 2,
  [BadgeStatus.REVOKED]: 3,
};

const SORT_LABELS: Record<SortField, string> = {
  badge: 'Badge',
  recipient: 'Recipient',
  issuedBy: 'Issued By',
  issuedAt: 'Issued On',
  status: 'Status',
};

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get recipient display name
 */
function getRecipientName(badge: BadgeType): string {
  const { firstName, lastName, email } = badge.recipient;
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return email;
}

/**
 * Get issuer display name
 */
function getIssuerName(badge: BadgeType): string {
  if (!badge.issuer) return 'Unknown';
  const { firstName, lastName, email } = badge.issuer;
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return email;
}

/**
 * Get revoker display name
 */
function getRevokerName(badge: BadgeType): string | null {
  if (!badge.revoker) return null;
  const { firstName, lastName, email } = badge.revoker;
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return email;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: BadgeStatus }) {
  const config = {
    [BadgeStatus.PENDING]: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    [BadgeStatus.CLAIMED]: {
      icon: CheckCircle2,
      label: 'Claimed',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    [BadgeStatus.REVOKED]: {
      icon: XCircle,
      label: 'Revoked',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    [BadgeStatus.EXPIRED]: {
      icon: AlertCircle,
      label: 'Expired',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
  };

  const { icon: Icon, label, className } = config[status] || config[BadgeStatus.PENDING];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function BadgeManagementPage({
  userRole: userRoleProp,
  userId: userIdProp,
}: BadgeManagementPageProps) {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const userRole = userRoleProp || (currentUser?.role as 'ADMIN' | 'ISSUER' | 'MANAGER') || 'ADMIN';
  const userId = userIdProp || currentUser?.id || 'unknown';
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Toggle sort on column click: asc → desc → clear
  const handleSort = useCallback(
    (field: SortField) => {
      setCurrentPage(1);
      if (sortField !== field) {
        // New column: start ascending
        setSortField(field);
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        // Same column, was asc: switch to desc
        setSortDirection('desc');
      } else {
        // Same column, was desc: clear sort
        setSortField(null);
        setSortDirection('asc');
      }
    },
    [sortField, sortDirection]
  );

  // Fetch ALL badges across pages for client-side sorting, filtering, and pagination
  const fetchAllBadges = useCallback(async (): Promise<BadgeType[]> => {
    const fetchFn = userRole === 'ADMIN' ? getAllBadges : getIssuedBadges;
    const allBadges: BadgeType[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchFn({ page, limit: 100 });
      allBadges.push(...result.data);
      hasMore = result.meta.hasNextPage;
      page++;
    }
    return allBadges;
  }, [userRole]);

  // Fetch badges - Admin sees all, Issuer sees own, Manager sees department badges
  const {
    data: allBadges,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['badges', userRole, 'all'],
    queryFn: fetchAllBadges,
  });

  // Wrap in a shape compatible with rest of component
  const data = useMemo(() => {
    if (!allBadges) return undefined;
    return { data: allBadges, meta: { total: allBadges.length } };
  }, [allBadges]);

  // Fetch skills for filter dropdown (Story 8.2 AC2)
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
        id: badge.issuerId,
        firstName: badge.issuer?.firstName || null,
        lastName: badge.issuer?.lastName || null,
        email: badge.issuer?.email || '',
      },
      recipient: {
        id: badge.recipient.id,
        firstName: badge.recipient.firstName,
        lastName: badge.recipient.lastName,
        email: badge.recipient.email,
      },
      issuedAt: badge.issuedAt,
      claimedAt: badge.claimedAt,
      status: badge.status,
    }));
  }, [data]);

  // Story 8.2 AC2: Badge search hook with enhanced filtering
  const {
    searchTerm,
    setSearchTerm,
    selectedSkills,
    setSelectedSkills,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    issuerFilter,
    setIssuerFilter,
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

  // Story 8.2 AC2: Derive unique issuers from badge data for filter dropdown
  const issuers = useMemo(() => {
    if (!data?.data) return [];
    const issuerMap = new Map<string, string>();
    data.data.forEach((badge) => {
      if (badge.issuer && !issuerMap.has(badge.issuer.id)) {
        const name =
          badge.issuer.firstName && badge.issuer.lastName
            ? `${badge.issuer.firstName} ${badge.issuer.lastName}`
            : badge.issuer.email || 'Unknown';
        issuerMap.set(badge.issuer.id, name);
      }
    });
    return Array.from(issuerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Map filtered badges back to original badge objects for display
  const displayBadges = useMemo(() => {
    if (!data?.data) return [];
    const filteredIds = new Set(filteredBadges.map((b) => b.id));
    const result = data.data.filter((badge) => filteredIds.has(badge.id));

    // Apply client-side sorting
    if (sortField) {
      result.sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case 'badge':
            cmp = a.template.name.localeCompare(b.template.name);
            break;
          case 'recipient':
            cmp = getRecipientName(a).localeCompare(getRecipientName(b));
            break;
          case 'issuedBy':
            cmp = getIssuerName(a).localeCompare(getIssuerName(b));
            break;
          case 'issuedAt':
            cmp = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
            break;
          case 'status':
            cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
            break;
        }
        return sortDirection === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [data, filteredBadges, sortField, sortDirection]);

  // Check if user can revoke a specific badge
  const canRevokeBadge = useCallback(
    (badge: BadgeType): boolean => {
      // AC1: Only PENDING or CLAIMED badges can be revoked (PENDING = issued but unclaimed)
      if (badge.status !== BadgeStatus.PENDING && badge.status !== BadgeStatus.CLAIMED) {
        return false;
      }

      // Admin can revoke any badge
      if (userRole === 'ADMIN') return true;

      // Issuer can only revoke badges they issued
      if (userRole === 'ISSUER') {
        return badge.issuerId === userId;
      }

      // Manager can revoke department badges (backend enforces same-department)
      if (userRole === 'MANAGER') return true;

      return false;
    },
    [userRole, userId]
  );

  // Handle revoke button click
  const handleRevokeClick = useCallback((badge: BadgeType) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBadge(null);
  }, []);

  // Handle successful revocation
  const handleRevocationSuccess = useCallback(() => {
    // Invalidate and refetch badges query
    queryClient.invalidateQueries({ queryKey: ['badges'] });
    handleModalClose();
  }, [queryClient, handleModalClose]);

  // Client-side pagination over sorted/filtered results
  const displayTotal = displayBadges.length;
  const totalPages = Math.ceil(displayTotal / PAGE_SIZE) || 1;
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const paginatedBadges = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return displayBadges.slice(start, start + PAGE_SIZE);
  }, [displayBadges, currentPage]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <PageTemplate
          title="Badge Management"
          description={
            userRole === 'ADMIN'
              ? 'Manage all badges in the system'
              : userRole === 'MANAGER'
                ? 'Manage badges for your department'
                : 'Manage badges you have issued'
          }
          actions={
            (userRole === 'ADMIN' || userRole === 'ISSUER') && (
              <Button
                onClick={() => navigate('/admin/badges/issue')}
                className="flex items-center gap-2 min-h-[44px] bg-brand-600 hover:bg-brand-700 text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Issue New Badge
              </Button>
            )
          }
        >
          {/* Story 8.2 AC2: Enhanced Search & Filter Controls */}
          <Card className="mb-6 p-4 shadow-elevation-1">
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
              issuers={userRole === 'ADMIN' ? issuers : []}
              selectedIssuer={issuerFilter}
              onIssuerChange={setIssuerFilter}
              filterChips={filterChips}
              onRemoveFilter={removeFilter}
              onClearAllFilters={clearAllFilters}
              placeholder="Search by recipient or template..."
            />

            {/* Results count */}
            {hasFilters && displayBadges.length > 0 && (
              <p className="mt-3 text-sm text-neutral-500">
                Showing {displayBadges.length} of {data?.data?.length || 0} badges
              </p>
            )}
          </Card>

          {/* Table */}
          <Card className="overflow-hidden shadow-elevation-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <span className="ml-2 text-neutral-600">Loading badges...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-error" />
                <p className="mt-2 text-neutral-600">
                  {error instanceof Error ? error.message : 'Failed to load badges'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['badges'] })}
                >
                  Retry
                </Button>
              </div>
            ) : displayBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldX className="h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-neutral-600">
                  {hasFilters ? 'No badges match your filters' : 'No badges found'}
                </p>
                {hasFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Sort Selector */}
                <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-neutral-50">
                  <span className="text-xs text-neutral-500">Sort by:</span>
                  <select
                    value={sortField ? `${sortField}-${sortDirection}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setSortField(null);
                        setSortDirection('asc');
                      } else {
                        const [field, dir] = val.split('-') as [SortField, SortDirection];
                        setSortField(field);
                        setSortDirection(dir);
                      }
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-neutral-300 rounded px-2 py-1.5 bg-white text-neutral-700 min-h-[36px]"
                    aria-label="Sort badges"
                  >
                    <option value="">Default</option>
                    {(Object.entries(SORT_LABELS) as [SortField, string][]).map(
                      ([field, label]) => (
                        <optgroup key={field} label={label}>
                          <option value={`${field}-asc`}>{label} ↑</option>
                          <option value={`${field}-desc`}>{label} ↓</option>
                        </optgroup>
                      )
                    )}
                  </select>
                </div>

                {/* Mobile Card Layout (< 768px) - Story 8.5 AC2 */}
                <div className="md:hidden divide-y divide-neutral-200">
                  {paginatedBadges.map((badge) => {
                    const isRevoked = badge.status === BadgeStatus.REVOKED;
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 ${isRevoked ? 'bg-neutral-50 opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {badge.template.imageUrl && (
                            <img
                              src={badge.template.imageUrl}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {badge.template.name}
                            </div>
                            <div className="text-sm text-neutral-600 truncate">
                              {getRecipientName(badge)}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {formatDate(badge.issuedAt)} · Issued by {getIssuerName(badge)}
                            </div>
                          </div>
                          <StatusBadge status={badge.status} />
                        </div>
                        {/* Action Row */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-neutral-500">{badge.recipient.email}</span>
                          {canRevokeBadge(badge) ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeClick(badge)}
                              className="min-h-[44px] px-4"
                              aria-label={`Revoke badge ${badge.template.name}`}
                            >
                              Revoke
                            </Button>
                          ) : isRevoked ? (
                            <span className="text-xs text-neutral-400">Revoked</span>
                          ) : null}
                        </div>
                        {isRevoked && (
                          <div className="mt-2 space-y-0.5">
                            {badge.revocationReason && (
                              <div className="text-xs text-neutral-500">
                                Reason: {badge.revocationReason}
                              </div>
                            )}
                            {getRevokerName(badge) && (
                              <div className="text-xs text-neutral-400">
                                Revoked by {getRevokerName(badge)}
                                {badge.revokedAt ? ` on ${formatDate(badge.revokedAt)}` : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[18%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                      <col className="w-[24%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead className="bg-neutral-100">
                      <tr>
                        {(
                          [
                            ['badge', 'Badge'],
                            ['recipient', 'Recipient'],
                            ['issuedBy', 'Issued By'],
                            ['issuedAt', 'Issued On'],
                            ['status', 'Status'],
                          ] as [SortField, string][]
                        ).map(([field, label]) => (
                          <th
                            key={field}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 cursor-pointer select-none hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
                            onClick={() => handleSort(field)}
                            aria-sort={
                              sortField === field
                                ? sortDirection === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                                : 'none'
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              {sortField === field ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {paginatedBadges.map((badge) => {
                        const isRevoked = badge.status === BadgeStatus.REVOKED;
                        return (
                          <tr
                            key={badge.id}
                            className={
                              isRevoked ? 'bg-neutral-50 opacity-60' : 'hover:bg-neutral-50'
                            }
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {badge.template.imageUrl && (
                                  <img
                                    src={badge.template.imageUrl}
                                    alt=""
                                    className="h-10 w-10 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium text-neutral-900 truncate">
                                    {badge.template.name}
                                  </div>
                                  {badge.template.category && (
                                    <div className="text-xs text-neutral-500 truncate">
                                      {badge.template.category}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-neutral-900 truncate">
                                {getRecipientName(badge)}
                              </div>
                              <div className="text-xs text-neutral-500 truncate">
                                {badge.recipient.email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-neutral-900 truncate">
                                {getIssuerName(badge)}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-neutral-600">
                              {formatDate(badge.issuedAt)}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <StatusBadge status={badge.status} />
                              {isRevoked && badge.revocationReason && (
                                <div className="mt-1 text-xs text-neutral-500 break-words">
                                  {badge.revocationReason}
                                </div>
                              )}
                              {isRevoked && getRevokerName(badge) && (
                                <div className="mt-1 text-xs text-neutral-400">
                                  by {getRevokerName(badge)}
                                  {badge.revokedAt ? ` · ${formatDate(badge.revokedAt)}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right">
                              {canRevokeBadge(badge) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevokeClick(badge)}
                                  aria-label={`Revoke badge ${badge.template.name} for ${getRecipientName(badge)}`}
                                >
                                  Revoke
                                </Button>
                              ) : isRevoked ? (
                                <span className="text-xs text-neutral-400">Revoked</span>
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - Story 8.5: Touch-friendly buttons */}
                <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="text-sm text-neutral-600">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                    {Math.min(currentPage * PAGE_SIZE, displayTotal)} of {displayTotal} badges
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={!canGoBack}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-neutral-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!canGoForward}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Revoke Modal */}
          <RevokeBadgeModal
            badge={selectedBadge}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSuccess={handleRevocationSuccess}
          />
        </PageTemplate>
      </div>
    </div>
  );
}

export default BadgeManagementPage;
