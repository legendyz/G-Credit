/**
 * DTO for sharing badge to Microsoft Teams
 * Story 7.4 - Microsoft Teams Notifications
 */

import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareBadgeTeamsDto {
  @ApiProperty({
    description: 'Microsoft Teams Team ID',
    example: '19:abc123team456@thread.tacv2',
  })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({
    description: 'Microsoft Teams Channel ID',
    example: '19:xyz789channel012@thread.tacv2',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiPropertyOptional({
    description:
      'Optional personal message to include with the badge notification',
    example: 'I just earned this badge! Check it out!',
  })
  @IsString()
  @IsOptional()
  personalMessage?: string;
}

export class ShareBadgeTeamsResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Badge shared to Microsoft Teams successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Badge ID that was shared',
    example: 'badge-123',
  })
  badgeId: string;

  @ApiProperty({
    description: 'Team ID where badge was shared',
    example: '19:abc123team456@thread.tacv2',
  })
  teamId: string;

  @ApiProperty({
    description: 'Channel ID where badge was shared',
    example: '19:xyz789channel012@thread.tacv2',
  })
  channelId: string;
}
