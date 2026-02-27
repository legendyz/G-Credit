/**
 * LoginPage Tests - Story 13.4: Login Page Dual Entry
 *
 * Tests: SSO button rendering, SSO redirect, SSO error display,
 * password login, shadcn components, loading state.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../stores/authStore';

// Mock authStore
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
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

const mockLogin = vi.fn();
const mockClearError = vi.fn();

const defaultAuthState = {
  login: mockLogin,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  clearError: mockClearError,
  loginViaSSO: vi.fn(),
};

function renderLoginPage(route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage (Story 13.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as Mock).mockReturnValue(defaultAuthState);
    // Reset window.location mock
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, href: '' },
    });
  });

  it('renders SSO button with Microsoft branding', () => {
    renderLoginPage();
    const ssoButton = screen.getByRole('button', { name: /sign in with microsoft/i });
    expect(ssoButton).toBeInTheDocument();
    // Microsoft logo SVG should be present
    const svg = ssoButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('SSO button click triggers redirect to /api/auth/sso/login', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    const ssoButton = screen.getByRole('button', { name: /sign in with microsoft/i });

    await user.click(ssoButton);

    expect(window.location.href).toBe('/api/auth/sso/login');
  });

  it('SSO button shows loading state after click', async () => {
    renderLoginPage();
    const user = userEvent.setup();
    const ssoButton = screen.getByRole('button', { name: /sign in with microsoft/i });

    await user.click(ssoButton);

    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    expect(ssoButton).toBeDisabled();
  });

  it('displays SSO error from URL params (sso_cancelled)', () => {
    renderLoginPage('/login?error=sso_cancelled');

    expect(screen.getByRole('alert')).toHaveTextContent('Sign-in was cancelled. Please try again.');
  });

  it('displays SSO error from URL params (account_disabled)', () => {
    renderLoginPage('/login?error=account_disabled');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your account has been deactivated. Contact your administrator.'
    );
  });

  it('renders email and password fields with shadcn Input components', () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    // shadcn Input uses specific class patterns
    expect(emailInput.tagName).toBe('INPUT');
    expect(passwordInput.tagName).toBe('INPUT');
  });

  it('renders visual separator between SSO and email form', () => {
    renderLoginPage();
    expect(screen.getByText(/or sign in with email/i)).toBeInTheDocument();
  });

  it('password login form calls authStore.login()', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays auth store error', () => {
    (useAuthStore as unknown as Mock).mockReturnValue({
      ...defaultAuthState,
      error: 'Invalid credentials',
    });

    renderLoginPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('redirects if already authenticated', () => {
    (useAuthStore as unknown as Mock).mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
    });

    renderLoginPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('displays generic message for unknown SSO error code', () => {
    renderLoginPage('/login?error=unknown_code_xyz');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'An unexpected error occurred. Please try again.'
    );
  });

  // Story 13.6: reason param toast tests
  it('shows info toast for reason=session_expired', async () => {
    const { toast } = await import('sonner');
    renderLoginPage('/login?reason=session_expired');

    expect(toast.info).toHaveBeenCalledWith('Your session has expired. Please log in again.');
  });

  it('shows info toast for reason=idle_timeout', async () => {
    const { toast } = await import('sonner');
    renderLoginPage('/login?reason=idle_timeout');

    expect(toast.info).toHaveBeenCalledWith(
      'Session expired due to inactivity. Please log in again.'
    );
  });
});
