import { useQuery } from '@tanstack/react-query';
import { BadgeStatus } from '../types/badge';
import { API_BASE_URL } from '../lib/apiConfig';

export interface Badge {
  id: string;
  recipientId: string;
  issuedAt: string;
  status: BadgeStatus;
  claimedAt?: string;
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
    description: string;
    imageUrl: string;
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

export interface DateGroup {
  label: string;
  count: number;
  startIndex: number;
}

export interface WalletResponse {
  badges: Badge[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

      const response = await fetch(`${API_BASE_URL}/badges/wallet?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet badges');
      }

      return response.json();
    },
  });
}
