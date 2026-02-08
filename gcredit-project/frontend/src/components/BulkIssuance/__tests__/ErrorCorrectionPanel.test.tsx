import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorCorrectionPanel from '../ErrorCorrectionPanel';

describe('ErrorCorrectionPanel', () => {
  const defaultProps = {
    errorCount: 5,
    validCount: 15,
    errors: [
      {
        rowNumber: 2,
        badgeTemplateId: 'tmpl-bad',
        recipientEmail: 'bad@example.com',
        message: 'Template not found',
      },
      {
        rowNumber: 4,
        badgeTemplateId: 'tmpl-ok',
        recipientEmail: 'invalid-email',
        message: 'Invalid email format',
      },
    ],
    onDownloadErrorReport: vi.fn(),
    onReupload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error count correctly', () => {
    render(<ErrorCorrectionPanel {...defaultProps} />);
    expect(screen.getByText(/5 errors prevent badge issuance/)).toBeInTheDocument();
  });

  it('should show all error rows in table', () => {
    render(<ErrorCorrectionPanel {...defaultProps} />);
    expect(screen.getByText('Template not found')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByText('bad@example.com')).toBeInTheDocument();
    expect(screen.getByText('invalid-email')).toBeInTheDocument();
  });

  it('should call onDownloadErrorReport when download button clicked', () => {
    render(<ErrorCorrectionPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Download Error Report/ }));
    expect(defaultProps.onDownloadErrorReport).toHaveBeenCalledOnce();
  });

  it('should call onReupload when re-upload button clicked', () => {
    render(<ErrorCorrectionPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Re-upload Fixed CSV/ }));
    expect(defaultProps.onReupload).toHaveBeenCalledOnce();
  });
});
