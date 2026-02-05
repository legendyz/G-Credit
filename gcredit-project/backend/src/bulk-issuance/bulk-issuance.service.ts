import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CsvValidationService } from './csv-validation.service';
import { randomUUID } from 'crypto';

/**
 * Bulk Issuance Session Status
 */
export enum SessionStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Session error details for reporting
 */
export interface SessionError {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

/**
 * Preview data returned after CSV upload
 */
export interface PreviewData {
  sessionId: string;
  validRows: number;
  errorRows: number;
  totalRows: number;
  errors: SessionError[];
  status: SessionStatus;
  createdAt: Date;
  expiresAt: Date;
  rows: Array<{
    rowNumber: number;
    badgeTemplateId: string;
    recipientEmail: string;
    evidenceUrl?: string;
    isValid: boolean;
    error?: string;
  }>;
}

/**
 * Bulk Issuance Service
 * 
 * Handles batch badge issuance with:
 * - CSV template generation and validation
 * - Session-based preview workflow
 * - IDOR protection through ownership validation
 * - CSV injection prevention
 */
@Injectable()
export class BulkIssuanceService {
  private readonly logger = new Logger(BulkIssuanceService.name);
  
  // In-memory session store (TODO: Move to database in production)
  private sessions = new Map<string, {
    issuerId: string;
    status: SessionStatus;
    validRows: any[];
    errors: SessionError[];
    createdAt: Date;
    expiresAt: Date;
  }>();

  // Session TTL: 30 minutes
  private readonly SESSION_TTL_MS = 30 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private csvValidation: CsvValidationService,
  ) {}

  /**
   * Generate CSV template for bulk issuance
   * Includes clearly marked example rows that must be deleted
   */
  generateTemplate(): string {
    const headerComment = '# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOADING YOUR REAL DATA\n';
    const headers = 'templateId,recipientEmail,evidenceUrl,notes';
    
    const exampleRows = [
      'EXAMPLE-DELETE-THIS-ROW,example-john@company.com,https://example.com/evidence1,"DELETE THIS EXAMPLE ROW BEFORE UPLOAD"',
      'EXAMPLE-DELETE-THIS-ROW,example-jane@company.com,,"DELETE THIS EXAMPLE ROW BEFORE UPLOAD"'
    ].join('\n');

    return headerComment + headers + '\n' + exampleRows;
  }

  /**
   * Create a new bulk issuance session from uploaded CSV
   * 
   * @param csvContent - Raw CSV file content
   * @param issuerId - User ID of the issuer creating the session
   * @returns PreviewData with validation results
   */
  async createSession(csvContent: string, issuerId: string): Promise<PreviewData> {
    const sessionId = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.SESSION_TTL_MS);

