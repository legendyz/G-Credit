import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MilestoneTriggerType {
  BADGE_COUNT = 'badge_count',
  SKILL_TRACK = 'skill_track',
  ANNIVERSARY = 'anniversary',
}

export class MilestoneTriggerDto {
  @ApiProperty({
    description: 'Type of trigger',
    enum: MilestoneTriggerType,
    example: MilestoneTriggerType.BADGE_COUNT,
  })
  @IsEnum(MilestoneTriggerType)
  type: MilestoneTriggerType;

  @ApiPropertyOptional({
    description: 'Badge count required (for badge_count trigger)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  value?: number;

  @ApiPropertyOptional({
    description: 'Category ID (for skill_track trigger)',
    example: 'category-uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Required badge count in category (for skill_track trigger)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  requiredBadgeCount?: number;

  @ApiPropertyOptional({
    description: 'Months since registration (for anniversary trigger)',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  months?: number;
}

export class CreateMilestoneDto {
  @ApiProperty({
    description: 'Milestone type identifier',
    example: 'badge-collector',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Milestone title',
    example: '🎉 10 Badges Earned!',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Milestone description',
    example: "You've earned 10 badges! Keep up the great work!",
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Trigger configuration (JSON)',
    type: MilestoneTriggerDto,
  })
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger: MilestoneTriggerDto;

  @ApiProperty({
    description: 'Milestone icon/emoji',
    example: '🎉',
  })
  @IsString()
  icon: string;

  @ApiPropertyOptional({
    description: 'Whether milestone is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional({
    description: 'Milestone title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Milestone description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Trigger configuration (JSON)',
    type: MilestoneTriggerDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger?: MilestoneTriggerDto;

  @ApiPropertyOptional({
    description: 'Milestone icon/emoji',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Whether milestone is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MilestoneConfigResponseDto {
  id: string;
  type: string;
  title: string;
  description: string;
  trigger: any;
  icon: string;
  isActive: boolean;
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
