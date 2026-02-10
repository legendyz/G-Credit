/**
 * Auth Store - Story 0.2a: Login & Navigation System
 *
 * Zustand store for authentication state management.
 * Handles login, logout, and token persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../lib/apiConfig';

/**
 * Decode JWT and check if it's expired.
 * Uses a 30-second buffer to avoid edge cases.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE';
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Token management
  setTokens: (accessToken: string, refreshToken: string) => void;
  getAccessToken: () => string | null;

  // Session validation (checks token expiry on app startup)
  sessionValidated: boolean;
  validateSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionValidated: false,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid email or password');
          }

          const data = await response.json();

          // Store tokens
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed',
            isAuthenticated: false,
          });
          throw err;
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          sessionValidated: false,
          error: null,
        });
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Set tokens (for refresh)
      setTokens: (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      // Get access token
      getAccessToken: () => {
        const state = get();
        return state.accessToken || localStorage.getItem('accessToken');
      },

      // Validate session on app startup
      // Checks access token expiry → tries refresh → logs out if both expired
      validateSession: async () => {
        const state = get();
        if (!state.isAuthenticated) {
          set({ sessionValidated: true });
          return false;
        }

        const accessToken = state.accessToken || localStorage.getItem('accessToken');

        // Access token still valid → session OK
        if (!isTokenExpired(accessToken)) {
          set({ sessionValidated: true });
          return true;
        }

        // Access token expired → try refresh
        const refreshTk = state.refreshToken || localStorage.getItem('refreshToken');

        if (!refreshTk || isTokenExpired(refreshTk)) {
          // Refresh token also expired → force logout
          get().logout();
          set({ sessionValidated: true });
          return false;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTk }),
          });

          if (!response.ok) {
            get().logout();
            set({ sessionValidated: true });
            return false;
          }

          const data = await response.json();
          get().setTokens(data.accessToken, data.refreshToken);
          set({ sessionValidated: true });
          return true;
        } catch {
          get().logout();
          set({ sessionValidated: true });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
