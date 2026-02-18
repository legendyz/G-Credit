/**
 * ProfilePage.test.tsx
 * Story 10.8 BUG-007: Profile & Password Change Page Tests
 *
 * Tests: profile load, edit & save, password validation rules,
 * password change, error handling, show/hide toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from './ProfilePage';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked toast for assertions
import { toast } from 'sonner';

// Mock auth store
const mockAuthStoreState = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'EMPLOYEE',
  },
  isAuthenticated: true,
  accessToken: 'test-token',
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => mockAuthStoreState),
    {
      getState: () => mockAuthStoreState,
      setState: vi.fn(),
    }
  ),
}));

const MOCK_PROFILE = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'EMPLOYEE',
  department: 'Engineering',
  isActive: true,
  emailVerified: true,
  lastLoginAt: '2026-02-01T10:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T10:00:00Z',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: successful profile load
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PROFILE),
    });
  });

  describe('profile loading', () => {
    it('shows loading spinner initially', () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<ProfilePage />);
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('fetches profile with credentials: include on mount', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/profile'),
          expect.objectContaining({
            credentials: 'include',
          })
        );
      });
    });

    it('populates profile fields after loading', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('Employee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });

    it('shows readonly email, role, department fields', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText('Email');
      const roleInput = screen.getByLabelText('Role');
      const deptInput = screen.getByLabelText('Department');

      expect(emailInput).toBeDisabled();
      expect(roleInput).toBeDisabled();
      expect(deptInput).toBeDisabled();
    });

    it('shows error when profile load fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });
  });

  describe('profile edit & save', () => {
    it('Save Changes button is disabled when no changes', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      expect(saveBtn).toBeDisabled();
    });

    it('Save Changes button enables when name changes', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      expect(saveBtn).not.toBeDisabled();
    });

    it('sends PATCH with updated name on save', async () => {
      const user = userEvent.setup();
      // First call: GET profile, Second call: PATCH profile
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...MOCK_PROFILE, firstName: 'Jane' }),
        });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/profile'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ firstName: 'Jane', lastName: 'Doe' }),
          })
        );
      });
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    it('shows validation error for empty first name', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);

      // Need to make hasProfileChanges truthy — modify lastName too
      const lastNameInput = screen.getByLabelText('Last Name');
      await user.clear(lastNameInput);

      // Profile changes exist but validation will fail
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('First name and last name are required')).toBeInTheDocument();
      });
    });
  });

  describe('password change', () => {
    it('renders Change Password section', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      });

      // Card title also exists
      const matches = screen.getAllByText('Change Password');
      expect(matches.length).toBeGreaterThanOrEqual(2); // title + button
    });

    it('Change Password button is disabled when fields are empty', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const changePwdBtn = screen.getByRole('button', { name: /change password/i });
      expect(changePwdBtn).toBeDisabled();
    });

    it('shows error for password too short', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Current Password'), 'oldpass');
      await user.type(screen.getByLabelText('New Password'), 'short');
      await user.type(screen.getByLabelText('Confirm New Password'), 'short');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('New password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('shows error for password without complexity', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Current Password'), 'oldpass');
      await user.type(screen.getByLabelText('New Password'), 'alllowercase');
      await user.type(screen.getByLabelText('Confirm New Password'), 'alllowercase');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/must contain at least one uppercase/i)).toBeInTheDocument();
      });
    });

    it('shows error for password mismatch', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Current Password'), 'oldpass');
      await user.type(screen.getByLabelText('New Password'), 'NewPass123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'NewPass456');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('New password and confirmation do not match')).toBeInTheDocument();
      });
    });

    it('calls change-password API on valid submit', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Password changed' }),
        });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Current Password'), 'OldPass123');
      await user.type(screen.getByLabelText('New Password'), 'NewPass123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'NewPass123');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/change-password'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              currentPassword: 'OldPass123',
              newPassword: 'NewPass123',
            }),
          })
        );
      });
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully');
    });

    it('clears password fields after successful change', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const currentPwd = screen.getByLabelText('Current Password');
      const newPwd = screen.getByLabelText('New Password');
      const confirmPwd = screen.getByLabelText('Confirm New Password');

      await user.type(currentPwd, 'OldPass123');
      await user.type(newPwd, 'NewPass123');
      await user.type(confirmPwd, 'NewPass123');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(currentPwd).toHaveValue('');
        expect(newPwd).toHaveValue('');
        expect(confirmPwd).toHaveValue('');
      });
    });

    it('shows error from API on password change failure', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_PROFILE),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Current password is incorrect' }),
        });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Current Password'), 'WrongPass1');
      await user.type(screen.getByLabelText('New Password'), 'NewPass123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'NewPass123');

      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });
  });

  describe('password visibility toggle', () => {
    it('toggles current password visibility', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const currentPwd = screen.getByLabelText('Current Password') as HTMLInputElement;
      expect(currentPwd.type).toBe('password');

      const toggleBtns = screen.getAllByLabelText('Show password');
      await user.click(toggleBtns[0]);

      expect(currentPwd.type).toBe('text');
    });
  });
});
