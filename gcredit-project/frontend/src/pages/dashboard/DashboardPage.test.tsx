/**
 * DashboardPage Tests — Story 15.1 (TD-035-A)
 *
 * Tests all 6 role × isManager combinations for tab visibility,
 * default tab selection, URL deep-link, tab switching, and data gating.
 *
 * @see ADR-016 DEC-016-01 (Dashboard tab matrix)
 * @see DEC-15-03 (Mount all + CSS hidden + enabled gate)
 * @see REC-15.1-004 (URL ?tab= deep-link)
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/utils/permissions';

// --- Mocks ---

// Mock sub-dashboard components to avoid rendering their internals
vi.mock('./EmployeeDashboard', () => ({
  EmployeeDashboard: ({ enabled }: { enabled?: boolean }) => (
    <div data-testid="employee-dashboard" data-enabled={String(enabled ?? true)}>
      EmployeeDashboard
    </div>
  ),
}));
vi.mock('./ManagerDashboard', () => ({
  ManagerDashboard: ({ enabled }: { enabled?: boolean }) => (
    <div data-testid="manager-dashboard" data-enabled={String(enabled ?? true)}>
      ManagerDashboard
    </div>
  ),
}));
vi.mock('./IssuerDashboard', () => ({
  IssuerDashboard: ({ enabled }: { enabled?: boolean }) => (
    <div data-testid="issuer-dashboard" data-enabled={String(enabled ?? true)}>
      IssuerDashboard
    </div>
  ),
}));
vi.mock('./AdminDashboard', () => ({
  AdminDashboard: ({ enabled }: { enabled?: boolean }) => (
    <div data-testid="admin-dashboard" data-enabled={String(enabled ?? true)}>
      AdminDashboard
    </div>
  ),
}));

// Mock apiFetchJson to prevent actual API calls
vi.mock('@/lib/apiFetch', () => ({
  apiFetchJson: vi.fn().mockResolvedValue(null),
  apiFetch: vi.fn().mockResolvedValue({ ok: true }),
}));

// --- Helpers ---

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
    isLoading: false,
  });
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderDashboard(initialPath = '/') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
});

// --- Tests ---

describe('DashboardPage', () => {
  describe('Loading & Auth Guards', () => {
    it('shows loader when isLoading is true', () => {
      useAuthStore.setState({ isLoading: true, isAuthenticated: false, user: null });
      renderDashboard();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error when not authenticated', () => {
      useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
      renderDashboard();
      expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
    });
  });

  describe('Tab Visibility — 6 role×manager combinations (AC#3, AC#8)', () => {
    const testCases: {
      role: UserRole;
      isManager: boolean;
      expectedTabs: string[];
      notExpectedTabs: string[];
    }[] = [
      {
        role: 'EMPLOYEE',
        isManager: false,
        expectedTabs: ['My Badges'],
        notExpectedTabs: ['Team Overview', 'Issuance', 'Administration'],
      },
      {
        role: 'EMPLOYEE',
        isManager: true,
        expectedTabs: ['My Badges', 'Team Overview'],
        notExpectedTabs: ['Issuance', 'Administration'],
      },
      {
        role: 'ISSUER',
        isManager: false,
        expectedTabs: ['My Badges', 'Issuance'],
        notExpectedTabs: ['Team Overview', 'Administration'],
      },
      {
        role: 'ISSUER',
        isManager: true,
        expectedTabs: ['My Badges', 'Team Overview', 'Issuance'],
        notExpectedTabs: ['Administration'],
      },
      {
        role: 'ADMIN',
        isManager: false,
        expectedTabs: ['My Badges', 'Issuance', 'Administration'],
        notExpectedTabs: ['Team Overview'],
      },
      {
        role: 'ADMIN',
        isManager: true,
        expectedTabs: ['My Badges', 'Team Overview', 'Issuance', 'Administration'],
        notExpectedTabs: [],
      },
    ];

    testCases.forEach(({ role, isManager, expectedTabs, notExpectedTabs }) => {
      it(`${role} + isManager=${isManager} → shows [${expectedTabs.join(', ')}]`, () => {
        setAuthState(role, isManager);
        renderDashboard();

        expectedTabs.forEach((label) => {
          expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
        });
        notExpectedTabs.forEach((label) => {
          expect(screen.queryByRole('tab', { name: label })).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('Default Tab (AC#2, DEC-016-01)', () => {
    it('defaults to "My Badges" for all users', () => {
      setAuthState('ADMIN', true);
      renderDashboard();

      const myBadgesTab = screen.getByRole('tab', { name: 'My Badges' });
      expect(myBadgesTab).toHaveAttribute('data-state', 'active');
    });

    it('deep-links to ?tab=issuance if user has permission', () => {
      setAuthState('ISSUER', false);
      renderDashboard('/?tab=issuance');

      const issuanceTab = screen.getByRole('tab', { name: 'Issuance' });
      expect(issuanceTab).toHaveAttribute('data-state', 'active');
    });

    it('falls back to "My Badges" if ?tab= value is invalid', () => {
      setAuthState('EMPLOYEE', false);
      renderDashboard('/?tab=admin');

      const myBadgesTab = screen.getByRole('tab', { name: 'My Badges' });
      expect(myBadgesTab).toHaveAttribute('data-state', 'active');
    });

    it('falls back to "My Badges" if ?tab= is unknown string', () => {
      setAuthState('ADMIN', true);
      renderDashboard('/?tab=nonexistent');

      const myBadgesTab = screen.getByRole('tab', { name: 'My Badges' });
      expect(myBadgesTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Tab Switching & CSS Hidden (DEC-15-03)', () => {
    it('active tab content is visible, non-active has hidden class', () => {
      setAuthState('ADMIN', true);
      renderDashboard();

      // My Badges is default → visible
      const myBadgesContent = screen.getByTestId('tab-content-my-badges');
      expect(myBadgesContent).not.toHaveClass('hidden');

      // Other tabs mounted but hidden
      expect(screen.getByTestId('tab-content-team')).toHaveClass('hidden');
      expect(screen.getByTestId('tab-content-issuance')).toHaveClass('hidden');
      expect(screen.getByTestId('tab-content-admin')).toHaveClass('hidden');
    });

    it('clicking a tab makes it visible and hides others', async () => {
      setAuthState('ADMIN', true);
      renderDashboard();
      const user = userEvent.setup();

      // Click "Issuance" tab
      await user.click(screen.getByRole('tab', { name: 'Issuance' }));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-issuance')).not.toHaveClass('hidden');
      });
      expect(screen.getByTestId('tab-content-my-badges')).toHaveClass('hidden');
      expect(screen.getByTestId('tab-content-team')).toHaveClass('hidden');
      expect(screen.getByTestId('tab-content-admin')).toHaveClass('hidden');
    });

    it('all visible tab content is mounted in DOM (forceMount)', () => {
      setAuthState('ADMIN', true);
      renderDashboard();

      // All 4 dashboards are in the DOM
      expect(screen.getByTestId('employee-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('manager-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('issuer-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Gating — enabled prop (MEDIUM-15.1-001)', () => {
    it('passes enabled=true only to the active tab dashboard', () => {
      setAuthState('ADMIN', true);
      renderDashboard();

      // Default tab is my-badges → EmployeeDashboard enabled, others disabled
      expect(screen.getByTestId('employee-dashboard')).toHaveAttribute('data-enabled', 'true');
      expect(screen.getByTestId('manager-dashboard')).toHaveAttribute('data-enabled', 'false');
      expect(screen.getByTestId('issuer-dashboard')).toHaveAttribute('data-enabled', 'false');
      expect(screen.getByTestId('admin-dashboard')).toHaveAttribute('data-enabled', 'false');
    });

    it('switches enabled when tab changes', async () => {
      setAuthState('ADMIN', true);
      renderDashboard();
      const user = userEvent.setup();

      // Click "Administration" tab
      await user.click(screen.getByRole('tab', { name: 'Administration' }));

      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toHaveAttribute('data-enabled', 'true');
      });
      expect(screen.getByTestId('employee-dashboard')).toHaveAttribute('data-enabled', 'true');
      expect(screen.getByTestId('manager-dashboard')).toHaveAttribute('data-enabled', 'false');
      expect(screen.getByTestId('issuer-dashboard')).toHaveAttribute('data-enabled', 'false');
    });
  });
});
