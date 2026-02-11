import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyPreviewState from '../EmptyPreviewState';

describe('EmptyPreviewState', () => {
  const onReupload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the no valid badges message', () => {
    render(<EmptyPreviewState onReupload={onReupload} />);
    expect(screen.getByText('No Valid Badges')).toBeInTheDocument();
    expect(screen.getByText(/No valid badges found in CSV file/)).toBeInTheDocument();
  });

  it('should call onReupload when re-upload button clicked', () => {
    render(<EmptyPreviewState onReupload={onReupload} />);
    fireEvent.click(screen.getByText(/Re-upload CSV/));
    expect(onReupload).toHaveBeenCalledOnce();
  });
});
