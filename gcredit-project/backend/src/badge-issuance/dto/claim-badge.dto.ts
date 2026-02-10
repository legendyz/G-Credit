import { IsString, Length, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimBadgeDto {
  @ApiPropertyOptional({
    description:
      'Unique 32-character claim token from email. Optional when the authenticated user is the badge recipient.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    minLength: 32,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @Length(32, 32, { message: 'Claim token must be exactly 32 characters' })
  claimToken?: string;
}
