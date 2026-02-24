import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CategoryFormDialog } from './CategoryFormDialog';

// Mock useSkillCategoryFlat
vi.mock('@/hooks/useSkillCategories', () => ({
  useSkillCategoryFlat: () => ({
    data: [
      {
        id: 'cat-1',
        name: 'Technical Skills',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 0,
      },
      {
        id: 'cat-2',
        name: 'Soft Skills',
        level: 1,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 1,
      },
      {
        id: 'cat-1-1',
        name: 'Frontend',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 0,
      },
    ],
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('CategoryFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    mode: 'create' as const,
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form with empty fields', () => {
    render(<CategoryFormDialog {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('Create Category')).toBeInTheDocument();
    const nameInput = document.getElementById('category-name') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('');
    expect(screen.getByLabelText('Name (English)')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  it('renders edit form with pre-populated values', () => {
    const category = {
      id: 'cat-1',
      name: 'Technical Skills',
      nameEn: 'Technical Skills',
      description: 'All tech things',
      level: 1,
      isSystemDefined: true,
      isEditable: true,
      displayOrder: 0,
    };

    render(<CategoryFormDialog {...defaultProps} mode="edit" category={category} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    const nameInput = document.getElementById('category-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Technical Skills');
    expect(screen.getByLabelText('Name (English)')).toHaveValue('Technical Skills');
    expect(screen.getByLabelText('Description')).toHaveValue('All tech things');
  });

  it('validates required name field', () => {
    const onSubmit = vi.fn();
    render(<CategoryFormDialog {...defaultProps} onSubmit={onSubmit} />, {
      wrapper: createWrapper(),
    });

    // Click submit with empty name
    fireEvent.click(screen.getByText('Create'));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits correct data for create', () => {
    const onSubmit = vi.fn();
    render(<CategoryFormDialog {...defaultProps} onSubmit={onSubmit} />, {
      wrapper: createWrapper(),
    });

    const nameInput = document.getElementById('category-name') as HTMLInputElement;
    fireEvent.change(nameInput, {
      target: { value: 'New Category' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'A description' },
    });

    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Category',
        description: 'A description',
      })
    );
  });

  it('submits correct data for edit', () => {
    const onSubmit = vi.fn();
    const category = {
      id: 'cat-1',
      name: 'Old Name',
      level: 1,
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 0,
    };

    render(
      <CategoryFormDialog {...defaultProps} mode="edit" category={category} onSubmit={onSubmit} />,
      { wrapper: createWrapper() }
    );

    const nameInput = document.getElementById('category-name') as HTMLInputElement;
    fireEvent.change(nameInput, {
      target: { value: 'Updated Name' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
  });

  it('shows parent selector in create mode', () => {
    render(<CategoryFormDialog {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('Parent Category')).toBeInTheDocument();
  });

  it('hides parent selector in edit mode', () => {
    const category = {
      id: 'cat-1',
      name: 'Test',
      level: 1,
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 0,
    };

    render(<CategoryFormDialog {...defaultProps} mode="edit" category={category} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText('Parent Category')).not.toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<CategoryFormDialog {...defaultProps} open={false} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText('Create Category')).not.toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<CategoryFormDialog {...defaultProps} loading />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });
});
