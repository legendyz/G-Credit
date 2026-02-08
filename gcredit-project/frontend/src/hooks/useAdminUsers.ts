/**
 * Admin Users Hooks - Story 8.10
 *
 * TanStack Query hooks for Admin User Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUsersQueryParams,
  type UpdateRoleRequest,
  type UpdateStatusRequest,
} from '@/lib/adminUsersApi';

// Query key factory
export const adminUsersKeys = {
  all: ['admin-users'] as const,
  lists: () => [...adminUsersKeys.all, 'list'] as const,
  list: (params: AdminUsersQueryParams) => [...adminUsersKeys.lists(), params] as const,
  details: () => [...adminUsersKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUsersKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated user list
 */
export function useAdminUsers(params: AdminUsersQueryParams = {}) {
  return useQuery({
    queryKey: adminUsersKeys.list(params),
    queryFn: () => getAdminUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateRoleRequest }) =>
      updateUserRole(userId, data),
    onSuccess: () => {
      // Invalidate all user lists to refetch
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}

/**
 * Hook to update user status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateStatusRequest }) =>
      updateUserStatus(userId, data),
    onSuccess: () => {
      // Invalidate all user lists to refetch
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}
