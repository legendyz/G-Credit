/**
 * Admin Users API Types - Story 8.10, 12.3b
 */

export type UserRole = 'ADMIN' | 'ISSUER' | 'EMPLOYEE'; // ADR-017: MANAGER removed; manager identity from directReports

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  roleSetManually: boolean;
  roleUpdatedAt: string | null;
  roleUpdatedBy: string | null;
  roleVersion: number;
  createdAt: string;
  // 12.3b additions
  source: 'M365' | 'LOCAL';
  sourceLabel: string;
  badgeCount: number;
  lastSyncAt: string | null;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  directReportsCount: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  meta: PaginationInfo;
}

export interface AdminUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleFilter?: UserRole;
  statusFilter?: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
  sourceFilter?: 'M365' | 'LOCAL';
  sortBy?:
    | 'name'
    | 'email'
    | 'role'
    | 'department'
    | 'status'
    | 'lastLogin'
    | 'createdAt'
    | 'source'
    | 'badgeCount';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  role: UserRole;
  managerId?: string;
}

export interface CreateUserResponse extends AdminUser {
  managerAutoUpgraded?: {
    managerId: string;
    managerEmail: string;
    managerName: string;
    previousRole: UserRole;
  };
}

export interface UpdateRoleRequest {
  role: UserRole;
  auditNote?: string;
  roleVersion: number;
}

export interface UpdateRoleResponse {
  id: string;
  email: string;
  role: UserRole;
  roleSetManually: boolean;
  roleUpdatedAt: string;
  roleUpdatedBy: string;
  roleVersion: number;
}

export interface UpdateStatusRequest {
  isActive: boolean;
  auditNote?: string;
}

export interface UpdateStatusResponse {
  id: string;
  email: string;
  isActive: boolean;
}

export interface UpdateDepartmentRequest {
  department: string;
  auditNote?: string;
}

export interface UpdateDepartmentResponse {
  id: string;
  email: string;
  department: string;
}

export interface UpdateManagerRequest {
  managerId: string | null;
  auditNote?: string;
}

export interface UpdateManagerResponse {
  id: string;
  email: string;
  managerId: string | null;
  managerName: string | null;
  managerAutoUpgraded?: {
    managerId: string;
    managerName: string;
    previousRole: UserRole;
  };
  managerAutoDowngraded?: {
    managerId: string;
    managerName: string;
  };
}

import { apiFetch } from './apiFetch';

/**
 * Get list of users with pagination, filtering, and sorting
 */
export async function getAdminUsers(
  params: AdminUsersQueryParams = {}
): Promise<AdminUsersResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.roleFilter) searchParams.set('roleFilter', params.roleFilter);
  if (params.statusFilter) searchParams.set('statusFilter', params.statusFilter);
  if (params.sourceFilter) searchParams.set('sourceFilter', params.sourceFilter);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const response = await apiFetch(`/admin/users?${searchParams.toString()}`);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Access denied. Admin role required.');
    }
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

/**
 * Get single user by ID
 */
export async function getAdminUser(userId: string): Promise<AdminUser> {
  const response = await apiFetch(`/admin/users/${userId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  data: UpdateRoleRequest
): Promise<UpdateRoleResponse> {
  const response = await apiFetch(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || 'Cannot change your own role');
    }
    if (response.status === 409) {
      throw new Error('User role was modified by another process. Please refresh and try again.');
    }
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to update user role');
  }

  return response.json();
}

/**
 * Update user status (activate/deactivate)
 */
export async function updateUserStatus(
  userId: string,
  data: UpdateStatusRequest
): Promise<UpdateStatusResponse> {
  const response = await apiFetch(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || 'Cannot deactivate your own account');
    }
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to update user status');
  }

  return response.json();
}

/**
 * Create a local user (12.3b)
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create user');
  }

  return response.json();
}

/**
 * Delete a local user (12.3b)
 */
export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await apiFetch(`/admin/users/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete user');
  }

  return response.json();
}

/**
 * Update user department
 */
export async function updateUserDepartment(
  userId: string,
  data: UpdateDepartmentRequest
): Promise<UpdateDepartmentResponse> {
  const response = await apiFetch(`/admin/users/${userId}/department`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update department');
  }

  return response.json();
}

/**
 * Update user manager assignment
 */
export async function updateUserManager(
  userId: string,
  data: UpdateManagerRequest
): Promise<UpdateManagerResponse> {
  const response = await apiFetch(`/admin/users/${userId}/manager`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid manager assignment');
    }
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to update manager');
  }

  return response.json();
}
