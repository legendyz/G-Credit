/**
 * Milestone Admin API Functions — Story 12.4
 *
 * CRUD operations for milestone configuration management.
 */
import { apiFetchJson } from './apiFetch';

// --- Types ---

export interface MilestoneTrigger {
  metric: 'badge_count' | 'category_count';
  scope: 'global' | 'category';
  threshold: number;
  categoryId?: string;
  includeSubCategories?: boolean;
}

export interface MilestoneConfig {
  id: string;
  type: 'BADGE_COUNT' | 'CATEGORY_COUNT';
  title: string;
  description: string;
  trigger: MilestoneTrigger;
  icon: string;
  isActive: boolean;
  _count?: { achievements: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneInput {
  type: 'BADGE_COUNT' | 'CATEGORY_COUNT';
  title: string;
  description: string;
  trigger: MilestoneTrigger;
  icon: string;
  isActive?: boolean;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  trigger?: MilestoneTrigger;
  icon?: string;
  isActive?: boolean;
}

// --- API Functions ---

export async function fetchMilestones(): Promise<MilestoneConfig[]> {
  return apiFetchJson<MilestoneConfig[]>('/admin/milestones');
}

export async function createMilestone(input: CreateMilestoneInput): Promise<MilestoneConfig> {
  return apiFetchJson<MilestoneConfig>('/admin/milestones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMilestone(
  id: string,
  input: UpdateMilestoneInput
): Promise<MilestoneConfig> {
  return apiFetchJson<MilestoneConfig>(`/admin/milestones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMilestone(id: string): Promise<MilestoneConfig> {
  return apiFetchJson<MilestoneConfig>(`/admin/milestones/${id}`, {
    method: 'DELETE',
  });
}
