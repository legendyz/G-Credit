import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoveToDialog } from './MoveToDialog';
import type { SkillCategory } from '@/hooks/useSkillCategories';

// Mock the update mutation
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useSkillCategories', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useSkillCategories')>();
  return {
    ...original,
    useUpdateSkillCategory: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

const mockCategories: SkillCategory[] = [
  {
    id: 'cat-1',
    name: 'Technical Skills',
    level: 1,
    parentId: null,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
    children: [
      {
        id: 'cat-1-1',
        name: 'Frontend',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 0,
        children: [
          {
            id: 'cat-1-1-1',
            name: 'React',
            level: 3,
            parentId: 'cat-1-1',
            isSystemDefined: false,
            isEditable: true,
            displayOrder: 0,
            children: [],
            skills: [],
          },
        ],
        skills: [],
      },
      {
        id: 'cat-1-2',
        name: 'Backend',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 1,
        children: [],
        skills: [],
      },
    ],
    skills: [],
  },
  {
    id: 'cat-2',
    name: 'Soft Skills',
    level: 1,
    parentId: null,
    isSystemDefined: false,
    isEditable: true,
    displayOrder: 1,
    children: [],
    skills: [],
  },
];

describe('MoveToDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders dialog with target list when open', () => {
    const movingCategory = mockCategories[0].children![1]; // Backend (L2)
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    expect(screen.getByText(/Move.*Backend/)).toBeInTheDocument();
    expect(screen.getByTestId('move-target-list')).toBeInTheDocument();
    expect(screen.getByTestId('move-target-root')).toBeInTheDocument();
  });

  it('disables current parent in target list', () => {
    const movingCategory = mockCategories[0].children![1]; // Backend, parentId=cat-1
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    const currentParentTarget = screen.getByTestId('move-target-cat-1');
    expect(currentParentTarget).toBeDisabled();
  });

  it('disables self in target list', () => {
    const movingCategory = mockCategories[0]; // Technical Skills
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    const selfTarget = screen.getByTestId('move-target-cat-1');
    expect(selfTarget).toBeDisabled();
  });

  it('disables descendants in target list (cycle prevention)', () => {
    const movingCategory = mockCategories[0]; // Technical Skills (has children: Frontend, Backend)
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    // Frontend is a descendant of Technical Skills
    const descendantTarget = screen.getByTestId('move-target-cat-1-1');
    expect(descendantTarget).toBeDisabled();
  });

  it('disables targets that would exceed max depth', () => {
    // Moving Frontend (L2, has child React at L3) under Soft Skills (L1)
    // Result: Frontend at L2, React at L3 — OK (3)
    // Moving Frontend under Backend (L2) would put Frontend at L3, React at L4 — exceeds!
    const movingCategory = mockCategories[0].children![0]; // Frontend (L2, has L3 child)
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    // Backend is L2, moving Frontend under it would be L3 + 1 subtree depth = 4 > 3
    const backendTarget = screen.getByTestId('move-target-cat-1-2');
    expect(backendTarget).toBeDisabled();
  });

  it('enables valid target selections', () => {
    const movingCategory = mockCategories[0].children![1]; // Backend (L2, leaf)
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    // Soft Skills (L1) should be enabled — Backend can move under it as L2
    const softSkillsTarget = screen.getByTestId('move-target-cat-2');
    expect(softSkillsTarget).not.toBeDisabled();
  });

  it('Move button disabled when no target selected', () => {
    const movingCategory = mockCategories[0].children![1]; // Backend
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    const moveBtn = screen.getByRole('button', { name: 'Move' });
    expect(moveBtn).toBeDisabled();
  });

  it('calls mutation and closes dialog when Move confirmed', async () => {
    const onOpenChange = vi.fn();
    const movingCategory = mockCategories[0].children![1]; // Backend
    render(
      <MoveToDialog
        open={true}
        onOpenChange={onOpenChange}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    // Select "Soft Skills" as target
    const softSkillsTarget = screen.getByTestId('move-target-cat-2');
    fireEvent.click(softSkillsTarget);

    // Click Move
    const moveBtn = screen.getByRole('button', { name: 'Move' });
    expect(moveBtn).not.toBeDisabled();
    fireEvent.click(moveBtn);

    // Should call mutateAsync with the category id and new parentId
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'cat-1-2',
      parentId: 'cat-2',
    });
  });

  it('allows selecting root as target', () => {
    // Backend is currently under cat-1; moving to root is valid
    const movingCategory = mockCategories[0].children![1]; // Backend (parentId: cat-1)
    render(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        category={movingCategory}
        categories={mockCategories}
      />
    );

    const rootTarget = screen.getByTestId('move-target-root');
    expect(rootTarget).not.toBeDisabled();
    fireEvent.click(rootTarget);

    const moveBtn = screen.getByRole('button', { name: 'Move' });
    expect(moveBtn).not.toBeDisabled();
  });
});
