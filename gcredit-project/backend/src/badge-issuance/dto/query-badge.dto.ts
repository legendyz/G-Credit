import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsIn,
  IsString,
  MaxLength,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeStatus } from '@prisma/client';

export class QueryBadgeDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    enum: BadgeStatus,
    description: 'Filter by badge status',
  })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @ApiPropertyOptional({
    description: 'Filter for active badges only (ISSUED + CLAIMED)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by template ID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description:
      'Search by recipient name, email, or template name (Story 9.5 AC5)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  // Story 8.2: Enhanced search filters
  @ApiPropertyOptional({
    description: 'Filter by skill IDs (comma-separated or array)',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsUUID('4', { each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Filter badges issued on or after this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter badges issued on or before this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by issuer ID (Admin only)',
  })
  @IsOptional()
  @IsUUID()
  issuerId?: string;

  @ApiPropertyOptional({ enum: ['issuedAt', 'claimedAt'], default: 'issuedAt' })
  @IsOptional()
  @IsIn(['issuedAt', 'claimedAt'])
  sortBy: 'issuedAt' | 'claimedAt' = 'issuedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
