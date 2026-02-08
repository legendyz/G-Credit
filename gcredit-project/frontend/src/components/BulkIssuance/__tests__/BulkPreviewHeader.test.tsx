import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BulkPreviewHeader from '../BulkPreviewHeader';

// Mock SessionExpiryTimer to avoid timer side effects
vi.mock('../SessionExpiryTimer', () => ({
  default: ({ expiresAt }: { expiresAt: string; onExpired: () => void }) => (
    <div data-testid="session-timer">Timer: {expiresAt}</div>
  ),
}));

describe('BulkPreviewHeader', () => {
  const defaultProps = {
    totalRows: 100,
    validRows: 95,
    errorRows: 5,
    templateBreakdown: [
      { templateName: 'Leadership', count: 45 },
      { templateName: 'Team Player', count: 30 },
      { templateName: 'Innovation', count: 20 },
    ],
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    onExpired: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correct counts', () => {
    render(<BulkPreviewHeader {...defaultProps} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Bulk Issuance Preview — 100 Badges')).toBeInTheDocument();
  });

  it('should display template breakdown pills', () => {
    render(<BulkPreviewHeader {...defaultProps} />);

    expect(screen.getByText('Leadership: 45')).toBeInTheDocument();
    expect(screen.getByText('Team Player: 30')).toBeInTheDocument();
    expect(screen.getByText('Innovation: 20')).toBeInTheDocument();
  });

  it('should render timer component', () => {
    render(<BulkPreviewHeader {...defaultProps} />);
    expect(screen.getByTestId('session-timer')).toBeInTheDocument();
  });

  it('should not show template section when no breakdown', () => {
    render(<BulkPreviewHeader {...defaultProps} templateBreakdown={[]} />);
    expect(screen.queryByText('Templates:')).not.toBeInTheDocument();
  });
});
