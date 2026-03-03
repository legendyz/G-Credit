# Dev Prompt — Story 15.8: Wallet Cursor-Based Infinite Scroll

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-8-wallet-infinite-scroll.md`

## Objective
Replace the current "fetch all + client-side paginate" approach in the Badge Wallet with **cursor-based infinite scroll**. Users scroll down to progressively load more badges — no page controls, no full page reload.

## Current Architecture Analysis

### Backend (`badge-issuance.service.ts` → `getWalletBadges()`)
- Currently uses **offset pagination** (`page`/`limit` via `WalletQueryDto`)
- Fetches ALL badges from DB (no Prisma `skip`/`take` on the query itself — only slices in memory via `allItems.slice(skip, skip + limit)`)
- Merges badges + milestones, sorts, then paginates client-side
- Returns `{ data, meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage }, dateGroups }`

### Frontend (`useWallet.ts` → `TimelineView.tsx`)
- `useWallet({})` fetches with `useQuery` — currently fetches page 1 with limit 50 (the default)
- `TimelineView` renders all returned data at once
- `BadgeSearchBar` does **client-side** filtering via `useBadgeSearch` hook
- No infinite scroll, no IntersectionObserver

## What Needs to Change

### Part 1: Backend — Add Cursor Support to Wallet Endpoint

**File:** `backend/src/badge-issuance/dto/wallet-query.dto.ts`

Add `cursor` param alongside existing params:
```ts
@ApiPropertyOptional({ description: 'Cursor for pagination (last item ID from previous page)' })
@IsOptional()
@IsString()
cursor?: string;
```

Change default `limit` from 50 to 20 to match AC#4.

**File:** `backend/src/badge-issuance/badge-issuance.service.ts` → `getWalletBadges()`

The current implementation already fetches ALL badges and slices in memory. For cursor-based infinite scroll, the approach should be:

**Strategy:** Since badges and milestones are merged and sorted together, true Prisma cursor pagination is complex. **Practical approach:**
1. Keep the current "fetch all + merge + sort" approach (badge counts are per-user, typically < 100)
2. Implement cursor as the **index position** in the merged array (or the last item's `sortDate` + `id` combo)
3. Return `nextCursor` instead of `page`/`totalPages`

**Simplified approach — encode cursor as `lastSortDate_lastId`:**

```ts
async getWalletBadges(userId: string, query: WalletQueryDto): Promise<WalletCursorResponse> {
  const { limit = 20, status, sort = 'issuedAt_desc', cursor } = query;
  
  // ... existing where/filter logic unchanged ...
  // ... existing badge + milestone fetch + merge + sort unchanged ...
  
  // Find cursor position
  let startIndex = 0;
  if (cursor) {
    const [cursorDate, cursorId] = cursor.split('_');
    const cursorTime = new Date(cursorDate).getTime();
    startIndex = allItems.findIndex((item, idx) => {
      const itemTime = item.sortDate.getTime();
      const itemId = (item.data as any).id || (item.data as any).milestoneId;
      if (sort === 'issuedAt_desc') {
        return itemTime < cursorTime || (itemTime === cursorTime && itemId === cursorId);
      }
      return itemTime > cursorTime || (itemTime === cursorTime && itemId === cursorId);
    });
    if (startIndex === -1) startIndex = allItems.length;
  }
  
  const paginatedItems = allItems.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < allItems.length;
  
  // Build nextCursor from last item
  let nextCursor: string | null = null;
  if (hasMore && paginatedItems.length > 0) {
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const lastId = (lastItem.data as any).id || (lastItem.data as any).milestoneId;
    nextCursor = `${lastItem.sortDate.toISOString()}_${lastId}`;
  }
  
  // ... dateGroups generation unchanged ...
  
  return {
    data: timelineItems,
    nextCursor,
    total: allItems.length,
    dateGroups,
  };
}
```

**New response type:**
```ts
export interface WalletCursorResponse {
  data: any[];
  nextCursor: string | null;
  total: number;
  dateGroups: DateGroup[];
}
```

**IMPORTANT:** Keep backward compat — if `cursor` param is not provided AND `page` param IS provided, fall back to the existing offset pagination. This ensures other consumers (if any) aren't broken.

### Part 2: Frontend — `useWallet.ts` → `useInfiniteWallet.ts`

**New file:** `frontend/src/hooks/useInfiniteWallet.ts`

Use `useInfiniteQuery` from `@tanstack/react-query`:

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';
import type { Badge, Milestone, WalletItem, DateGroup } from './useWallet';

interface WalletCursorResponse {
  data: (Badge | WalletItem)[];
  nextCursor: string | null;
  total: number;
  dateGroups: DateGroup[];
}

interface UseInfiniteWalletParams {
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
      
      const response = await apiFetch(`/badges/wallet?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch wallet badges');
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

