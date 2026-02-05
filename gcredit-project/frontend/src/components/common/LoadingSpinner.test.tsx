/**
 * LoadingSpinner Component Tests - Story 8.1 (UX-P1-002)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, PageLoader, InlineLoader } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container, rerender } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('.h-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.h-12')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('renders spinner with aria-hidden', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders full screen overlay when fullScreen is true', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });
});

describe('PageLoader', () => {
  it('renders with default text', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<PageLoader text="Loading dashboard..." />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('has large spinner size', () => {
    const { container } = render(<PageLoader />);
    expect(container.querySelector('.h-12')).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('renders with small size', () => {
    const { container } = render(<InlineLoader />);
    expect(container.querySelector('.h-4')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<InlineLoader className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
