import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, GripVertical, Pencil, Trash2, Plus, Lock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import type { SkillCategory } from '@/hooks/useSkillCategories';

interface CategoryTreeProps {
  categories: SkillCategory[];
  editable?: boolean;
  onEdit?: (category: SkillCategory) => void;
  onDelete?: (category: SkillCategory) => void;
  onAddChild?: (parent: SkillCategory) => void;
  onReorder?: (id: string, newDisplayOrder: number) => void;
  selectedId?: string;
  onSelect?: (category: SkillCategory) => void;
  onCreateRoot?: () => void;
}

export function CategoryTree({
  categories,
  editable = false,
  onEdit,
  onDelete,
  onAddChild,
  onReorder,
  selectedId,
  onSelect,
  onCreateRoot,
}: CategoryTreeProps) {
  // Track expanded state — top-level nodes expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    categories.forEach((cat) => initial.add(cat.id));
    return initial;
  });

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      // Find the items in the same level
      const activeId = active.id as string;
      const overId = over.id as string;

      // Calculate new display order based on position
      const siblings = categories;
      const oldIndex = siblings.findIndex((c) => c.id === activeId);
      const newIndex = siblings.findIndex((c) => c.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(siblings, oldIndex, newIndex);
      reordered.forEach((item, index) => {
        if (item.displayOrder !== index) {
          onReorder(item.id, index);
        }
      });
    },
    [categories, onReorder]
  );

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-body font-medium text-neutral-700">No categories found</p>
        <p className="text-sm text-neutral-500">Create your first skill category.</p>
        {onCreateRoot && (
          <Button onClick={onCreateRoot}>
            <Plus className="h-4 w-4 mr-1" />
            Create Category
          </Button>
        )}
      </div>
    );
  }

  if (editable && onReorder) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5" role="tree" aria-label="Skill categories">
            {categories.map((category) => (
              <SortableTreeNode
                key={category.id}
                category={category}
                editable={editable}
                expanded={expanded}
                onToggleExpand={toggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onReorder={onReorder}
                selectedId={selectedId}
                onSelect={onSelect}
                level={0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className="space-y-0.5" role="tree" aria-label="Skill categories">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          editable={editable}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          selectedId={selectedId}
          onSelect={onSelect}
          level={0}
        />
      ))}
    </div>
  );
}

interface CategoryTreeNodeProps {
  category: SkillCategory;
  editable: boolean;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit?: (category: SkillCategory) => void;
  onDelete?: (category: SkillCategory) => void;
  onAddChild?: (parent: SkillCategory) => void;
  onReorder?: (id: string, newDisplayOrder: number) => void;
  selectedId?: string;
  onSelect?: (category: SkillCategory) => void;
  level: number;
}

// Sortable wrapper for drag-and-drop
function SortableTreeNode(props: CategoryTreeNodeProps) {
  const { category } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryTreeNodeInner {...props} dragAttributes={attributes} dragListeners={listeners} />
    </div>
  );
}

interface CategoryTreeNodeInnerProps extends CategoryTreeNodeProps {
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
}

function CategoryTreeNodeInner({
  category,
  editable,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  onReorder,
  selectedId,
  onSelect,
  level,
  dragAttributes,
  dragListeners,
}: CategoryTreeNodeInnerProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expanded.has(category.id);
  const isSelected = selectedId === category.id;
  const skillCount = category._count?.skills ?? category.skills?.length ?? 0;

  const handleChildDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onReorder || !category.children) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const oldIndex = category.children.findIndex((c) => c.id === activeId);
      const newIndex = category.children.findIndex((c) => c.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(category.children, oldIndex, newIndex);
      reordered.forEach((item, index) => {
        if (item.displayOrder !== index) {
          onReorder(item.id, index);
        }
      });
    },
    [category.children, onReorder]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <div
      role="treeitem"
      aria-selected={!!isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md group transition-colors ${
          isSelected ? 'bg-brand-50 border border-brand-200' : 'hover:bg-neutral-50'
        } ${level > 0 ? 'ml-6' : ''}`}
        style={{ marginLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
        onClick={() => onSelect?.(category)}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
      >
        {/* Drag handle (editable mode only) */}
        {editable && (
          <span
            className="cursor-grab text-neutral-400"
            data-testid="drag-handle"
            {...(dragAttributes || {})}
            {...(dragListeners || {})}
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(category.id);
            }}
            className="p-0.5 rounded hover:bg-neutral-200"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-500" />
            )}
          </button>
        ) : (
          <span className="w-5" /> // spacer for alignment
        )}

        {/* Category name */}
        <span className="flex-1 text-sm font-medium text-neutral-800">{category.name}</span>

        {/* Skill count badge */}
        {skillCount > 0 && (
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {skillCount} {skillCount === 1 ? 'skill' : 'skills'}
          </span>
        )}

        {/* System-defined lock icon */}
        {category.isSystemDefined && (
          <Lock className="h-3.5 w-3.5 text-neutral-400" data-testid="lock-icon" />
        )}

        {/* Action buttons (editable mode only, shown on hover) */}
        {editable && (
          <div className="hidden group-hover:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(category);
              }}
              aria-label={`Edit ${category.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {category.level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild?.(category);
                }}
                aria-label={`Add child to ${category.name}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(category);
              }}
              disabled={category.isSystemDefined}
              aria-label={`Delete ${category.name}`}
              title={
                category.isSystemDefined ? 'System-defined categories cannot be deleted' : undefined
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div role="group">
          {editable && onReorder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleChildDragEnd}
            >
              <SortableContext
                items={category.children!.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {category.children!.map((child) => (
                  <SortableTreeNode
                    key={child.id}
                    category={child}
                    editable={editable}
                    expanded={expanded}
                    onToggleExpand={onToggleExpand}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    onReorder={onReorder}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    level={level + 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            category.children!.map((child) => (
              <CategoryTreeNode
                key={child.id}
                category={child}
                editable={editable}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                selectedId={selectedId}
                onSelect={onSelect}
                level={level + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Non-sortable tree node (read-only mode)
function CategoryTreeNode(props: Omit<CategoryTreeNodeProps, 'onReorder'>) {
  return <CategoryTreeNodeInner {...props} />;
}
