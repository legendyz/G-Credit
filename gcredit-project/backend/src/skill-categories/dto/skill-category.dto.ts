import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillCategoryDto {
  @ApiProperty({
    example: 'Frontend Development',
    description: 'Skill category name',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Frontend Development',
    description: 'English name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'Modern frontend frameworks like React, Vue, Angular',
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'da721a77-18c0-40e7-a7aa-269efe8e26bb',
    description:
      'Parent category ID (required, top-level creation not allowed)',
  })
  @IsUUID()
  parentId: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Display order',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateSkillCategoryDto {
  @ApiPropertyOptional({
    example: 'Frontend Development',
    description: 'Skill category name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Frontend Development',
    description: 'English name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'Modern frontend frameworks like React, Vue, Angular',
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10, description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class SkillCategoryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Frontend Development' })
  name: string;

  @ApiPropertyOptional({ example: 'Frontend Development' })
  nameEn: string | null;

  @ApiPropertyOptional({
    example: 'Modern frontend frameworks like React, Vue, Angular',
  })
  description: string | null;

  @ApiProperty({ example: 'parent-uuid' })
  parentId: string | null;

  @ApiProperty({ example: 2, description: 'Level: 1=top, 2=second, 3=third' })
  level: number;

  @ApiProperty({ example: false, description: 'System predefined' })
  isSystemDefined: boolean;

  @ApiProperty({ example: true, description: 'Editable' })
  isEditable: boolean;

  @ApiProperty({ example: 10 })
  displayOrder: number;

  @ApiProperty({ type: [Object], description: 'Subcategories' })
  children?: SkillCategoryResponseDto[];

  @ApiProperty({ type: [Object], description: 'Associated skills' })
  skills?: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
