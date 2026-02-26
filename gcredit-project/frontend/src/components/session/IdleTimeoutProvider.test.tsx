import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdleTimeoutProvider } from './IdleTimeoutProvider';

// Mock authStore
const mockState = {
  isAuthenticated: false,
  sessionValidated: false,
  logout: vi.fn(),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign((selector: (s: typeof mockState) => unknown) => selector(mockState), {
    getState: () => mockState,
  }),
}));

// Mock useIdleTimeout
const mockUseIdleTimeout = vi.fn().mockReturnValue({
  isWarning: false,
  secondsRemaining: 0,
  resetTimer: vi.fn(),
});

vi.mock('@/hooks/useIdleTimeout', () => ({
  useIdleTimeout: (...args: unknown[]) => mockUseIdleTimeout(...args),
}));

describe('IdleTimeoutProvider', () => {
  beforeEach(() => {
    mockUseIdleTimeout.mockClear();
    mockState.isAuthenticated = false;
    mockState.sessionValidated = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render modal when not authenticated', () => {
    mockUseIdleTimeout.mockReturnValue({
      isWarning: false,
      secondsRemaining: 0,
      resetTimer: vi.fn(),
    });

    render(<IdleTimeoutProvider />);

    expect(screen.queryByText(/Session Expiring/)).not.toBeInTheDocument();
    expect(mockUseIdleTimeout).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('renders modal when warning fires (authenticated)', () => {
    mockState.isAuthenticated = true;
    mockState.sessionValidated = true;
    mockUseIdleTimeout.mockReturnValue({
      isWarning: true,
      secondsRemaining: 120,
      resetTimer: vi.fn(),
    });

    render(<IdleTimeoutProvider />);

    expect(screen.getByText(/Session Expiring/)).toBeInTheDocument();
    const matches = screen.getAllByText('2:00', { exact: false });
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(mockUseIdleTimeout).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});
