import { IsOptional, IsInt, Min, Max, IsEnum, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeStatus } from '@prisma/client';

export class QueryBadgeDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ enum: BadgeStatus, description: 'Filter by badge status' })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @ApiPropertyOptional({ description: 'Filter by template ID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ enum: ['issuedAt', 'claimedAt'], default: 'issuedAt' })
  @IsOptional()
  @IsIn(['issuedAt', 'claimedAt'])
  sortBy: 'issuedAt' | 'claimedAt' = 'issuedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
