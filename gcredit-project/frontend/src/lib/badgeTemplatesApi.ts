/**
 * Badge Templates API Client
 * Story 10.8 BUG-003: Badge Template CRUD UI
 */

import { apiFetch } from './apiFetch';

export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type TemplateCategory = 'achievement' | 'skill' | 'certification' | 'participation';

export interface TemplateUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface BadgeStats {
  total: number;
  pending: number;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: TemplateCategory;
  skillIds: string[];
  issuanceCriteria?: Record<string, unknown>;
  validityPeriod?: number | null;
  status: TemplateStatus;
  createdBy: string;
  creator?: TemplateUser;
  updatedBy?: string | null;
  updater?: TemplateUser | null;
  createdAt: string;
  updatedAt: string;
  badgeStats?: BadgeStats;
}

export interface BadgeTemplateListResponse {
  data: BadgeTemplate[];
  total: number;
  page: number;
  limit: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/** Get all templates (ADMIN/ISSUER — includes DRAFT, ACTIVE, ARCHIVED) */
export async function getAllTemplates(): Promise<BadgeTemplate[]> {
  const response = await apiFetch('/badge-templates/all');
  const data = await handleResponse<BadgeTemplate[] | BadgeTemplateListResponse>(response);
  return Array.isArray(data) ? data : data.data || [];
}

/** Get a single template by ID */
export async function getTemplateById(id: string): Promise<BadgeTemplate> {
  const response = await apiFetch(`/badge-templates/${id}`);
  return handleResponse<BadgeTemplate>(response);
}

/** Create a new template (multipart/form-data for image support) */
export async function createTemplate(
  data: {
    name: string;
    description?: string;
    category: TemplateCategory;
    skillIds?: string[];
    issuanceCriteria?: Record<string, unknown>;
    validityPeriod?: number;
  },
  image?: File
): Promise<BadgeTemplate> {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  formData.append('category', data.category);
  // Always send skillIds — even empty array — as JSON string for MultipartJsonInterceptor
  formData.append('skillIds', JSON.stringify(data.skillIds || []));
  if (data.issuanceCriteria) {
    formData.append('issuanceCriteria', JSON.stringify(data.issuanceCriteria));
  }
  if (data.validityPeriod !== undefined) {
    formData.append('validityPeriod', data.validityPeriod.toString());
  }
  if (image) {
    formData.append('image', image);
  }

  const response = await apiFetch('/badge-templates', {
    method: 'POST',
    body: formData,
  });
  return handleResponse<BadgeTemplate>(response);
}

/** Update an existing template */
export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: TemplateCategory;
    skillIds?: string[];
    issuanceCriteria?: Record<string, unknown>;
    validityPeriod?: number | null;
    status?: TemplateStatus;
  },
  image?: File
): Promise<BadgeTemplate> {
  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.category !== undefined) formData.append('category', data.category);
  // Only send skillIds when explicitly provided (avoid clearing on status-only updates)
  if (data.skillIds !== undefined) {
    formData.append('skillIds', JSON.stringify(data.skillIds));
  }
  if (data.issuanceCriteria !== undefined) {
    formData.append('issuanceCriteria', JSON.stringify(data.issuanceCriteria));
  }
  if (data.validityPeriod !== undefined) {
    formData.append(
      'validityPeriod',
      data.validityPeriod === null ? '' : data.validityPeriod.toString()
    );
  }
  if (data.status !== undefined) formData.append('status', data.status);
  if (image) {
    formData.append('image', image);
  }

  const response = await apiFetch(`/badge-templates/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  return handleResponse<BadgeTemplate>(response);
}

/** Delete a template */
export async function deleteTemplate(id: string): Promise<void> {
  const response = await apiFetch(`/badge-templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

/** GET /badge-templates?status=ACTIVE — only active templates */
export async function getActiveTemplates(): Promise<BadgeTemplate[]> {
  const response = await apiFetch('/badge-templates?status=ACTIVE');
  const data = await handleResponse<BadgeTemplate[] | BadgeTemplateListResponse>(response);
  return Array.isArray(data) ? data : data.data || [];
}

export const badgeTemplatesApi = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getActiveTemplates,
};

export default badgeTemplatesApi;
