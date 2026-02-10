/**
 * Badge Templates API Client
 * Story 10.8 BUG-003: Badge Template CRUD UI
 */

import { API_BASE_URL } from './apiConfig';

export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type TemplateCategory = 'achievement' | 'skill' | 'certification' | 'participation';

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
  createdAt: string;
  updatedAt: string;
}

export interface BadgeTemplateListResponse {
  data: BadgeTemplate[];
  total: number;
  page: number;
  limit: number;
}

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getJsonAuthHeader(): HeadersInit {
  return {
    ...getAuthHeader(),
    'Content-Type': 'application/json',
  };
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
  const response = await fetch(`${API_BASE_URL}/badge-templates/all`, {
    headers: getJsonAuthHeader(),
  });
  const data = await handleResponse<BadgeTemplate[] | BadgeTemplateListResponse>(response);
  return Array.isArray(data) ? data : data.data || [];
}

/** Get a single template by ID */
export async function getTemplateById(id: string): Promise<BadgeTemplate> {
  const response = await fetch(`${API_BASE_URL}/badge-templates/${id}`, {
    headers: getJsonAuthHeader(),
  });
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
  if (data.skillIds) {
    data.skillIds.forEach((id) => formData.append('skillIds', id));
  }
  if (data.issuanceCriteria) {
    formData.append('issuanceCriteria', JSON.stringify(data.issuanceCriteria));
  }
  if (data.validityPeriod !== undefined) {
    formData.append('validityPeriod', data.validityPeriod.toString());
  }
  if (image) {
    formData.append('image', image);
  }

  const response = await fetch(`${API_BASE_URL}/badge-templates`, {
    method: 'POST',
    headers: getAuthHeader(),
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
  if (data.skillIds) {
    data.skillIds.forEach((id) => formData.append('skillIds', id));
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

  const response = await fetch(`${API_BASE_URL}/badge-templates/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: formData,
  });
  return handleResponse<BadgeTemplate>(response);
}

/** Delete a template */
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/badge-templates/${id}`, {
    method: 'DELETE',
    headers: getJsonAuthHeader(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

export const badgeTemplatesApi = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

export default badgeTemplatesApi;
