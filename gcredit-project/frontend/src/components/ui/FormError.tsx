/**
 * Form Error Component (Story 8.3 - AC4)
 * WCAG 3.3.1 - Error Identification
 * 
 * Accessible error message display for form validation.
 * Uses role="alert" for immediate screen reader announcement.
 */

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  /** Error message to display */
  message?: string;
  /** ID for aria-describedby linking */
  id?: string;
  /** Additional CSS classes */
  className?: string;
}

export function FormError({ message, id, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-1.5 text-sm text-red-600 mt-1.5',
        className
      )}
    >
      <AlertCircle 
        className="h-4 w-4 flex-shrink-0" 
        aria-hidden="true" 
      />
      <span>{message}</span>
    </div>
  );
}

/**
 * Form Error Summary Component
 * Displays a summary of all form errors at the top of a form.
 */
interface FormErrorSummaryProps {
  /** Array of error messages */
  errors: string[];
  /** Summary title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className,
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-md bg-red-50 border border-red-200 p-4 mb-4',
        className
      )}
    >
      <div className="flex">
        <AlertCircle
          className="h-5 w-5 text-red-600 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FormError;
