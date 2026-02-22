/**
 * Admin User Management Page - Story 8.10, 12.3b
 *
 * Admin-only page for managing users:
 * - List users with pagination, search, filtering
 * - Edit user roles
 * - Activate/deactivate users
 * - Source filter (M365/Local) — 12.3b AC #5
 * - Enhanced status filter (Active/Locked/Inactive) — 12.3b AC #4
 * - Page size selector — 12.3b AC #9
 * - Create local user — 12.3b AC #2
 *
 * AC1: User List Page
 * AC6: Security & Authorization (Admin-only)
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, Filter, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserListTable } from '@/components/admin/UserListTable';
import { RoleBadge } from '@/components/admin/RoleBadge';
import { M365SyncPanel } from '@/components/admin/M365SyncPanel';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { PageTemplate } from '@/components/layout/PageTemplate';
import type { UserRole, AdminUsersQueryParams } from '@/lib/adminUsersApi';

type SortByField = 'name' | 'email' | 'role' | 'department' | 'status' | 'lastLogin' | 'createdAt';
type StatusFilterValue = 'ALL' | 'ACTIVE' | 'LOCKED' | 'INACTIVE';
type SourceFilterValue = 'ALL' | 'M365' | 'LOCAL';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const ROLES: (UserRole | 'ALL')[] = ['ALL', 'ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'];

export function AdminUserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params for initial state (sort state persistence)
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSortBy = (searchParams.get('sortBy') as SortByField | null) || null;
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
  const initialRoleFilter = searchParams.get('roleFilter') as UserRole | null;
  const initialStatusFilter =
    (searchParams.get('statusFilter') as StatusFilterValue | null) || 'ALL';
  const initialSourceFilter =
    (searchParams.get('sourceFilter') as SourceFilterValue | null) || 'ALL';
  const initialPageSize = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);

  // Local state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(
    PAGE_SIZE_OPTIONS.includes(initialPageSize) ? initialPageSize : DEFAULT_PAGE_SIZE
  );
  const [sortBy, setSortBy] = useState<SortByField | null>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>(initialRoleFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatusFilter);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>(initialSourceFilter);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(search, 300);

  // Build query params
  const queryParams = useMemo<AdminUsersQueryParams>(() => {
    const params: AdminUsersQueryParams = {
      page,
      limit: pageSize,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== 'ALL') params.roleFilter = roleFilter;
    if (statusFilter !== 'ALL')
      params.statusFilter = statusFilter as 'ACTIVE' | 'LOCKED' | 'INACTIVE';
    if (sourceFilter !== 'ALL') params.sourceFilter = sourceFilter as 'M365' | 'LOCAL';
    return params;
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter, sourceFilter, sortBy, sortOrder]);

  // Fetch users
  const { data, isLoading, isError, error } = useAdminUsers(queryParams);

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Handle sort: 3-click cycle (asc -> desc -> clear)
  const handleSort = useCallback(
    (field: string) => {
      let newSortBy: SortByField | null;
      let newSortOrder: 'asc' | 'desc';

      if (sortBy !== field) {
        // New column: start ascending
        newSortBy = field as SortByField;
        newSortOrder = 'asc';
      } else if (sortOrder === 'asc') {
        // Same column, was asc: switch to desc
        newSortBy = field as SortByField;
        newSortOrder = 'desc';
      } else {
        // Same column, was desc: clear sort
        newSortBy = null;
        newSortOrder = 'asc';
      }

      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setPage(1);
      updateUrlParams({
        sortBy: newSortBy,
        sortOrder: newSortBy ? newSortOrder : null,
        page: '1',
      });
    },
    [sortBy, sortOrder, updateUrlParams]
  );

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      updateUrlParams({
        search: value || null,
        page: '1',
      });
    },
    [updateUrlParams]
  );

  // Handle role filter
  const handleRoleFilterChange = useCallback(
    (value: string) => {
      setRoleFilter(value as UserRole | 'ALL');
      setPage(1);
      updateUrlParams({
        roleFilter: value === 'ALL' ? null : value,
        page: '1',
      });
    },
    [updateUrlParams]
  );

  // Handle status filter
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value as StatusFilterValue);
      setPage(1);
      updateUrlParams({
        statusFilter: value === 'ALL' ? null : value,
        page: '1',
      });
    },
    [updateUrlParams]
  );

  // Handle source filter (12.3b)
  const handleSourceFilterChange = useCallback(
    (value: string) => {
      setSourceFilter(value as SourceFilterValue);
      setPage(1);
      updateUrlParams({
        sourceFilter: value === 'ALL' ? null : value,
        page: '1',
      });
    },
    [updateUrlParams]
  );

  // Handle page size change (12.3b AC #9)
  const handlePageSizeChange = useCallback(
    (value: string) => {
      const newSize = Number(value);
      setPageSize(newSize);
      setPage(1);
      updateUrlParams({ limit: value, page: '1' });
    },
    [updateUrlParams]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateUrlParams({ page: newPage.toString() });
    },
    [updateUrlParams]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setSearchParams({});
  }, [setSearchParams]);

  // Empty state
  const isEmpty = data && data.data.length === 0;
  const hasFilters =
    debouncedSearch || roleFilter !== 'ALL' || statusFilter !== 'ALL' || sourceFilter !== 'ALL';

  return (
    <PageTemplate
      title="User Management"
      description="Manage user accounts and roles"
      actions={
        <div className="flex items-center gap-3">
          {data && (
            <p className="text-sm text-neutral-500">
              {data.meta.total} user{data.meta.total !== 1 ? 's' : ''}
            </p>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      }
    >
      {/* M365 Sync Panel — AC #28, #29 */}
      <M365SyncPanel />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name, email, role, or department..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            aria-label="Search users"
          />
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role === 'ALL' ? 'All Roles' : <RoleBadge role={role} />}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter (Enhanced — 12.3b AC #4) */}
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="LOCKED">Locked</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Source Filter (12.3b AC #5) */}
        <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            <SelectItem value="M365">M365</SelectItem>
            <SelectItem value="LOCAL">Local</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="ml-2 text-neutral-500">Loading users...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-error-light p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-error" />
          <h3 className="mt-2 text-lg font-medium text-error">Failed to load users</h3>
          <p className="mt-1 text-sm text-error">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No users found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {hasFilters
              ? 'No users match your search criteria. Try adjusting your filters.'
              : 'There are no users in the system yet.'}
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* User Table */}
      {data && data.data.length > 0 && (
        <>
          <UserListTable
            users={data.data}
            currentUserId={currentUser?.id || ''}
            sortBy={sortBy || ''}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Pagination — always visible for user count + page size control */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-neutral-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.meta.total)}{' '}
                of {data.meta.total} users
              </p>
              {/* Page size selector (12.3b AC #9) */}
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data.meta.totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!data.meta.hasNextPage}
                  className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create User Dialog (12.3b) */}
      <CreateUserDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
    </PageTemplate>
  );
}

export default AdminUserManagementPage;
