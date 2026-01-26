import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillCategoryDto {
  @ApiProperty({ example: '前端开发', description: '技能分类名称（中文）' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Frontend Development',
    description: '英文名称',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'React、Vue、Angular等现代前端框架',
    description: '分类描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'da721a77-18c0-40e7-a7aa-269efe8e26bb',
    description: '父分类ID（必须，不允许创建顶层分类）',
  })
  @IsUUID()
  parentId: string;

  @ApiPropertyOptional({ example: 10, description: '显示顺序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateSkillCategoryDto {
  @ApiPropertyOptional({
    example: '前端开发',
    description: '技能分类名称（中文）',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Frontend Development',
    description: '英文名称',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'React、Vue、Angular等现代前端框架',
    description: '分类描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10, description: '显示顺序' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class SkillCategoryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '前端开发' })
  name: string;

  @ApiPropertyOptional({ example: 'Frontend Development' })
  nameEn: string | null;

  @ApiPropertyOptional({ example: 'React、Vue、Angular等现代前端框架' })
  description: string | null;

  @ApiProperty({ example: 'parent-uuid' })
  parentId: string | null;

  @ApiProperty({ example: 2, description: '层级：1=顶层，2=二级，3=三级' })
  level: number;

  @ApiProperty({ example: false, description: '是否系统预设' })
  isSystemDefined: boolean;

  @ApiProperty({ example: true, description: '是否可编辑' })
  isEditable: boolean;

  @ApiProperty({ example: 10 })
  displayOrder: number;

  @ApiProperty({ type: [Object], description: '子分类' })
  children?: SkillCategoryResponseDto[];

  @ApiProperty({ type: [Object], description: '关联技能' })
  skills?: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
