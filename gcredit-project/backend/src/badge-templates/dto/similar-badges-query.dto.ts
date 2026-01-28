import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SimilarBadgesQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of similar badges to return',
    minimum: 1,
    maximum: 10,
    default: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 6;
}

export class SimilarBadgeDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  issuerName: string;
  badgeCount: number;
  similarityScore: number;
}
