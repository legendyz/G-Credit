import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class IssuanceTrendsQueryDto {
  @ApiProperty({
    description: 'Period in days (7, 30, 90, 365)',
    example: 30,
    default: 30,
    enum: [7, 30, 90, 365],
  })
  @IsIn([7, 30, 90, 365], { message: 'Period must be one of: 7, 30, 90, 365' })
  @Type(() => Number)
  period: number = 30;

  @ApiPropertyOptional({
    description: 'Filter by issuer ID (Admin only)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuerId?: string;
}

export class TrendDataPointDto {
  @ApiProperty({ example: '2026-01-03' })
  date: string;

  @ApiProperty({ example: 15 })
  issued: number;

  @ApiProperty({ example: 12 })
  claimed: number;

  @ApiProperty({ example: 0 })
  revoked: number;
}

export class TrendTotalsDto {
  @ApiProperty({ example: 456 })
  issued: number;

  @ApiProperty({ example: 380 })
  claimed: number;

  @ApiProperty({ example: 8 })
  revoked: number;

  @ApiProperty({ example: 0.83 })
  claimRate: number;
}

export class IssuanceTrendsDto {
  @ApiProperty({ example: 'last30days' })
  period: string;

  @ApiProperty({ example: '2026-01-03' })
  startDate: string;

  @ApiProperty({ example: '2026-02-02' })
  endDate: string;

  @ApiProperty({ type: [TrendDataPointDto] })
  dataPoints: TrendDataPointDto[];

  @ApiProperty({ type: TrendTotalsDto })
  totals: TrendTotalsDto;
}
