import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchJson } from '@/lib/apiFetch';
import { toast } from 'sonner';

// Types
export interface SkillCategory {
  id: string;
  name: string;
  color?: string | null;
  nameEn?: string;
  description?: string;
  parentId?: string;
  level: number;
  isSystemDefined: boolean;
  isEditable: boolean;
  displayOrder: number;
  children?: SkillCategory[];
  skills?: { id: string; name: string }[];
  _count?: { skills: number };
}

export interface CreateSkillCategoryInput {
  name: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
}

export interface UpdateSkillCategoryInput {
  name?: string;
  nameEn?: string;
  description?: string;
  displayOrder?: number;
}

const QUERY_KEY = 'skill-categories';

// Fetch tree
export function useSkillCategoryTree() {
  return useQuery({
    queryKey: [QUERY_KEY, 'tree'],
    queryFn: async (): Promise<SkillCategory[]> => {
      const res = await apiFetch('/skill-categories?includeSkills=true');
      if (!res.ok) throw new Error('Failed to fetch skill categories');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch flat list (for parent selector dropdown)
export function useSkillCategoryFlat() {
  return useQuery({
    queryKey: [QUERY_KEY, 'flat'],
    queryFn: async (): Promise<SkillCategory[]> => {
      const res = await apiFetch('/skill-categories/flat');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create mutation
export function useCreateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSkillCategoryInput) => {
      return apiFetchJson<SkillCategory>('/skill-categories', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

// Update mutation
export function useUpdateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSkillCategoryInput & { id: string }) => {
      return apiFetchJson<SkillCategory>(`/skill-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

// Delete mutation
export function useDeleteSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/skill-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP ${res.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}
