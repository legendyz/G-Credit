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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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
  badges: [
    createMockBadge({ id: 'badge-1', status: 'PENDING', recipient: { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' } }),
    createMockBadge({ id: 'badge-2', status: 'CLAIMED', recipient: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' } }),
    createMockBadge({ id: 'badge-3', status: 'REVOKED', revokedAt: '2026-01-20T12:00:00Z', revocationReason: 'Policy Violation', recipient: { id: 'user-3', email: 'bob@example.com', firstName: 'Bob', lastName: 'Wilson' } }),
    createMockBadge({ id: 'badge-4', status: 'EXPIRED', recipient: { id: 'user-4', email: 'alice@example.com', firstName: 'Alice', lastName: 'Brown' } }),
  ],
  total: 4,
  page: 1,
  limit: 10,
  totalPages: 1,
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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

      expect(screen.getByText('Status:')).toBeInTheDocument();
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });

    it('should show badge template name', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Excellence Award')).toHaveLength(4); // All 4 badges have same template
      });
    });

    it('should show status badges', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByText('Claimed')).toBeInTheDocument();
      // Note: 'Revoked' may appear multiple times (status badge + action column)
      expect(screen.getAllByText('Revoked').length).toBeGreaterThan(0);
      expect(screen.getByText('Expired')).toBeInTheDocument();
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
        // Should have revoke buttons for PENDING and CLAIMED badges (2 total)
        expect(revokeButtons.length).toBe(2);
      });
    });

    it('should NOT show Revoke button for REVOKED badges', async () => {
      const revokedOnlyResponse = {
        badges: [createMockBadge({ id: 'badge-1', status: 'REVOKED' })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(revokedOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Revoke/i })).not.toBeInTheDocument();
      });
    });

    it('should NOT show Revoke button for EXPIRED badges', async () => {
      const expiredOnlyResponse = {
        badges: [createMockBadge({ id: 'badge-1', status: 'EXPIRED' })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(expiredOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Revoke/i })).not.toBeInTheDocument();
      });
    });

    it('should only allow ISSUER to revoke own badges', async () => {
      const mixedIssuersResponse = {
        badges: [
          createMockBadge({ id: 'badge-1', issuerId: 'current-user-id', status: 'PENDING' }), // Own badge
          createMockBadge({ id: 'badge-2', issuerId: 'other-issuer', status: 'PENDING' }), // Not own badge
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(badgesApi.getIssuedBadges).mockResolvedValue(mixedIssuersResponse);

      render(
        <BadgeManagementPage userRole="ISSUER" userId="current-user-id" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // Should only have 1 revoke button (for own badge)
        const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
        expect(revokeButtons).toHaveLength(1);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should call API with search term when searching', async () => {
      const user = userEvent.setup();
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by recipient or template/i);
      await user.type(searchInput, 'john');

      await waitFor(() => {
        expect(badgesApi.getAllBadges).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'john' })
        );
      });
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
        badges: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
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
        badges: [createMockBadge({ id: 'badge-1', status: 'PENDING' })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(pendingOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Revoke/i })).toBeInTheDocument();
      });

      const revokeButton = screen.getByRole('button', { name: /Revoke/i });
      await user.click(revokeButton);

      await waitFor(() => {
        expect(screen.getByText(/Revoke Badge - Excellence Award/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', async () => {
      render(<BadgeManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Search badges by recipient name, email, or template name/i)).toBeInTheDocument();
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
        badges: [createMockBadge({ id: 'badge-1', status: 'PENDING' })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(badgesApi.getAllBadges).mockResolvedValue(pendingOnlyResponse);

      render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Revoke badge Excellence Award for John Doe/i })).toBeInTheDocument();
      });
    });
  });
});