**Keep `useWallet.ts` unchanged** — other components (EmployeeDashboard, etc.) may still use it.

### Part 3: Frontend — `useInfiniteScroll.ts` Hook

**New file:** `frontend/src/hooks/useInfiniteScroll.ts`

```ts
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, rootMargin]);

  return sentinelRef;
}
```

### Part 4: Frontend — `TimelineView.tsx` Integration

This is the biggest change. Key modifications:

#### 4a. Replace `useWallet` with `useInfiniteWallet`

```tsx
import { useInfiniteWallet } from '../../hooks/useInfiniteWallet';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

// Inside component:
const {
  data: infiniteData,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
} = useInfiniteWallet({
  limit: 20,
  status: statusFilter || undefined,
  search: searchTerm || undefined,
  // Pass other filters as server params
});

// Flatten all pages into single array
const allItems = useMemo(() => {
  return infiniteData?.pages.flatMap((page) => page.data) ?? [];
}, [infiniteData]);

// Total from first page
const total = infiniteData?.pages[0]?.total ?? 0;
```

#### 4b. Move Filtering to Server-Side

Currently `TimelineView` does **client-side** filtering via `useBadgeSearch`. With infinite scroll, the filter params should be sent to the server:

- `status` → pass to `useInfiniteWallet({ status })`  
- `search` → pass to `useInfiniteWallet({ search })` (with debounce)
- `skills` → pass to `useInfiniteWallet({ skills })`
- `dateRange` → pass to `useInfiniteWallet({ fromDate, toDate })`

**When any filter changes:** the `queryKey` changes → react-query auto-refetches from cursor=null → fresh results.

**Remove `useBadgeSearch` hook usage** from `TimelineView` and pass filter params directly to the API.

**Keep `BadgeSearchBar`** — it still manages the search/filter UI state, but instead of feeding into `useBadgeSearch` for client-side filtering, its values feed directly into `useInfiniteWallet` params.

#### 4c. Add Sentinel + Loading Indicator

At bottom of timeline/grid:
```tsx
// Infinite scroll sentinel
const sentinelRef = useInfiniteScroll({
  hasNextPage: !!hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
});

// Inside JSX, after badge list:
{/* Infinite scroll sentinel */}
<div ref={sentinelRef} className="h-px" />

{/* Loading more indicator */}
{isFetchingNextPage && (
  <div className="flex justify-center py-6">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    <span className="sr-only">Loading more badges...</span>
  </div>
)}

{/* End of list indicator */}
{!hasNextPage && allItems.length > 0 && (
  <div className="text-center py-6 text-neutral-400 text-sm">
    You've seen all your badges
  </div>
)}
```

#### 4d. Date Groups Across Pages

Current date groups are computed per-page on the backend. With infinite scroll, you need to merge date groups across pages or recompute client-side:

**Recommended:** Compute date groups client-side from `allItems` (already being done in `TimelineView` via `useMemo`). The server `dateGroups` can be ignored for infinite scroll mode.

#### 4e. Smooth Scroll (AC#7 — No Layout Jumps)

- Use `min-height` on the list container to prevent scroll position jumping
- React-query's `useInfiniteQuery` keeps previous pages in memory — existing items don't re-render

### Part 5: Search/Filter State Management

Current flow:
```
BadgeSearchBar → useBadgeSearch (client-side filter) → filteredBadges → displayBadges
```

