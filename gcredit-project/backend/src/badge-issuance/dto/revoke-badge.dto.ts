import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeBadgeDto {
  @ApiProperty({
    description: 'Reason for revocation',
    example: 'Badge issued in error - recipient did not meet criteria',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
