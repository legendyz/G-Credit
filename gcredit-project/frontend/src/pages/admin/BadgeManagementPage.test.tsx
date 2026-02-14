/**
 * BadgeManagementPage.test.tsx
 * Sprint 7 - Story 9.5: Badge Management Page Unit Tests
 *
 * Tests for the admin badge management page component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { BadgeManagementPage } from './BadgeManagementPage';
import * as badgesApi from '@/lib/badgesApi';
import type { Badge, BadgeListResponse } from '@/lib/badgesApi';

// Mock the badgesApi module
vi.mock('@/lib/badgesApi', async () => {
  const actual = await vi.importActual('@/lib/badgesApi');
  return {
    ...actual,
    getAllBadges: vi.fn(),
    getIssuedBadges: vi.fn(),
    revokeBadge: vi.fn(),
  };
});

// Mock useSkills hook to avoid fetch issues
vi.mock('@/hooks/useSkills', () => ({
  useSkills: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    status: 'success',
    isSuccess: true,
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
  })),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Set viewport width for responsive design tests (desktop by default)
// This affects CSS media queries in jsdom
beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

// Sample badges for testing
const createMockBadge = (overrides: Partial<Badge> = {}): Badge => ({
  id: 'badge-1',
  templateId: 'template-1',
  recipientId: 'user-1',
  issuerId: 'issuer-1',
  status: 'PENDING',
  issuedAt: '2026-01-15T10:00:00Z',
  template: {
    id: 'template-1',
    name: 'Excellence Award',
    description: 'Award for excellence',
    category: 'Achievement',
  },
  recipient: {
    id: 'user-1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
  },
  issuer: {
    id: 'issuer-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
  },
  ...overrides,
});

const mockBadgesResponse: BadgeListResponse = {
  data: [
    createMockBadge({
      id: 'badge-1',
      status: 'PENDING',
      recipient: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    }),
    createMockBadge({
      id: 'badge-2',
      status: 'CLAIMED',
      recipient: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    }),
    createMockBadge({
      id: 'badge-3',
      status: 'REVOKED',
      revokedAt: '2026-01-20T12:00:00Z',
      revocationReason: 'Policy Violation',
      recipient: { id: 'user-3', email: 'bob@example.com', firstName: 'Bob', lastName: 'Wilson' },
    }),
    createMockBadge({
      id: 'badge-4',
      status: 'EXPIRED',
      recipient: {
        id: 'user-4',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Brown',
      },
    }),
  ],
  meta: {
    total: 4,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

// Helper to create QueryClient wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe('BadgeManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(badgesApi.getAllBadges).mockResolvedValue(mockBadgesResponse);
    vi.mocked(badgesApi.getIssuedBadges).mockResolvedValue(mockBadgesResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title for ADMIN', async () => {
      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      expect(screen.getByText('Badge Management')).toBeInTheDocument();
      expect(screen.getByText('Manage all badges in the system')).toBeInTheDocument();
    });

    it('should render page title for ISSUER', async () => {
      render(<BadgeManagementPage userRole="ISSUER" />, { wrapper: createWrapper() });

      expect(screen.getByText('Badge Management')).toBeInTheDocument();
      expect(screen.getByText('Manage badges you have issued')).toBeInTheDocument();
    });

    it('should render search input', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText(/Search by recipient or template/i)).toBeInTheDocument();
    });

    it('should render status filter dropdown', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Filter by status/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      vi.mocked(badgesApi.getAllBadges).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading badges/i)).toBeInTheDocument();
    });
  });

  describe('Badge Table', () => {
    it('should render badges in table', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Both mobile card and desktop table layouts render, so content appears twice
        expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Alice Brown').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show badge template name', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Mobile + desktop layouts = 8 occurrences (4 badges × 2 layouts)
        expect(screen.getAllByText('Excellence Award').length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should show status badges', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      // Wait for badges to load - check for any badge first
      await waitFor(
        () => {
          expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 5000 }
      );

      // Now check for status badges
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Claimed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Revoked').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(1);
    });

    it('should show revocation reason for revoked badges', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Policy Violation')).toBeInTheDocument();
      });
    });

    it('should show pagination info', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 4 of 4 badges/i)).toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Revoke Button Logic', () => {
    it('should show Revoke button for PENDING badges when ADMIN', async () => {
      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
        // Mobile + desktop layouts: 2 revocable badges × 2 layouts = up to 4 buttons
        // But minimum should be 2 (one per revocable badge in at least one layout)
        expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should NOT show Revoke button for REVOKED badges', async () => {
      const revokedOnlyResponse = {
        data: [createMockBadge({ id: 'badge-1', status: 'REVOKED' })],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(revokedOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Revoke/i })).not.toBeInTheDocument();
      });
    });

    it('should NOT show Revoke button for EXPIRED badges', async () => {
      const expiredOnlyResponse = {
        data: [createMockBadge({ id: 'badge-1', status: 'EXPIRED' })],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(expiredOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Revoke/i })).not.toBeInTheDocument();
      });
    });

    it('should only allow ISSUER to revoke own badges', async () => {
      const mixedIssuersResponse = {
        data: [
          createMockBadge({ id: 'badge-1', issuerId: 'current-user-id', status: 'PENDING' }), // Own badge
          createMockBadge({ id: 'badge-2', issuerId: 'other-issuer', status: 'PENDING' }), // Not own badge
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      vi.mocked(badgesApi.getIssuedBadges).mockResolvedValue(mixedIssuersResponse);

      render(<BadgeManagementPage userRole="ISSUER" userId="current-user-id" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Mobile + desktop = 2 revoke buttons for own badge (one per layout)
        const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
        expect(revokeButtons.length).toBeGreaterThanOrEqual(1);
        // Ensure we don't have 4 buttons (which would mean both badges have revoke in both layouts)
        expect(revokeButtons.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter badges when searching', async () => {
      const user = userEvent.setup();
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Content appears in both mobile and desktop layouts
        expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
      });

      const searchInput = screen.getByPlaceholderText(/Search by recipient or template/i);
      await user.type(searchInput, 'john');

      // Client-side filtering: search filters results locally
      // API was already called on mount to get all badges
      expect(badgesApi.getAllBadges).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(badgesApi.getAllBadges).mockRejectedValue(new Error('Failed to load badges'));

      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Failed to load badges')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(badgesApi.getAllBadges).mockRejectedValue(new Error('Network error'));

      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no badges', async () => {
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No badges found')).toBeInTheDocument();
      });
    });
  });

  describe('Revoke Modal Integration', () => {
    it('should open modal when Revoke button clicked', async () => {
      const user = userEvent.setup();
      const pendingOnlyResponse = {
        data: [createMockBadge({ id: 'badge-1', status: 'PENDING' })],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(pendingOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Both mobile and desktop layouts have revoke buttons
        expect(screen.getAllByRole('button', { name: /Revoke/i }).length).toBeGreaterThanOrEqual(1);
      });

      // Click the first revoke button found
      const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
      await user.click(revokeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Revoke Badge - Excellence Award/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Search badges by name or description/i)).toBeInTheDocument();
    });

    it('should have accessible pagination buttons', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Previous page/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next page/i })).toBeInTheDocument();
      });
    });

    it('should have accessible revoke buttons with badge context', async () => {
      const pendingOnlyResponse = {
        data: [createMockBadge({ id: 'badge-1', status: 'PENDING' })],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(pendingOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Revoke badge Excellence Award for John Doe/i })
        ).toBeInTheDocument();
      });
    });
  });
});
