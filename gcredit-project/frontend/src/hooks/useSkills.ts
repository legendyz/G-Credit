/**
 * useSkills Hook - Story 8.2
 *
 * Fetches available skills for filtering badges.
 * Supports optional category filter and search.
 */

import { useQuery } from '@tanstack/react-query';
import type { Skill } from '@/components/search/SkillsFilter';
import { apiFetch } from '@/lib/apiFetch';

interface CategoryParent {
  id: string;
  name: string;
  color?: string | null;
  level?: number;
  parent?: CategoryParent | null;
}

interface SkillApiResponse {
  id: string;
  name: string;
  description?: string;
  level?: string;
  badgeCount?: number;
  templateNames?: string[];
  category?: {
    id: string;
    name: string;
    color?: string | null;
    level?: number;
    parentId?: string | null;
    parent?: CategoryParent | null;
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
      return data.map((skill) => {
        const cat = skill.category;
        // Build hierarchy path: rootCategory (L1) > subCategory (L2) > category (L3)
        let rootCategoryName: string | undefined;
        let rootCategoryColor: string | null | undefined;
        let subCategoryName: string | undefined;

        let l3CategoryName: string | undefined;

        if (cat) {
          if (cat.parent?.parent) {
            // Level 3 category: grandparent (L1) > parent (L2) > this (L3)
            rootCategoryName = cat.parent.parent.name;
            rootCategoryColor = cat.parent.parent.color;
            subCategoryName = cat.parent.name;
            l3CategoryName = cat.name;
          } else if (cat.parent) {
            // Level 2 category: parent (L1) > this (L2)
            rootCategoryName = cat.parent.name;
            rootCategoryColor = cat.parent.color;
            subCategoryName = cat.name;
          } else {
            // Level 1 category: skill directly under top-level
            rootCategoryName = cat.name;
            rootCategoryColor = cat.color;
          }
        }

        return {
          id: skill.id,
          name: skill.name,
          categoryName: cat?.name,
          categoryColor: cat?.color,
          categoryId: cat?.id,
          rootCategoryName,
          rootCategoryColor,
          subCategoryName,
          l3CategoryName,
          description: skill.description,
          level: skill.level,
          badgeCount: skill.badgeCount ?? 0,
          templateNames: skill.templateNames ?? [],
        };
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Skills rarely change, cache for 5 minutes
  });
}

import { UNKNOWN_SKILL_LABEL } from '@/lib/constants';

// Re-export for backward compatibility
export { UNKNOWN_SKILL_LABEL } from '@/lib/constants';

/**
 * Get a map of skill IDs to skill names for chip display
 */
export function useSkillNamesMap(skillIds?: string[]): Record<string, string> {
  const { data: skills } = useSkills({ enabled: true });

  if (!skillIds) return {};

  if (!skills) {
    // Skills not yet loaded — return fallback for all IDs
    return skillIds.reduce(
      (acc, id) => {
        acc[id] = UNKNOWN_SKILL_LABEL;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  // Build O(1) lookup map from fetched skills
  const skillMap = new Map(skills.map((s) => [s.id, s.name]));

  // Map all requested IDs — fallback for unresolved ones
  return skillIds.reduce(
    (acc, id) => {
      acc[id] = skillMap.get(id) ?? UNKNOWN_SKILL_LABEL;
      return acc;
    },
    {} as Record<string, string>
  );
}

export default useSkills;
