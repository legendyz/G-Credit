/**
 * Shared QueryClient instance
 *
 * Extracted to a dedicated module so both App.tsx and authStore.ts
 * can reference the same instance without circular dependencies.
 *
 * Story 13.5: retry config updated — skip 401s (interceptor handles those).
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 401s — the apiFetch interceptor handles token refresh
        if (
          error instanceof Error &&
          'status' in error &&
          (error as { status: number }).status === 401
        )
          return false;
        // Default: retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
