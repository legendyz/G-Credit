import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueBadgeDto {
  @ApiProperty({
    description: 'Badge template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Recipient user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Expiration in days (null = no expiration)',
    example: 365,
    minimum: 1,
    maximum: 3650,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresIn?: number;
}
