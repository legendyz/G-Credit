/**
 * ErrorBoundary Component - Story 8.1 (UX-P1-003)
 * 
 * React Error Boundary for catching and handling component errors.
 * Provides retry functionality for error recovery.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryProps {
  /** Children components to wrap */
  children: ReactNode;
  /** Fallback component or render function */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom error message */
  errorMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, this.handleReset);
        }
        return this.props.fallback;
      }

      // Default error display
      return (
        <ErrorDisplay
          title="Something went wrong"
          message={this.props.errorMessage || this.state.error?.message || 'An unexpected error occurred'}
          onRetry={this.handleReset}
          variant="page"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}

export default ErrorBoundary;
