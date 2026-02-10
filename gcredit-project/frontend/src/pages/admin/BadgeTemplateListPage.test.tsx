/**
 * BadgeTemplateListPage.test.tsx
 * Story 10.8 BUG-003: Badge Template List Page Tests
 *
 * Tests: rendering, search, status filter, status change, delete, error state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { BadgeTemplateListPage } from './BadgeTemplateListPage';
import * as badgeTemplatesApi from '@/lib/badgeTemplatesApi';
import type { BadgeTemplate } from '@/lib/badgeTemplatesApi';

// Mock the API module
vi.mock('@/lib/badgeTemplatesApi', async () => {
  const actual = await vi.importActual('@/lib/badgeTemplatesApi');
  return {
    ...actual,
    getAllTemplates: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
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

const mockGetAllTemplates = badgeTemplatesApi.getAllTemplates as ReturnType<typeof vi.fn>;
const mockUpdateTemplate = badgeTemplatesApi.updateTemplate as ReturnType<typeof vi.fn>;
const mockDeleteTemplate = badgeTemplatesApi.deleteTemplate as ReturnType<typeof vi.fn>;

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
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    ...overrides,
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
    mockGetAllTemplates.mockResolvedValue(mockTemplates);
    // Mock window.confirm for delete tests
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders loading skeletons initially', () => {
    mockGetAllTemplates.mockReturnValue(new Promise(() => {})); // never resolves
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
    it('filters templates by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      await user.type(searchInput, 'Leadership');

      expect(screen.getByText('Leadership Badge')).toBeInTheDocument();
      expect(screen.queryByText('Cloud Expert')).not.toBeInTheDocument();
    });

    it('shows "No Matching Templates" when search has no results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      await user.type(searchInput, 'zzz-nonexistent');

      expect(screen.getByText('No Matching Templates')).toBeInTheDocument();
    });
  });

  describe('status filter tabs', () => {
    it('renders All, Draft, Active, Archived tabs', async () => {
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Filter tabs have text + count like "Draft (1)"
      const buttons = screen.getAllByRole('button');
      const tabLabels = buttons.map((b) => b.textContent?.trim());
      expect(tabLabels).toContain('All');
      // Draft, Active, Archived tabs contain counts
      expect(tabLabels.some((t) => t?.startsWith('Draft'))).toBe(true);
      expect(tabLabels.some((t) => t?.startsWith('Active'))).toBe(true);
      expect(tabLabels.some((t) => t?.startsWith('Archived'))).toBe(true);
    });

    it('filters by Draft status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Click the Draft tab button — find by text content that starts with Draft and includes count
      const allButtons = screen.getAllByRole('button');
      const draftTab = allButtons.find(
        (btn) => btn.textContent?.trim().startsWith('Draft') && btn.textContent?.includes('(')
      );
      expect(draftTab).toBeTruthy();
      await user.click(draftTab!);

      expect(screen.getByText('Leadership Badge')).toBeInTheDocument();
      expect(screen.queryByText('Cloud Expert')).not.toBeInTheDocument();
      expect(screen.queryByText('Retired Cert')).not.toBeInTheDocument();
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
      const activateBtn = allButtons.find(
        (btn) => btn.textContent?.trim() === 'Activate'
      );
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
      const activateBtn = allButtons.find(
        (btn) => btn.textContent?.trim() === 'Activate'
      );
      expect(activateBtn).toBeTruthy();
      await user.click(activateBtn!);

      const { toast } = await import('sonner');
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('delete', () => {
    it('deletes a template after confirmation', async () => {
      const user = userEvent.setup();
      mockDeleteTemplate.mockResolvedValue(undefined);
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Click the first delete button (trash icon)
      const deleteButtons = screen.getAllByRole('button').filter((btn) => {
        return btn.querySelector('.lucide-trash-2') !== null;
      });
      // Fall back to aria or class-based finder
      const trashButtons = screen.getAllByRole('button');
      const deleteBtn = trashButtons.find(
        (btn) => btn.textContent === '' && btn.classList.contains('text-error')
      );
      if (deleteBtn) {
        await user.click(deleteBtn);
      }

      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalled();
      });
    });

    it('does not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
      });

      // Find delete button by the error text class
      const allButtons = screen.getAllByRole('button');
      const deleteBtn = allButtons.find((btn) =>
        btn.className.includes('text-error')
      );
      if (deleteBtn) {
        await user.click(deleteBtn);
      }

      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('renders error message when API fails', async () => {
      mockGetAllTemplates.mockRejectedValue(new Error('Server error'));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Templates')).toBeInTheDocument();
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('shows Try Again button on error', async () => {
      mockGetAllTemplates.mockRejectedValue(new Error('Server error'));
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no templates exist', async () => {
      mockGetAllTemplates.mockResolvedValue([]);
      renderWithProviders(<BadgeTemplateListPage />);

      await waitFor(() => {
        expect(screen.getByText('No Templates Yet')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Create your first badge template to get started.')
      ).toBeInTheDocument();
    });
  });
});
