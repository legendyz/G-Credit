import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
  };

  it('renders title and description', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel clicked', () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows destructive variant for variant="danger"', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" confirmLabel="Delete" />);

    const deleteButton = screen.getByText('Delete');
    // Shadcn destructive variant uses bg-destructive class
    expect(deleteButton.className).toMatch(/destructive/);
  });

  it('disables buttons when loading=true', () => {
    render(<ConfirmDialog {...defaultProps} loading />);

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeDisabled();
  });

  it('shows custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" cancelLabel="No, keep it" />
    );

    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('No, keep it')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });
});
