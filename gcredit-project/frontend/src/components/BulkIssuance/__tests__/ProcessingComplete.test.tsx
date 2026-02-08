import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcessingComplete from '../ProcessingComplete';

const mockResults = [
  { row: 2, recipientEmail: 'alice@test.com', badgeName: 'Leadership', status: 'success' as const },
  { row: 3, recipientEmail: 'bob@test.com', badgeName: 'Innovation', status: 'success' as const },
  { row: 4, recipientEmail: 'charlie@test.com', badgeName: 'Teamwork', status: 'failed' as const, error: 'User not found' },
  { row: 5, recipientEmail: 'dave@test.com', badgeName: 'Safety', status: 'failed' as const, error: 'Template inactive' },
];

describe('ProcessingComplete', () => {
  const defaultProps = {
    success: 2,
    failed: 2,
    results: mockResults,
    sessionId: 'abc12345-6789-uuid',
    onViewBadges: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success and failure counts', () => {
    render(<ProcessingComplete {...defaultProps} />);
    const successCard = screen.getByText('Issued Successfully').closest('div')!;
    const failedCard = screen.getByText('Failed').closest('div')!;
    expect(successCard.querySelector('p')!.textContent).toBe('2');
    expect(failedCard.querySelector('p')!.textContent).toBe('2');
  });

  it('should show partial failure heading when failures exist', () => {
    render(<ProcessingComplete {...defaultProps} />);
    expect(screen.getByText(/Partial Failure/)).toBeInTheDocument();
  });

  it('should show complete heading when no failures', () => {
    render(
      <ProcessingComplete
        success={5}
        failed={0}
        results={mockResults.filter((r) => r.status === 'success')}
        onViewBadges={vi.fn()}
      />,
    );
    expect(screen.getByText('Issuance Complete')).toBeInTheDocument();
    expect(screen.queryByText(/Partial Failure/)).not.toBeInTheDocument();
  });

  it('should render failed badges table', () => {
    render(<ProcessingComplete {...defaultProps} />);
    expect(screen.getByText('Failed Badges')).toBeInTheDocument();
    expect(screen.getByText('charlie@test.com')).toBeInTheDocument();
    expect(screen.getByText('Teamwork')).toBeInTheDocument();
    expect(screen.getByText('User not found')).toBeInTheDocument();
    expect(screen.getByText('dave@test.com')).toBeInTheDocument();
    expect(screen.getByText('Template inactive')).toBeInTheDocument();
  });

  it('should not render failed badges table when no failures', () => {
    render(
      <ProcessingComplete
        success={5}
        failed={0}
        results={mockResults.filter((r) => r.status === 'success')}
        onViewBadges={vi.fn()}
      />,
    );
    expect(screen.queryByText('Failed Badges')).not.toBeInTheDocument();
  });

  it('should show Download Error Report button when sessionId provided', () => {
    render(<ProcessingComplete {...defaultProps} />);
    expect(screen.getByText('Download Error Report')).toBeInTheDocument();
  });

  it('should not show Download Error Report button without sessionId', () => {
    render(
      <ProcessingComplete
        success={0}
        failed={2}
        results={mockResults.filter((r) => r.status === 'failed')}
        onViewBadges={vi.fn()}
      />,
    );
    expect(screen.queryByText('Download Error Report')).not.toBeInTheDocument();
  });

  it('should call onViewBadges when button clicked', () => {
    const onViewBadges = vi.fn();
    render(
      <ProcessingComplete
        success={5}
        failed={0}
        results={[]}
        onViewBadges={onViewBadges}
      />,
    );
    fireEvent.click(screen.getByText('View Issued Badges'));
    expect(onViewBadges).toHaveBeenCalledOnce();
  });

  it('should show Return to Dashboard when failures exist', () => {
    render(<ProcessingComplete {...defaultProps} />);
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('View Issued Badges')).not.toBeInTheDocument();
  });

  it('should display table headers correctly', () => {
    render(<ProcessingComplete {...defaultProps} />);
    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
