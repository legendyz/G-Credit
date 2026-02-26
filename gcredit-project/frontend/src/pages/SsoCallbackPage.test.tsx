/**
 * SsoCallbackPage Tests - Story 13.4: Login Page Dual Entry
 *
 * Tests: success flow → dashboard, failure flow → login with error, loading state.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SsoCallbackPage } from './SsoCallbackPage';
import { useAuthStore } from '../stores/authStore';

// Mock authStore
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLoginViaSSO = vi.fn();

function renderCallbackPage() {
  return render(
    <MemoryRouter initialEntries={['/sso/callback?success=true']}>
      <SsoCallbackPage />
    </MemoryRouter>
  );
}

describe('SsoCallbackPage (Story 13.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = { loginViaSSO: mockLoginViaSSO };
        return selector(state);
      }
    );
  });

  it('shows loading state during validation', () => {
    mockLoginViaSSO.mockReturnValue(new Promise(() => {})); // never resolves
    renderCallbackPage();

    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it('navigates to dashboard on successful SSO validation', async () => {
    mockLoginViaSSO.mockResolvedValue(true);
    renderCallbackPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('navigates to login with error on failed SSO validation', async () => {
    mockLoginViaSSO.mockResolvedValue(false);
    renderCallbackPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=sso_failed', { replace: true });
    });
  });

  it('redirects to login with error when SSO validation times out', async () => {
    vi.useFakeTimers();
    mockLoginViaSSO.mockReturnValue(new Promise(() => {})); // never resolves
    renderCallbackPage();

    // Advance past the 10-second timeout
    vi.advanceTimersByTime(10_000);

    expect(mockNavigate).toHaveBeenCalledWith('/login?error=sso_failed', { replace: true });
    vi.useRealTimers();
  });
});
