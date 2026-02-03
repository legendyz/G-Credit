/**
 * ErrorDisplay Component - Story 8.1 (UX-P1-003)
 * 
 * Consistent error display with retry functionality.
 * Shows error messages with optional retry button.
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export interface ErrorDisplayProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Retry button callback */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Variant for styling */
  variant?: 'inline' | 'card' | 'page';
  /** Additional CSS classes */
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try again',
  variant = 'inline',
  className,
}) => {
  if (variant === 'page') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]',
          className
        )}
        role="alert"
      >
        <div className="text-5xl mb-4" aria-hidden="true">
          ⚠️
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            {retryText}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <span className="text-destructive text-xl" aria-hidden="true">⚠️</span>
          <div className="flex-1">
            <p className="font-medium text-destructive">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                {retryText}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Network Error preset
 */
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorDisplay
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection."
    onRetry={onRetry}
    variant="card"
  />
);

/**
 * Data Fetch Error preset
 */
export const FetchError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorDisplay
    title="Failed to load data"
    message="We couldn't load the requested data. Please try again."
    onRetry={onRetry}
    variant="card"
  />
);

export default ErrorDisplay;
