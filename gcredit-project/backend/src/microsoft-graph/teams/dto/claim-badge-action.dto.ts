/**
 * Claim Badge Action DTO
 *
 * Story 7.4 Task 5 / Story 11.25 AC-C2
 * Request body for Teams Adaptive Card "Claim Badge" action.
 * Uses one-time claimToken for authorization (no JWT required).
 */

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimBadgeActionDto {
  @ApiProperty({
    description:
      'One-time claim token embedded in the Teams Adaptive Card. Validates and authorizes the claim.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @IsString()
  claimToken: string;
}
