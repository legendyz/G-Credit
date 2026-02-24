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
  updateUserDepartment,
  updateUserManager,
  createUser,
  deleteUser,
  type AdminUsersQueryParams,
  type UpdateRoleRequest,
  type UpdateStatusRequest,
  type UpdateDepartmentRequest,
  type UpdateManagerRequest,
  type UpdateManagerResponse,
  type CreateUserRequest,
  type CreateUserResponse,
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

/**
 * Hook to update user department
 */
export function useUpdateUserDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateDepartmentRequest }) =>
      updateUserDepartment(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}

/**
 * Hook to create a local user (12.3b)
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}

/**
 * Hook to update user manager (12.5)
 */
export function useUpdateUserManager() {
  const queryClient = useQueryClient();

  return useMutation<UpdateManagerResponse, Error, { userId: string; data: UpdateManagerRequest }>({
    mutationFn: ({ userId, data }) => updateUserManager(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}

/**
 * Hook to delete a local user (12.3b)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}
