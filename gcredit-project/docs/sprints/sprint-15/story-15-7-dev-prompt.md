# Dev Prompt — Story 15.7: Template List Server-Side Pagination

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-7-template-list-pagination.md`

## Objective
Wire the `BadgeTemplateListPage` frontend to use the **existing** server-side pagination in `GET /api/badge-templates/all`. Currently the page calls `getAllTemplates()` which fetches ALL templates then filters/paginates client-side. This story changes it to pass `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder` as query params to the API and render server-provided pagination metadata.

## Critical Discovery: Backend Already Has Pagination

The backend is **already fully implemented** for pagination:
- `QueryBadgeTemplatesDto` has `page`, `limit`, `status`, `category`, `search`, `sortBy`, `sortOrder`
- `BadgeTemplatesService.findAll()` uses Prisma `skip`/`take` + `count` 
- Returns `{ data, meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }` via `createPaginatedResponse()`

**This means Story 15.7 is primarily a FRONTEND task.** No backend changes needed unless testing reveals issues.

## What Needs to Change

### 1. Frontend API Layer: `frontend/src/lib/badgeTemplatesApi.ts`

Current:
```ts
export async function getAllTemplates(): Promise<BadgeTemplate[]> {
  const data = await apiFetchJson<BadgeTemplate[] | BadgeTemplateListResponse>(
    '/badge-templates/all'
  );
  return Array.isArray(data) ? data : data.data || [];
}
```

Change to:
```ts
export interface PaginatedTemplateResponse {
  data: BadgeTemplate[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TemplateQueryParams {
  page?: number;
  limit?: number;
  status?: TemplateStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  category?: string;
}

export async function getTemplatesPaginated(
  params: TemplateQueryParams = {}
): Promise<PaginatedTemplateResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.category) searchParams.set('category', params.category);
  
  const url = `/badge-templates/all?${searchParams.toString()}`;
  return apiFetchJson<PaginatedTemplateResponse>(url);
}
```

**Keep `getAllTemplates()` for backward compat** (other pages may use it). Add new `getTemplatesPaginated()`.

### 2. Frontend Page: `frontend/src/pages/admin/BadgeTemplateListPage.tsx`

This is the main change. Current architecture:
- Fetches ALL templates via `useQuery(['badge-templates-all'], getAllTemplates)`
- Client-side `useMemo` for filtering by `statusFilter` and `searchTerm`
- Client-side sort for ISSUER (own first)
- No pagination controls

New architecture:
- URL query params synced via `useSearchParams`: `?page=1&pageSize=10&status=ACTIVE&search=foo`
- `useQuery` with params: `['badge-templates', { page, limit, status, search }]`
- Calls `getTemplatesPaginated({ page, limit, status, search })`
- Pagination controls below the grid
- Page size selector (10/20/50)
- Reset to page 1 on filter/search change

#### Key Changes:

```tsx
import { useSearchParams } from 'react-router-dom';
import { getTemplatesPaginated, type PaginatedTemplateResponse } from '@/lib/badgeTemplatesApi';

// Inside component:
const [searchParams, setSearchParams] = useSearchParams();

// Read URL state
const page = Number(searchParams.get('page')) || 1;
const pageSize = Number(searchParams.get('pageSize')) || 10;
const statusFilter = (searchParams.get('status') as StatusFilter) || 'ALL';
const searchTerm = searchParams.get('search') || '';

// Update URL helper
const updateParams = (updates: Record<string, string | undefined>) => {
  const newParams = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
  });
  setSearchParams(newParams, { replace: true });
};

// Query with server params
const { data: response, isLoading, isError, error } = useQuery({
  queryKey: ['badge-templates', { page, pageSize, statusFilter, searchTerm }],
  queryFn: () => getTemplatesPaginated({
    page,
    limit: pageSize,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: searchTerm || undefined,
  }),
});

const templates = response?.data ?? [];
const meta = response?.meta;
```

#### Remove client-side filtering
- Remove `useMemo` that filters by `statusFilter` and `searchTerm` — server does this now
- Keep ISSUER "own first" sort client-side (OR add it to backend later)

#### Pagination Controls
Use shadcn `Pagination` component or build simple one:

```tsx
{/* Pagination */}
{meta && meta.totalPages > 1 && (
  <div className="flex items-center justify-between">
    <p className="text-sm text-neutral-500">
      Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
    </p>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!meta.hasPreviousPage}
        onClick={() => updateParams({ page: String(page - 1) })}
      >
        <ChevronLeft size={16} /> Previous
      </Button>
      {/* Page numbers */}
      {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
        .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === meta.totalPages)
        .map((p, idx, arr) => (
          <>
            {idx > 0 && arr[idx - 1] !== p - 1 && <span>...</span>}
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateParams({ page: String(p) })}
            >
              {p}
            </Button>
          </>
        ))}
      <Button
        variant="outline"
        size="sm"
        disabled={!meta.hasNextPage}
        onClick={() => updateParams({ page: String(page + 1) })}
      >
        Next <ChevronRight size={16} />
      </Button>
    </div>
  </div>
)}
```

#### Page Size Selector
```tsx
<Select
  value={String(pageSize)}
  onValueChange={(v) => updateParams({ pageSize: v, page: '1' })}
