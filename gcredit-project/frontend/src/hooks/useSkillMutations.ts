/**
 * useSkillMutations — Story 12.2 (Task 5)
 *
 * Create / Update / Delete mutation hooks for skills.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiFetch';
import { toast } from 'sonner';

export interface CreateSkillInput {
  name: string;
  description?: string;
  categoryId: string;
  level?: string;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  level?: string;
  categoryId?: string;
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillInput) =>
      apiFetchJson('/skills', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skill-categories'] });
      toast.success('Skill created');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create skill'),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSkillInput & { id: string }) =>
      apiFetchJson(`/skills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skill-categories'] });
      toast.success('Skill updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update skill'),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetchJson(`/skills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skill-categories'] });
      toast.success('Skill deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete skill'),
  });
}
