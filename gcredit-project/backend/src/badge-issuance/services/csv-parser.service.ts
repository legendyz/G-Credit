import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { BulkIssuanceRow } from '../dto/bulk-issue-badges.dto';

@Injectable()
export class CSVParserService {
  /**
   * Parse CSV file and validate structure
   */
  parseBulkIssuanceCSV(fileBuffer: Buffer): BulkIssuanceRow[] {
    try {
      // Parse CSV with headers
      const records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Check if CSV is empty
      if (!records || records.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Validate headers
      this.validateHeaders(records[0]);

      // Validate and transform rows
      return records.map((row, index) => this.validateRow(row, index + 2)); // +2 for header row
    } catch (error) {
      throw new BadRequestException(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate required CSV headers
   */
  private validateHeaders(firstRow: any) {
    const requiredHeaders = ['recipientEmail', 'templateId'];
    const optionalHeaders = ['evidenceUrl', 'expiresIn'];
    const allHeaders = [...requiredHeaders, ...optionalHeaders];

    const actualHeaders = Object.keys(firstRow);

    // Check for required headers
    const missingHeaders = requiredHeaders.filter(
      (h) => !actualHeaders.includes(h),
    );
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Check for unexpected headers
    const unexpectedHeaders = actualHeaders.filter(
      (h) => !allHeaders.includes(h),
    );
    if (unexpectedHeaders.length > 0) {
      throw new Error(`Unexpected headers: ${unexpectedHeaders.join(', ')}`);
    }
  }

  /**
   * Validate and transform a single row
   */
  private validateRow(row: any, rowNumber: number): BulkIssuanceRow {
    const errors: string[] = [];

    // Validate recipientEmail
    if (!row.recipientEmail || !this.isValidEmail(row.recipientEmail)) {
      errors.push(`Invalid email: ${row.recipientEmail}`);
    }

    // Validate templateId (UUID format)
    if (!row.templateId || !this.isValidUUID(row.templateId)) {
      errors.push(`Invalid templateId: ${row.templateId}`);
    }

    // Validate evidenceUrl (optional)
    if (row.evidenceUrl && !this.isValidURL(row.evidenceUrl)) {
      errors.push(`Invalid evidenceUrl: ${row.evidenceUrl}`);
    }

    // Validate expiresIn (optional)
    if (row.expiresIn) {
      const days = parseInt(row.expiresIn);
      if (isNaN(days) || days < 1 || days > 3650) {
        errors.push(
          `Invalid expiresIn (must be 1-3650 days): ${row.expiresIn}`,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Row ${rowNumber}: ${errors.join(', ')}`);
    }

    return {
      recipientEmail: row.recipientEmail.toLowerCase().trim(),
      templateId: row.templateId.trim(),
      evidenceUrl: row.evidenceUrl?.trim() || undefined,
      expiresIn: row.expiresIn ? parseInt(row.expiresIn) : undefined,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
