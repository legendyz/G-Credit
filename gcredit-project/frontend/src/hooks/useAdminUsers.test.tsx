/**
 * Admin Users Hooks Tests - Story 8.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from './useAdminUsers';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Create a mock fetch function
const mockFetch = vi.fn();

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
  });

  const mockUsersResponse = {
    users: [
      {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: true,
        lastLoginAt: '2026-02-01T10:30:00Z',
        roleSetManually: false,
        roleUpdatedAt: null,
        roleUpdatedBy: null,
        roleVersion: 0,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
      hasMore: false,
    },
  };

  it('fetches users successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsersResponse),
    });

    const { result } = renderHook(() => useAdminUsers({ page: 1, limit: 25 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUsersResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users'),
      expect.any(Object)
    );
  });

  it('includes search parameter in request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsersResponse),
    });

    const { result } = renderHook(() => useAdminUsers({ page: 1, limit: 25, search: 'john' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=john'),
      expect.any(Object)
    );
  });

  it('includes role filter parameter in request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsersResponse),
    });

    const { result } = renderHook(
      () => useAdminUsers({ page: 1, limit: 25, roleFilter: 'ADMIN' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('roleFilter=ADMIN'),
      expect.any(Object)
    );
  });

  it('handles 403 error for non-admin users', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });

    const { result } = renderHook(() => useAdminUsers({ page: 1, limit: 25 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Admin role required');
  });
});

describe('useUpdateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
  });

  const mockUpdateResponse = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'ISSUER',
    roleSetManually: true,
    roleUpdatedAt: '2026-02-03T10:30:00Z',
    roleUpdatedBy: 'admin-1',
    roleVersion: 1,
  };

  it('updates user role successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdateResponse),
    });

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-1',
      data: { role: 'ISSUER', roleVersion: 0 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUpdateResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/user-1/role'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'ISSUER', roleVersion: 0 }),
      })
    );
  });

  it('handles 409 conflict error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Conflict' }),
    });

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-1',
      data: { role: 'ISSUER', roleVersion: 0 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('modified by another process');
  });

  it('handles 400 error when changing own role', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Cannot change your own role' }),
    });

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'self-id',
      data: { role: 'EMPLOYEE', roleVersion: 0 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('Cannot change your own role');
  });
});

describe('useUpdateUserStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
  });

  const mockStatusResponse = {
    id: 'user-1',
    email: 'john@example.com',
    isActive: false,
  };

  it('deactivates user successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    });

    const { result } = renderHook(() => useUpdateUserStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-1',
      data: { isActive: false, auditNote: 'User left organization' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStatusResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/user-1/status'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          isActive: false,
          auditNote: 'User left organization',
        }),
      })
    );
  });

  it('activates user successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockStatusResponse, isActive: true }),
    });

    const { result } = renderHook(() => useUpdateUserStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-1',
      data: { isActive: true },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isActive).toBe(true);
  });
});
