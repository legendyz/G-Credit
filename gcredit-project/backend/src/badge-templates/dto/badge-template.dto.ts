import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  IsEnum,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStatus } from '@prisma/client';
import { IssuanceCriteriaDto } from './issuance-criteria.dto';

export class CreateBadgeTemplateDto {
  @ApiProperty({
    example: 'TypeScript Advanced Certification',
    description: 'Badge template name',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({
    example:
      'Awarded upon completing the advanced TypeScript course and passing the exam',
    description: 'Badge description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: 'skill',
    description: 'Badge category',
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
    description: 'Associated skill IDs',
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
    description: 'Issuance criteria (structured)',
    type: IssuanceCriteriaDto,
  })
  @ValidateNested()
  @Type(() => IssuanceCriteriaDto)
  issuanceCriteria: IssuanceCriteriaDto;

  @ApiPropertyOptional({
    example: 365,
    description: 'Validity period (days), null means permanent',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;
}

export class UpdateBadgeTemplateDto {
  @ApiPropertyOptional({
    example: 'TypeScript Advanced Certification',
    description: 'Badge template name',
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiPropertyOptional({
    example:
      'Awarded upon completing the advanced TypeScript course and passing the exam',
    description: 'Badge description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 'skill',
    description: 'Badge category',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['achievement', 'skill', 'certification', 'participation'])
  category?: string;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    description: 'Associated skill IDs',
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
    description: 'Issuance criteria (structured)',
    type: IssuanceCriteriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IssuanceCriteriaDto)
  issuanceCriteria?: IssuanceCriteriaDto;

  @ApiPropertyOptional({
    example: 365,
    description: 'Validity period (days)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;

  @ApiPropertyOptional({
    enum: TemplateStatus,
    example: TemplateStatus.ACTIVE,
    description: 'Badge status',
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;
}

export class BadgeTemplateResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'TypeScript Advanced Certification' })
  name: string;

  @ApiPropertyOptional({
    example:
      'Awarded upon completing the advanced TypeScript course and passing the exam',
  })
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

  @ApiProperty({ enum: TemplateStatus, example: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @ApiProperty({ example: 'creator-uuid' })
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object, description: 'Creator information' })
  creator?: any;
}
