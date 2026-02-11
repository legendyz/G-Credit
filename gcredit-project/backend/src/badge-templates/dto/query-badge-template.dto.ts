import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStatus } from '@prisma/client';

export class QueryBadgeTemplatesDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starting from 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: TemplateStatus,
    example: TemplateStatus.ACTIVE,
    description: 'Filter by badge status',
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({
    example: 'skill',
    description: 'Filter by badge category',
    enum: ['achievement', 'skill', 'certification', 'participation'],
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Filter by skill ID (badges containing this skill)',
  })
  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @ApiPropertyOptional({
    example: 'TypeScript',
    description: 'Search keyword (matches name or description)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'name'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedBadgeTemplatesResponseDto {
  @ApiPropertyOptional({ type: [Object], description: 'Badge template list' })
  data: any[];

  @ApiPropertyOptional({
    example: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    },
    description: 'Pagination metadata',
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
