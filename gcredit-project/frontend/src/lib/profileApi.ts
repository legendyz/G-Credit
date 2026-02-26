/**
 * Profile API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: GET/PATCH /auth/profile, POST /auth/change-password
 */

import { apiFetch, apiFetchJson } from './apiFetch';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  azureId?: string | null;
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

/** GET /auth/profile */
export async function getProfile(): Promise<ProfileData> {
  return apiFetchJson<ProfileData>('/auth/profile');
}

/** PATCH /auth/profile */
export async function updateProfile(data: {
  firstName: string;
  lastName: string;
}): Promise<ProfileData> {
  return apiFetchJson<ProfileData>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
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
