/**
 * Shared QueryClient instance
 *
 * Extracted to a dedicated module so both App.tsx and authStore.ts
 * can reference the same instance without circular dependencies.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
