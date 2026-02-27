/**
 * Auth Store - Story 0.2a: Login & Navigation System
 *
 * Zustand store for authentication state management.
 * Tokens are stored in httpOnly cookies (Story 11.6 - SEC-002).
 * Frontend only tracks user info and authentication status.
 *
 * @see ADR-010: JWT Token Transport Migration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/apiFetch';
import { queryClient } from '../lib/queryClient';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // SSO login (validates cookies set by backend SSO redirect)
  loginViaSSO: () => Promise<boolean>;

  // Session validation (verifies cookie validity on app startup)
  sessionValidated: boolean;
  validateSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionValidated: false,

      // Login action — cookies set by server via Set-Cookie header
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid email or password');
          }

          const data = await response.json();

          // Clear stale query cache from previous user session
          queryClient.clear();

          set({
            user: data.user,
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

      // Register action — cookies set by server via Set-Cookie header
      register: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, firstName, lastName }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Registration failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registration failed',
            isAuthenticated: false,
          });
          throw err;
        }
      },

      // Logout — clear local state immediately, then server clears httpOnly cookies
      logout: async () => {
        // Clear auth state first to prevent route-guard race conditions
        set({
          user: null,
          isAuthenticated: false,
          sessionValidated: false,
          error: null,
        });

        // Clean up any legacy localStorage tokens (migration cleanup)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Clear all cached query data from previous user session
        queryClient.clear();

        // Clear all cached query data from previous user session
        queryClient.clear();

        try {
          await apiFetch('/auth/logout', { method: 'POST' });
        } catch {
          // Best-effort: server cookie will expire naturally if call fails
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading state
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // SSO login: cookies already set by backend redirect, validate and fetch profile
      loginViaSSO: async () => {
        set({ isLoading: true, error: null });
        try {
          const profileRes = await apiFetch('/auth/profile');
          if (profileRes.ok) {
            const data = await profileRes.json();
            queryClient.clear();
            set({
              user: data.user || data,
              isAuthenticated: true,
              isLoading: false,
              sessionValidated: true,
            });
            return true;
          }
          throw new Error('Session validation failed');
        } catch {
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
      },

      // Validate session on app startup
      // Tries /auth/profile (cookie sent automatically) → refresh if expired → logout
      validateSession: async () => {
        const state = get();
        if (!state.isAuthenticated) {
          set({ sessionValidated: true });
          return false;
        }

        try {
          // Verify session via profile endpoint (cookie auth)
          const profileRes = await apiFetch('/auth/profile');

          if (profileRes.ok) {
            const data = await profileRes.json();
            set({ user: data.user || data, sessionValidated: true });
            return true;
          }

          // Access token expired → try refresh (refresh cookie sent automatically)
          const refreshRes = await apiFetch('/auth/refresh', {
            method: 'POST',
          });

          if (refreshRes.ok) {
            // Retry profile with refreshed cookie
            const retryRes = await apiFetch('/auth/profile');
            if (retryRes.ok) {
              const data = await retryRes.json();
              set({ user: data.user || data, sessionValidated: true });
              return true;
            }
          }

          // Both failed → force logout
          await get().logout();
          set({ sessionValidated: true });
          return false;
        } catch {
          await get().logout();
          set({ sessionValidated: true });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive data (tokens are in httpOnly cookies)
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
