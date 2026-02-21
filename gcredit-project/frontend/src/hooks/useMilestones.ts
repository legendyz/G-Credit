/**
 * Milestone React Query Hooks — Story 12.4
 *
 * TanStack Query hooks for milestone CRUD operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '@/lib/milestonesApi';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@/lib/milestonesApi';

export function useMilestones() {
  return useQuery({
    queryKey: ['admin-milestones'],
    queryFn: fetchMilestones,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => createMilestone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
      toast.success('Milestone created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create milestone: ${error.message}`);
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMilestoneInput }) =>
      updateMilestone(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestones'] });
      toast.success('Milestone deactivated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });
}
