import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  Res,
  Logger,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BulkIssuanceService } from './bulk-issuance.service';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

/**
 * Bulk Issuance Controller
 *
 * Provides endpoints for batch badge issuance:
 * - Template download
 * - CSV upload and validation
 * - Preview session management
 * - Confirmation and processing
 * - Error report download
 *
 * Security Features:
 * - IDOR protection through session ownership validation (ARCH-C2)
 * - CSV injection prevention in error reports (ARCH-C1)
 * - Role-based access control (ISSUER, ADMIN only)
 */
@ApiTags('Bulk Issuance')
@Controller('api/bulk-issuance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BulkIssuanceController {
  private readonly logger = new Logger(BulkIssuanceController.name);

  constructor(private readonly bulkIssuanceService: BulkIssuanceService) {}

  /**
   * Download CSV template for bulk issuance
   */
  @Get('template')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Download CSV template for bulk badge issuance' })
  @ApiResponse({ status: 200, description: 'CSV template file' })
  downloadTemplate(@Request() req: RequestWithUser, @Res() res: Response) {
    const csv = this.bulkIssuanceService.generateTemplate();
    const dateStr = new Date().toISOString().split('T')[0];
    const BOM = '\uFEFF';

    // AC5: Analytics tracking for template downloads
    this.logger.log(
      JSON.stringify({
        event: 'template_download',
        userId: req.user?.userId,
        timestamp: new Date().toISOString(),
        templateType: 'bulk-badge-issuance',
      }),
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bulk-badge-issuance-template-${dateStr}.csv"`,
    );
    res.send(BOM + csv);
  }

  /**
   * Upload CSV file and create preview session
   */
  @Post('upload')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @Throttle({
    default: {
      ttl: parseInt(process.env.UPLOAD_THROTTLE_TTL || '300000'),
      limit: parseInt(process.env.UPLOAD_THROTTLE_LIMIT || '10'),
    },
  }) // 10 uploads per 5 minutes per user (ARCH-C3, updated 2026-02-07)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: BulkIssuanceService.MAX_FILE_SIZE },
    }),
  )
  @ApiOperation({ summary: 'Upload CSV file for bulk issuance' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
    description: 'Session created with preview data',
  })
  @ApiResponse({ status: 400, description: 'Invalid CSV file' })
  @ApiResponse({
    status: 429,
    description: 'Too many upload requests. Try again later.',
  })
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const isCsv =
      file.mimetype.includes('csv') || file.originalname.endsWith('.csv');
    const isTxt =
      file.mimetype === 'text/plain' || file.originalname.endsWith('.txt');
    if (!isCsv && !isTxt) {
      throw new BadRequestException('File must be in CSV or TXT format');
    }

    const csvContent = file.buffer.toString('utf-8');
    const userId = req.user.userId;

    return this.bulkIssuanceService.createSession(csvContent, userId);
  }

  /**
   * Get preview data for a session
   *
   * SECURITY: Validates session ownership to prevent IDOR (ARCH-C2)
   */
  @Get('preview/:sessionId')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get preview data for a bulk issuance session' })
  @ApiResponse({ status: 200, description: 'Session preview data' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this session',
  })
  @ApiResponse({ status: 404, description: 'Session not found or expired' })
  async getPreview(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.bulkIssuanceService.getPreviewData(sessionId, userId);
  }

  /**
   * Confirm and execute bulk issuance
   *
   * SECURITY: Validates session ownership to prevent IDOR (ARCH-C2)
   */
  @Post('confirm/:sessionId')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm and execute bulk badge issuance' })
  @ApiResponse({ status: 200, description: 'Processing complete' })
  @ApiResponse({
    status: 400,
    description: 'Session not ready for confirmation',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to confirm this session',
  })
  @ApiResponse({ status: 404, description: 'Session not found or expired' })
  async confirmBulkIssuance(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.bulkIssuanceService.confirmBulkIssuance(sessionId, userId);
  }

  /**
   * Download error report as CSV
   *
   * SECURITY:
   * - Validates session ownership to prevent IDOR (ARCH-C2)
   * - Sanitizes CSV output to prevent injection attacks (ARCH-C1)
   */
  @Get('error-report/:sessionId')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Download error report for a bulk issuance session',
  })
  @ApiResponse({ status: 200, description: 'CSV error report' })
  @ApiResponse({ status: 400, description: 'No errors in this session' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this session',
  })
  @ApiResponse({ status: 404, description: 'Session not found or expired' })
  async downloadErrorReport(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    const csvContent = await this.bulkIssuanceService.getErrorReportCsv(
      sessionId,
      userId,
    );

    const shortId = sessionId.substring(0, 8);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="errors-${shortId}.csv"`,
    );
    res.send(csvContent);
  }
}
