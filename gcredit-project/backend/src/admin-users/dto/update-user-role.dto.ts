/**
 * Update User Role DTO - Story 8.10
 *
 * Request body for updating a user's role via Admin panel.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: 'ISSUER',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Audit note explaining the role change',
    maxLength: 200,
    example: 'Promoted to badge issuer for HR department',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  auditNote?: string;

  @ApiProperty({
    description: 'Current role version for optimistic locking',
    example: 0,
  })
  @IsInt()
  @Min(0)
  roleVersion: number;
}
