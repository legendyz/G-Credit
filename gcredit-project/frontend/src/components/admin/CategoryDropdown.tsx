/**
 * CategoryDropdown — D-1: Responsive dropdown alternative for CategoryTree
 *
 * Renders on screens <1024px as a flat dropdown with indented labels.
 * Provides toolbar buttons for CRUD actions on the selected category.
 */

import { useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { SkillCategory } from '@/hooks/useSkillCategories';

interface CategoryDropdownProps {
  categories: SkillCategory[];
  editable?: boolean;
  selectedId?: string;
  onSelect?: (category: SkillCategory) => void;
  onEdit?: (category: SkillCategory) => void;
  onDelete?: (category: SkillCategory) => void;
  onAddChild?: (parent: SkillCategory) => void;
  onCreateRoot?: () => void;
}

interface FlatCategoryItem {
  id: string;
  name: string;
  level: number;
  hasChildren: boolean;
  hasSkills: boolean;
  isSystemDefined: boolean;
  original: SkillCategory;
}

/**
 * Flatten tree into ordered list preserving hierarchy for dropdown display
 */
function flattenCategories(categories: SkillCategory[]): FlatCategoryItem[] {
  const items: FlatCategoryItem[] = [];
  const walk = (cats: SkillCategory[]) => {
    for (const cat of cats) {
      const skillCount = cat._count?.skills ?? cat.skills?.length ?? 0;
      items.push({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        hasChildren: (cat.children?.length ?? 0) > 0,
        hasSkills: skillCount > 0,
        isSystemDefined: cat.isSystemDefined,
        original: cat,
      });
      if (cat.children && cat.children.length > 0) {
        walk(cat.children);
      }
    }
  };
  walk(categories);
  return items;
}

export function CategoryDropdown({
  categories,
  editable = false,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onCreateRoot,
}: CategoryDropdownProps) {
  const flatItems = useMemo(() => flattenCategories(categories), [categories]);

  const selectedItem = useMemo(
    () => flatItems.find((item) => item.id === selectedId),
    [flatItems, selectedId]
  );

  const handleValueChange = (value: string) => {
    if (value === '__all__') return;
    const item = flatItems.find((i) => i.id === value);
    if (item && onSelect) {
      onSelect(item.original);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <p className="text-body font-medium text-neutral-700">No categories found</p>
        {onCreateRoot && (
          <Button onClick={onCreateRoot} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Category
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="category-dropdown">
      <Select value={selectedId || '__all__'} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full" aria-label="Select category">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Categories</SelectItem>
          {flatItems.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <span style={{ paddingLeft: `${(item.level - 1) * 16}px` }}>
                {item.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                {item.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Toolbar: CRUD actions on selected category */}
      {editable && selectedItem && (
        <div className="flex items-center gap-1" data-testid="dropdown-toolbar">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(selectedItem.original)}
              aria-label={`Edit ${selectedItem.name}`}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}

          {onAddChild && selectedItem.original.level < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddChild(selectedItem.original)}
              aria-label={`Add child to ${selectedItem.name}`}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Child
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(selectedItem.original)}
              disabled={selectedItem.hasChildren || selectedItem.hasSkills}
              aria-label={`Delete ${selectedItem.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Create root button when no item is selected */}
      {editable && !selectedItem && onCreateRoot && (
        <Button variant="outline" size="sm" onClick={onCreateRoot}>
          <Plus className="h-4 w-4 mr-1" />
          Create Category
        </Button>
      )}
    </div>
  );
}
