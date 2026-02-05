import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

/**
 * Sync Type Enum
 *
 * FULL: Complete sync of all users from M365
 * INCREMENTAL: Only sync changes (future enhancement)
 */
export type SyncType = 'FULL' | 'INCREMENTAL';

/**
 * Trigger Sync DTO
 *
 * Request body for POST /api/admin/m365-sync endpoint.
 *
 * @see Story 8.9: M365 Production Hardening AC1
 */
export class TriggerSyncDto {
  @ApiPropertyOptional({
    description: 'Sync type: FULL (all users) or INCREMENTAL (changes only)',
    enum: ['FULL', 'INCREMENTAL'],
    default: 'FULL',
    example: 'FULL',
  })
  @IsOptional()
  @IsEnum(['FULL', 'INCREMENTAL'], {
    message: 'syncType must be either FULL or INCREMENTAL',
  })
  syncType?: SyncType = 'FULL';
}
