/**
 * AccessDeniedPage Tests - Story 11.19
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccessDeniedPage from './AccessDeniedPage';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock Layout component
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) => (
    <div data-testid="layout" data-title={pageTitle}>
      {children}
    </div>
  ),
}));

// Mock authStore
vi.mock('@/stores/authStore', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useAuthStore: (selector: (s: any) => any) => selector({ user: { role: 'EMPLOYEE' } }),
}));

describe('AccessDeniedPage', () => {
  it('renders 403 heading', () => {
    render(<AccessDeniedPage />);
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders Access Denied title', () => {
    render(<AccessDeniedPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('displays current user role', () => {
    render(<AccessDeniedPage />);
    expect(screen.getByText(/EMPLOYEE/)).toBeInTheDocument();
  });

  it('renders Go Back button', () => {
    render(<AccessDeniedPage />);
    expect(screen.getByText('← Go Back')).toBeInTheDocument();
  });

  it('renders Contact Admin button with mailto link', () => {
    render(<AccessDeniedPage />);
    const contactBtn = screen.getByText('Contact Admin');
    expect(contactBtn).toBeInTheDocument();
    expect(contactBtn.closest('a')).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });

  it('renders both buttons in the action area', () => {
    render(<AccessDeniedPage />);
    const goBack = screen.getByText('← Go Back');
    const contact = screen.getByText('Contact Admin');
    // Both buttons are in the same flex container
    expect(goBack.parentElement).toBe(contact.closest('a')?.parentElement);
  });
});
