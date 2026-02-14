import { IsEnum } from 'class-validator';
import { BadgeVisibility } from '@prisma/client';

export class UpdateBadgeVisibilityDto {
  @IsEnum(BadgeVisibility)
  visibility: BadgeVisibility;
}
