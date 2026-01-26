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
import { BadgeStatus } from '@prisma/client';

export class QueryBadgeTemplatesDto {
  @ApiPropertyOptional({
    example: 1,
    description: '页码（从1开始）',
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
    description: '每页数量',
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
    enum: BadgeStatus,
    example: BadgeStatus.ACTIVE,
    description: '徽章状态筛选',
  })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @ApiPropertyOptional({
    example: 'skill',
    description: '徽章类别筛选',
    enum: ['achievement', 'skill', 'certification', 'participation'],
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: '技能ID筛选（包含该技能的徽章）',
  })
  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @ApiPropertyOptional({
    example: 'TypeScript',
    description: '搜索关键词（匹配名称或描述）',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: '排序字段',
    enum: ['createdAt', 'updatedAt', 'name'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedBadgeTemplatesResponseDto {
  @ApiPropertyOptional({ type: [Object], description: '徽章模板列表' })
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
    description: '分页元数据',
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
