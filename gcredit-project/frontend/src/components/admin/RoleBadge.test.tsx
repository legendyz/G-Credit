/**
 * RoleBadge Component Tests - Story 8.10
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge', () => {
  it('renders Admin badge with correct styling', () => {
    render(<RoleBadge role="ADMIN" />);

    const badge = screen.getByText('Admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders Issuer badge with correct styling', () => {
    render(<RoleBadge role="ISSUER" />);

    const badge = screen.getByText('Issuer');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders Manager badge with correct styling', () => {
    render(<RoleBadge role="MANAGER" />);

    const badge = screen.getByText('Manager');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('renders Employee badge with correct styling', () => {
    render(<RoleBadge role="EMPLOYEE" />);

    const badge = screen.getByText('Employee');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('applies custom className', () => {
    render(<RoleBadge role="ADMIN" className="custom-class" />);

    const badge = screen.getByText('Admin');
    expect(badge).toHaveClass('custom-class');
  });

  it('has correct accessible text', () => {
    render(<RoleBadge role="ADMIN" />);

    // Badge text should be readable
    expect(screen.getByText('Admin')).toBeVisible();
  });
});
