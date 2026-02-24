/**
 * SourceBadge Component Tests - Story 12.3b
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceBadge } from './SourceBadge';

describe('SourceBadge', () => {
  it('renders M365 badge with blue styling and icon', () => {
    render(<SourceBadge source="M365" />);

    const badge = screen.getByTestId('source-badge-m365');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('M365');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders Local badge with gray styling', () => {
    render(<SourceBadge source="LOCAL" />);

    const badge = screen.getByTestId('source-badge-local');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Local');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('applies custom className', () => {
    render(<SourceBadge source="M365" className="custom-class" />);

    const badge = screen.getByTestId('source-badge-m365');
    expect(badge).toHaveClass('custom-class');
  });
});
