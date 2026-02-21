import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';
import { MilestoneType } from '@prisma/client';

// --- Enums ---
export enum MilestoneMetric {
  BADGE_COUNT = 'badge_count',
  CATEGORY_COUNT = 'category_count',
}

export enum MilestoneScope {
  GLOBAL = 'global',
  CATEGORY = 'category',
}

// --- Trigger DTO ---
export class MilestoneTriggerDto {
  @ApiProperty({ enum: MilestoneMetric })
  @IsEnum(MilestoneMetric)
  metric: MilestoneMetric;

  @ApiProperty({ enum: MilestoneScope })
  @IsEnum(MilestoneScope)
  scope: MilestoneScope;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  threshold: number;

  @ApiPropertyOptional({ description: 'Required when scope=category' })
  @ValidateIf((o: MilestoneTriggerDto) => o.scope === MilestoneScope.CATEGORY)
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeSubCategories?: boolean;
}

// --- Create DTO ---
export class CreateMilestoneDto {
  @ApiProperty({ enum: MilestoneType })
  @IsEnum(MilestoneType)
  type: MilestoneType;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  title: string;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  description: string;

  @ApiProperty({ type: MilestoneTriggerDto })
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger: MilestoneTriggerDto;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  icon: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Update DTO ---
// NOTE: UpdateMilestoneDto intentionally does NOT include `type` — metric/scope
// are locked after creation (cannot change the fundamental measurement).
export class UpdateMilestoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @ApiPropertyOptional({ type: MilestoneTriggerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger?: MilestoneTriggerDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Response DTOs ---
export class MilestoneConfigResponseDto {
  id: string;
  type: string;
  title: string;
  description: string;
  trigger: {
    metric: string;
    scope: string;
    threshold: number;
    categoryId?: string;
    includeSubCategories?: boolean;
  };
  icon: string;
  isActive: boolean;
  achievementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MilestoneAchievementResponseDto {
  id: string;
  milestone: {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  };
  achievedAt: Date;
}
