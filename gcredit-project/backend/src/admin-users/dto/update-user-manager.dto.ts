/**
 * Update User Manager DTO
 *
 * Request body for updating a user's manager (managerId).
 * Setting managerId to null removes the manager assignment.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUserManagerDto {
  @ApiProperty({
    description:
      'New manager user ID (UUID), or null to remove manager assignment',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  managerId: string | null;

  @ApiPropertyOptional({
    description: 'Audit note explaining the manager change',
    maxLength: 200,
    example: 'Reassigned to new team lead',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  auditNote?: string;
}
