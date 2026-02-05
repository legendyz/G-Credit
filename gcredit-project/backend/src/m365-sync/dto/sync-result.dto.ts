import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sync Status Enum
 *
 * SUCCESS: All users synced successfully
 * PARTIAL_SUCCESS: Some users synced, others failed
 * FAILED: No users synced, complete failure
 *
 * Note: Aligned with database enum in Prisma schema
 */
export type SyncStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';

/**
 * Sync Result DTO
 *
 * Response from POST /api/admin/m365-sync endpoint.
 * Contains detailed information about the sync operation.
 *
 * @see Story 8.9: M365 Production Hardening AC3
 */
export class SyncResultDto {
  @ApiProperty({
    description: 'Unique identifier for this sync operation',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  syncId: string;

  @ApiProperty({
    description: 'Status of the sync operation',
    enum: ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED'],
    example: 'SUCCESS',
  })
  status: SyncStatus;

  @ApiProperty({
    description: 'Total number of users found in M365',
    example: 150,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of users successfully synced',
    example: 148,
  })
  syncedUsers: number;

  @ApiProperty({
    description: 'Number of new users created',
    example: 5,
  })
  createdUsers: number;

  @ApiProperty({
    description: 'Number of existing users updated',
    example: 143,
  })
  updatedUsers: number;

  @ApiProperty({
    description: 'Number of users deactivated (not found in M365)',
    example: 2,
  })
  deactivatedUsers: number;

  @ApiProperty({
    description: 'Number of users that failed to sync',
    example: 2,
  })
  failedUsers: number;

  @ApiPropertyOptional({
    description: 'Error messages for failed users',
    type: [String],
    example: ['user@example.com: Database constraint violation'],
  })
  errors: string[];

  @ApiProperty({
    description: 'Total duration of sync operation in milliseconds',
    example: 15234,
  })
  durationMs: number;

  @ApiProperty({
    description: 'Timestamp when sync started',
    example: '2026-02-05T10:30:00.000Z',
  })
  startedAt: Date;

  @ApiProperty({
    description: 'Timestamp when sync completed',
    example: '2026-02-05T10:30:15.234Z',
  })
  completedAt: Date;
}
