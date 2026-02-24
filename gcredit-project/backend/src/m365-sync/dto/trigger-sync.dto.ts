import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

/**
 * Sync Type Enum
 *
 * FULL: Complete sync of all users from M365
 * INCREMENTAL: Only sync changes (future enhancement)
 * GROUPS_ONLY: Re-check Security Group membership + manager for existing M365 users (Story 12.3a)
 */
export type SyncType = 'FULL' | 'INCREMENTAL' | 'GROUPS_ONLY';

/**
 * Trigger Sync DTO
 *
 * Request body for POST /api/admin/m365-sync endpoint.
 *
 * @see Story 8.9: M365 Production Hardening AC1
 * @see Story 12.3a: Group-only sync mode (AC #27)
 */
export class TriggerSyncDto {
  @ApiPropertyOptional({
    description:
      'Sync type: FULL (all users), INCREMENTAL (changes only), or GROUPS_ONLY (role + manager refresh)',
    enum: ['FULL', 'INCREMENTAL', 'GROUPS_ONLY'],
    default: 'FULL',
    example: 'FULL',
  })
  @IsOptional()
  @IsEnum(['FULL', 'INCREMENTAL', 'GROUPS_ONLY'], {
    message: 'syncType must be FULL, INCREMENTAL, or GROUPS_ONLY',
  })
  syncType?: SyncType = 'FULL';
}
