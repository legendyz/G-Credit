/**
 * M365 Sync Hooks — Story 12.3a AC #28, #29
 *
 * TanStack Query hooks for M365 sync operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerSync, getSyncLogs, getIntegrationStatus } from '@/lib/m365SyncApi';

// Query key factory
export const m365SyncKeys = {
  all: ['m365-sync'] as const,
  logs: () => [...m365SyncKeys.all, 'logs'] as const,
  logList: (limit?: number) => [...m365SyncKeys.logs(), { limit }] as const,
  status: () => [...m365SyncKeys.all, 'status'] as const,
};

/**
 * Hook to fetch sync logs (history)
 */
export function useM365SyncLogs(limit?: number) {
  return useQuery({
    queryKey: m365SyncKeys.logList(limit),
    queryFn: () => getSyncLogs(limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get M365 integration status
 */
export function useM365IntegrationStatus() {
  return useQuery({
    queryKey: m365SyncKeys.status(),
    queryFn: () => getIntegrationStatus(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to trigger M365 sync
 */
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (syncType: 'FULL' | 'GROUPS_ONLY') => triggerSync(syncType),
    onSuccess: () => {
      // Invalidate sync logs + status to refetch
      queryClient.invalidateQueries({ queryKey: m365SyncKeys.logs() });
      queryClient.invalidateQueries({ queryKey: m365SyncKeys.status() });
    },
  });
}
