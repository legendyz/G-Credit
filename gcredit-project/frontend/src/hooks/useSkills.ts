/**
 * useSkills Hook - Story 8.2
 *
 * Fetches available skills for filtering badges.
 * Supports optional category filter and search.
 */

import { useQuery } from '@tanstack/react-query';
import type { Skill } from '@/components/search/SkillsFilter';
import { apiFetch } from '@/lib/apiFetch';

interface SkillApiResponse {
  id: string;
  name: string;
  description?: string;
  level?: string;
  badgeCount?: number;
  category?: {
    id: string;
    name: string;
    color?: string | null;
  };
}

export interface UseSkillsOptions {
  /** Filter by category ID */
  categoryId?: string;
  /** Search query for skills */
  search?: string;
  /** Whether to include the query (can be used to disable fetch) */
  enabled?: boolean;
}

/**
 * Fetch all skills or search for skills
 */
export function useSkills(options: UseSkillsOptions = {}) {
  const { categoryId, search, enabled = true } = options;

  return useQuery({
    queryKey: ['skills', { categoryId, search }],
    queryFn: async (): Promise<Skill[]> => {
      let url = '/skills';
      const params = new URLSearchParams();

      if (search && search.length >= 2) {
        url = '/skills/search';
        params.set('q', search);
      } else if (categoryId) {
        params.set('categoryId', categoryId);
      }

      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const response = await apiFetch(fullUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data: SkillApiResponse[] = await response.json();

      // Transform to Skill type for filter component
      return data.map((skill) => ({
        id: skill.id,
        name: skill.name,
        categoryName: skill.category?.name, // FIX: was `category` (Story 12.2)
        categoryColor: skill.category?.color, // NEW: category color for pills
        categoryId: skill.category?.id, // NEW: for admin page filtering
        description: skill.description, // NEW: for admin table
        level: skill.level, // NEW: for admin table
        badgeCount: skill.badgeCount ?? 0, // NEW: badge template reference count
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Skills rarely change, cache for 5 minutes
  });
}

/**
 * Get a map of skill IDs to skill names for chip display
 */
export function useSkillNamesMap(skillIds?: string[]) {
  const { data: skills } = useSkills({ enabled: true });

  if (!skills || !skillIds) {
    return {};
  }

  return skills.reduce(
    (acc, skill) => {
      if (skillIds.includes(skill.id)) {
        acc[skill.id] = skill.name;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

export default useSkills;
