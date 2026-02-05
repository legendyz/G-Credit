import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sync Log DTO
 *
 * Response from GET /api/admin/m365-sync/logs endpoints.
 * Represents a single sync log entry from M365SyncLog table.
 *
 * @see Story 8.9: M365 Production Hardening AC3
 */
export class SyncLogDto {
  @ApiProperty({
    description: 'Unique identifier for the sync log',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Date and time when sync was performed',
    example: '2026-02-05T10:30:00.000Z',
  })
  syncDate: Date;

  @ApiProperty({
    description: 'Type of sync: FULL or INCREMENTAL',
    example: 'FULL',
  })
  syncType: string;

  @ApiProperty({
    description: 'Total number of users found in M365',
    example: 150,
  })
  userCount: number;

  @ApiProperty({
    description: 'Number of users successfully synced',
    example: 148,
  })
  syncedCount: number;

  @ApiProperty({
    description: 'Number of new users created',
    example: 5,
  })
  createdCount: number;

  @ApiProperty({
    description: 'Number of existing users updated',
    example: 143,
  })
  updatedCount: number;

  @ApiProperty({
    description: 'Number of users that failed to sync (AC3)',
    example: 2,
  })
  failedCount: number;

  @ApiProperty({
    description: 'Status of the sync operation',
    enum: ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE', 'IN_PROGRESS'],
    example: 'SUCCESS',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Error message if sync failed or partially failed',
    example: 'Failed to sync 2 users: user1@example.com, user2@example.com',
  })
  errorMessage: string | null;

  @ApiPropertyOptional({
    description: 'Duration of sync in milliseconds',
    example: 15234,
  })
  durationMs: number | null;

  @ApiPropertyOptional({
    description: 'Who triggered the sync (user email or SYSTEM for scheduled)',
    example: 'admin@example.com',
  })
  syncedBy: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata (retry info, pagination, etc.)',
    example: { retryAttempts: 0, pagesProcessed: 2 },
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Timestamp when log was created',
    example: '2026-02-05T10:30:00.000Z',
  })
  createdAt: Date;
}

/**
 * Integration Status DTO
 *
 * Response from GET /api/admin/m365-sync/status endpoint.
 * Provides quick status check for M365 integration.
 */
export class IntegrationStatusDto {
  @ApiProperty({
    description: 'Whether M365 integration is available and configured',
    example: true,
  })
  available: boolean;

  @ApiPropertyOptional({
    description: 'Date of last successful sync (null if never synced)',
    example: '2026-02-05T10:30:00.000Z',
  })
  lastSync: Date | null;

  @ApiPropertyOptional({
    description: 'Status of last sync operation',
    example: 'SUCCESS',
  })
  lastSyncStatus: string | null;

  @ApiPropertyOptional({
    description: 'Number of users from last sync',
    example: 150,
  })
  lastSyncUserCount: number | null;
}
