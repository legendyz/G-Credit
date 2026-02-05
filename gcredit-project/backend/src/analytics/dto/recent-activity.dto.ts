import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecentActivityQueryDto {
  @ApiProperty({
    description: 'Number of activities to return (1-100)',
    example: 20,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class ActivityActorDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'John Issuer' })
  name: string;
}

export class ActivityTargetDto {
  @ApiPropertyOptional({ example: 'uuid' })
  userId?: string;

  @ApiPropertyOptional({ example: 'Jane Recipient' })
  name?: string;

  @ApiPropertyOptional({ example: 'Python Expert' })
  badgeTemplateName?: string;

  @ApiPropertyOptional({ example: 'New Badge' })
  templateName?: string;
}

export class ActivityItemDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({
    example: 'BADGE_ISSUED',
    enum: [
      'BADGE_ISSUED',
      'BADGE_CLAIMED',
      'BADGE_REVOKED',
      'TEMPLATE_CREATED',
      'USER_REGISTERED',
    ],
  })
  type: string;

  @ApiProperty({ type: ActivityActorDto })
  actor: ActivityActorDto;

  @ApiPropertyOptional({ type: ActivityTargetDto })
  target?: ActivityTargetDto;

  @ApiProperty({ example: '2026-02-02T09:30:00Z' })
  timestamp: string;
}

export class PaginationDto {
  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: 1250 })
  total: number;
}

export class RecentActivityDto {
  @ApiProperty({ type: [ActivityItemDto] })
  activities: ActivityItemDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