    // Parse and validate CSV
    const lines = csvContent.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'));
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must contain header and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['templateId', 'recipientEmail'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new BadRequestException(`Missing required header: ${required}`);
      }
    }

    const validRows: any[] = [];
    const errors: SessionError[] = [];
    const rows: PreviewData['rows'] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      const templateValidation = this.csvValidation.validateBadgeTemplateId(row.templateId);
      const emailValidation = this.csvValidation.validateEmail(row.recipientEmail);

      if (!templateValidation.valid) {
        errors.push({
          rowNumber,
          badgeTemplateId: row.templateId,
          recipientEmail: row.recipientEmail,
          message: templateValidation.error!,
        });
        rows.push({
          rowNumber,
          badgeTemplateId: row.templateId,
          recipientEmail: row.recipientEmail,
          evidenceUrl: row.evidenceUrl,
          isValid: false,
          error: templateValidation.error,
        });
      } else if (!emailValidation.valid) {
        errors.push({
          rowNumber,
          badgeTemplateId: row.templateId,
          recipientEmail: row.recipientEmail,
          message: emailValidation.error!,
        });
        rows.push({
          rowNumber,
          badgeTemplateId: row.templateId,
          recipientEmail: row.recipientEmail,
          evidenceUrl: row.evidenceUrl,
          isValid: false,
          error: emailValidation.error,
        });
      } else {
        validRows.push(row);
        rows.push({
          rowNumber,
          badgeTemplateId: row.templateId,
          recipientEmail: row.recipientEmail,
          evidenceUrl: row.evidenceUrl,
          isValid: true,
        });
      }
    }

    // Store session
    this.sessions.set(sessionId, {
      issuerId,
      status: validRows.length > 0 ? SessionStatus.VALIDATED : SessionStatus.FAILED,
      validRows,
      errors,
      createdAt,
      expiresAt,
    });

    this.logger.log(
      `Created bulk issuance session ${sessionId} for user ${issuerId}: ` +
      `${validRows.length} valid, ${errors.length} errors`
    );

    return {
      sessionId,
      validRows: validRows.length,
      errorRows: errors.length,
      totalRows: validRows.length + errors.length,
      errors,
      status: validRows.length > 0 ? SessionStatus.VALIDATED : SessionStatus.FAILED,
      createdAt,
      expiresAt,
      rows,
    };
  }

  /**
   * Get preview data for an existing session
   * 
   * CRITICAL: Validates ownership to prevent IDOR attacks (ARCH-C2)
   * 
   * @param sessionId - Session identifier
   * @param currentUserId - User ID from JWT token
   * @returns PreviewData if authorized
   * @throws NotFoundException if session doesn't exist
   * @throws ForbiddenException if user doesn't own the session
   */
  async getPreviewData(sessionId: string, currentUserId: string): Promise<PreviewData> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      throw new NotFoundException(`Session expired: ${sessionId}`);
    }

    // CRITICAL: Validate ownership (IDOR prevention - ARCH-C2)
    if (session.issuerId !== currentUserId) {
      this.logger.warn(
        `IDOR attempt: User ${currentUserId} tried to access session ${sessionId} owned by ${session.issuerId}`
      );
      throw new ForbiddenException('You do not have permission to access this session');
    }

    return {
      sessionId,
      validRows: session.validRows.length,
      errorRows: session.errors.length,
      totalRows: session.validRows.length + session.errors.length,
      errors: session.errors,
      status: session.status,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      rows: session.validRows.map((row, idx) => ({
        rowNumber: idx + 2,
        badgeTemplateId: row.templateId,
        recipientEmail: row.recipientEmail,
        evidenceUrl: row.evidenceUrl,
        isValid: true,
      })),
    };
  }

  /**
   * Confirm and execute bulk issuance
   * 
   * CRITICAL: Validates ownership to prevent IDOR attacks (ARCH-C2)
   * 
   * @param sessionId - Session identifier
   * @param currentUserId - User ID from JWT token
   * @returns Processing result
   * @throws NotFoundException if session doesn't exist
   * @throws ForbiddenException if user doesn't own the session
   */
  async confirmBulkIssuance(sessionId: string, currentUserId: string): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{ row: number; status: 'success' | 'failed'; error?: string }>;
  }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      throw new NotFoundException(`Session expired: ${sessionId}`);
    }

    // CRITICAL: Validate ownership (IDOR prevention - ARCH-C2)
    if (session.issuerId !== currentUserId) {
      this.logger.warn(
        `IDOR attempt: User ${currentUserId} tried to confirm session ${sessionId} owned by ${session.issuerId}`
      );
      throw new ForbiddenException('You do not have permission to confirm this session');
    }

    if (session.status !== SessionStatus.VALIDATED) {
      throw new BadRequestException(
        `Session is not ready for confirmation. Status: ${session.status}`
      );
    }

    // Update status to processing
    session.status = SessionStatus.PROCESSING;

    const results: Array<{ row: number; status: 'success' | 'failed'; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    // Process each valid row
    for (let i = 0; i < session.validRows.length; i++) {
      const row = session.validRows[i];
      try {
        // TODO: Call actual badge issuance service
        // await this.badgeIssuanceService.issueBadge({
        //   templateId: row.templateId,
        //   recipientEmail: row.recipientEmail,
        //   evidenceUrl: row.evidenceUrl,
        // }, currentUserId);
        
        processed++;
        results.push({ row: i + 2, status: 'success' });
        
        this.logger.debug(
          `Issued badge ${i + 1}/${session.validRows.length} to ${row.recipientEmail}`
        );
      } catch (error) {
        failed++;
        results.push({
          row: i + 2,
          status: 'failed',
          error: error.message,
        });
        this.logger.error(
          `Failed to issue badge to ${row.recipientEmail}: ${error.message}`
        );
      }
    }

    // Update session status
    session.status = failed === 0 ? SessionStatus.COMPLETED : SessionStatus.COMPLETED;

    this.logger.log(
      `Completed bulk issuance session ${sessionId}: ${processed} success, ${failed} failed`
    );

    return {
      success: failed === 0,
      processed,
      failed,
      results,
    };
  }

  /**
   * Get error report for a session as CSV content
   * Uses sanitized output to prevent CSV injection
   * 
   * @param sessionId - Session identifier
   * @param currentUserId - User ID from JWT token
   * @returns CSV content with error details
   */
  async getErrorReportCsv(sessionId: string, currentUserId: string): Promise<string> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // CRITICAL: Validate ownership (IDOR prevention)
    if (session.issuerId !== currentUserId) {
      this.logger.warn(
        `IDOR attempt: User ${currentUserId} tried to get error report for session ${sessionId} owned by ${session.issuerId}`
      );
      throw new ForbiddenException('You do not have permission to access this session');
    }

    if (!session.errors || session.errors.length === 0) {
      throw new BadRequestException('No errors found in this session');
    }

    // Generate sanitized CSV (ARCH-C1: CSV injection prevention)
    const headers = ['Row', 'BadgeTemplateId', 'RecipientEmail', 'Error'];
    const rows = session.errors.map(error => ({
      Row: String(error.rowNumber),
      BadgeTemplateId: error.badgeTemplateId,
      RecipientEmail: error.recipientEmail,
      Error: error.message,
    }));

    return this.csvValidation.generateSafeCsv(headers, rows);
  }
}
