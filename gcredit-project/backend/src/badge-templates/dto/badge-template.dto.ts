import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsObject,
  IsInt,
  IsEnum,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeStatus } from '@prisma/client';
import { IssuanceCriteriaDto } from './issuance-criteria.dto';

export class CreateBadgeTemplateDto {
  @ApiProperty({
    example: 'TypeScript高级认证',
    description: '徽章模板名称',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({
    example: '完成TypeScript高级课程并通过考试后获得',
    description: '徽章描述',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: 'skill',
    description: '徽章类别',
    enum: ['achievement', 'skill', 'certification', 'participation'],
  })
  @IsString()
  @IsEnum(['achievement', 'skill', 'certification', 'participation'], {
    message:
      'Category must be one of: achievement, skill, certification, participation',
  })
  category: string;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: '关联的技能ID数组',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds: string[];

  @ApiProperty({
    example: {
      type: 'auto_exam_score',
      conditions: [
        { field: 'examId', operator: '==', value: 'ts-advanced' },
        { field: 'score', operator: '>=', value: 90 },
      ],
      logicOperator: 'all',
      description: 'Complete TypeScript exam with 90%+ score',
    },
    description: '颁发标准（结构化）',
    type: IssuanceCriteriaDto,
  })
  @ValidateNested()
  @Type(() => IssuanceCriteriaDto)
  issuanceCriteria: IssuanceCriteriaDto;

  @ApiPropertyOptional({
    example: 365,
    description: '有效期（天数），null表示永久有效',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;
}

export class UpdateBadgeTemplateDto {
  @ApiPropertyOptional({
    example: 'TypeScript高级认证',
    description: '徽章模板名称',
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiPropertyOptional({
    example: '完成TypeScript高级课程并通过考试后获得',
    description: '徽章描述',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 'skill',
    description: '徽章类别',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['achievement', 'skill', 'certification', 'participation'])
  category?: string;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    description: '关联的技能ID数组',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({
    example: {
      type: 'auto_exam_score',
      conditions: [
        { field: 'examId', operator: '==', value: 'ts-advanced' },
        { field: 'score', operator: '>=', value: 90 },
      ],
      logicOperator: 'all',
    },
    description: '颁发标准（结构化）',
    type: IssuanceCriteriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssuanceCriteriaDto)
  issuanceCriteria?: IssuanceCriteriaDto;

  @ApiPropertyOptional({
    example: 365,
    description: '有效期（天数）',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;

  @ApiPropertyOptional({
    enum: BadgeStatus,
    example: BadgeStatus.ACTIVE,
    description: '徽章状态',
  })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;
}

export class BadgeTemplateResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'TypeScript高级认证' })
  name: string;

  @ApiPropertyOptional({ example: '完成TypeScript高级课程并通过考试后获得' })
  description: string | null;

  @ApiPropertyOptional({
    example: 'https://gcreditdevstoragelz.blob.core.windows.net/badges/...',
  })
  imageUrl: string | null;

  @ApiProperty({ example: 'skill' })
  category: string;

  @ApiProperty({ example: ['uuid-1', 'uuid-2'], type: [String] })
  skillIds: string[];

  @ApiProperty({ example: { type: 'exam_score', conditions: [] } })
  issuanceCriteria: any;

  @ApiPropertyOptional({ example: 365 })
  validityPeriod: number | null;

  @ApiProperty({ enum: BadgeStatus, example: BadgeStatus.DRAFT })
  status: BadgeStatus;

  @ApiProperty({ example: 'creator-uuid' })
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object, description: '创建者信息' })
  creator?: any;
}
