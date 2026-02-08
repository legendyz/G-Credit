/**
 * Admin Users API Types - Story 8.10
 */

export type UserRole = 'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE';

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
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
}

export interface AdminUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleFilter?: UserRole;
  statusFilter?: boolean;
  sortBy?: 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
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

import { API_BASE_URL } from './apiConfig';

const API_BASE = `${API_BASE_URL}/admin/users`;

/**
 * Helper to get auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
  if (params.statusFilter !== undefined)
    searchParams.set('statusFilter', params.statusFilter.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`, {
    headers: getAuthHeaders(),
  });

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
  const response = await fetch(`${API_BASE}/${userId}`, {
    headers: getAuthHeaders(),
  });

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
  const response = await fetch(`${API_BASE}/${userId}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
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
  const response = await fetch(`${API_BASE}/${userId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
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
