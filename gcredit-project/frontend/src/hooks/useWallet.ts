import { useQuery } from '@tanstack/react-query';
import { BadgeStatus } from '../types/badge';
import { apiFetch } from '../lib/apiFetch';

export interface Badge {
  id: string;
  recipientId: string;
  issuedAt: string;
  status: BadgeStatus;
  visibility?: 'PUBLIC' | 'PRIVATE';
  claimedAt?: string;
  // Story 11.24 AC-C3: type discriminator for wallet items
  type?: 'badge';
  // Story 9.3: Revocation fields (only present when status = REVOKED)
  revokedAt?: string;
  revocationReason?: string;
  revocationNotes?: string;
  revokedBy?: {
    name: string;
    role: string;
  };
  template: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    // Story 8.2: Skill IDs for filtering
    skillIds?: string[];
  };
  issuer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Story 11.24 AC-C3: Milestone type for wallet timeline
export interface Milestone {
  type: 'milestone';
  milestoneId: string;
  title: string;
  description: string;
  achievedAt: string;
}

export type WalletItem = (Badge & { type: 'badge' }) | Milestone;

export interface DateGroup {
  label: string;
  count: number;
  startIndex: number;
}

export interface WalletResponse {
  data: (Badge | WalletItem)[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  dateGroups: DateGroup[];
}

interface UseWalletParams {
  page?: number;
  limit?: number;
  status?: BadgeStatus;
  sort?: 'issuedAt_desc' | 'issuedAt_asc';
}

export function useWallet(params: UseWalletParams = {}) {
  return useQuery({
    queryKey: ['wallet', params],
    queryFn: async (): Promise<WalletResponse> => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.status) searchParams.set('status', params.status);
      if (params.sort) searchParams.set('sort', params.sort);

      const response = await apiFetch(`/badges/wallet?${searchParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch wallet badges');
      }

      return response.json();
    },
  });
}
