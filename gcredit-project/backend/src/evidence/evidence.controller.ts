import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EvidenceService } from './evidence.service';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Evidence Files')
@Controller('api/badges/:badgeId/evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload evidence file (Story 4.3 - AC 3.7)' })
  @ApiBody({
    description: 'Evidence file (max 10MB, PDF/Image/Word)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Evidence file uploaded successfully',
    schema: {
      example: {
        id: 'file-uuid',
        fileName: 'badge-uuid/file-uuid-certificate.pdf',
        originalName: 'certificate.pdf',
        fileSize: 1234567,
        mimeType: 'application/pdf',
        blobUrl:
          'https://gcreditdevstoragelz.blob.core.windows.net/evidence/...',
        uploadedAt: '2026-01-28T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File too large or invalid type' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async uploadEvidence(
    @Param('badgeId') badgeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // SEC-P1-001: Pass user role for IDOR protection (Story 8.6)
    return this.evidenceService.uploadEvidence(
      badgeId,
      file,
      req.user.userId,
      req.user.role,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List evidence files for badge (Story 4.3 - AC 3.8)',
  })
  @ApiResponse({
    status: 200,
    description: 'Evidence files retrieved',
    schema: {
      example: [
        {
          id: 'file-uuid',
          fileName: 'badge-uuid/file-uuid-cert.pdf',
          originalName: 'certificate.pdf',
          fileSize: 1234567,
          mimeType: 'application/pdf',
          blobUrl: 'https://...',
          uploadedAt: '2026-01-28T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async listEvidence(
    @Param('badgeId') badgeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.evidenceService.listEvidence(
      badgeId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Generate download SAS token (Story 4.3 - AC 3.9)' })
  @ApiResponse({
    status: 200,
    description: 'SAS token generated (5-minute expiry)',
    schema: {
      example: {
        url: 'https://gcreditdevstoragelz.blob.core.windows.net/evidence/...?sasToken...',
        expiresAt: '2026-01-28T10:05:00.000Z',
        isImage: false,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async generateDownloadSas(
    @Param('badgeId') badgeId: string,
    @Param('fileId') fileId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.evidenceService.generateDownloadSas(
      badgeId,
      fileId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':fileId/preview')
  @ApiOperation({ summary: 'Generate preview SAS token (Story 4.3 - AC 3.10)' })
  @ApiResponse({
    status: 200,
    description: 'SAS token generated for preview',
    schema: {
      example: {
        url: 'https://gcreditdevstoragelz.blob.core.windows.net/evidence/...?sasToken...',
        expiresAt: '2026-01-28T10:05:00.000Z',
        isImage: true,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async generatePreviewSas(
    @Param('badgeId') badgeId: string,
    @Param('fileId') fileId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.evidenceService.generatePreviewSas(
      badgeId,
      fileId,
      req.user.userId,
      req.user.role,
    );
  }
}
