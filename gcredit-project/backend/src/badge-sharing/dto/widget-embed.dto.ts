import { ApiProperty } from '@nestjs/swagger';

export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum WidgetTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export class WidgetEmbedResponseDto {
  @ApiProperty({
    description: 'Badge ID',
    example: 'badge-123',
  })
  badgeId: string;

  @ApiProperty({
    description: 'Badge name',
    example: 'Full-Stack Developer',
  })
  badgeName: string;

  @ApiProperty({
    description: 'Badge image URL',
    example: 'https://storage.example.com/badge.png',
  })
  badgeImageUrl: string;

  @ApiProperty({
    description: 'Issuer name',
    example: 'Tech University',
  })
  issuerName: string;

  @ApiProperty({
    description: 'Issue date',
    example: '2026-01-15',
  })
  issuedAt: string;

  @ApiProperty({
    description: 'Verification URL',
    example: 'https://g-credit.com/verify/badge-123',
  })
  verificationUrl: string;

  @ApiProperty({
    description: 'Badge status',
    example: 'CLAIMED',
  })
  status: string;
}

export class WidgetHtmlResponseDto {
  @ApiProperty({
    description: 'HTML snippet for embedding',
    example: '<div class="g-credit-badge">...</div>',
  })
  html: string;

  @ApiProperty({
    description: 'CSS styles for the widget',
    example: '.g-credit-badge { ... }',
  })
  css: string;

  @ApiProperty({
    description: 'JavaScript for widget functionality',
    example: '(function() { ... })()',
  })
  script: string;
}
