import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor to parse JSON fields from multipart/form-data requests
 * 
 * Problem: When sending multipart/form-data with JSON fields, tools like curl
 * may send malformed JSON (e.g., missing quotes around UUIDs or object keys).
 * This causes UUID strings like "88eb8c69-0e5e-4639-96c4-5e80a9401e3d" to be
 * parsed as scientific notation (the 'e' is interpreted as exponent).
 * 
 * Solution: This interceptor automatically parses and fixes common JSON issues
 * in multipart form data before the request reaches the controller.
 * 
 * Usage:
 * @UseInterceptors(MultipartJsonInterceptor)
 * @UseInterceptors(FileInterceptor('image'))
 * async create(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
 *   // body.skillIds and body.issuanceCriteria are already parsed
 * }
 */
@Injectable()
export class MultipartJsonInterceptor implements NestInterceptor {
  /**
   * Fields that should be parsed as JSON
   * Override this in extended classes to customize
   */
  protected jsonFields: string[] = ['skillIds', 'issuanceCriteria'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body) {
      return next.handle();
    }

    // Parse each JSON field
    for (const field of this.jsonFields) {
      if (body[field]) {
        try {
          body[field] = this.parseJsonField(field, body[field]);
        } catch (error) {
          throw new BadRequestException(
            `Invalid JSON in field '${field}': ${error.message}`,
          );
        }
      }
    }

    return next.handle();
  }

  /**
   * Parse a single JSON field with automatic fixing of common issues
   */
  private parseJsonField(fieldName: string, value: any): any {
    // Already parsed (object or array)
    if (typeof value !== 'string') {
      return value;
    }

    let jsonStr = value.trim();

    // Handle different field types
    if (fieldName === 'skillIds') {
      return this.parseSkillIds(jsonStr);
    } else if (fieldName === 'issuanceCriteria') {
      return this.parseIssuanceCriteria(jsonStr);
    }

    // Generic JSON parsing
    return this.parseGenericJson(jsonStr);
  }

  /**
   * Parse skillIds array
   * Handles formats like:
   * - [88eb8c69-0e5e-4639-96c4-5e80a9401e3d]
   * - ["88eb8c69-0e5e-4639-96c4-5e80a9401e3d"]
   * - [88eb..., 77cd...]
   */
  private parseSkillIds(jsonStr: string): string[] {
    // Handle array format
    if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
      const content = jsonStr.slice(1, -1).trim();
      
      // Empty array
      if (!content) {
        return [];
      }

      // Split by comma and clean up UUIDs
      const uuids = content.split(',').map((id: string) => {
        // Remove quotes if present
        let cleanId = id.trim().replace(/^["']|["']$/g, '');
        return cleanId;
      }).filter(id => id.length > 0); // Remove empty strings

      return uuids;
    }

    // Try standard JSON parse
    try {
      const parsed = JSON.parse(jsonStr);
      // Ensure it's an array
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      // If parse fails and it's a single UUID string, wrap it in array
      return [jsonStr.trim()];
    }
  }

  /**
   * Parse issuanceCriteria object
   * Handles formats like:
   * - {type:manual}
   * - {"type":"manual"}
   * - {type:manual,config:{...}}
   */
  private parseIssuanceCriteria(jsonStr: string): any {
    // Fix common JSON issues:
    // 1. Unquoted keys: {type:manual} -> {"type":manual}
    // 2. Unquoted string values: {"type":manual} -> {"type":"manual"}
    
    let fixed = jsonStr;

    // Fix unquoted keys: word followed by colon
    fixed = fixed.replace(/(\w+):/g, '"$1":');

    // Fix unquoted string values: colon followed by word (before comma, } or end of string)
    // But preserve numbers and booleans
    fixed = fixed.replace(/:(\w+)(,|}|$)/g, (match, value, after) => {
      // Don't quote numbers or booleans
      if (['true', 'false', 'null'].includes(value) || !isNaN(Number(value))) {
        return `:${value}${after}`;
      }
      return `:"${value}"${after}`;
    });

    // Parse the fixed JSON
    try {
      return JSON.parse(fixed);
    } catch (error) {
      // If still fails, try standard parsing
      return JSON.parse(jsonStr);
    }
  }

  /**
   * Generic JSON parser with error handling
   */
  private parseGenericJson(jsonStr: string): any {
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
}

/**
 * Extended interceptor for custom JSON fields
 * 
 * Example:
 * @Injectable()
 * export class CustomMultipartInterceptor extends MultipartJsonInterceptor {
 *   protected jsonFields = ['myCustomField', 'anotherField'];
 * }
 */
export class ExtendableMultipartJsonInterceptor extends MultipartJsonInterceptor {
  constructor(jsonFields?: string[]) {
    super();
    if (jsonFields) {
      this.jsonFields = jsonFields;
    }
  }
}
