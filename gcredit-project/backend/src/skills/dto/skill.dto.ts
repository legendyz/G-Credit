import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export class CreateSkillDto {
  @ApiProperty({ example: 'React.js', description: 'Skill name' })
  @IsString()
  @SanitizeHtml()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'React 18+ with Hooks and Context',
    description: 'Skill description',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @ApiProperty({
    example: 'uuid',
    description: 'Category ID',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: 'Skill level',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({ example: 'React.js', description: 'Skill name' })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'React 18+ with Hooks and Context',
    description: 'Skill description',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: 'Skill level',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Category ID (reassign skill to different category)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class SkillResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'React.js' })
  name: string;

  @ApiPropertyOptional({ example: 'React 18+ with Hooks and Context' })
  description: string | null;

  @ApiProperty({ example: 'category-uuid' })
  categoryId: string;

  @ApiPropertyOptional({ enum: SkillLevel, example: SkillLevel.INTERMEDIATE })
  level: SkillLevel | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: Object, description: 'Category information' })
  category?: any;
}
