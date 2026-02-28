/**
 * Auth Store — loginViaSSO Unit Tests (Story 13.4 Code Review)
 *
 * Direct unit tests for loginViaSSO() state transitions:
 * success → isAuthenticated, sessionValidated, user set
 * failure → isAuthenticated false, isLoading false
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';

// Mock apiFetch
vi.mock('../lib/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

// Mock queryClient
vi.mock('../lib/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}));

import { apiFetch } from '../lib/apiFetch';

const mockUser = {
  id: '1',
  email: 'sso@example.com',
  firstName: 'SSO',
  lastName: 'User',
  role: 'EMPLOYEE',
  isManager: false,
};

describe('authStore — loginViaSSO()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionValidated: false,
    });
  });

  it('sets isAuthenticated, user, and sessionValidated on success', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const result = await useAuthStore.getState().loginViaSSO();

    expect(result).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionValidated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
  });

  it('sets isLoading true during request', async () => {
    let resolveProfile: (value: unknown) => void;
    (apiFetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve;
      })
    );

    const promise = useAuthStore.getState().loginViaSSO();

    // While pending, isLoading should be true
    expect(useAuthStore.getState().isLoading).toBe(true);

    // Resolve and verify final state
    resolveProfile!({ ok: true, json: async () => ({ user: mockUser }) });
    await promise;
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('returns false and clears auth state on profile failure', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const result = await useAuthStore.getState().loginViaSSO();

    expect(result).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('returns false on network error', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const result = await useAuthStore.getState().loginViaSSO();

    expect(result).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
