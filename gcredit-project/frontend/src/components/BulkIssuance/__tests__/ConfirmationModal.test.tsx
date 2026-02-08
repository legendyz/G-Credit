import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    badgeCount: 15,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the badge count', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/Confirm Bulk Issuance/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirmed', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Confirm and Issue/));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('should call onCancel when cancelled', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });
});
