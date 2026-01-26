import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export class CreateSkillDto {
  @ApiProperty({ example: 'React.js', description: '技能名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'React 18+ with Hooks and Context',
    description: '技能描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'uuid',
    description: '所属分类ID',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: '技能等级',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({ example: 'React.js', description: '技能名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'React 18+ with Hooks and Context',
    description: '技能描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
    description: '技能等级',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;
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

  @ApiProperty({ type: Object, description: '所属分类信息' })
  category?: any;
}
