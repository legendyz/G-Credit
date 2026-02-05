import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TopPerformersQueryDto {
  @ApiPropertyOptional({
    description:
      'Team/Department name to filter (Manager must use their own team)',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiProperty({
    description: 'Limit results (1-100)',
    example: 10,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;
}

export class LatestBadgeDto {
  @ApiProperty({ example: 'Python Expert' })
  templateName: string;

  @ApiProperty({ example: '2026-02-01T10:00:00Z' })
  claimedAt: string;
}

export class PerformerDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 15 })
  badgeCount: number;

  @ApiPropertyOptional({ type: LatestBadgeDto })
  latestBadge?: LatestBadgeDto;
}

export class TopPerformersDto {
  @ApiPropertyOptional({ example: 'uuid' })
  teamId?: string;

  @ApiPropertyOptional({ example: 'Engineering Team' })
  teamName?: string;

  @ApiProperty({ example: 'allTime' })
  period: string;

  @ApiProperty({ type: [PerformerDto] })
  topPerformers: PerformerDto[];
}
