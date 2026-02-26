/**
 * Badges API Client
 * Sprint 7 - Epic 9: Badge Revocation Admin UI
 */

import { apiFetch, apiFetchJson } from './apiFetch';

// Badge status constants matching backend Prisma enum
export const BadgeStatus = {
  PENDING: 'PENDING', // Awaiting claim (same as "Issued" in UI)
  CLAIMED: 'CLAIMED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export type BadgeStatus = (typeof BadgeStatus)[keyof typeof BadgeStatus];

// Revocation reasons constants matching backend enum (revoke-badge.dto.ts)
export const RevocationReason = {
  POLICY_VIOLATION: 'Policy Violation',
  ISSUED_IN_ERROR: 'Issued in Error',
  EXPIRED: 'Expired',
  DUPLICATE: 'Duplicate',
  FRAUD: 'Fraud',
  OTHER: 'Other',
} as const;

export type RevocationReason = (typeof RevocationReason)[keyof typeof RevocationReason];

// Revocation reasons for dropdown (matches backend RevocationReason enum)
export const REVOCATION_REASONS = [
  { value: RevocationReason.POLICY_VIOLATION, label: 'Policy Violation' },
  { value: RevocationReason.ISSUED_IN_ERROR, label: 'Issued in Error' },
  { value: RevocationReason.EXPIRED, label: 'Expired' },
  { value: RevocationReason.DUPLICATE, label: 'Duplicate' },
  { value: RevocationReason.FRAUD, label: 'Fraud' },
  { value: RevocationReason.OTHER, label: 'Other' },
] as const;

export interface Badge {
  id: string;
  templateId: string;
  recipientId: string;
  issuerId: string;
  status: BadgeStatus;
  issuedAt: string;
  claimedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  revocationNotes?: string;
  revokedBy?: string;
  evidenceCount?: number; // Story 12.6
  template: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    category?: string;
    // Story 8.2: Skill IDs for filtering
    skillIds?: string[];
  };
  recipient: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  issuer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  revoker?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface BadgeListResponse {
  data: Badge[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface RevokeBadgeDto {
  reason: string;
  notes?: string;
}

export interface RevokeBadgeResponse {
  success: boolean;
  message: string;
  badge: Badge;
}

export interface BadgeQueryParams {
  page?: number;
  limit?: number;
  status?: BadgeStatus | 'all';
  search?: string;
  sortBy?: 'issuedAt' | 'templateName' | 'recipientName';
  sortOrder?: 'asc' | 'desc';
  activeOnly?: boolean; // Filter for ISSUED + CLAIMED badges only
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all badges (Admin view) - uses /issued endpoint which returns all for ADMIN
 * GET /api/badges/issued
 */
export async function getAllBadges(params: BadgeQueryParams = {}): Promise<BadgeListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.activeOnly) searchParams.set('activeOnly', 'true');

  const response = await apiFetch(`/badges/issued?${searchParams}`);

  return handleResponse<BadgeListResponse>(response);
}

/**
 * Fetch badges issued by current user (Issuer view)
 * GET /api/badges/issued
 */
export async function getIssuedBadges(params: BadgeQueryParams = {}): Promise<BadgeListResponse> {
  // Same endpoint - backend filters based on user role
  return getAllBadges(params);
}

/**
 * Revoke a badge
 * POST /api/badges/:id/revoke
 *
 * @param badgeId - The badge ID to revoke
 * @param dto - Revocation reason and optional notes
 * @returns Revocation result with updated badge
 */
export async function revokeBadge(
  badgeId: string,
  dto: RevokeBadgeDto
): Promise<RevokeBadgeResponse> {
  const response = await apiFetch(`/badges/${badgeId}/revoke`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });

  return handleResponse<RevokeBadgeResponse>(response);
}

/**
 * Get a single badge by ID
 * GET /api/badges/:id
 */
export async function getBadgeById(badgeId: string): Promise<Badge> {
  const response = await apiFetch(`/badges/${badgeId}`);

  return handleResponse<Badge>(response);
}

// --- Single Badge Issuance (Story 10.6b) ---

export interface IssueBadgeRequest {
  templateId: string;
  recipientId: string;
  expiresIn?: number;
}

export async function issueBadge(dto: IssueBadgeRequest): Promise<Badge> {
  const response = await apiFetch('/badges', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return handleResponse<Badge>(response);
}

// --- Story 13.7: API Client Cleanup — migrated inline calls ---

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

/** PATCH /badges/:id/visibility */
export async function updateBadgeVisibility(
  badgeId: string,
  visibility: 'PUBLIC' | 'PRIVATE'
): Promise<void> {
  const res = await apiFetch(`/badges/${badgeId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) throw new Error('Failed to update visibility');
}

/** POST /badges/:id/claim — claim a specific badge (wallet modal) */
export async function claimBadge(badgeId: string): Promise<Record<string, unknown>> {
  const response = await apiFetch(`/badges/${badgeId}/claim`, {
    method: 'POST',
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** POST /badges/claim — public claim by token (email link) */
export async function claimBadgeByToken(data: {
  claimToken: string;
}): Promise<Record<string, unknown>> {
  const response = await apiFetch('/badges/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** GET /badges/:id/download/png — returns blob */
export async function downloadBadgePng(badgeId: string): Promise<Blob> {
  const response = await apiFetch(`/badges/${badgeId}/download/png`);
  if (!response.ok) throw new Error('Failed to download badge');
  return response.blob();
}

/** POST /badges/:id/report */
export async function reportBadgeIssue(
  badgeId: string,
  data: { issueType: string; description: string; email: string }
): Promise<Record<string, unknown>> {
  const response = await apiFetch(`/badges/${badgeId}/report`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** GET /badges/:id/similar?limit=N */
export async function getSimilarBadges(badgeId: string, limit = 6): Promise<unknown[]> {
  return apiFetchJson(`/badges/${badgeId}/similar?limit=${limit}`);
}

/** GET /badges/recipients */
export async function getRecipients(): Promise<Recipient[]> {
  return apiFetchJson('/badges/recipients');
}

// Export as namespace for cleaner imports
export const badgesApi = {
  getAllBadges,
  getIssuedBadges,
  revokeBadge,
  getBadgeById,
  issueBadge,
  updateBadgeVisibility,
  claimBadge,
  claimBadgeByToken,
  downloadBadgePng,
  reportBadgeIssue,
  getSimilarBadges,
  getRecipients,
};

export default badgesApi;
