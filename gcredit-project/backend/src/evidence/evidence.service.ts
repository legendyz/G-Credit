import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import { EvidenceFileResponse, EvidenceSasResponse } from './dto/upload-evidence.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class EvidenceService {
  // AC 3.7: Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // AC 3.7: Max file size 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /**
   * Upload evidence file (Story 4.3 - AC 3.7)
   */
  async uploadEvidence(
    badgeId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<EvidenceFileResponse> {
    // Validate badge exists
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // AC 3.7: Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds 10MB limit`);
    }

    // AC 3.7: Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // AC 3.4: Generate filename: {badgeId}/{fileId}-{sanitized-filename}
    const fileId = randomUUID();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${badgeId}/${fileId}-${sanitizedName}`;

    // Upload to Azure Blob Storage
    const blobUrl = await this.storage.uploadEvidence(
      fileName,
      file.buffer,
      file.mimetype,
    );

    // Save metadata to database
    const evidenceFile = await this.prisma.evidenceFile.create({
      data: {
        badgeId,
        fileName,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        blobUrl,
        uploadedBy,
      },
    });

    return {
      id: evidenceFile.id,
      fileName: evidenceFile.fileName,
      originalName: evidenceFile.originalName,
      fileSize: evidenceFile.fileSize,
      mimeType: evidenceFile.mimeType,
      blobUrl: evidenceFile.blobUrl,
      uploadedAt: evidenceFile.uploadedAt,
    };
  }

  /**
   * List evidence files for a badge (Story 4.3 - AC 3.8)
   */
  async listEvidence(
    badgeId: string,
    userId: string,
    userRole: string,
  ): Promise<EvidenceFileResponse[]> {
    // Verify badge exists and user owns it (or is ADMIN)
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // AC 3.8: RBAC - Badge owner or ADMIN
    if (badge.recipientId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this badge');
    }

    const evidenceFiles = await this.prisma.evidenceFile.findMany({
      where: { badgeId },
      orderBy: { uploadedAt: 'desc' },
    });

    return evidenceFiles.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      blobUrl: file.blobUrl,
      uploadedAt: file.uploadedAt,
    }));
  }

  /**
   * Generate download SAS token (Story 4.3 - AC 3.9)
   */
  async generateDownloadSas(
    badgeId: string,
    fileId: string,
    userId: string,
    userRole: string,
  ): Promise<EvidenceSasResponse> {
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // AC 3.9: RBAC - Badge owner or ADMIN
    if (badge.recipientId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this badge');
    }

    const evidenceFile = await this.prisma.evidenceFile.findUnique({
      where: { id: fileId },
    });

    if (!evidenceFile || evidenceFile.badgeId !== badgeId) {
      throw new NotFoundException('Evidence file not found');
    }

    // AC 3.6: Generate SAS token (5-minute expiry, read-only)
    const { url, expiresAt } = await this.storage.generateEvidenceSasUrl(
      evidenceFile.fileName,
    );

    const isImage = evidenceFile.mimeType.startsWith('image/');

    return { url, expiresAt, isImage };
  }

  /**
   * Generate preview SAS token (Story 4.3 - AC 3.10)
   * Same as download, used for inline viewing
   */
  async generatePreviewSas(
    badgeId: string,
    fileId: string,
    userId: string,
    userRole: string,
  ): Promise<EvidenceSasResponse> {
    return this.generateDownloadSas(badgeId, fileId, userId, userRole);
  }
}
