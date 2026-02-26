import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdleWarningModal } from './IdleWarningModal';

describe('IdleWarningModal', () => {
  it('renders when open=true', () => {
    render(<IdleWarningModal open={true} secondsRemaining={300} onContinue={() => {}} />);

    expect(screen.getByText(/Session Expiring/)).toBeInTheDocument();
  });

  it('displays formatted countdown', () => {
    render(<IdleWarningModal open={true} secondsRemaining={125} onContinue={() => {}} />);

    // 125 seconds = 2:05 — appears in both description and large display
    const matches = screen.getAllByText('2:05', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('Continue Working button calls onContinue', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();

    render(<IdleWarningModal open={true} secondsRemaining={60} onContinue={onContinue} />);

    await user.click(screen.getByRole('button', { name: /Continue Working/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('not rendered when open=false', () => {
    render(<IdleWarningModal open={false} secondsRemaining={300} onContinue={() => {}} />);

    expect(screen.queryByText(/Session Expiring/)).not.toBeInTheDocument();
  });

  it('countdown at 0:00', () => {
    render(<IdleWarningModal open={true} secondsRemaining={0} onContinue={() => {}} />);

    const matches = screen.getAllByText('0:00', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
