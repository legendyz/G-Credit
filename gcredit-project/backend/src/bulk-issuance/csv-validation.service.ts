import { Injectable, Logger } from '@nestjs/common';

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
    
    if (this.DANGEROUS_PREFIXES.some(prefix => value.startsWith(prefix))) {
      this.logger.warn(`Sanitizing potentially dangerous CSV field: ${value.substring(0, 20)}...`);
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
  sanitizeRow<T extends Record<string, any>>(row: T): T {
    const sanitized: Record<string, any> = {};
    
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
    
    return value.startsWith('EXAMPLE-') || 
           value.includes('DELETE-THIS-ROW') ||
           value.startsWith('example-');
  }

  /**
   * Validate that a template ID is not example data
   * 
   * @param templateId - The template ID to validate
   * @returns Validation result with error message if invalid
   */
  validateBadgeTemplateId(templateId: string): { valid: boolean; error?: string } {
    if (!templateId) {
      return { valid: false, error: 'Template ID is required' };
    }

    if (this.isExampleData(templateId)) {
      return {
        valid: false,
        error: 'Example row detected. Please delete example rows and add your real data.'
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
        error: 'Example email detected. Please use a real email address.'
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
   * Generate safe CSV content with sanitized values
   * 
   * @param headers - Array of header names
   * @param rows - Array of row data
   * @returns CSV string with sanitized content
   */
  generateSafeCsv(headers: string[], rows: Array<Record<string, any>>): string {
    const headerLine = headers.join(',');
    
    const dataLines = rows.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        
        const stringValue = String(value);
        const sanitized = this.sanitizeCsvField(stringValue);
        
        // Escape quotes and wrap in quotes if contains comma or newline
        if (sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"')) {
          return `"${sanitized.replace(/"/g, '""')}"`;
        }
        return sanitized;
      }).join(',');
    });
    
    return [headerLine, ...dataLines].join('\n');
  }
}
