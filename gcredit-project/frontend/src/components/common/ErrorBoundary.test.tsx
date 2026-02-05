/**
 * ErrorBoundary Component Tests - Story 8.1 (UX-P1-003)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom error message when provided', () => {
    render(
      <ErrorBoundary errorMessage="Custom error message">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('shows retry button and resets state on click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i });
    
    // Rerender with non-throwing component to simulate fix
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(retryButton);
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  it('renders custom fallback when provided as ReactNode', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('renders custom fallback function with error and reset', () => {
    const fallbackFn = vi.fn((error: Error, reset: () => void) => (
      <div>
        <span>Error: {error.message}</span>
        <button onClick={reset}>Reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(fallbackFn).toHaveBeenCalled();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('catches errors from wrapped component', () => {
    const WrappedComponent = withErrorBoundary(
      () => {
        throw new Error('Wrapped error');
      },
      { errorMessage: 'Wrapped component failed' }
    );

    render(<WrappedComponent />);

    expect(screen.getByText('Wrapped component failed')).toBeInTheDocument();
  });

  it('sets correct displayName', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});
