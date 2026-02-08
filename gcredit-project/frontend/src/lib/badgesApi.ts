/**
 * Badges API Client
 * Sprint 7 - Epic 9: Badge Revocation Admin UI
 */

import { API_BASE_URL } from './apiConfig';

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
  badges: Badge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
 * Get authorization header
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

  const response = await fetch(`${API_BASE_URL}/badges/issued?${searchParams}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

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
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/revoke`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(dto),
  });

  return handleResponse<RevokeBadgeResponse>(response);
}

/**
 * Get a single badge by ID
 * GET /api/badges/:id
 */
export async function getBadgeById(badgeId: string): Promise<Badge> {
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  return handleResponse<Badge>(response);
}

// Export as namespace for cleaner imports
export const badgesApi = {
  getAllBadges,
  getIssuedBadges,
  revokeBadge,
  getBadgeById,
};

export default badgesApi;
