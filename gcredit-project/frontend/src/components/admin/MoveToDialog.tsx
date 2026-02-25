/**
 * MoveToDialog — D-3: Cross-level move dialog
 *
 * Shows a read-only tree for selecting a new parent, validates constraints,
 * and calls PATCH /api/skill-categories/:id with the new parentId.
 */

import { useState, useMemo, useCallback } from 'react';
import { FolderRoot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SkillCategory } from '@/hooks/useSkillCategories';
import { useUpdateSkillCategory } from '@/hooks/useSkillCategories';

interface MoveToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SkillCategory;
  categories: SkillCategory[];
}

/**
 * Collect all descendant IDs of a category (for disabling in the tree).
 */
function getDescendantIds(category: SkillCategory): Set<string> {
  const ids = new Set<string>();
  const walk = (children: SkillCategory[] | undefined) => {
    if (!children) return;
    for (const child of children) {
      ids.add(child.id);
      walk(child.children);
    }
  };
  walk(category.children);
  return ids;
}

/**
 * Calculate max subtree depth below a category.
 * 0 = leaf, 1 = has children, 2 = has grandchildren.
 */
function getMaxSubtreeDepth(category: SkillCategory): number {
  if (!category.children || category.children.length === 0) return 0;
  let max = 0;
  for (const child of category.children) {
    const childDepth = 1 + getMaxSubtreeDepth(child);
    if (childDepth > max) max = childDepth;
  }
  return max;
}

/**
 * Flatten tree into ordered list with disable info for parent selection.
 */
interface FlatTarget {
  id: string | null; // null = root
  name: string;
  level: number;
  disabled: boolean;
  reason?: string;
}

function buildTargetList(categories: SkillCategory[], movingCategory: SkillCategory): FlatTarget[] {
  const descendantIds = getDescendantIds(movingCategory);
  const subtreeDepth = getMaxSubtreeDepth(movingCategory);
  const targets: FlatTarget[] = [];

  // Root option
  const rootDisabled = movingCategory.parentId === null; // already at root
  targets.push({
    id: null,
    name: 'Root (Level 1)',
    level: 0,
    disabled: rootDisabled || 1 + subtreeDepth > 3,
    reason: rootDisabled
      ? 'Already at root'
      : 1 + subtreeDepth > 3
        ? 'Would exceed max depth'
        : undefined,
  });

  const walk = (cats: SkillCategory[]) => {
    for (const cat of cats) {
      const isSelf = cat.id === movingCategory.id;
      const isDescendant = descendantIds.has(cat.id);
      const isCurrentParent = cat.id === movingCategory.parentId;
      const newLevel = cat.level + 1;
      const wouldExceedDepth = newLevel + subtreeDepth > 3;

      targets.push({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        disabled: isSelf || isDescendant || isCurrentParent || wouldExceedDepth,
        reason: isSelf
          ? 'Cannot move to self'
          : isDescendant
            ? 'Descendant (cycle)'
            : isCurrentParent
              ? 'Current parent'
              : wouldExceedDepth
                ? 'Would exceed max depth'
                : undefined,
      });

      if (cat.children && cat.children.length > 0) {
        walk(cat.children);
      }
    }
  };
  walk(categories);
  return targets;
}

export function MoveToDialog({ open, onOpenChange, category, categories }: MoveToDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null | undefined>(undefined);
  const updateMutation = useUpdateSkillCategory();

  const targets = useMemo(() => buildTargetList(categories, category), [categories, category]);

  const selectedTarget = useMemo(
    () =>
      selectedTargetId !== undefined ? targets.find((t) => t.id === selectedTargetId) : undefined,
    [targets, selectedTargetId]
  );

  const handleConfirm = useCallback(async () => {
    if (selectedTargetId === undefined) return;
    await updateMutation.mutateAsync({
      id: category.id,
      parentId: selectedTargetId,
    });
    onOpenChange(false);
  }, [selectedTargetId, category.id, updateMutation, onOpenChange]);

  const handleOpenChange = (value: boolean) => {
    if (updateMutation.isPending) return;
    if (!value) setSelectedTargetId(undefined);
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move &ldquo;{category.name}&rdquo;</DialogTitle>
          <DialogDescription>
            Select a new parent for this category. Disabled items cannot be selected due to depth or
            cycle constraints.
          </DialogDescription>
        </DialogHeader>

        <div
          className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-0.5"
          role="listbox"
          aria-label="Select target parent"
          data-testid="move-target-list"
        >
          {targets.map((target) => {
            const isSelected = selectedTargetId === target.id;
            return (
              <button
                key={target.id ?? '__root__'}
                role="option"
                aria-selected={isSelected}
                aria-disabled={target.disabled}
                disabled={target.disabled}
                onClick={() => setSelectedTargetId(target.id)}
                className={`
                  w-full text-left px-2 py-1.5 rounded text-sm transition-colors
                  ${isSelected ? 'bg-blue-100 border-blue-300 border' : 'hover:bg-gray-50'}
                  ${target.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ paddingLeft: `${target.level * 16 + 8}px` }}
                data-testid={`move-target-${target.id ?? 'root'}`}
              >
                <span className="flex items-center gap-1.5">
                  {target.id === null && <FolderRoot className="h-4 w-4 text-gray-500" />}
                  {target.level > 0 && <span className="text-muted-foreground">{'└'}</span>}
                  {target.name}
                  {target.reason && (
                    <span className="text-xs text-muted-foreground ml-1">({target.reason})</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              selectedTargetId === undefined ||
              (selectedTarget?.disabled ?? false) ||
              updateMutation.isPending
            }
          >
            {updateMutation.isPending ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
