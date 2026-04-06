/**
 * BadgeTemplateListPage.test.tsx
 * Story 10.8 BUG-003: Badge Template List Page Tests
 * Story 15.7: Updated for server-side pagination
 *
 * Tests: rendering, search, status filter, status change, delete, error state,
 *        pagination controls, page size selector, URL state sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { BadgeTemplateListPage } from './BadgeTemplateListPage';
import * as badgeTemplatesApi from '@/lib/badgeTemplatesApi';
import type { BadgeTemplate, PaginatedTemplateResponse } from '@/lib/badgeTemplatesApi';
import * as authStore from '@/stores/authStore';

// Mock the API module
vi.mock('@/lib/badgeTemplatesApi', async () => {
  const actual = await vi.importActual('@/lib/badgeTemplatesApi');
  return {
    ...actual,
    getTemplatesPaginated: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  };
});

// Mock auth store
vi.mock('@/stores/authStore', async () => {
  const actual = await vi.importActual('@/stores/authStore');
  return {
    ...actual,
    useCurrentUser: vi.fn(),
  };
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

const mockGetTemplatesPaginated = badgeTemplatesApi.getTemplatesPaginated as ReturnType<
  typeof vi.fn
>;
const mockUpdateTemplate = badgeTemplatesApi.updateTemplate as ReturnType<typeof vi.fn>;
const mockDeleteTemplate = badgeTemplatesApi.deleteTemplate as ReturnType<typeof vi.fn>;
const mockUseCurrentUser = authStore.useCurrentUser as ReturnType<typeof vi.fn>;

const adminUser = {
  id: 'admin-1',
  email: 'admin@gcredit.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN' as const,
};

const issuerUser = {
  id: 'issuer-1',
  email: 'issuer@gcredit.com',
  firstName: 'Issuer',
  lastName: 'User',
  role: 'ISSUER' as const,
};

function createMockTemplate(overrides: Partial<BadgeTemplate> = {}): BadgeTemplate {
  return {
    id: 'tpl-1',
    name: 'Cloud Expert',
    description: 'Cloud certification badge',
    category: 'certification',
    skillIds: ['skill-1'],
    issuanceCriteria: { type: 'manual' },
    validityPeriod: 365,
    status: 'ACTIVE',
    createdBy: 'admin-1',
    creator: { id: 'admin-1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User' },
    updatedBy: null,
    updater: null,
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

function createPaginatedResponse(
  templates: BadgeTemplate[],
  meta?: Partial<PaginatedTemplateResponse['meta']>
): PaginatedTemplateResponse {
  return {
    data: templates,
    meta: {
      page: 1,
      limit: 10,
      total: templates.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      ...meta,
    },
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BadgeTemplateListPage', () => {
  const mockTemplates: BadgeTemplate[] = [
    createMockTemplate({ id: 'tpl-1', name: 'Cloud Expert', status: 'ACTIVE' }),
    createMockTemplate({
      id: 'tpl-2',
      name: 'Leadership Badge',
      status: 'DRAFT',
      category: 'achievement',
      description: 'For leadership skills',
    }),
    createMockTemplate({
      id: 'tpl-3',
      name: 'Retired Cert',
      status: 'ARCHIVED',
      category: 'skill',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplatesPaginated.mockResolvedValue(createPaginatedResponse(mockTemplates));
    mockUseCurrentUser.mockReturnValue(adminUser);
  });

  it('renders loading skeletons initially', () => {
    mockGetTemplatesPaginated.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<BadgeTemplateListPage />);
    // Skeletons are rendered
    expect(screen.getByText('Badge Templates')).toBeInTheDocument();
  });

  it('renders template cards after loading', async () => {
    renderWithProviders(<BadgeTemplateListPage />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
    });
    expect(screen.getByText('Leadership Badge')).toBeInTheDocument();
    expect(screen.getByText('Retired Cert')).toBeInTheDocument();
  });

  it('renders status badges with correct labels', async () => {
    renderWithProviders(<BadgeTemplateListPage />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
    });

    // Status badges are <span> elements, tabs are <button> elements
    const statusBadges = screen.getAllByText(/^(Active|Draft|Archived)$/);
    // At least 3 status badge spans + 3 tab buttons = 6+
    expect(statusBadges.length).toBeGreaterThanOrEqual(6);
  });

  it('shows Create Template button that navigates', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BadgeTemplateListPage />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create template/i });
    await user.click(createButton);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/templates/new');
  });

  it('shows Edit button that navigates to edit page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BadgeTemplateListPage />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/templates/tpl-1/edit');
  });

  describe('search filtering', () => {
    it('passes search term to API', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      await user.type(searchInput, 'Leadership');

      // Debounced — wait for API call with search param
      await waitFor(() => {
        expect(mockGetTemplatesPaginated).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Leadership', page: 1 })
        );
      });
    });

    it('shows "No Matching Templates" when search returns empty with active filter', async () => {
      // First render with data
      const { unmount } = renderWithProviders(<BadgeTemplateListPage />);
      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });
      unmount();

      // Re-render simulating URL with search param that returns empty
      mockGetTemplatesPaginated.mockResolvedValue(createPaginatedResponse([]));
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['?search=nonexistent']}>
            <BadgeTemplateListPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No Matching Templates')).toBeInTheDocument();
      });
    });
  });

  describe('status filter tabs', () => {
    it('renders All, Draft, Active, Archived tabs', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const tabLabels = buttons.map((b) => b.textContent?.trim());
      expect(tabLabels).toContain('All');
      expect(tabLabels).toContain('Draft');
      expect(tabLabels).toContain('Active');
      expect(tabLabels).toContain('Archived');
    });

    it('passes status filter to API on tab click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Click the Draft tab button
      const allButtons = screen.getAllByRole('button');
      const draftTab = allButtons.find((btn) => btn.textContent?.trim() === 'Draft');
      expect(draftTab).toBeTruthy();
      await user.click(draftTab!);

      await waitFor(() => {
        expect(mockGetTemplatesPaginated).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'DRAFT', page: 1 })
        );
      });
    });
  });

  describe('status change', () => {
    it('activates a DRAFT template', async () => {
      const user = userEvent.setup();
      mockUpdateTemplate.mockResolvedValue(createMockTemplate({ status: 'ACTIVE' }));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Leadership Badge')).toBeInTheDocument();
      });

      // The Activate button is inside the card actions, find it by exact text "Activate"
      const allButtons = screen.getAllByRole('button');
      const activateBtn = allButtons.find((btn) => btn.textContent?.trim() === 'Activate');
      expect(activateBtn).toBeTruthy();
      await user.click(activateBtn!);

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith('tpl-2', { status: 'ACTIVE' });
      });
    });

    it('shows error toast on status change failure', async () => {
      const user = userEvent.setup();
      mockUpdateTemplate.mockRejectedValue(new Error('Update failed'));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Leadership Badge')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const activateBtn = allButtons.find((btn) => btn.textContent?.trim() === 'Activate');
      expect(activateBtn).toBeTruthy();
      await user.click(activateBtn!);

      const { toast } = await import('sonner');
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('delete', () => {
    it('shows delete confirmation dialog and deletes on confirm', async () => {
      const user = userEvent.setup();
      mockDeleteTemplate.mockResolvedValue(undefined);
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Find delete button by error text class
      const allButtons = screen.getAllByRole('button');
      const deleteBtn = allButtons.find(
        (btn) => btn.textContent === '' && btn.classList.contains('text-error')
      );
      expect(deleteBtn).toBeTruthy();
      await user.click(deleteBtn!);

      // Dialog appears with title and description
      await waitFor(() => {
        expect(screen.getByText('Delete Template')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      // Click confirm button in dialog
      const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalled();
      });
    });

    it('does not delete when user cancels confirmation dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Find delete button by the error text class
      const allButtons = screen.getAllByRole('button');
      const deleteBtn = allButtons.find((btn) => btn.className.includes('text-error'));
      expect(deleteBtn).toBeTruthy();
      await user.click(deleteBtn!);

      // Dialog appears
      await waitFor(() => {
        expect(screen.getByText('Delete Template')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      // Dialog closes, no delete called
      await waitFor(() => {
        expect(screen.queryByText('Delete Template')).not.toBeInTheDocument();
      });
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('renders error message when API fails', async () => {
      mockGetTemplatesPaginated.mockRejectedValue(new Error('Server error'));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Templates')).toBeInTheDocument();
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('shows Try Again button on error', async () => {
      mockGetTemplatesPaginated.mockRejectedValue(new Error('Server error'));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no templates exist', async () => {
      mockGetTemplatesPaginated.mockResolvedValue(createPaginatedResponse([]));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('No Templates Yet')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Create your first badge template to get started.')
      ).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('shows pagination controls when totalPages > 1', async () => {
      mockGetTemplatesPaginated.mockResolvedValue(
        createPaginatedResponse(mockTemplates, {
          page: 1,
          totalPages: 3,
          total: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        })
      );
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    it('hides pagination controls when totalPages = 1', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('calls API with next page on Next click', async () => {
      const user = userEvent.setup();
      mockGetTemplatesPaginated.mockResolvedValue(
        createPaginatedResponse(mockTemplates, {
          page: 1,
          totalPages: 3,
          total: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        })
      );
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(mockGetTemplatesPaginated).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('shows page size selector with default value', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Page size selector trigger should show default "10 / page"
      expect(screen.getByText('10 / page')).toBeInTheDocument();
    });

    it('shows results count from server meta', async () => {
      mockGetTemplatesPaginated.mockResolvedValue(
        createPaginatedResponse(mockTemplates, {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        })
      );
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Showing 1–10 of 25 templates/)).toBeInTheDocument();
    });
  });

  describe('ownership UX for ISSUER', () => {
    const issuerTemplates: BadgeTemplate[] = [
      createMockTemplate({
        id: 'tpl-own',
        name: 'My Template',
        createdBy: 'issuer-1',
        status: 'ACTIVE',
      }),
      createMockTemplate({
        id: 'tpl-other',
        name: 'Other Template',
        createdBy: 'admin-1',
        status: 'ACTIVE',
      }),
    ];

    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue(issuerUser);
      mockGetTemplatesPaginated.mockResolvedValue(createPaginatedResponse(issuerTemplates));
    });

    it('shows "Mine" badge on owned templates', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('My Template')).toBeInTheDocument();
      });

      expect(screen.getByText('Mine')).toBeInTheDocument();
      expect(screen.getByText('Read-only')).toBeInTheDocument();
    });

    it('shows View button (not Edit) for non-owned templates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Other Template')).toBeInTheDocument();
      });

      // Owned template has Edit, non-owned has View
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).not.toBeDisabled();

      // View navigates with ?readonly=true
      await user.click(viewButton);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/templates/tpl-other/edit?readonly=true');
    });

    it('disables Archive button for non-owned templates', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Other Template')).toBeInTheDocument();
      });

      // Find Archive action buttons
      const allButtons = screen.getAllByRole('button');
      const archiveButtons = allButtons.filter((btn) => btn.textContent?.trim() === 'Archive');
      expect(archiveButtons).toHaveLength(2);
      // First (owned) enabled, second (non-owned) disabled
      expect(archiveButtons[0]).not.toBeDisabled();
      expect(archiveButtons[1]).toBeDisabled();
    });

    it('disables Delete button for non-owned templates', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Other Template')).toBeInTheDocument();
      });

      // Delete buttons have the trash icon (no text)
      const allButtons = screen.getAllByRole('button');
      const deleteButtons = allButtons.filter((btn) => btn.className.includes('text-error'));
      expect(deleteButtons).toHaveLength(2);
      expect(deleteButtons[0]).not.toBeDisabled();
      expect(deleteButtons[1]).toBeDisabled();
    });
  });

  describe('ownership UX for ADMIN', () => {
    const mixedTemplates: BadgeTemplate[] = [
      createMockTemplate({
        id: 'tpl-a',
        name: 'Admin Template',
        createdBy: 'admin-1',
        status: 'ACTIVE',
      }),
      createMockTemplate({
        id: 'tpl-b',
        name: 'Issuer Template',
        createdBy: 'issuer-1',
        status: 'ACTIVE',
      }),
    ];

    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue(adminUser);
      mockGetTemplatesPaginated.mockResolvedValue(createPaginatedResponse(mixedTemplates));
    });

    it('does not show Mine/Read-only badges for ADMIN', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Template')).toBeInTheDocument();
      });

      expect(screen.queryByText('Mine')).not.toBeInTheDocument();
      expect(screen.queryByText('Read-only')).not.toBeInTheDocument();
    });

    it('enables all action buttons for ADMIN regardless of ownership', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Issuer Template')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      editButtons.forEach((btn) => expect(btn).not.toBeDisabled());
    });
  });
});
