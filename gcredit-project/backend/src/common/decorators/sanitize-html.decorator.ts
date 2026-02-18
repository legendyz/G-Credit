import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Decorator: Automatically strip HTML tags from string fields.
 * Uses sanitize-html library with allowedTags: [] (strip all).
 * Apply to @Body() DTO string fields for write operations only.
 *
 * @example
 * ```typescript
 * @IsString()
 * @SanitizeHtml()
 * name: string;
 * ```
 */
export function SanitizeHtml(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value as unknown;
    return String(
      sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      }),
    ).trim();
  });
}
