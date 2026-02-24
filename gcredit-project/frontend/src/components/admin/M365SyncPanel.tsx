/**
 * M365 Sync Panel — Story 12.3a AC #28, #29
 *
 * Sync buttons (Sync Users + Sync Roles) + history table.
 * Integrates into existing AdminUserManagementPage as a collapsible section.
 */

import { useState } from 'react';
import {
  RefreshCw,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useM365SyncLogs, useM365IntegrationStatus, useTriggerSync } from '@/hooks/useM365Sync';
import { toast } from 'sonner';

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function SyncTypeBadge({ syncType }: { syncType: string }) {
  const variant =
    syncType === 'FULL' ? 'default' : syncType === 'GROUPS_ONLY' ? 'secondary' : 'outline';

  return (
    <Badge variant={variant} className="text-xs">
      {syncType === 'GROUPS_ONLY' ? 'Roles Only' : syncType}
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'SUCCESS') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'PARTIAL_SUCCESS') return <CheckCircle2 className="h-4 w-4 text-yellow-600" />;
  if (status === 'IN_PROGRESS') return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

export function M365SyncPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: logs, isLoading: logsLoading } = useM365SyncLogs(10);
  const { data: status } = useM365IntegrationStatus();
  const triggerSync = useTriggerSync();

  const handleSync = async (syncType: 'FULL' | 'GROUPS_ONLY') => {
    const label = syncType === 'FULL' ? 'User Sync' : 'Role Sync';
    try {
      const result = await triggerSync.mutateAsync(syncType);
      toast.success(
        `${label} Complete: ${result.syncedUsers} synced, ${result.createdUsers} created, ${result.updatedUsers} updated`
      );
    } catch (error) {
      toast.error(`${label} Failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
          <div className="text-left">
            <h3 className="text-sm font-semibold">Microsoft 365 Sync</h3>
            {status?.lastSync && (
              <p className="text-xs text-muted-foreground">
                Last sync: {formatDate(status.lastSync)} · Status: {status.lastSyncStatus}
              </p>
            )}
          </div>
          {status && (
            <Badge
              variant={status.available ? 'default' : 'destructive'}
              className={`text-xs ${status.available ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            >
              {status.available ? 'Connected' : 'Unavailable'}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t px-6 py-4 space-y-4">
          {/* Sync Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleSync('FULL')}
              disabled={triggerSync.isPending || !status?.available}
              size="sm"
            >
              {triggerSync.isPending && triggerSync.variables === 'FULL' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Sync Users
            </Button>
            <Button
              onClick={() => handleSync('GROUPS_ONLY')}
              disabled={triggerSync.isPending || !status?.available}
              variant="outline"
              size="sm"
            >
              {triggerSync.isPending && triggerSync.variables === 'GROUPS_ONLY' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Sync Roles
            </Button>
          </div>

          {/* Sync History Table */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sync History</h4>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">No sync history yet</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[160px]">Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Synced</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{formatDate(log.syncDate)}</TableCell>
                        <TableCell>
                          <SyncTypeBadge syncType={log.syncType} />
                        </TableCell>
                        <TableCell className="text-right">{log.userCount}</TableCell>
                        <TableCell className="text-right">{log.syncedCount}</TableCell>
                        <TableCell className="text-right">{log.createdCount}</TableCell>
                        <TableCell className="text-right">{log.updatedCount}</TableCell>
                        <TableCell className="text-right">
                          {log.failedCount > 0 ? (
                            <span className="text-red-600 font-medium">{log.failedCount}</span>
                          ) : (
                            log.failedCount
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={log.status} />
                            <span className="text-xs">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatDuration(log.durationMs)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
