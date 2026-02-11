import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionExpiryTimer from '../SessionExpiryTimer';

describe('SessionExpiryTimer', () => {
  const onExpired = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be hidden when >5 min remaining', () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { container } = render(
      <SessionExpiryTimer expiresAt={expiresAt} onExpired={onExpired} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should be visible with correct time when <5 min remaining', () => {
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    render(<SessionExpiryTimer expiresAt={expiresAt} onExpired={onExpired} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText(/Preview expires in/)).toBeInTheDocument();
  });

  it('should call onExpired when time reaches 0', () => {
    const expiresAt = new Date(Date.now() + 2000).toISOString();
    render(<SessionExpiryTimer expiresAt={expiresAt} onExpired={onExpired} />);

    // Advance time past expiry
    vi.advanceTimersByTime(3000);

    expect(onExpired).toHaveBeenCalledOnce();
  });
});
