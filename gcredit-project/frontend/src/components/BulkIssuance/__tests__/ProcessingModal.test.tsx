import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ProcessingModal from '../ProcessingModal';

describe('ProcessingModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render when isProcessing is true', () => {
    render(<ProcessingModal totalBadges={10} isProcessing={true} />);
    expect(screen.getByText(/Issuing Badges/)).toBeInTheDocument();
  });

  it('should not render when isProcessing is false', () => {
    const { container } = render(
      <ProcessingModal totalBadges={10} isProcessing={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show progress percentage', () => {
    render(<ProcessingModal totalBadges={10} isProcessing={true} />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Advance to trigger progress update
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Progress should have advanced past 0%
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('should display badge count estimate', () => {
    render(<ProcessingModal totalBadges={15} isProcessing={true} />);
    expect(screen.getByText(/Processing ~0\/15 badges/)).toBeInTheDocument();
  });

  it('should show estimated remaining time', () => {
    render(<ProcessingModal totalBadges={10} isProcessing={true} />);
    expect(screen.getByText(/Estimated time remaining/)).toBeInTheDocument();
    expect(screen.getByText(/10 seconds/)).toBeInTheDocument();
  });

  it('should show all text in English (no Chinese)', () => {
    render(<ProcessingModal totalBadges={5} isProcessing={true} />);
    const allText = document.body.textContent ?? '';
    // Verify no Chinese characters exist
    expect(allText).not.toMatch(/[\u4e00-\u9fff]/);
    // Verify key English strings
    expect(screen.getByText(/Issuing Badges/)).toBeInTheDocument();
    expect(screen.getByText(/Please do not refresh or close your browser/)).toBeInTheDocument();
    expect(screen.getByText(/Bulk issuance is in progress/)).toBeInTheDocument();
  });

  it('should show timeout warning after 25 seconds', () => {
    render(<ProcessingModal totalBadges={5} isProcessing={true} />);
    expect(screen.queryByText(/taking longer than expected/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(26000);
    });
    expect(screen.getByText(/taking longer than expected/)).toBeInTheDocument();
  });

  it('should reset progress when processing stops', () => {
    const { rerender } = render(
      <ProcessingModal totalBadges={10} isProcessing={true} />,
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Stop processing
    rerender(<ProcessingModal totalBadges={10} isProcessing={false} />);

    // Re-start processing — should show 0% again
    rerender(<ProcessingModal totalBadges={10} isProcessing={true} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
