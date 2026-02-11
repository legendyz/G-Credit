/**
 * ErrorDisplay Component Tests - Story 8.1 (UX-P1-003)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorDisplay, NetworkError, FetchError } from './ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders with message', () => {
    render(<ErrorDisplay message="Something failed" />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<ErrorDisplay title="Custom Error" message="Error message" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={handleRetry} />);

    const button = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalled();
  });

  it('renders with custom retry text', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} retryText="Reload" />);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('renders inline variant by default', () => {
    const { container } = render(<ErrorDisplay message="Error" />);
    // Should have Alert component structure
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('renders card variant', () => {
    const { container } = render(<ErrorDisplay message="Error" variant="card" />);
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
  });

  it('renders page variant', () => {
    render(<ErrorDisplay message="Error" variant="page" />);
    // Page variant has centered content with min-height
    expect(screen.getByRole('alert')).toHaveClass('min-h-[400px]');
  });

  it('has proper accessibility role', () => {
    render(<ErrorDisplay message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('NetworkError', () => {
  it('renders with preset text', () => {
    render(<NetworkError />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(
      screen.getByText('Unable to connect to the server. Please check your internet connection.')
    ).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<NetworkError onRetry={handleRetry} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleRetry).toHaveBeenCalled();
  });
});

describe('FetchError', () => {
  it('renders with preset text', () => {
    render(<FetchError />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<FetchError onRetry={handleRetry} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleRetry).toHaveBeenCalled();
  });
});
