/**
 * Admin User Management Page - Story 8.10
 *
 * Admin-only page for managing users:
 * - List users with pagination, search, filtering
 * - Edit user roles
 * - Activate/deactivate users
 *
 * AC1: User List Page
 * AC6: Security & Authorization (Admin-only)
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, Filter, Loader2, AlertCircle } from 'lucide-react';
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
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { PageTemplate } from '@/components/layout/PageTemplate';
import type { UserRole, AdminUsersQueryParams } from '@/lib/adminUsersApi';

type SortByField = 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';

const PAGE_SIZE = 25;
const ROLES: (UserRole | 'ALL')[] = ['ALL', 'ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'];

export function AdminUserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params for initial state (sort state persistence)
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSortBy = (searchParams.get('sortBy') as SortByField | null) || 'name';
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
  const initialRoleFilter = searchParams.get('roleFilter') as UserRole | null;
  const initialStatusFilter = searchParams.get('statusFilter');

  // Local state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<SortByField>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>(initialRoleFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    initialStatusFilter === 'true' ? 'active' : initialStatusFilter === 'false' ? 'inactive' : 'all'
  );

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(search, 300);

  // Build query params
  const queryParams = useMemo<AdminUsersQueryParams>(() => {
    const params: AdminUsersQueryParams = {
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== 'ALL') params.roleFilter = roleFilter;
    if (statusFilter === 'active') params.statusFilter = true;
    if (statusFilter === 'inactive') params.statusFilter = false;
    return params;
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

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

  // Handle sort
  const handleSort = useCallback(
    (field: string) => {
      const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(field as SortByField);
      setSortOrder(newOrder);
      setPage(1);
      updateUrlParams({
        sortBy: field,
        sortOrder: newOrder,
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
      setStatusFilter(value as 'all' | 'active' | 'inactive');
      setPage(1);
      updateUrlParams({
        statusFilter: value === 'active' ? 'true' : value === 'inactive' ? 'false' : null,
        page: '1',
      });
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
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  // Empty state
  const isEmpty = data && data.users.length === 0;
  const hasFilters = debouncedSearch || roleFilter !== 'ALL' || statusFilter !== 'all';

  return (
    <PageTemplate
      title="User Management"
      description="Manage user accounts and roles"
      actions={
        data ? (
          <p className="text-sm text-neutral-500">
            {data.pagination.total} user{data.pagination.total !== 1 ? 's' : ''}
          </p>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
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

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
      {data && data.users.length > 0 && (
        <>
          <UserListTable
            users={data.users}
            currentUserId={currentUser?.id || ''}
            sortBy={sortBy || 'name'}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
              <p className="text-sm text-neutral-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(page * PAGE_SIZE, data.pagination.total)} of {data.pagination.total} users
              </p>
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
                  disabled={!data.pagination.hasMore}
                  className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </PageTemplate>
  );
}

export default AdminUserManagementPage;
