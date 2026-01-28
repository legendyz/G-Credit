import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BadgeStatus } from '@prisma/client';

export class WalletQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @IsOptional()
  @IsEnum(['issuedAt_desc', 'issuedAt_asc'])
  sort?: 'issuedAt_desc' | 'issuedAt_asc' = 'issuedAt_desc';
}

export interface DateGroup {
  label: string; // "January 2026"
  count: number;
  startIndex: number;
}

export interface WalletResponse {
  badges: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  dateGroups: DateGroup[];
}
