import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevokedBadgeAlert } from './RevokedBadgeAlert';

describe('RevokedBadgeAlert', () => {
  it('should render revoked alert with public reason', () => {
    const props = {
      revokedAt: '2026-02-01T10:00:00Z',
      reason: 'Issued in Error',
      notes: 'Badge was issued to wrong recipient',
      isPublicReason: true,
    };

    render(<RevokedBadgeAlert {...props} />);

    // AC1: Visual status indicator
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/BADGE REVOKED/i)).toBeInTheDocument();
    
    // AC1: Revoked date displayed
    expect(screen.getByText(/February 1, 2026/i)).toBeInTheDocument();

    // AC2: Public reason displayed
    expect(screen.getByText('Issued in Error')).toBeInTheDocument();
    expect(screen.getByText('Badge was issued to wrong recipient')).toBeInTheDocument();
  });

  it('should show generic message for private reasons', () => {
    const props = {
      revokedAt: '2026-02-01T10:00:00Z',
      reason: 'Policy Violation',
      notes: 'Confidential policy violation details',
      isPublicReason: false,
    };

    render(<RevokedBadgeAlert {...props} />);

    // AC2: Private reason shows generic message
    expect(screen.getByText(/This badge has been revoked/i)).toBeInTheDocument();
    expect(screen.queryByText('Policy Violation')).not.toBeInTheDocument();
    expect(screen.queryByText('Confidential policy violation details')).not.toBeInTheDocument();
  });

  it('should handle missing notes gracefully', () => {
    const props = {
      revokedAt: '2026-02-01T10:00:00Z',
      reason: 'Expired',
      isPublicReason: true,
    };

    render(<RevokedBadgeAlert {...props} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    // Should not crash without notes
  });

  it('should have proper ARIA attributes', () => {
    const props = {
      revokedAt: '2026-02-01T10:00:00Z',
      reason: 'Duplicate',
      isPublicReason: true,
    };

    render(<RevokedBadgeAlert {...props} />);

    // NFR: Accessibility
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
  });
});