New flow:
```
BadgeSearchBar → local state → debounced → useInfiniteWallet params → server response
```

Implement debounce for search term:
```tsx
const [localSearch, setLocalSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(localSearch), 300);
  return () => clearTimeout(timer);
}, [localSearch]);

// Then pass debouncedSearch to useInfiniteWallet
```

For `statusFilter`, `selectedSkills`, `dateRange` — no debounce needed, change immediately resets infinite query.

### Part 6: Filter Chips Adaptation

The current `useBadgeSearch` generates `filterChips` for the search bar. Since we're removing `useBadgeSearch`, we need to generate chips directly:

```tsx
const filterChips = useMemo(() => {
  const chips: Array<{ key: string; label: string }> = [];
  if (debouncedSearch) chips.push({ key: 'search', label: `"${debouncedSearch}"` });
  if (statusFilter) chips.push({ key: 'status', label: statusFilter });
  selectedSkills.forEach((id) => {
    chips.push({ key: `skill-${id}`, label: skillNames[id] || id });
  });
  if (dateRange.from) chips.push({ key: 'dateFrom', label: `From ${dateRange.from}` });
  if (dateRange.to) chips.push({ key: 'dateTo', label: `To ${dateRange.to}` });
  return chips;
}, [debouncedSearch, statusFilter, selectedSkills, dateRange, skillNames]);
```

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/src/badge-issuance/dto/wallet-query.dto.ts` | Modify | Add `cursor?: string`, change default `limit` to 20 |
| `backend/src/badge-issuance/badge-issuance.service.ts` | Modify | Add cursor logic to `getWalletBadges()`, return `nextCursor` |
| `frontend/src/hooks/useInfiniteWallet.ts` | **New** | `useInfiniteQuery` wrapper for wallet cursor API |
| `frontend/src/hooks/useInfiniteScroll.ts` | **New** | IntersectionObserver hook |
| `frontend/src/components/TimelineView/TimelineView.tsx` | Modify | Major: use `useInfiniteWallet`, add sentinel, remove client-side filtering |

## Files NOT to Change
- `useWallet.ts` — keep for backward compat (EmployeeDashboard uses it)
- `useBadgeSearch.ts` — can keep in codebase, just not used by TimelineView anymore
- `BadgeSearchBar.tsx` — keep, interface unchanged (it receives props, doesn't manage data)
- `BadgeTimelineCard.tsx` — no change needed
- `MilestoneTimelineCard.tsx` — no change needed

## Tailwind v4 Reminder (Lesson 52)
- CSS variables: `var(--color-x)` directly, NOT `hsl(var(--x))`
- Colors use oklch format

## Testing Checklist
1. `npx tsc --noEmit` — zero TS errors
2. `npx eslint . --max-warnings=0` — zero lint errors
3. `npm test` — all tests pass (currently 844)
4. Manual:
   - Load wallet → first 20 badges appear
   - Scroll to bottom → spinner → next 20 appended
   - Continue → "You've seen all your badges" when done
   - Apply status filter → list resets, loads fresh
   - Type search → 300ms debounce → list resets with filtered results
   - No layout jumps during loading
   - EmployeeDashboard still works (uses `useWallet`, not affected)

## Backend Test Ideas
```ts
describe('getWalletBadges cursor pagination', () => {
  it('returns first page with nextCursor when more items exist');
  it('returns nextCursor=null on last page');
  it('cursor skips to correct position');
  it('falls back to offset pagination when page param used without cursor');
});
```

## Commit Message Template
```
feat: wallet cursor-based infinite scroll (Story 15.8)

Backend:
- Add cursor param to WalletQueryDto, default limit 20
- Implement cursor-based pagination in getWalletBadges()
- Return { data, nextCursor, total, dateGroups } response

Frontend:
- New useInfiniteWallet hook (useInfiniteQuery)
- New useInfiniteScroll hook (IntersectionObserver)
- Refactor TimelineView: infinite scroll, server-side filtering
- Loading spinner at bottom, "all badges seen" end indicator
- Debounced search (300ms), filter reset on change

Ref: ADR-016 DEC-016-03
0 lint errors | 0 TS errors | N/N tests pass
```
