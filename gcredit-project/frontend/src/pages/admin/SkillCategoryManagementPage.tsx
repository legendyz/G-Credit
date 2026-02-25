import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { CategoryTree } from '@/components/admin/CategoryTree';
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useSkillCategoryTree,
  useCreateSkillCategory,
  useUpdateSkillCategory,
  useDeleteSkillCategory,
  type SkillCategory,
  type CreateSkillCategoryInput,
  type UpdateSkillCategoryInput,
} from '@/hooks/useSkillCategories';

export function SkillCategoryManagementPage() {
  // Data fetching
  const { data: categories, isLoading, isError, error, refetch } = useSkillCategoryTree();

  // Mutations
  const createMutation = useCreateSkillCategory();
  const updateMutation = useUpdateSkillCategory();
  const deleteMutation = useDeleteSkillCategory();

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<SkillCategory | undefined>();
  const [preSelectedParentId, setPreSelectedParentId] = useState<string | undefined>();

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<SkillCategory | undefined>();
  const [deleteBlockMessage, setDeleteBlockMessage] = useState('');

  // Selection state (used by responsive dropdown)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const handleSelect = useCallback((category: SkillCategory) => {
    setSelectedCategoryId(category.id);
  }, []);

  // Handlers
  const handleCreateRoot = useCallback(() => {
    setFormMode('create');
    setEditingCategory(undefined);
    setPreSelectedParentId(undefined);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((category: SkillCategory) => {
    setFormMode('edit');
    setEditingCategory(category);
    setPreSelectedParentId(undefined);
    setFormDialogOpen(true);
  }, []);

  const handleAddChild = useCallback((parent: SkillCategory) => {
    setFormMode('create');
    setEditingCategory(undefined);
    setPreSelectedParentId(parent.id);
    setFormDialogOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((category: SkillCategory) => {
    // Check if category has skills
    const skillCount = category._count?.skills ?? category.skills?.length ?? 0;
    if (skillCount > 0) {
      setDeleteBlockMessage(
        `Cannot delete '${category.name}' — it has ${skillCount} skill${skillCount === 1 ? '' : 's'} assigned. Reassign them first.`
      );
      setDeletingCategory(category);
      setDeleteDialogOpen(true);
      return;
    }

    // Check if category has children
    const childCount = category.children?.length ?? 0;
    if (childCount > 0) {
      setDeleteBlockMessage(
        `Cannot delete '${category.name}' — it has subcategories. Delete them first.`
      );
      setDeletingCategory(category);
      setDeleteDialogOpen(true);
      return;
    }

    // Safe to delete — show confirm
    setDeleteBlockMessage('');
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    (data: CreateSkillCategoryInput | UpdateSkillCategoryInput) => {
      if (formMode === 'create') {
        createMutation.mutate(data as CreateSkillCategoryInput, {
          onSuccess: () => setFormDialogOpen(false),
        });
      } else if (editingCategory) {
        updateMutation.mutate(
          { id: editingCategory.id, ...data } as UpdateSkillCategoryInput & { id: string },
          { onSuccess: () => setFormDialogOpen(false) }
        );
      }
    },
    [formMode, editingCategory, createMutation, updateMutation]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingCategory || deleteBlockMessage) return;
    deleteMutation.mutate(deletingCategory.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingCategory(undefined);
      },
    });
  }, [deletingCategory, deleteBlockMessage, deleteMutation]);

  const handleReorder = useCallback(
    (updates: Array<{ id: string; displayOrder: number }>) => {
      // Batch: fire all reorder mutations concurrently
      updates.forEach(({ id, displayOrder }) => {
        updateMutation.mutate({ id, displayOrder });
      });
    },
    [updateMutation]
  );

  const isEmpty = !isLoading && !isError && (!categories || categories.length === 0);

  return (
    <>
      <AdminPageShell
        title="Skill Categories"
        description="Manage the skill category hierarchy for your organization."
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
        isEmpty={isEmpty}
        emptyTitle="No skill categories"
        emptyDescription="Create your first skill category to organize skills."
        emptyAction={
          <Button onClick={handleCreateRoot}>
            <Plus className="h-4 w-4 mr-1" />
            Create Category
          </Button>
        }
        onRetry={() => refetch()}
        actions={
          <Button onClick={handleCreateRoot}>
            <Plus className="h-4 w-4 mr-1" />
            Create Category
          </Button>
        }
      >
        {categories && categories.length > 0 && (
          <CategoryTree
            categories={categories}
            editable
            selectedId={selectedCategoryId}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onAddChild={handleAddChild}
            onReorder={handleReorder}
            onCreateRoot={handleCreateRoot}
          />
        )}
      </AdminPageShell>

      {/* Create/Edit Dialog */}
      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        mode={formMode}
        category={editingCategory}
        parentId={preSelectedParentId}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingCategory(undefined);
        }}
        title={deleteBlockMessage ? 'Cannot Delete Category' : 'Delete Category'}
        description={
          deleteBlockMessage ||
          `Are you sure you want to delete '${deletingCategory?.name}'? This action cannot be undone.`
        }
        variant={deleteBlockMessage ? 'default' : 'danger'}
        confirmLabel={deleteBlockMessage ? 'OK' : 'Delete'}
        onConfirm={deleteBlockMessage ? () => setDeleteDialogOpen(false) : handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </>
  );
}

export default SkillCategoryManagementPage;
