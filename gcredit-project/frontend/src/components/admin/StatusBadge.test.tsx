/**
 * StatusBadge Component Tests - Story 8.10
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders Active badge with correct styling', () => {
    render(<StatusBadge isActive={true} />);
    
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders Inactive badge with correct styling', () => {
    render(<StatusBadge isActive={false} />);
    
    const badge = screen.getByText('Inactive');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-200', 'text-gray-600');
  });

  it('applies custom className', () => {
    render(<StatusBadge isActive={true} className="custom-class" />);
    
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('custom-class');
  });
});
