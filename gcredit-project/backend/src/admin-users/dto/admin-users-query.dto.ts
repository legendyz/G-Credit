/**
 * Admin Users Query DTO - Story 8.10
 *
 * Query parameters for listing users with pagination, filtering, and sorting.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Search by name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  roleFilter?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ACTIVE', 'LOCKED', 'INACTIVE'],
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'LOCKED', 'INACTIVE'])
  statusFilter?: 'ACTIVE' | 'LOCKED' | 'INACTIVE';

  @ApiPropertyOptional({
    description: 'Filter by user source',
    enum: ['M365', 'LOCAL'],
  })
  @IsOptional()
  @IsIn(['M365', 'LOCAL'])
  sourceFilter?: 'M365' | 'LOCAL';

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'name',
      'email',
      'role',
      'department',
      'status',
      'lastLogin',
      'createdAt',
    ],
    default: 'name',
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | 'name'
    | 'email'
    | 'role'
    | 'department'
    | 'status'
    | 'lastLogin'
    | 'createdAt' = 'name';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    description: 'Cursor for pagination (for large datasets)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