>
  <SelectTrigger className="w-[100px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="10">10 / page</SelectItem>
    <SelectItem value="20">20 / page</SelectItem>
    <SelectItem value="50">50 / page</SelectItem>
  </SelectContent>
</Select>
```

#### Reset to Page 1 on Filter Change
When `statusFilter` or `searchTerm` changes, always reset `page` to 1:
```tsx
// Status change handler
const handleStatusChange = (newStatus: StatusFilter) => {
  updateParams({
    status: newStatus === 'ALL' ? undefined : newStatus,
    page: '1',
  });
};

// Search change handler (with debounce)
const handleSearchChange = useDebouncedCallback((value: string) => {
  updateParams({
    search: value || undefined,
    page: '1',
  });
}, 300);
```

**Debounce note:** Use `useDebouncedCallback` from `use-debounce` package or implement a simple debounce. Check if already in project dependencies. If not, a simple `useEffect` + `setTimeout` debounce pattern works:

```tsx
const [localSearch, setLocalSearch] = useState(searchTerm);

useEffect(() => {
  const timer = setTimeout(() => {
    if (localSearch !== searchTerm) {
      updateParams({ search: localSearch || undefined, page: '1' });
    }
  }, 300);
  return () => clearTimeout(timer);
}, [localSearch]);
```

### 3. Status Tab Counts

Current code shows per-status counts from client-side array:
```tsx
({templates.filter((t) => t.status === tab.value).length})
```

With server-side pagination, the full list isn't available. Options:
- **Option A (Recommended):** Remove per-status counts from tabs (simplest)
- **Option B:** Make a separate lightweight API call to get counts per status
- **Option C:** Return counts in the paginated response metadata

Go with **Option A** for this story. The counts add minimal value and complicate server-side pagination.

### 4. Loading State During Page Transition

Use `isFetching` (not `isLoading`) for subsequent page loads to show a subtle loading overlay:

```tsx
const { data: response, isLoading, isFetching, isError, error } = useQuery({...});

// First load: full skeleton
// Page transition: subtle overlay
{isFetching && !isLoading && (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
  </div>
)}
```

### 5. Query Key Stability

Ensure the `queryKey` includes all params that affect the response:
```tsx
queryKey: ['badge-templates', { page, pageSize, status: statusFilter, search: searchTerm }],
```

Use `keepPreviousData: true` in the query options to prevent layout flash during page transitions:
```tsx
placeholderData: keepPreviousData, // from @tanstack/react-query
```

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/lib/badgeTemplatesApi.ts` | Add `getTemplatesPaginated()` function + types |
| `frontend/src/pages/admin/BadgeTemplateListPage.tsx` | Major refactor: URL params, server query, pagination controls |

## Files NOT to Change
- Backend is already complete — no changes needed
- Other consumers of `getAllTemplates()` should keep working (backward compat)

## Tailwind v4 Reminder (Lesson 52)
- CSS variables: `var(--color-x)` directly, NOT `hsl(var(--x))`
- Colors use oklch format

## Lucide Icons to Import
- `ChevronLeft`, `ChevronRight` — for pagination arrows
- `Loader2` — already imported, for page transition loading

## shadcn/ui Components Needed
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` — for page size selector
- Already exist in the project: check `frontend/src/components/ui/select.tsx`

## Testing Checklist
1. `npx tsc --noEmit` — zero TS errors
2. `npx eslint . --max-warnings=0` — zero lint errors
3. `npm test` — all tests pass
4. Manual verification:
   - Page loads with default page=1, pageSize=10
   - Click page 2 → URL updates, new data loads
   - Change page size → resets to page 1
   - Status filter → resets to page 1, correct filtered results
   - Search → debounced, resets to page 1
   - Back/forward browser navigation works (URL params)
   - Direct URL visit with params works (deep link)
   - Empty state on filtered page with no results
   - Loading overlay on page transition

## Commit Message Template
```
feat(ui): template list server-side pagination (Story 15.7)

- Add getTemplatesPaginated() API with query params
- Refactor BadgeTemplateListPage to use server-side pagination
- URL query params for page/pageSize/status/search (deep-linkable)
- Pagination controls: prev/next, page numbers, page size selector
- Debounced search with page reset
- Loading overlay during page transitions
- keepPreviousData for smooth transitions

Ref: ADR-016 DEC-016-03
0 lint errors | 0 TS errors | N/N tests pass
```
