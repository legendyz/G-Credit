/**
 * Badge Management Page
 * Sprint 7 - Story 9.5: Admin Badge Revocation UI
 * 
 * Admin/Issuer page for managing badges with search, filter, and revocation.
 * Implements AC1, AC4, AC5
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Badge as BadgeType, BadgeQueryParams } from '@/lib/badgesApi';
import { 
  BadgeStatus, 
  getAllBadges, 
  getIssuedBadges,
} from '@/lib/badgesApi';
import { RevokeBadgeModal } from '@/components/admin/RevokeBadgeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldX,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

// For demo purposes - in production this would come from auth context
const MOCK_USER_ROLE = 'ADMIN'; // or 'ISSUER'
const MOCK_USER_ID = 'current-user-id';

interface BadgeManagementPageProps {
  /** User role - determines which badges to show and actions available */
  userRole?: 'ADMIN' | 'ISSUER';
  /** Current user ID - for checking badge ownership */
  userId?: string;
}

const PAGE_SIZE = 10;

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
 * Status badge component
 */
function StatusBadge({ status }: { status: BadgeStatus }) {
  const config = {
    [BadgeStatus.PENDING]: { 
      icon: Clock, 
      label: 'Pending', 
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
    },
    [BadgeStatus.CLAIMED]: { 
      icon: CheckCircle2, 
      label: 'Claimed', 
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
    },
    [BadgeStatus.REVOKED]: { 
      icon: XCircle, 
      label: 'Revoked', 
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
    },
    [BadgeStatus.EXPIRED]: { 
      icon: AlertCircle, 
      label: 'Expired', 
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
    },
  };

  const { icon: Icon, label, className } = config[status] || config[BadgeStatus.PENDING];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function BadgeManagementPage({ 
  userRole = MOCK_USER_ROLE, 
  userId = MOCK_USER_ID 
}: BadgeManagementPageProps) {
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query params - handle special 'active' filter (ISSUED + CLAIMED)
  const queryParams: BadgeQueryParams = useMemo(() => {
    let status: BadgeStatus | 'all' | undefined;
    if (statusFilter === 'all') {
      status = undefined;
    } else if (statusFilter === 'active') {
      // 'active' filter handled by backend or client-side
      // For now, we pass undefined and filter client-side if needed
      status = undefined;
    } else {
      status = statusFilter as BadgeStatus;
    }
    return {
      page: currentPage,
      limit: PAGE_SIZE,
      status,
      search: searchTerm || undefined,
      // Pass active flag for backend to filter ISSUED + CLAIMED
      ...(statusFilter === 'active' ? { activeOnly: true } : {}),
    };
  }, [currentPage, statusFilter, searchTerm]);

  // Fetch badges - Admin sees all, Issuer sees only their issued badges
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['badges', userRole, queryParams],
    queryFn: () => userRole === 'ADMIN' 
      ? getAllBadges(queryParams) 
      : getIssuedBadges(queryParams),
  });

  // Check if user can revoke a specific badge
  const canRevokeBadge = useCallback((badge: BadgeType): boolean => {
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
    
    return false;
  }, [userRole, userId]);

  // Handle search with debounce effect
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

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

  // Pagination
  const totalPages = data?.totalPages || 1;
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header - Story 8.5 AC6: Responsive typography */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">Badge Management</h1>
          <p className="text-sm md:text-base text-slate-600">
            {userRole === 'ADMIN' 
              ? 'Manage all badges in the system' 
              : 'Manage badges you have issued'}
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by recipient or template..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                aria-label="Search badges by recipient name, email, or template name"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-slate-600">
                Status:
              </label>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger id="status-filter" className="w-[140px]" aria-label="Filter by status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value={BadgeStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={BadgeStatus.CLAIMED}>Claimed</SelectItem>
                  <SelectItem value={BadgeStatus.REVOKED}>Revoked</SelectItem>
                  <SelectItem value={BadgeStatus.EXPIRED}>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading badges...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p className="mt-2 text-slate-600">
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
          ) : !data?.badges || data.badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldX className="h-12 w-12 text-slate-300" />
              <p className="mt-2 text-slate-600">No badges found</p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (< 768px) - Story 8.5 AC2 */}
              <div className="md:hidden divide-y divide-slate-200">
                {data.badges.map((badge) => {
                  const isRevoked = badge.status === BadgeStatus.REVOKED;
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 ${isRevoked ? 'bg-slate-50 opacity-60' : ''}`}
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
                          <div className="font-medium text-slate-900 truncate">
                            {badge.template.name}
                          </div>
                          <div className="text-sm text-slate-600 truncate">
                            {getRecipientName(badge)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(badge.issuedAt)}
                          </div>
                        </div>
                        <StatusBadge status={badge.status} />
                      </div>
                      {/* Action Row */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{badge.recipient.email}</span>
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
                          <span className="text-xs text-slate-400">Revoked</span>
                        ) : null}
                      </div>
                      {isRevoked && badge.revocationReason && (
                        <div className="mt-2 text-xs text-slate-500">
                          Reason: {badge.revocationReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Badge
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Recipient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Issued
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.badges.map((badge) => {
                      const isRevoked = badge.status === BadgeStatus.REVOKED;
                      return (
                        <tr 
                          key={badge.id} 
                          className={isRevoked ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex items-center gap-3">
                              {badge.template.imageUrl && (
                                <img 
                                  src={badge.template.imageUrl} 
                                  alt="" 
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium text-slate-900">
                                  {badge.template.name}
                                </div>
                                {badge.template.category && (
                                  <div className="text-xs text-slate-500">
                                    {badge.template.category}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="text-sm text-slate-900">
                              {getRecipientName(badge)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {badge.recipient.email}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                            {formatDate(badge.issuedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge status={badge.status} />
                            {isRevoked && badge.revocationReason && (
                              <div className="mt-1 text-xs text-slate-500">
                                {badge.revocationReason}
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
                              <span className="text-xs text-slate-400">Revoked</span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Story 8.5: Touch-friendly buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1} to{' '}
                  {Math.min(currentPage * PAGE_SIZE, data.total)} of {data.total} badges
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
                  <span className="text-sm text-slate-600">
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
      </div>
    </div>
  );
}

export default BadgeManagementPage;
