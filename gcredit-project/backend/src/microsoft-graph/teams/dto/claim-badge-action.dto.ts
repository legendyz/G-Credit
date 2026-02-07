/**
 * Claim Badge Action DTO
 *
 * Story 7.4 Task 5
 * Request body for Teams Adaptive Card "Claim Badge" action
 */

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimBadgeActionDto {
  @ApiProperty({
    description: 'Badge ID to claim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  badgeId: string;

  @ApiProperty({
    description: 'User ID of the person claiming (must be badge recipient)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  userId: string;
}
