import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadEvidenceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  originalName: string;
}

export interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: Date;
}

export interface EvidenceSasResponse {
  url: string;
  expiresAt: Date;
  isImage: boolean;
}
