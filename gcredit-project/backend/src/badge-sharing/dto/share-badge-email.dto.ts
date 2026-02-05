import {
  IsEmail,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareBadgeEmailDto {
  @ApiProperty({
    description: 'Badge ID to share',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  badgeId: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'colleague@example.com',
  })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({
    description: 'Personal message to include in email (optional)',
    example: 'Hi John, I wanted to share my latest achievement with you!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalMessage?: string;
}

export class ShareBadgeEmailResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Badge shared successfully via email',
  })
  message: string;

  @ApiProperty({
    description: 'Recipient email',
    example: 'colleague@example.com',
  })
  recipientEmail: string;

  @ApiProperty({
    description: 'Badge ID that was shared',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  badgeId: string;
}
