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
  // evidenceUrl REMOVED — PO decision 2026-02-22
  // Evidence attached post-issuance via two-step flow (Story 12.6)
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
