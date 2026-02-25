import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryDropdown } from './CategoryDropdown';
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
        isSystemDefined: false,
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

describe('CategoryDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dropdown with testid', () => {
    render(<CategoryDropdown categories={mockCategories} />);
    expect(screen.getByTestId('category-dropdown')).toBeInTheDocument();
  });

  it('renders Select trigger with combobox role', () => {
    render(<CategoryDropdown categories={mockCategories} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders empty state when no categories', () => {
    const onCreateRoot = vi.fn();
    render(<CategoryDropdown categories={[]} onCreateRoot={onCreateRoot} />);

    expect(screen.getByText('No categories found')).toBeInTheDocument();
    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('calls onCreateRoot from empty state CTA', () => {
    const onCreateRoot = vi.fn();
    render(<CategoryDropdown categories={[]} onCreateRoot={onCreateRoot} />);

    fireEvent.click(screen.getByText('Create Category'));
    expect(onCreateRoot).toHaveBeenCalledTimes(1);
  });

  it('does not show toolbar when not editable', () => {
    render(<CategoryDropdown categories={mockCategories} editable={false} selectedId="cat-1" />);
    expect(screen.queryByTestId('dropdown-toolbar')).not.toBeInTheDocument();
  });

  it('does not show toolbar when no item is selected', () => {
    render(<CategoryDropdown categories={mockCategories} editable />);
    expect(screen.queryByTestId('dropdown-toolbar')).not.toBeInTheDocument();
  });

  it('shows toolbar when editable and item selected', () => {
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1-2"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAddChild={vi.fn()}
      />
    );
    expect(screen.getByTestId('dropdown-toolbar')).toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <CategoryDropdown categories={mockCategories} editable selectedId="cat-1" onEdit={onEdit} />
    );

    fireEvent.click(screen.getByLabelText('Edit Technical Skills'));
    expect(onEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onAddChild when Add Child button is clicked', () => {
    const onAddChild = vi.fn();
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1"
        onAddChild={onAddChild}
      />
    );

    fireEvent.click(screen.getByLabelText('Add child to Technical Skills'));
    expect(onAddChild).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onDelete when Delete button is clicked on empty category', () => {
    const onDelete = vi.fn();
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1-2"
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete Backend');
    expect(deleteBtn).not.toBeDisabled();
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });

  it('disables Delete button for categories with children', () => {
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1"
        onDelete={vi.fn()}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete Technical Skills');
    expect(deleteBtn).toBeDisabled();
  });

  it('disables Delete button for categories with skills', () => {
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1-1"
        onDelete={vi.fn()}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete Frontend');
    expect(deleteBtn).toBeDisabled();
  });

  it('shows Create Category button when editable and no selection', () => {
    const onCreateRoot = vi.fn();
    render(<CategoryDropdown categories={mockCategories} editable onCreateRoot={onCreateRoot} />);

    const createBtn = screen.getByText('Create Category');
    fireEvent.click(createBtn);
    expect(onCreateRoot).toHaveBeenCalledTimes(1);
  });

  // B2: Move button in dropdown toolbar
  it('calls onMoveTo when Move button clicked on non-system category', () => {
    const onMoveTo = vi.fn();
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1-2"
        onMoveTo={onMoveTo}
      />
    );

    const moveBtn = screen.getByLabelText('Move Backend');
    expect(moveBtn).not.toBeDisabled();
    fireEvent.click(moveBtn);
    expect(onMoveTo).toHaveBeenCalled();
  });

  it('disables Move button for system-defined categories', () => {
    render(
      <CategoryDropdown
        categories={mockCategories}
        editable
        selectedId="cat-1"
        onMoveTo={vi.fn()}
      />
    );

    const moveBtn = screen.getByLabelText('Move Technical Skills');
    expect(moveBtn).toBeDisabled();
  });

  it('does not render Move button when onMoveTo is not provided', () => {
    render(<CategoryDropdown categories={mockCategories} editable selectedId="cat-1-2" />);

    expect(screen.queryByLabelText('Move Backend')).not.toBeInTheDocument();
  });
});
