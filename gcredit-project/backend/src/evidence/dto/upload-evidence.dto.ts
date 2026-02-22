import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class UploadEvidenceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  originalName: string;
}

// Story 12.5: DTO for URL-type evidence
export class AddUrlEvidenceDto {
  @IsUrl()
  sourceUrl: string;
}

export interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: Date;
  type?: 'FILE' | 'URL'; // Story 12.5
  sourceUrl?: string; // Story 12.5: For URL-type evidence
}

export interface EvidenceSasResponse {
  url: string;
  expiresAt: Date;
  isImage: boolean;
}
