/**
 * useInfiniteWallet — Cursor-based infinite scroll for badge wallet
 * Story 15.8: Wallet cursor-based infinite scroll
 *
 * Uses `useInfiniteQuery` to progressively load wallet pages.
 * Keep `useWallet.ts` for backward compat (EmployeeDashboard uses it).
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';
import type { Badge, WalletItem, DateGroup } from './useWallet';

export interface WalletCursorResponse {
  data: (Badge | WalletItem)[];
  nextCursor: string | null;
  total: number;
  dateGroups: DateGroup[];
}

export interface UseInfiniteWalletParams {
  limit?: number;
  status?: string;
  sort?: 'issuedAt_desc' | 'issuedAt_asc';
  search?: string;
  skills?: string[];
  fromDate?: string;
  toDate?: string;
}

export function useInfiniteWallet(params: UseInfiniteWalletParams = {}) {
  return useInfiniteQuery({
    queryKey: ['wallet-infinite', params],
    queryFn: async ({ pageParam }): Promise<WalletCursorResponse> => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.status) searchParams.set('status', params.status);
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.search) searchParams.set('search', params.search);
      if (params.skills?.length) searchParams.set('skills', params.skills.join(','));
      if (params.fromDate) searchParams.set('fromDate', params.fromDate);
      if (params.toDate) searchParams.set('toDate', params.toDate);
      if (pageParam) searchParams.set('cursor', pageParam);

      const qs = searchParams.toString();
      const url = qs ? `/badges/wallet?${qs}` : '/badges/wallet';
      const response = await apiFetch(url);
      if (!response.ok) throw new Error('Failed to fetch wallet badges');
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
