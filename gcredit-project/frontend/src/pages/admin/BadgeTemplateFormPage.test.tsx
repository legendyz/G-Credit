/**
 * BadgeTemplateFormPage.test.tsx
 * Story 10.8 BUG-003: Badge Template Form Page Tests
 *
 * Tests: create mode rendering, validation, submit, edit mode loading,
 * skill selection, issuanceCriteria shape, error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BadgeTemplateFormPage } from './BadgeTemplateFormPage';
import * as badgeTemplatesApi from '@/lib/badgeTemplatesApi';
import type { BadgeTemplate } from '@/lib/badgeTemplatesApi';

// Mock the API module
vi.mock('@/lib/badgeTemplatesApi', async () => {
  const actual = await vi.importActual('@/lib/badgeTemplatesApi');
  return {
    ...actual,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    getTemplateById: vi.fn(),
  };
});

// Mock useSkills hook
vi.mock('@/hooks/useSkills', () => ({
  useSkills: vi.fn(() => ({
    data: [
      { id: 'skill-1', name: 'Cloud Computing' },
      { id: 'skill-2', name: 'Leadership' },
    ],
    isLoading: false,
    isError: false,
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked toast for assertions
import { toast } from 'sonner';

// Mock Select to native <select> for testability
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode; id?: string }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder || 'Select...'}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
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

const mockCreateTemplate = badgeTemplatesApi.createTemplate as ReturnType<typeof vi.fn>;
const mockUpdateTemplate = badgeTemplatesApi.updateTemplate as ReturnType<typeof vi.fn>;
const mockGetTemplateById = badgeTemplatesApi.getTemplateById as ReturnType<typeof vi.fn>;

const MOCK_TEMPLATE: BadgeTemplate = {
  id: 'tpl-1',
  name: 'Cloud Expert',
  description: 'Cloud certification',
  category: 'certification',
  skillIds: ['skill-1'],
  issuanceCriteria: { type: 'manual', description: 'Pass the exam' },
  validityPeriod: 365,
  status: 'ACTIVE',
  createdBy: 'admin-1',
  creator: { id: 'admin-1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User' },
  updatedBy: null,
  updater: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderCreateMode() {
  return render(
    <MemoryRouter initialEntries={['/admin/templates/new']}>
      <Routes>
        <Route path="/admin/templates/new" element={<BadgeTemplateFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEditMode(templateId = 'tpl-1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/templates/${templateId}/edit`]}>
      <Routes>
        <Route path="/admin/templates/:id/edit" element={<BadgeTemplateFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BadgeTemplateFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create mode', () => {
    it('renders create form with title "Create Template"', () => {
      renderCreateMode();
      // Title is in an <h1> heading
      expect(screen.getByRole('heading', { name: /create template/i })).toBeInTheDocument();
      expect(screen.getByText('Template Details')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderCreateMode();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/issuance criteria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/validity period/i)).toBeInTheDocument();
    });

    it('renders skill picker with available skills', () => {
      renderCreateMode();
      expect(screen.getByText('Related Skills')).toBeInTheDocument();
      expect(screen.getByText('Cloud Computing')).toBeInTheDocument();
      expect(screen.getByText('Leadership')).toBeInTheDocument();
    });

    it('shows Create Template submit button', () => {
      renderCreateMode();
      expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument();
    });

    it('shows validation error when name is empty', async () => {
      const user = userEvent.setup();
      renderCreateMode();

      // Select a category first (via native select)
      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'skill');

      // Type then clear name — the input has HTML required, so blank submit
      // is blocked by native validation. Type something, then clear it.
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, '  '); // whitespace only — passes required but fails trim check

      const submitBtn = screen.getByRole('button', { name: /create template/i });
      await user.click(submitBtn);

      expect(toast.error).toHaveBeenCalledWith('Template name is required');
      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it('shows validation error when category is empty', async () => {
      const user = userEvent.setup();
      renderCreateMode();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Template');

      const submitBtn = screen.getByRole('button', { name: /create template/i });
      await user.click(submitBtn);

      expect(toast.error).toHaveBeenCalledWith('Please select a badge type');
    });

    it('shows validation error for invalid validity period', async () => {
      const user = userEvent.setup();
      renderCreateMode();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Template');

      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'skill');

      // Set validity to invalid value — use fireEvent.change to bypass HTML max constraint
      const validityInput = screen.getByLabelText(/validity period/i);
      fireEvent.change(validityInput, { target: { value: '5000' } });

      // Submit the form directly to bypass any HTML constraint validation
      const form = screen.getByRole('button', { name: /create template/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Validity period must be between 1 and 3650 days');
      });
    });

    it('submits form with correct payload including type: manual', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockResolvedValue(MOCK_TEMPLATE);
      renderCreateMode();

      // Fill name
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Badge');

      // Select category
      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'certification');

      // Enter criteria text
      const criteriaInput = screen.getByLabelText(/issuance criteria/i);
      await user.type(criteriaInput, 'Must pass exam');

      // Submit
      const submitBtn = screen.getByRole('button', { name: /create template/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Badge',
            category: 'certification',
            skillIds: [],
            issuanceCriteria: {
              type: 'manual',
              description: 'Must pass exam',
            },
          }),
          undefined
        );
      });
    });

    it('submits with selected skills in skillIds', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockResolvedValue(MOCK_TEMPLATE);
      renderCreateMode();

      // Fill required fields
      await user.type(screen.getByLabelText(/name/i), 'Skill Badge');
      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'skill');

      // Select a skill
      const cloudBtn = screen.getByRole('button', { name: /cloud computing/i });
      await user.click(cloudBtn);

      // Check selection count indicator
      expect(screen.getByText('1 skill selected')).toBeInTheDocument();

      // Submit
      await user.click(screen.getByRole('button', { name: /create template/i }));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            skillIds: ['skill-1'],
          }),
          undefined
        );
      });
    });

    it('toggles skill selection', async () => {
      const user = userEvent.setup();
      renderCreateMode();

      const cloudBtn = screen.getByRole('button', { name: /cloud computing/i });

      // Select
      await user.click(cloudBtn);
      expect(screen.getByText('1 skill selected')).toBeInTheDocument();

      // Deselect
      await user.click(cloudBtn);
      expect(screen.queryByText(/skill selected/i)).not.toBeInTheDocument();
    });

    it('navigates to templates list on successful create', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockResolvedValue(MOCK_TEMPLATE);
      renderCreateMode();

      await user.type(screen.getByLabelText(/name/i), 'New Badge');
      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'skill');

      await user.click(screen.getByRole('button', { name: /create template/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/templates');
      });
      expect(toast.success).toHaveBeenCalledWith('Template created successfully');
    });

    it('shows error toast on create failure', async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockRejectedValue(new Error('Server error'));
      renderCreateMode();

      await user.type(screen.getByLabelText(/name/i), 'New Badge');
      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'skill');

      await user.click(screen.getByRole('button', { name: /create template/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
      expect(mockNavigate).not.toHaveBeenCalledWith('/admin/templates');
    });

    it('Cancel button navigates back', async () => {
      const user = userEvent.setup();
      renderCreateMode();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/templates');
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      mockGetTemplateById.mockResolvedValue(MOCK_TEMPLATE);
    });

    it('shows loading skeleton while fetching', () => {
      mockGetTemplateById.mockReturnValue(new Promise(() => {}));
      renderEditMode();

      // The page title should say Edit Template
      expect(screen.getByRole('heading', { name: /edit template/i })).toBeInTheDocument();
    });

    it('populates form fields from template data', async () => {
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('Cloud certification')).toBeInTheDocument();
      expect(screen.getByDisplayValue('365')).toBeInTheDocument();
    });

    it('populates criteriaText from issuanceCriteria.description', async () => {
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pass the exam')).toBeInTheDocument();
      });
    });

    it('handles legacy requirements format', async () => {
      mockGetTemplateById.mockResolvedValue({
        ...MOCK_TEMPLATE,
        issuanceCriteria: { requirements: ['Req A', 'Req B'] },
      });
      renderEditMode();

      // Textarea joins requirements with newlines
      await waitFor(() => {
        const criteriaTextarea = screen.getByLabelText(/issuance criteria/i) as HTMLTextAreaElement;
        expect(criteriaTextarea.value).toBe('Req A\nReq B');
      });
    });

    it('populates selectedSkills from template.skillIds', async () => {
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      // skill-1 = Cloud Computing should be selected (has brand-600 class)
      const cloudBtn = screen.getByRole('button', { name: /cloud computing/i });
      expect(cloudBtn.className).toContain('bg-brand-600');
    });

    it('shows Save Changes button in edit mode', async () => {
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });

    it('shows Status dropdown in edit mode', async () => {
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls updateTemplate on submit in edit mode', async () => {
      const user = userEvent.setup();
      mockUpdateTemplate.mockResolvedValue(MOCK_TEMPLATE);
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith(
          'tpl-1',
          expect.objectContaining({
            name: 'Cloud Expert',
            issuanceCriteria: {
              type: 'manual',
              description: 'Pass the exam',
            },
          }),
          undefined
        );
      });
      expect(toast.success).toHaveBeenCalledWith('Template updated successfully');
    });

    it('shows error state when template load fails', async () => {
      mockGetTemplateById.mockRejectedValue(new Error('Not found'));
      renderEditMode();

      await waitFor(() => {
        expect(screen.getByText('Failed to Load')).toBeInTheDocument();
      });
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  describe('Read-only mode', () => {
    function renderReadonlyMode(templateId = 'tpl-1') {
      return render(
        <MemoryRouter initialEntries={[`/admin/templates/${templateId}/edit?readonly=true`]}>
          <Routes>
            <Route path="/admin/templates/:id/edit" element={<BadgeTemplateFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    }

    beforeEach(() => {
      mockGetTemplateById.mockResolvedValue(MOCK_TEMPLATE);
    });

    it('shows "View Template" title', async () => {
      renderReadonlyMode();

      await waitFor(() => {
        expect(screen.getByText('View Template')).toBeInTheDocument();
      });
      expect(screen.getByText('Viewing badge template details (read-only)')).toBeInTheDocument();
    });

    it('disables name input', async () => {
      renderReadonlyMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Cloud Expert')).toBeDisabled();
    });

    it('does not show Save Changes button', async () => {
      renderReadonlyMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('shows Back to Templates button', async () => {
      renderReadonlyMode();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cloud Expert')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /back to templates/i })).toBeInTheDocument();
    });
  });
});
