import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BadgeStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WalletQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: BadgeStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @ApiPropertyOptional({ enum: ['issuedAt_desc', 'issuedAt_asc'], default: 'issuedAt_desc' })
  @IsOptional()
  @IsEnum(['issuedAt_desc', 'issuedAt_asc'])
  sort?: 'issuedAt_desc' | 'issuedAt_asc' = 'issuedAt_desc';

  // Story 8.2: Enhanced search filters
  @ApiPropertyOptional({ description: 'Search by template name or issuer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by skill IDs (comma-separated or array)',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsUUID('4', { each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Filter badges issued on or after this date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter badges issued on or before this date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export interface DateGroup {
  label: string; // "January 2026"
  count: number;
  startIndex: number;
}

export interface WalletResponse {
  badges: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  dateGroups: DateGroup[];
}
