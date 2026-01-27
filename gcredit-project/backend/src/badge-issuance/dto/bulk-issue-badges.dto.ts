import { ApiProperty } from '@nestjs/swagger';

export class BulkIssueBadgesDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CSV file with badge issuance data',
  })
  file: Express.Multer.File;
}

export interface BulkIssuanceRow {
  recipientEmail: string;
  templateId: string;
  evidenceUrl?: string;
  expiresIn?: number;
}

export interface BulkIssuanceResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    row: number;
    email: string;
    success: boolean;
    badgeId?: string;
    error?: string;
  }>;
}
