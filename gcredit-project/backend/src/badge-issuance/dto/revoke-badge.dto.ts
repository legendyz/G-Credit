import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RevocationReason {
  POLICY_VIOLATION = 'Policy Violation',
  ISSUED_IN_ERROR = 'Issued in Error',
  EXPIRED = 'Expired',
  DUPLICATE = 'Duplicate',
  FRAUD = 'Fraud',
  OTHER = 'Other',
}

export class RevokeBadgeDto {
  @ApiProperty({
    description: 'Reason for revocation',
    enum: RevocationReason,
    example: RevocationReason.POLICY_VIOLATION,
  })
  @IsEnum(RevocationReason)
  reason: RevocationReason;

  @ApiProperty({
    description: 'Additional notes explaining the revocation (optional, max 1000 chars)',
    required: false,
    maxLength: 1000,
    example: 'Detailed explanation of the revocation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
