import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CsvValidationService } from './csv-validation.service';
import { BadgeIssuanceService } from '../badge-issuance/badge-issuance.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

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
 * Preview row data
 */
export interface PreviewRow {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  isValid: boolean;
  error?: string;
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
  rows: PreviewRow[];
}

/**
 * Enriched preview row with badge and recipient names
 */
export interface EnrichedPreviewRow extends PreviewRow {
  badgeName?: string;
  recipientName?: string;
}

/**
 * Template breakdown entry for summary
 */
export interface TemplateBreakdown {
  templateId: string;
  templateName: string;
  count: number;
}

/**
 * Enriched preview data with badge/recipient names and template summary
 */
export interface EnrichedPreviewData extends Omit<PreviewData, 'rows'> {
  summary: {
    byTemplate: TemplateBreakdown[];
  };
  rows: EnrichedPreviewRow[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Bulk Issuance Service
 *
 * Handles batch badge issuance with:
 * - CSV template generation and validation
 * - Database-backed session storage (BulkIssuanceSession table)
 * - IDOR protection through ownership validation
 * - CSV injection prevention
 * - RFC 4180 compliant CSV parsing (multiline quoted fields)
 */
@Injectable()
export class BulkIssuanceService {
  private readonly logger = new Logger(BulkIssuanceService.name);

  // Session TTL: 30 minutes
  private readonly SESSION_TTL_MS = 30 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private csvValidation: CsvValidationService,
    private badgeIssuanceService: BadgeIssuanceService,
  ) {}

  /** Maximum rows allowed per CSV upload */
  static readonly MAX_ROWS = 20;
  /** Maximum file size in bytes (100KB) */
  static readonly MAX_FILE_SIZE = 102_400;

  /**
   * Generate CSV template for bulk issuance
   * Includes field documentation and clearly marked example rows that must be deleted
   */
  generateTemplate(templateId?: string): string {
    const headerComments = [
      '# G-Credit Bulk Badge Issuance Template',
      '# Instructions: Fill in the rows below with badge issuance data',
      '# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD',
      '#',
      '# Field Specifications:',
      '# badgeTemplateId       - Can be template name (e.g., "Leadership Excellence") or UUID (REQUIRED)',
      '# recipientEmail        - Must match registered user email addresses (REQUIRED)',
      '# narrativeJustification - (Optional) Reason for awarding this badge, max 500 characters',
      '#',
      '# Tips:',
      '# - You can find badge template names in the Badge Catalog page',
      '# - Maximum 20 badges per upload (file size limit: 100KB)',
      '# - recipientEmail must match existing user accounts',
    ].join('\n');

    const headers = 'badgeTemplateId,recipientEmail,narrativeJustification';

    const templateIdValue = templateId || 'EXAMPLE-DELETE-THIS-ROW';
    const exampleRows = [
      `${templateIdValue},example-john@company.com,"DELETE THIS EXAMPLE ROW BEFORE UPLOAD"`,
      `${templateIdValue},example-jane@company.com,"DELETE THIS EXAMPLE ROW BEFORE UPLOAD"`,
    ].join('\n');

    return headerComments + '\n' + headers + '\n' + exampleRows;
  }

  /**
   * Parse CSV content into rows respecting RFC 4180 quoting rules.
   * Handles quoted fields that may contain commas, newlines, or escaped quotes.
   * Comment lines (starting with #) are skipped.
   *
   * @param content - Full CSV content string
   * @returns Array of rows, each row is an array of field strings
   */
  parseCsvContent(content: string): string[][] {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let fields: string[] = [];

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote ("")
          if (i + 1 < content.length && content[i + 1] === '"') {
            current += '"';
            i++; // skip next quote
          } else {
            inQuotes = false;
          }
        } else if (char === '\r') {
          // Skip \r inside quotes too (normalize line endings)
          continue;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          fields.push(current.trim());
          current = '';
        } else if (char === '\r') {
          // Skip \r, handle \n next
          continue;
        } else if (char === '\n') {
          // End of row
          fields.push(current.trim());
          const rowStr = fields.join(',');
          // Skip empty lines and comment lines
          if (rowStr.trim() && !rowStr.trim().startsWith('#')) {
            rows.push(fields);
          }
          fields = [];
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Handle last row (no trailing newline)
    fields.push(current.trim());
    const lastRowStr = fields.join(',');
    if (lastRowStr.trim() && !lastRowStr.trim().startsWith('#')) {
      rows.push(fields);
    }

    return rows;
  }

  /**
   * Create a new bulk issuance session from uploaded CSV
   *
   * @param csvContent - Raw CSV file content
   * @param issuerId - User ID of the issuer creating the session
   * @returns PreviewData with validation results
   */
  async createSession(
    csvContent: string,
    issuerId: string,
  ): Promise<PreviewData> {
    const sessionId = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.SESSION_TTL_MS);

    // Strip UTF-8 BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');

    // Parse CSV with RFC 4180 compliant parser (handles multiline quoted fields)
    const parsedRows = this.parseCsvContent(cleanContent);

    if (parsedRows.length < 2) {
      throw new BadRequestException(
        'CSV file must contain header and at least one data row',
      );
    }

    const headers = parsedRows[0];
    const requiredHeaders = ['badgeTemplateId', 'recipientEmail'];

    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new BadRequestException(`Missing required header: ${required}`);
      }
    }

    // Enforce max row count (AC7)
    const dataLineCount = parsedRows.length - 1;
    if (dataLineCount > BulkIssuanceService.MAX_ROWS) {
      throw new BadRequestException(
        `CSV contains ${dataLineCount} rows, exceeding the MVP limit of ${BulkIssuanceService.MAX_ROWS} badges per batch. ` +
          `Please split your CSV or remove rows to have at most ${BulkIssuanceService.MAX_ROWS} rows. ` +
          `Phase 2 will support larger batches.`,
      );
    }

    const validRows: Record<string, string>[] = [];
    const errors: SessionError[] = [];
    const rows: PreviewData['rows'] = [];

    // Wrap validation in a database transaction for consistency (ARCH-C4)
    const { txValidRows, txErrors, txRows } = await this.prisma.$transaction(
      async (tx) => {
        const localValidRows: Record<string, string>[] = [];
        const localErrors: SessionError[] = [];
        const localRows: PreviewData['rows'] = [];

        for (let i = 1; i < parsedRows.length; i++) {
          const rowNumber = i + 1;
          const values = parsedRows[i];

          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });

          // XSS Sanitize text fields BEFORE validation (ARCH-C7)
          row.narrativeJustification = this.csvValidation.sanitizeTextInput(
            row.narrativeJustification || '',
          );
          row.badgeTemplateId = this.csvValidation.sanitizeTextInput(
            row.badgeTemplateId || '',
          );

          // Validate within transaction context (ARCH-C4)
          const rowValidation =
            await this.csvValidation.validateRowInTransaction(row, tx);

          if (!rowValidation.valid) {
            const errorMsg = rowValidation.errors.join('; ');
            localErrors.push({
              rowNumber,
              badgeTemplateId: row.badgeTemplateId,
              recipientEmail: row.recipientEmail,
              message: errorMsg,
            });
            localRows.push({
              rowNumber,
              badgeTemplateId: row.badgeTemplateId,
              recipientEmail: row.recipientEmail,
              isValid: false,
              error: errorMsg,
            });
          } else {
            localValidRows.push(row);
            localRows.push({
              rowNumber,
              badgeTemplateId: row.badgeTemplateId,
              recipientEmail: row.recipientEmail,
              isValid: true,
            });
          }
        }

        return {
          txValidRows: localValidRows,
          txErrors: localErrors,
          txRows: localRows,
        };
      },
      {
        isolationLevel: 'ReadCommitted',
        timeout: 30000,
        maxWait: 10000,
      },
    );

    // Copy transaction results
    validRows.push(...txValidRows);
    errors.push(...txErrors);
    rows.push(...txRows);

    const status =
      validRows.length > 0 ? SessionStatus.VALIDATED : SessionStatus.FAILED;

    // Store session in database (Finding #1: persistent storage)
    await this.prisma.bulkIssuanceSession.create({
      data: {
        id: sessionId,
        issuerId,
        status,
        validRows: validRows as unknown as Prisma.JsonArray,
        totalRows: validRows.length + errors.length,
        validCount: validRows.length,
        errorCount: errors.length,
        errors: errors as unknown as Prisma.JsonArray,
        rows: rows as unknown as Prisma.JsonArray,
        expiresAt,
      },
    });

    this.logger.log(
      `Created bulk issuance session ${sessionId} for user ${issuerId}: ` +
        `${validRows.length} valid, ${errors.length} errors`,
    );

    return {
      sessionId,
      validRows: validRows.length,
      errorRows: errors.length,
      totalRows: validRows.length + errors.length,
      errors,
      status,
      createdAt,
      expiresAt,
      rows,
    };
  }

  /**
   * Helper: Load and validate a session from the database.
   * Handles not-found, expiration, and IDOR checks.
   */
  private async loadSession(sessionId: string, currentUserId: string) {
    const session = await this.prisma.bulkIssuanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await this.prisma.bulkIssuanceSession.delete({
        where: { id: sessionId },
      });
      throw new NotFoundException(`Session expired: ${sessionId}`);
    }

    // CRITICAL: Validate ownership (IDOR prevention - ARCH-C2)
    if (session.issuerId !== currentUserId) {
      this.logger.warn(
        `IDOR attempt: User ${currentUserId} tried to access session ${sessionId} owned by ${session.issuerId}`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this session',
      );
    }

    return session;
  }

  async getPreviewData(
    sessionId: string,
    currentUserId: string,
    page?: number,
    pageSize?: number,
  ): Promise<EnrichedPreviewData> {
    const session = await this.loadSession(sessionId, currentUserId);

    const sessionErrors = session.errors as any as SessionError[];
    const sessionRows = session.rows as any as PreviewRow[];

    // Collect unique badge template IDs and recipient emails for batch lookup
    const uniqueTemplateIds: string[] = [
      ...new Set(sessionRows.map((r) => r.badgeTemplateId).filter(Boolean)),
    ];
    const uniqueEmails: string[] = [
      ...new Set(
        sessionRows
          .filter((r) => r.isValid)
          .map((r) => r.recipientEmail)
          .filter(Boolean),
      ),
    ];

    // Batch query badge templates (badgeTemplateId can be UUID or name)
    const templateMap = new Map<string, string>();
    if (uniqueTemplateIds.length > 0) {
      const templates = await this.prisma.badgeTemplate.findMany({
        where: {
          OR: [
            { id: { in: uniqueTemplateIds } },
            { name: { in: uniqueTemplateIds } },
          ],
        },
        select: { id: true, name: true },
      });
      for (const t of templates) {
        templateMap.set(t.id, t.name);
        templateMap.set(t.name, t.name);
      }
    }

    // Batch query users by email
    const userMap = new Map<string, string>();
    if (uniqueEmails.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { email: { in: uniqueEmails } },
        select: { email: true, firstName: true, lastName: true },
      });
      for (const u of users) {
        const fullName: string = [u.firstName, u.lastName]
          .filter(Boolean)
          .join(' ');
        userMap.set(u.email, fullName || u.email);
      }
    }

    // Enrich rows with badge and recipient names
    const enrichedRows: EnrichedPreviewRow[] = sessionRows.map((row) => ({
      ...row,
      badgeName: templateMap.get(row.badgeTemplateId),
      recipientName: row.isValid ? userMap.get(row.recipientEmail) : undefined,
    }));

    // Build template breakdown summary from valid rows
    const templateCountMap = new Map<
      string,
      { templateId: string; templateName: string; count: number }
    >();
    for (const row of enrichedRows.filter((r) => r.isValid)) {
      const key = row.badgeTemplateId;
      const existing = templateCountMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        templateCountMap.set(key, {
          templateId: key,
          templateName: row.badgeName || key,
          count: 1,
        });
      }
    }

    // Apply server-side pagination if requested (otherwise return all rows)
    let paginatedRows: EnrichedPreviewRow[] = enrichedRows;
    let currentPage: number | undefined;
    let totalPages: number | undefined;

    if (page !== undefined && pageSize !== undefined && pageSize > 0) {
      const safePage = Math.max(1, page);
      totalPages = Math.ceil(enrichedRows.length / pageSize);
      currentPage = Math.min(safePage, Math.max(1, totalPages));
      const start = (currentPage - 1) * pageSize;
      paginatedRows = enrichedRows.slice(start, start + pageSize);
    }

    return {
      sessionId: session.id,
      validRows: session.validCount,
      errorRows: session.errorCount,
      totalRows: session.totalRows,
      errors: sessionErrors,
      status: session.status as SessionStatus,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      rows: paginatedRows,
      summary: {
        byTemplate: [...templateCountMap.values()],
      },
      ...(currentPage !== undefined && {
        page: currentPage,
        pageSize,
        totalPages,
      }),
    };
  }

  /**
   * Confirm and execute bulk issuance
   *
   * Resolves CSV field values to UUIDs, then issues each badge
   * via BadgeIssuanceService. Individual failures don't stop the batch.
   *
   * CRITICAL: Validates ownership to prevent IDOR attacks (ARCH-C2)
   */
  async confirmBulkIssuance(
    sessionId: string,
    currentUserId: string,
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{
      row: number;
      recipientEmail: string;
      badgeName: string;
      status: 'success' | 'failed';
      error?: string;
      emailError?: string;
      badgeId?: string;
    }>;
  }> {
    const session = await this.loadSession(sessionId, currentUserId);

    if ((session.status as SessionStatus) !== SessionStatus.VALIDATED) {
      throw new BadRequestException(
        `Session is not ready for confirmation. Status: ${session.status}`,
      );
    }

    const sessionValidRows = session.validRows as unknown as Array<{
      badgeTemplateId: string;
      recipientEmail: string;
    }>;

    // MVP limit: 20 badges max
    if (sessionValidRows.length > BulkIssuanceService.MAX_ROWS) {
      throw new BadRequestException(
        `MVP limit: maximum ${BulkIssuanceService.MAX_ROWS} badges per batch`,
      );
    }

    if (sessionValidRows.length === 0) {
      throw new BadRequestException('No valid badges to process');
    }

    // Update status to processing
    await this.prisma.bulkIssuanceSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.PROCESSING },
    });

    const results: Array<{
      row: number;
      recipientEmail: string;
      badgeName: string;
      status: 'success' | 'failed';
      error?: string;
      emailError?: string;
      badgeId?: string;
    }> = [];
    let processed = 0;
    let failed = 0;

    // Process each valid row
    for (let i = 0; i < sessionValidRows.length; i++) {
      const row = sessionValidRows[i];
      try {
        // Resolve badgeTemplateId (could be name or UUID) → UUID
        const template = await this.prisma.badgeTemplate.findFirst({
          where: {
            OR: [{ id: row.badgeTemplateId }, { name: row.badgeTemplateId }],
            status: 'ACTIVE',
          },
        });

        if (!template) {
          throw new Error(
            `Badge template "${row.badgeTemplateId}" not found or inactive`,
          );
        }

        // Resolve recipientEmail → user UUID
        const recipient = await this.prisma.user.findFirst({
          where: { email: row.recipientEmail, isActive: true },
        });

        if (!recipient) {
          throw new Error(
            `No active user found with email: ${row.recipientEmail}`,
          );
        }

        // Issue badge via BadgeIssuanceService
        const issueResult = await this.badgeIssuanceService.issueBadge(
          {
            templateId: template.id,
            recipientId: recipient.id,
          },
          currentUserId,
        );

        processed++;
        results.push({
          row: i + 2,
          recipientEmail: row.recipientEmail,
          badgeName: template.name,
          status: 'success',
          badgeId: issueResult.id,
          ...(issueResult.emailError
            ? { emailError: issueResult.emailError }
            : {}),
        });

        this.logger.debug(
          `Issued badge ${i + 1}/${sessionValidRows.length}: ${template.name} → ${row.recipientEmail}`,
        );
      } catch (error: unknown) {
        failed++;
        results.push({
          row: i + 2,
          recipientEmail: row.recipientEmail,
          badgeName: row.badgeTemplateId,
          status: 'failed',
          error: (error as Error).message,
        });
        this.logger.error(
          `Failed badge ${i + 1}/${sessionValidRows.length} to ${row.recipientEmail}: ${(error as Error).message}`,
        );
      }
    }

    // Update session status based on results
    const finalStatus =
      failed === sessionValidRows.length
        ? SessionStatus.FAILED
        : SessionStatus.COMPLETED;

    await this.prisma.bulkIssuanceSession.update({
      where: { id: sessionId },
      data: { status: finalStatus },
    });

    this.logger.log(
      `Completed bulk issuance session ${sessionId}: ${processed} success, ${failed} failed`,
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
   */
  async getErrorReportCsv(
    sessionId: string,
    currentUserId: string,
  ): Promise<string> {
    const session = await this.loadSession(sessionId, currentUserId);

    const sessionErrors = session.errors as any as SessionError[];

    if (!sessionErrors || sessionErrors.length === 0) {
      throw new BadRequestException('No errors found in this session');
    }

    // Generate sanitized CSV (ARCH-C1: CSV injection prevention)
    const headers = ['Row', 'BadgeTemplateId', 'RecipientEmail', 'Error'];
    const rows = sessionErrors.map((error) => ({
      Row: String(error.rowNumber),
      BadgeTemplateId: error.badgeTemplateId,
      RecipientEmail: error.recipientEmail,
      Error: error.message,
    }));

    return this.csvValidation.generateSafeCsv(headers, rows);
  }
}
