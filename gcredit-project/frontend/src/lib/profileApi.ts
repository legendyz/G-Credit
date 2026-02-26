/**
 * Profile API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: GET/PATCH /auth/profile, POST /auth/change-password
 */

import { apiFetch } from './apiFetch';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/** GET /auth/profile */
export async function getProfile(): Promise<ProfileData> {
  const response = await apiFetch('/auth/profile');
  return handleResponse<ProfileData>(response);
}

/** PATCH /auth/profile */
export async function updateProfile(data: {
  firstName: string;
  lastName: string;
}): Promise<ProfileData> {
  const response = await apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return handleResponse<ProfileData>(response);
}

/** POST /auth/change-password */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to change password');
  }
}
