/**
 * M365 Sync API — Story 12.3a AC #28, #29
 *
 * API functions for M365 sync trigger, logs, and status.
 */

import { apiFetchJson } from './apiFetch';

export interface SyncResult {
  syncId: string;
  status: string;
  totalUsers: number;
  syncedUsers: number;
  createdUsers: number;
  updatedUsers: number;
  deactivatedUsers: number;
  failedUsers: number;
  errors: string[];
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface SyncLog {
  id: string;
  syncDate: string;
  syncType: string;
  userCount: number;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
  syncedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IntegrationStatus {
  available: boolean;
  lastSync: string | null;
  lastSyncStatus: string | null;
  lastSyncUserCount: number | null;
}

export async function triggerSync(syncType: 'FULL' | 'GROUPS_ONLY' = 'FULL'): Promise<SyncResult> {
  return apiFetchJson<SyncResult>('/admin/m365-sync', {
    method: 'POST',
    body: JSON.stringify({ syncType }),
  });
}

export async function getSyncLogs(limit = 10): Promise<SyncLog[]> {
  return apiFetchJson<SyncLog[]>(`/admin/m365-sync/logs?limit=${limit}`);
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  return apiFetchJson<IntegrationStatus>('/admin/m365-sync/status');
}
