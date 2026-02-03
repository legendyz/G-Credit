/**
 * Update User Status DTO - Story 8.10
 *
 * Request body for activating/deactivating a user via Admin panel.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'New active status for the user',
    example: false,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Audit note explaining the status change',
    maxLength: 200,
    example: 'User left organization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  auditNote?: string;
}
