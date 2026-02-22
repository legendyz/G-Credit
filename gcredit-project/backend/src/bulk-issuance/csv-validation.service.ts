import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import sanitize from 'sanitize-html';

/**
 * CSV Validation Service
 *
 * Provides CSV field validation and sanitization to prevent:
 * - CSV Injection attacks (formula injection)
 * - Example row submissions
 * - Malformed data
 *
 * Security Note (ARCH-C1): CSV injection is a serious vulnerability where
 * malicious formulas (e.g., =cmd|'/c calc'!A1) can execute arbitrary code
 * when opened in Excel or LibreOffice.
 */
@Injectable()
export class CsvValidationService {
  private readonly logger = new Logger(CsvValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prefixes that can trigger formula execution in spreadsheet applications
   */
  private readonly DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

  /**
   * Sanitize CSV field to prevent formula injection attacks
   * Strips dangerous formula prefixes that Excel/LibreOffice execute
   *
   * @param value - The field value to sanitize
   * @returns Sanitized value with single quote prefix if dangerous
   */
  sanitizeCsvField(value: string): string {
    if (!value) return value;

    if (this.DANGEROUS_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      this.logger.warn(
        `Sanitizing potentially dangerous CSV field: ${value.substring(0, 20)}...`,
      );
      return "'" + value; // Prefix with single quote to force text
    }

    return value;
  }

  /**
   * Sanitize all fields in a row for CSV export
   *
   * @param row - Object with string values to sanitize
   * @returns New object with all values sanitized
   */
  sanitizeRow<T extends Record<string, unknown>>(row: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeCsvField(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  /**
   * Check if a value is an example row that should be rejected
   *
   * @param value - The value to check
   * @returns true if the value appears to be example data
   */
  isExampleData(value: string): boolean {
    if (!value) return false;

    return (
      value.startsWith('EXAMPLE-') ||
      value.includes('DELETE-THIS-ROW') ||
      value.startsWith('example-')
    );
  }

  /**
   * Sanitize text input to prevent XSS attacks (ARCH-C7)
   * Strips ALL HTML tags and attributes from text fields
   *
   * @param value - The text value to sanitize
   * @returns Sanitized text with all HTML removed
   */
  sanitizeTextInput(value: string): string {
    if (!value) return value;
    return sanitize(value, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  /**
   * Validate that a template ID is not example data
   *
   * @param templateId - The template ID to validate
   * @returns Validation result with error message if invalid
   */
  validateBadgeTemplateId(templateId: string): {
    valid: boolean;
    error?: string;
  } {
    if (!templateId) {
      return { valid: false, error: 'Template ID is required' };
    }

    if (this.isExampleData(templateId)) {
      return {
        valid: false,
        error:
          'Example row detected. Please delete example rows and add your real data.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate email is not example data
   *
   * @param email - The email to validate
   * @returns Validation result with error message if invalid
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    if (email.startsWith('example-') || email.includes('@example.com')) {
      return {
        valid: false,
        error: 'Example email detected. Please use a real email address.',
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Validate evidence URL format (optional field)
   *
   * @param url - The URL to validate (null/empty is valid since optional)
   * @returns Validation result with error message if invalid
   */
  validateEvidenceUrl(url: string | null): { valid: boolean; error?: string } {
    if (!url || url.trim() === '') return { valid: true }; // Optional field

    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(url)) {
      return {
        valid: false,
        error: 'Evidence URL must be a valid HTTP/HTTPS URL',
      };
    }
    return { valid: true };
  }

  /**
   * Validate narrative justification length (optional, max 500 chars)
   *
   * @param text - The notes text to validate
   * @returns Validation result with error message if invalid
   */
  validateNotes(text: string | null): { valid: boolean; error?: string } {
    if (!text || text.trim() === '') return { valid: true }; // Optional field

    if (text.length > 500) {
      return {
        valid: false,
        error: `Notes exceed 500 character limit (${text.length} chars)`,
      };
    }
    return { valid: true };
  }

  /**
   * Validate that a badge template exists with ACTIVE status in the database
   * Accepts either UUID or template name
   *
   * @param badgeTemplateId - The template ID or name to validate
   * @returns Validation result with error message if invalid
   */
  async validateBadgeTemplateIdInDb(
    badgeTemplateId: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (!badgeTemplateId) {
      return { valid: false, error: 'Badge template ID is required' };
    }

    if (this.isExampleData(badgeTemplateId)) {
      return {
        valid: false,
        error:
          'Example row detected. Please delete example rows and add your real data.',
      };
    }

    // Check if template exists by UUID or name with ACTIVE status
    const template = await this.prisma.badgeTemplate.findFirst({
      where: {
        OR: [{ id: badgeTemplateId }, { name: badgeTemplateId }],
        status: 'ACTIVE',
      },
    });

    if (!template) {
      return {
        valid: false,
        error: `Badge template "${badgeTemplateId}" not found or is not in ACTIVE status`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate that the recipient email belongs to a registered, active user
   *
   * @param email - The email to validate against the user database
   * @returns Validation result with error message if invalid
   */
  async validateRegisteredEmail(
    email: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    if (email.startsWith('example-') || email.includes('@example.com')) {
      return {
        valid: false,
        error: 'Example email detected. Please use a real email address.',
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Check if user exists and is active in database
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        isActive: true,
      },
    });

    if (!user) {
      return {
        valid: false,
        error: `No active registered user found with email: ${email}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate a complete CSV row (with DB checks)
   *
   * @param row - Record with CSV field values
   * @returns Validation result with array of error messages
   */
  async validateRow(
    row: Record<string, string>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const templateResult = await this.validateBadgeTemplateIdInDb(
      row.badgeTemplateId,
    );
    if (!templateResult.valid) errors.push(templateResult.error!);

    const emailResult = await this.validateRegisteredEmail(row.recipientEmail);
    if (!emailResult.valid) errors.push(emailResult.error!);

    const notesResult = this.validateNotes(row.narrativeJustification);
    if (!notesResult.valid) errors.push(notesResult.error!);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a row using a transaction-scoped Prisma client (ARCH-C4)
   * Ensures consistent reads during batch validation
   *
   * @param row - Record with CSV field values
   * @param tx - Transaction-scoped Prisma client
   * @returns Validation result with array of error messages
   */
  async validateRowInTransaction(
    row: Record<string, string>,
    tx: {
      badgeTemplate: { findFirst: (...args: unknown[]) => unknown };
      user: { findFirst: (...args: unknown[]) => unknown };
    },
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Badge template validation within transaction
    if (!row.badgeTemplateId) {
      errors.push('Badge template ID is required');
    } else if (this.isExampleData(row.badgeTemplateId)) {
      errors.push(
        'Example row detected. Please delete example rows and add your real data.',
      );
    } else {
      const template = await tx.badgeTemplate.findFirst({
        where: {
          OR: [{ id: row.badgeTemplateId }, { name: row.badgeTemplateId }],
          status: 'ACTIVE',
        },
      });
      if (!template) {
        errors.push(
          `Badge template "${row.badgeTemplateId}" not found or is not in ACTIVE status`,
        );
      }
    }

    // Recipient email validation within transaction
    if (!row.recipientEmail) {
      errors.push('Email is required');
    } else if (
      row.recipientEmail.startsWith('example-') ||
      row.recipientEmail.includes('@example.com')
    ) {
      errors.push('Example email detected. Please use a real email address.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.recipientEmail)) {
        errors.push('Invalid email format');
      } else {
        const user = await tx.user.findFirst({
          where: { email: row.recipientEmail, isActive: true },
        });
        if (!user) {
          errors.push(
            `No active registered user found with email: ${row.recipientEmail}`,
          );
        }
      }
    }

    // Non-DB validations (same as regular validateRow)
    const notesResult = this.validateNotes(row.narrativeJustification);
    if (!notesResult.valid) errors.push(notesResult.error!);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate safe CSV content with sanitized values
   *
   * @param headers - Array of header names
   * @param rows - Array of row data
   * @returns CSV string with sanitized content
   */
  generateSafeCsv(
    headers: string[],
    rows: Array<Record<string, string | number | boolean | null>>,
  ): string {
    const headerLine = headers.join(',');

    const dataLines = rows.map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';

          const stringValue = String(value);
          const sanitized = this.sanitizeCsvField(stringValue);

          // Escape quotes and wrap in quotes if contains comma or newline
          if (
            sanitized.includes(',') ||
            sanitized.includes('\n') ||
            sanitized.includes('"')
          ) {
            return `"${sanitized.replace(/"/g, '""')}"`;
          }
          return sanitized;
        })
        .join(',');
    });

    return [headerLine, ...dataLines].join('\n');
  }
}
