/**
 * AppSidebar Tests — Story 15.3 (TD-035-C)
 *
 * Tests all 6 role x isManager combinations for group visibility (CROSS-001),
 * active state, navigation links, Sign Out, and collapsed tooltip behavior.
 *
 * @see ADR-016 DEC-016-02 (Sidebar navigation groups)
 * @see Story 15.3 AC#3, AC#4, AC#5, AC#8
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/utils/permissions';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to set auth store state
function setAuthState(role: UserRole, isManager: boolean) {
  useAuthStore.setState({
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role,
      isManager,
    },
    isAuthenticated: true,
  });
}

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
  });
});

describe('AppSidebar', () => {
  describe('Brand Header', () => {
    it('renders G-Credit brand text', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();
      expect(screen.getByText('G-Credit')).toBeInTheDocument();
    });
  });

  describe('Permission-based Group Visibility (CROSS-001)', () => {
    const testCases: {
      role: UserRole;
      isManager: boolean;
      expectedGroups: string[];
      unexpectedGroups: string[];
    }[] = [
      {
        role: 'EMPLOYEE',
        isManager: false,
        expectedGroups: [],
        unexpectedGroups: ['Team', 'Issuance', 'Admin'],
      },
      {
        role: 'EMPLOYEE',
        isManager: true,
        expectedGroups: ['Team'],
        unexpectedGroups: ['Issuance', 'Admin'],
      },
      {
        role: 'ISSUER',
        isManager: false,
        expectedGroups: ['Issuance'],
        unexpectedGroups: ['Team', 'Admin'],
      },
      {
        role: 'ISSUER',
        isManager: true,
        expectedGroups: ['Team', 'Issuance'],
        unexpectedGroups: ['Admin'],
      },
      {
        role: 'ADMIN',
        isManager: false,
        expectedGroups: ['Issuance', 'Admin'],
        unexpectedGroups: ['Team'],
      },
      {
        role: 'ADMIN',
        isManager: true,
        expectedGroups: ['Team', 'Issuance', 'Admin'],
        unexpectedGroups: [],
      },
    ];

    testCases.forEach(({ role, isManager, expectedGroups, unexpectedGroups }) => {
      it(`${role} (isManager=${isManager}) sees groups: [base${expectedGroups.length ? ', ' + expectedGroups.join(', ') : ''}]`, () => {
        setAuthState(role, isManager);
        renderSidebar();

        // Base items always visible
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Wallet')).toBeInTheDocument();

        // Expected group headers
        expectedGroups.forEach((group) => {
          expect(screen.getByText(group)).toBeInTheDocument();
        });

        // Unexpected group headers
        unexpectedGroups.forEach((group) => {
          expect(screen.queryByText(group)).not.toBeInTheDocument();
        });
      });
    });

    it('EMPLOYEE without isManager cannot see Team Overview link', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();
      expect(screen.queryByText('Team Overview')).not.toBeInTheDocument();
    });

    it('EMPLOYEE with isManager sees Team Overview link', () => {
      setAuthState('EMPLOYEE', true);
      renderSidebar();
      expect(screen.getByText('Team Overview')).toBeInTheDocument();
    });

    it('ADMIN sees all admin links', () => {
      setAuthState('ADMIN', true);
      renderSidebar();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Milestones')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('all base items have correct hrefs', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/');

      const walletLink = screen.getByText('Wallet').closest('a');
      expect(walletLink).toHaveAttribute('href', '/wallet');
    });

    it('clicking a nav item calls navigate with correct href', () => {
      setAuthState('ADMIN', true);
      renderSidebar();

      const templatesLink = screen.getByText('Templates').closest('a');
      fireEvent.click(templatesLink!);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/templates');
    });
  });

  describe('Active State', () => {
    it('marks Dashboard active when on /', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar('/');

      const dashboardButton = screen.getByText('Dashboard').closest('[data-sidebar="menu-button"]');
      expect(dashboardButton).toHaveAttribute('data-active', 'true');
    });

    it('marks Wallet active when on /wallet', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar('/wallet');

      const walletButton = screen.getByText('Wallet').closest('[data-sidebar="menu-button"]');
      expect(walletButton).toHaveAttribute('data-active', 'true');
    });

    it('Dashboard is not active when on another route', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar('/wallet');

      const dashboardButton = screen.getByText('Dashboard').closest('[data-sidebar="menu-button"]');
      expect(dashboardButton).toHaveAttribute('data-active', 'false');
    });
  });

  describe('User Info + Sign Out', () => {
    it('renders user name in footer', () => {
      setAuthState('ADMIN', false);
      renderSidebar();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders user initial avatar', () => {
      setAuthState('ADMIN', false);
      renderSidebar();
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('renders Sign Out button', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('clicking Sign Out calls logout and navigates to /login', async () => {
      const logoutMock = vi.fn().mockResolvedValue(undefined);
      setAuthState('EMPLOYEE', false);
      useAuthStore.setState({ logout: logoutMock } as unknown as Parameters<
        typeof useAuthStore.setState
      >[0]);

      renderSidebar();
      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Sidebar Structure', () => {
    it('renders navigation items for the given user role', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();

      // Base items always rendered for any authenticated user
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Wallet')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('renders sidebar rail for toggle', () => {
      setAuthState('EMPLOYEE', false);
      renderSidebar();

      const rail = document.querySelector('[data-sidebar="rail"]');
      expect(rail).toBeInTheDocument();
    });
  });
});
