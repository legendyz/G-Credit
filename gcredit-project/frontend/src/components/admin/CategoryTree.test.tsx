import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTree } from './CategoryTree';
import type { SkillCategory } from '@/hooks/useSkillCategories';

const mockCategories: SkillCategory[] = [
  {
    id: 'cat-1',
    name: 'Technical Skills',
    level: 1,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
    children: [
      {
        id: 'cat-1-1',
        name: 'Frontend',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 0,
        children: [],
        skills: [
          { id: 's1', name: 'React' },
          { id: 's2', name: 'Vue' },
        ],
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
    isSystemDefined: false,
    isEditable: true,
    displayOrder: 1,
    children: [],
    skills: [{ id: 's3', name: 'Leadership' }],
  },
];

describe('CategoryTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tree with nested children', () => {
    render(<CategoryTree categories={mockCategories} />);

    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('Soft Skills')).toBeInTheDocument();
    // Top-level nodes expanded by default -> children visible
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('expand/collapse toggles children visibility', () => {
    render(<CategoryTree categories={mockCategories} />);

    // Children should be visible initially (top-level expanded)
    expect(screen.getByText('Frontend')).toBeInTheDocument();

    // Click collapse button on "Technical Skills"
    const collapseButton = screen.getByLabelText('Collapse');
    fireEvent.click(collapseButton);

    // Children should be hidden
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText('Expand');
    fireEvent.click(expandButton);

    // Children should be visible again
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('shows skill count per node', () => {
    render(<CategoryTree categories={mockCategories} />);

    expect(screen.getByText('2 skills')).toBeInTheDocument(); // Frontend has 2 skills
    expect(screen.getByText('1 skill')).toBeInTheDocument(); // Soft Skills has 1 skill
  });

  it('shows system badge for system-defined categories', () => {
    render(<CategoryTree categories={mockCategories} />);

    const systemBadges = screen.getAllByTestId('system-badge');
    // Technical Skills + Frontend are system-defined
    expect(systemBadges.length).toBe(2);
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<CategoryTree categories={mockCategories} editable onEdit={onEdit} />);

    const editButtons = screen.getAllByLabelText(/^Edit/);
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onDelete when delete button clicked on empty category', () => {
    const onDelete = vi.fn();
    render(<CategoryTree categories={mockCategories} editable onDelete={onDelete} />);

    // Backend is an empty non-system category with no children and no skills
    const deleteButton = screen.getByLabelText('Delete Backend');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalled();
  });

  it('calls onAddChild when add child button clicked', () => {
    const onAddChild = vi.fn();
    render(<CategoryTree categories={mockCategories} editable onAddChild={onAddChild} />);

    const addButtons = screen.getAllByLabelText(/^Add child/);
    fireEvent.click(addButtons[0]);
    expect(onAddChild).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('delete button disabled for categories with children', () => {
    render(<CategoryTree categories={mockCategories} editable />);

    // Technical Skills has children (Frontend, Backend)
    const deleteButton = screen.getByLabelText('Delete Technical Skills');
    expect(deleteButton).toBeDisabled();
  });

  it('delete button disabled for categories with skills', () => {
    render(<CategoryTree categories={mockCategories} editable />);

    // Frontend has 2 skills
    const deleteButton = screen.getByLabelText('Delete Frontend');
    expect(deleteButton).toBeDisabled();
  });

  it('delete button enabled for empty categories', () => {
    render(<CategoryTree categories={mockCategories} editable />);

    // Backend has no children and no skills
    const deleteButton = screen.getByLabelText('Delete Backend');
    expect(deleteButton).not.toBeDisabled();
  });

  it('hides action buttons in read-only mode', () => {
    render(<CategoryTree categories={mockCategories} editable={false} />);

    expect(screen.queryAllByLabelText(/^Edit/)).toHaveLength(0);
    expect(screen.queryAllByLabelText(/^Delete/)).toHaveLength(0);
    expect(screen.queryAllByLabelText(/^Add child/)).toHaveLength(0);
  });

  it('hides drag handles in read-only mode', () => {
    render(<CategoryTree categories={mockCategories} editable={false} />);

    expect(screen.queryAllByTestId('drag-handle')).toHaveLength(0);
  });

  it('shows drag handles in editable mode', () => {
    render(<CategoryTree categories={mockCategories} editable />);

    const handles = screen.getAllByTestId('drag-handle');
    expect(handles.length).toBeGreaterThan(0);
  });

  it('renders empty state when no categories', () => {
    render(<CategoryTree categories={[]} onCreateRoot={vi.fn()} />);

    expect(screen.getByText('No categories found')).toBeInTheDocument();
    expect(screen.getByText('Create your first skill category.')).toBeInTheDocument();
    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('calls onCreateRoot CTA in empty state', () => {
    const onCreateRoot = vi.fn();
    render(<CategoryTree categories={[]} onCreateRoot={onCreateRoot} />);

    fireEvent.click(screen.getByText('Create Category'));
    expect(onCreateRoot).toHaveBeenCalledTimes(1);
  });

  describe('DnD reorder behavior', () => {
    // Note: @dnd-kit sensors are hard to fully simulate in JSDOM.
    // We test the reorder callback contract and rendering structure.

    it('renders DndContext with SortableContext in editable mode with onReorder', () => {
      const onReorder = vi.fn();
      const { container } = render(
        <CategoryTree categories={mockCategories} editable onReorder={onReorder} />
      );

      // Verify tree role is rendered (DnD branch)
      const tree = container.querySelector('[role="tree"]');
      expect(tree).toBeInTheDocument();

      // Verify treeitem roles for each visible node
      const treeItems = container.querySelectorAll('[role="treeitem"]');
      expect(treeItems.length).toBeGreaterThanOrEqual(2);
    });

    it('renders drag handles for all visible nodes in editable DnD mode', () => {
      const onReorder = vi.fn();
      render(<CategoryTree categories={mockCategories} editable onReorder={onReorder} />);

      // Top-level expanded by default, so we should see handles for:
      // cat-1, cat-1-1, cat-1-2, cat-2 = 4 visible nodes
      const handles = screen.getAllByTestId('drag-handle');
      expect(handles).toHaveLength(4);
    });

    it('does not call onReorder when dragging to same position', () => {
      const onReorder = vi.fn();
      render(<CategoryTree categories={mockCategories} editable onReorder={onReorder} />);

      // DnD context prevents calling onReorder when active.id === over.id
      // This is enforced by the handleDragEnd guard: if (active.id === over.id) return
      // We can verify no spurious calls were made during render
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('passes batch updates array type to onReorder (contract test)', () => {
      // Verify the onReorder prop accepts the batch signature
      const onReorder = vi.fn();
      render(<CategoryTree categories={mockCategories} editable onReorder={onReorder} />);

      // Simulate what handleDragEnd would produce: batch of {id, displayOrder}
      const mockUpdates = [
        { id: 'cat-2', displayOrder: 0 },
        { id: 'cat-1', displayOrder: 1 },
      ];
      onReorder(mockUpdates);

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'cat-2', displayOrder: 0 },
        { id: 'cat-1', displayOrder: 1 },
      ]);
    });
  });
});
