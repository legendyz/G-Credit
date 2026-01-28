import { IsEmail, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum IssueType {
  INCORRECT_INFO = 'Incorrect info',
  TECHNICAL_PROBLEM = 'Technical problem',
  OTHER = 'Other',
}

export class ReportBadgeIssueDto {
  @ApiProperty({
    description: 'Type of issue being reported',
    enum: IssueType,
    example: IssueType.INCORRECT_INFO,
  })
  @IsEnum(IssueType)
  issueType: IssueType;

  @ApiProperty({
    description: 'Detailed description of the issue',
    maxLength: 500,
    example: 'The badge shows incorrect skills that do not match the actual training completed.',
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Email address for follow-up (pre-filled from user profile)',
    example: 'john.doe@company.com',
  })
  @IsEmail()
  email: string;
}

export class ReportBadgeIssueResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: "Report submitted. We'll review within 2 business days.",
  })
  message: string;

  @ApiProperty({
    description: 'Report ID for tracking',
    example: 'report-uuid-123',
  })
  reportId: string;
}
