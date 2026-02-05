/**
 * LoadingSpinner Component - Story 8.1 (UX-P1-002)
 * 
 * Accessible loading indicator with optional text support.
 * Consistent loading experience across the application.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading text */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Full screen overlay mode */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  fullScreen = false,
}) => {
  const spinner = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text ? (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </p>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  );

  return spinner;
};

/**
 * Page-level loading state
 */
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

/**
 * Inline loading indicator for buttons/cards
 */
export const InlineLoader: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner size="sm" className={className} />
);

export default LoadingSpinner;
