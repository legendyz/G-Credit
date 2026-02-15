/**
 * MobileNav Component Tests - Story 8.5: Responsive Design (AC1)
 *
 * Tests for mobile navigation with hamburger menu and slide-out drawer.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { useAuthStore } from '../../stores/authStore';

// Mock authStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockLogout = vi.fn().mockResolvedValue(undefined);

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN',
};

const renderMobileNav = () => {
  return render(
    <BrowserRouter>
      <MobileNav />
    </BrowserRouter>
  );
};

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });
  });

  describe('Hamburger Menu', () => {
    it('renders hamburger menu button', () => {
      renderMobileNav();
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('hamburger button has 44×44px touch target', () => {
      renderMobileNav();
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveClass('w-11', 'h-11');
    });

    it('opens drawer when hamburger is clicked', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('changes aria-expanded when drawer opens', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Slide-out Drawer', () => {
    it('drawer is hidden by default', () => {
      renderMobileNav();
      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).toHaveClass('translate-x-full');
    });

    it('drawer slides in when opened', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).toHaveClass('translate-x-0');
    });

    it('closes drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      // Get the close button inside the drawer (there are 2, get the one in the drawer header)
      const closeButtons = screen.getAllByRole('button', { name: /close menu/i });
      await user.click(closeButtons[0]);

      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).toHaveClass('translate-x-full');
    });

    it('closes drawer when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));
      await user.keyboard('{Escape}');

      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).toHaveClass('translate-x-full');
    });

    it('closes drawer when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      // Click the backdrop (first fixed overlay)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        const drawer = document.getElementById('mobile-nav-drawer');
        expect(drawer).toHaveClass('translate-x-full');
      });
    });
  });

  describe('Navigation Links', () => {
    it('displays navigation links for admin user', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      expect(screen.getByRole('menuitem', { name: /my wallet/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /badge management/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /analytics/i })).toBeInTheDocument();
    });

    it('navigation links have 44px minimum height', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      const walletLink = screen.getByRole('menuitem', { name: /my wallet/i });
      expect(walletLink).toHaveClass('min-h-[44px]');
    });

    it('hides admin links for non-admin users', async () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { ...mockUser, role: 'EMPLOYEE' },
        isAuthenticated: true,
        logout: mockLogout,
      });

      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      expect(screen.getByRole('menuitem', { name: /my wallet/i })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: /badge management/i })).not.toBeInTheDocument();
    });
  });

  describe('User Info', () => {
    it('displays user initials in avatar', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('displays user name and role', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  describe('Logout', () => {
    it('logout button has 44px minimum height', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      const logoutButton = screen.getByRole('button', { name: /sign out/i });
      expect(logoutButton).toHaveClass('min-h-[44px]');
    });

    it('calls logout when sign out is clicked', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));
      await user.click(screen.getByRole('button', { name: /sign out/i }));

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('drawer has proper ARIA attributes when open', async () => {
      const user = userEvent.setup();
      renderMobileNav();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
      expect(drawer).toHaveAttribute('aria-label', 'Navigation menu');
      expect(drawer).toHaveAttribute('aria-hidden', 'false');
    });

    it('drawer has aria-hidden when closed', () => {
      renderMobileNav();

      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });

    it('nav has proper landmark role', () => {
      renderMobileNav();
      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('returns null when not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        isAuthenticated: false,
        logout: mockLogout,
      });

      const { container } = renderMobileNav();
      expect(container.firstChild).toBeNull();
    });
  });
});
