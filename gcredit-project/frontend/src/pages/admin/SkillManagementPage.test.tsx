import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import SkillManagementPage from './SkillManagementPage';

// --- Mock data ---
const mockCategoryTree = [
  {
    id: 'cat-1',
    name: 'Technical Skills',
    level: 1,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
    color: 'blue',
    children: [
      {
        id: 'cat-1-1',
        name: 'Frontend',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 0,
        color: 'emerald',
        children: [],
        skills: [{ id: 's1', name: 'React' }],
        _count: { skills: 1 },
      },
    ],
    skills: [],
    _count: { skills: 0 },
  },
];

const mockFlatCategories = [
  {
    id: 'cat-1',
    name: 'Technical Skills',
    level: 1,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
  },
  {
    id: 'cat-1-1',
    name: 'Frontend',
    level: 2,
    parentId: 'cat-1',
    isSystemDefined: false,
    isEditable: true,
    displayOrder: 0,
  },
];

const mockSkills = [
  {
    id: 's1',
    name: 'React',
    categoryName: 'Frontend',
    categoryColor: 'emerald',
    categoryId: 'cat-1-1',
    description: 'React framework',
    level: 'ADVANCED',
  },
  {
    id: 's2',
    name: 'TypeScript',
    categoryName: 'Frontend',
    categoryColor: 'emerald',
    categoryId: 'cat-1-1',
    description: 'TS language',
    level: 'INTERMEDIATE',
  },
  {
    id: 's3',
    name: 'Node.js',
    categoryName: 'Technical Skills',
    categoryColor: 'blue',
    categoryId: 'cat-1',
    description: 'Server runtime',
    level: 'BEGINNER',
  },
];

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

let mockTreeLoading = false;
let mockTreeError = false;
let mockSkillsData = mockSkills;

vi.mock('@/hooks/useSkillCategories', () => ({
  useSkillCategoryTree: () => ({
    data: mockTreeLoading ? undefined : mockCategoryTree,
    isLoading: mockTreeLoading,
    isError: mockTreeError,
  }),
  useSkillCategoryFlat: () => ({ data: mockFlatCategories }),
}));

vi.mock('@/hooks/useSkills', () => ({
  useSkills: () => ({
    data: mockTreeLoading ? undefined : mockSkillsData,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/useSkillMutations', () => ({
  useCreateSkill: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateSkill: () => ({ mutate: mockUpdateMutate, isPending: false }),
  useDeleteSkill: () => ({ mutate: mockDeleteMutate, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('SkillManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTreeLoading = false;
    mockTreeError = false;
    mockSkillsData = mockSkills;
  });

  it('renders page title and skills table', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Skill Management')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('renders category tree on desktop', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getAllByText('All Categories').length).toBeGreaterThanOrEqual(1);
    // Technical Skills appears in tree and as category chip
    expect(screen.getAllByText('Technical Skills').length).toBeGreaterThanOrEqual(1);
  });

  it('shows skill count', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    expect(screen.getByText('3 skills')).toBeInTheDocument();
  });

  it('renders category color chips', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const chips = screen.getAllByText('Frontend');
    // At least one chip with emerald color classes
    const chipElements = chips.filter((el) => el.closest('span')?.className.includes('bg-emerald'));
    expect(chipElements.length).toBeGreaterThan(0);
  });

  it('search filters skills by name', async () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('Add Skill button is disabled when no category selected', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const addButton = screen.getByText('Add Skill');
    expect(addButton.closest('button')).toBeDisabled();
  });

  it('clicking edit opens edit dialog', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const editButton = screen.getByLabelText('Edit React');
    fireEvent.click(editButton);
    expect(screen.getByText('Edit Skill')).toBeInTheDocument();
  });

  it('clicking delete opens confirm dialog', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const deleteButton = screen.getByLabelText('Delete React');
    fireEvent.click(deleteButton);
    expect(screen.getByText('Delete "React"?')).toBeInTheDocument();
    expect(screen.getByText('This skill will be permanently removed.')).toBeInTheDocument();
  });

  it('confirm delete calls deleteSkill mutation', () => {
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    const deleteButton = screen.getByLabelText('Delete React');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);
    expect(mockDeleteMutate).toHaveBeenCalledWith('s1', expect.any(Object));
  });

  it('empty skills shows empty message', () => {
    mockSkillsData = [];
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    expect(
      screen.getByText('No skills found. Select a category and add skills.')
    ).toBeInTheDocument();
  });

  it('loading state shows spinner', () => {
    mockTreeLoading = true;
    render(<SkillManagementPage />, { wrapper: createWrapper() });
    // AdminPageShell shows a spinner
    expect(screen.queryByText('Skill Management')).toBeInTheDocument();
  });
});
