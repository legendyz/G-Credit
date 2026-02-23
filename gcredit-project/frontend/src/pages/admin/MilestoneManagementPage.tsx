/**
 * MilestoneManagementPage — Story 12.4 (Task 7)
 *
 * Admin page for managing milestone configurations.
 * Card grid layout grouped by scope, with create/edit/toggle/delete actions.
 */
import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MilestoneFormSheet } from '@/components/admin/MilestoneFormSheet';
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '@/hooks/useMilestones';
import type {
  MilestoneConfig,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from '@/lib/milestonesApi';

export function MilestoneManagementPage() {
  // Data fetching
  const { data: milestones, isLoading, isError, error, refetch } = useMilestones();

  // Mutations
  const createMutation = useCreateMilestone();
  const updateMutation = useUpdateMilestone();
  const deleteMutation = useDeleteMilestone();

  // Form sheet state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingMilestone, setEditingMilestone] = useState<MilestoneConfig | undefined>();

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState<MilestoneConfig | undefined>();

  // Handlers
  const handleCreate = useCallback(() => {
    setFormMode('create');
    setEditingMilestone(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((milestone: MilestoneConfig) => {
    setFormMode('edit');
    setEditingMilestone(milestone);
    setFormOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((milestone: MilestoneConfig) => {
    setDeletingMilestone(milestone);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (milestone: MilestoneConfig) => {
      const newIsActive = !milestone.isActive;
      updateMutation.mutate(
        {
          id: milestone.id,
          input: { isActive: newIsActive },
        },
        {
          onSuccess: () => {
            toast.success(`Milestone ${newIsActive ? 'activated' : 'deactivated'}`);
          },
        }
      );
    },
    [updateMutation]
  );

  const handleFormSubmitCreate = useCallback(
    (input: CreateMilestoneInput) => {
      createMutation.mutate(input, {
        onSuccess: () => setFormOpen(false),
      });
    },
    [createMutation]
  );

  const handleFormSubmitUpdate = useCallback(
    (id: string, input: UpdateMilestoneInput) => {
      updateMutation.mutate(
        { id, input },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast.success('Milestone updated');
          },
        }
      );
    },
    [updateMutation]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deletingMilestone) return;
    deleteMutation.mutate(deletingMilestone.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  }, [deletingMilestone, deleteMutation]);

  // Group milestones by scope
  const globalMilestones = milestones?.filter((m) => m.trigger.scope === 'global') ?? [];
  const categoryMilestones = milestones?.filter((m) => m.trigger.scope === 'category') ?? [];
  const isEmpty = !milestones || milestones.length === 0;

  return (
    <AdminPageShell
      title="Milestone Management"
      description="Configure achievement milestones"
      isLoading={isLoading}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => refetch()}
      isEmpty={isEmpty}
      emptyTitle="Create Your First Milestone"
      emptyDescription="Set up achievement milestones to motivate your team."
      emptyAction={
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Milestone
        </Button>
      }
      actions={
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Milestone
        </Button>
      }
    >
      {/* Global Milestones Section */}
      {globalMilestones.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Global Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onToggle={handleToggleActive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Milestones Section */}
      {categoryMilestones.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Category Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onToggle={handleToggleActive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form Sheet */}
      <MilestoneFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        milestone={editingMilestone}
        onSubmitCreate={handleFormSubmitCreate}
        onSubmitUpdate={handleFormSubmitUpdate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete / Deactivate Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(v) => !v && setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          (deletingMilestone?._count?.achievements ?? 0) > 0
            ? 'Deactivate Milestone'
            : 'Delete Milestone'
        }
        description={
          (deletingMilestone?._count?.achievements ?? 0) > 0
            ? `"${deletingMilestone?.title}" has been achieved by ${deletingMilestone?._count?.achievements} user(s). It will be deactivated (hidden) but achievement records are preserved.`
            : `Are you sure you want to permanently delete "${deletingMilestone?.title}"? No users have achieved this milestone, so it can be safely removed.`
        }
        confirmLabel={(deletingMilestone?._count?.achievements ?? 0) > 0 ? 'Deactivate' : 'Delete'}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </AdminPageShell>
  );
}

// --- Milestone Card Component ---

interface MilestoneCardProps {
  milestone: MilestoneConfig;
  onEdit: (milestone: MilestoneConfig) => void;
  onDelete: (milestone: MilestoneConfig) => void;
  onToggle: (milestone: MilestoneConfig) => void;
}

function MilestoneCard({ milestone, onEdit, onDelete, onToggle }: MilestoneCardProps) {
  const achievementCount = milestone._count?.achievements ?? 0;

  return (
    <div
      className={`rounded-lg border bg-white p-4 cursor-pointer transition-shadow hover:shadow-md ${
        !milestone.isActive ? 'opacity-60' : ''
      }`}
      onClick={() => onEdit(milestone)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(milestone);
        }
      }}
    >
      {/* Top row: icon + actions */}
      <div className="flex items-start justify-between">
        <span className="text-3xl">{milestone.icon}</span>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onDelete(milestone)}
            className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
            aria-label={
              achievementCount > 0 ? `Deactivate ${milestone.title}` : `Delete ${milestone.title}`
            }
            title={achievementCount > 0 ? 'Deactivate (has achievements)' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Switch
            checked={milestone.isActive}
            onCheckedChange={() => onToggle(milestone)}
            aria-label={`Toggle ${milestone.title}`}
          />
        </div>
      </div>

      {/* Title & description */}
      <p className="font-semibold mt-2 text-neutral-900">{milestone.title}</p>
      <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{milestone.description}</p>

      {/* Chips */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
          {milestone.trigger.metric === 'badge_count' ? 'BADGE_COUNT' : 'CATEGORY_COUNT'}
        </span>
        <span className="text-xs text-neutral-400">·</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
          {milestone.trigger.scope === 'global' ? 'Global' : 'Category'}
        </span>
      </div>

      {/* Threshold + Achievements */}
      <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
        <span>Threshold: {milestone.trigger.threshold}</span>
        <span>👥 {achievementCount} achieved</span>
      </div>
    </div>
  );
}

export default MilestoneManagementPage;
