# Code Review Prompt — Story 15.8: Wallet Cursor-Based Infinite Scroll

## Story Reference
- Story: `gcredit-project/docs/sprints/sprint-15/15-8-wallet-infinite-scroll.md`
- Dev Prompt: `gcredit-project/docs/sprints/sprint-15/story-15-8-dev-prompt.md`

## Change Summary
Replace offset pagination + client-side filtering in Badge Wallet with cursor-based infinite scroll. Backend returns `nextCursor` alongside existing meta; frontend uses `useInfiniteQuery` + `IntersectionObserver` to progressively load badges.

## Files Changed (7 files, +736 / -113)

| File | Action | Lines |
|------|--------|-------|
| `backend/src/badge-issuance/dto/wallet-query.dto.ts` | Modified | +21/-4 |
| `backend/src/badge-issuance/badge-issuance.service.ts` | Modified | +50/-3 |
| `frontend/src/hooks/useInfiniteWallet.ts` | **New** | +53 |
| `frontend/src/hooks/useInfiniteScroll.ts` | **New** | +52 |
| `frontend/src/components/TimelineView/TimelineView.tsx` | Modified | +192/-106 |
| `docs/sprints/sprint-15/15-8-wallet-infinite-scroll.md` | Updated | Story → done |
| `docs/sprints/sprint-15/story-15-8-dev-prompt.md` | Added | Dev prompt doc |

## Acceptance Criteria Cross-Check

| AC# | Description | Expected Evidence |
|-----|-------------|-------------------|
| 1 | Wallet API accepts `cursor` + `limit` | `WalletQueryDto` has `cursor?: string`, `limit` default changed 50→20 |
| 2 | Response includes `nextCursor` (null when done) | `nextCursor` added to `WalletResponse`, cursor logic in `getWalletBadges()` |
| 3 | Frontend uses `IntersectionObserver` | `useInfiniteScroll` hook, sentinel `<div ref={sentinelRef}>` in TimelineView |
| 4 | Initial load: first 20 badges | `limit: 20` in `useInfiniteWallet` call |
| 5 | Scroll → spinner → next batch appended | `Loader2` spinner when `isFetchingNextPage`, page flattening via `allItems` |
| 6 | "No more badges" when `nextCursor` is null | `"You've seen all your badges"` when `!hasNextPage && allItems.length > 0` |
| 7 | No layout jumps | `h-px` sentinel, `useInfiniteQuery` keeps previous pages in memory |
| 8 | Filter/search resets cursor | `queryKey: ['wallet-infinite', params]` → params change = auto-refetch, debounced search (300ms) |

## Review Checklist

### 1. Backend — Correctness & Safety

- [ ] **Cursor encoding/decoding** — Cursor format is `${sortDate.toISOString()}_${id}`. Verify:
  - The split on `_` is safe — ISO date strings contain no underscores, but badge IDs (UUIDs) also don't. Confirm no edge case with `_` in IDs.
  - `new Date(cursorDate)` parsing — would a malformed cursor cause 500? Should there be validation/try-catch?
  - Cursor position search: uses exact match on `(itemTime === cursorTime && itemId === cursorId)`. If the cursor item was deleted between requests, `foundIndex = -1` → `startIndex = allItems.length` → returns empty. Is this acceptable?

- [ ] **Backward compatibility** — When no `cursor` provided, offset fallback `startIndex = (page - 1) * limit` is used. Verify other consumers (e.g., EmployeeDashboard) still work with offset path.

- [ ] **Performance** — Still fetches ALL badges from DB and slices in memory. Dev prompt acknowledged this as acceptable (per-user badge count typically <100). Confirm this aligns with production expectations.

- [ ] **`nextCursor` calculation** — `hasMore = startIndex + limit < allItems.length`. Verify this correctly identifies the last page (off-by-one check).

- [ ] **`WalletCursorResponse` vs `WalletResponse`** — Both interfaces exist. `WalletCursorResponse` is defined but the actual return type is still `Promise<WalletResponse>`. Is `WalletCursorResponse` used anywhere, or is it dead code?

- [ ] **DTO validation** — `@IsString()` on `cursor` is present. No `@MaxLength()` — should there be one to prevent abuse?

### 2. Frontend — Architecture & Patterns

- [ ] **`useInfiniteWallet` hook** — Uses `useInfiniteQuery` correctly:
  - `initialPageParam: undefined as string | undefined` — type assertion is a bit unusual. Confirm TanStack accepts this.
  - `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined` — correct (returns undefined to signal no more pages).
  - `queryKey: ['wallet-infinite', params]` — params object in key triggers refetch on any param change. Confirm deep equality works.

- [ ] **`useInfiniteScroll` hook** — IntersectionObserver:
  - `rootMargin: '200px'` — pre-fetch trigger. Reasonable default.
  - `handleIntersect` depends on `[hasNextPage, isFetchingNextPage, fetchNextPage]`. When these change, the effect re-runs and creates a new observer. Confirm no memory leak (cleanup `observer.disconnect()` is present ✓).
  - `sentinelRef` is `useRef<HTMLDivElement>(null)` — confirm the sentinel element always renders (not conditionally hidden when it shouldn't be).

- [ ] **`TimelineView` refactor** — Major changes:
  - Removed `useBadgeSearch` dependency — client-side filtering replaced with server-side params. Verify `useBadgeSearch` isn't imported anywhere else that might break.
  - `FilterChip` type import from `'../search/FilterChips'` — confirm this type exists and matches.
  - `DateRange` type import from `'../search/DateRangePicker'` — confirm this type exists.
  - `removeFilter` callback handles chip removal by ID prefix (`skill-`, `dateFrom`, `dateTo`, etc.). Verify all chip IDs match between creation and removal.

- [ ] **Empty state logic change** — Previously checked `!data || data.data.length === 0`. Now checks `!isLoading && !error && allItems.length === 0 && !hasFilters`. Verify:
  - No flash of empty state during initial load (guarded by `!isLoading` ✓).
  - Empty state with filters active: passes `false` as `hasActiveFilter` to `detectEmptyStateScenario`. Is this correct? If filters are active and result is empty, should we show "no results" or "empty wallet"?

- [ ] **`isSearchLoading` prop** — Changed from `isSearching` (from `useBadgeSearch`) to `isFetchingNextPage`. Semantically different — `isFetchingNextPage` means loading MORE pages, not searching. Should this be `isLoading` instead when a new search is triggered?

- [ ] **`showNoResults` handling** — Where is `showNoResults` defined? Verify it still works correctly with the new filter/search flow.

### 3. Tailwind v4 Compliance

- [ ] `text-brand-600` — Verify this is a valid Tailwind v4 token (oklch format, not `text-blue-600`).
- [ ] `text-neutral-400` — Confirm valid.
- [ ] No `hsl(var(--x))` usage (Lesson 52).

### 4. Accessibility

- [ ] Loader spinner has `sr-only` text: "Loading more badges..." ✓
- [ ] End-of-list message is visible text, not just visual ✓
- [ ] Sentinel `div` has `h-px` (1px height) — invisible to sighted users, no a11y concern ✓

### 5. Test Verification

- [ ] 844/844 tests pass (same count as before — no new tests added)
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] **Follow-up concern:** No new tests for `useInfiniteWallet`, `useInfiniteScroll`, or updated `TimelineView` logic. Should tests be added?

### 6. Potential Issues / Follow-ups

| ID | Severity | Description |
|----|----------|-------------|
| F-01 | LOW | `WalletCursorResponse` interface in DTO may be dead code (method still returns `WalletResponse`) |
| F-02 | LOW | No `@MaxLength()` on cursor string param — consider adding for input validation |
| F-03 | MEDIUM | No try-catch around cursor parsing (`new Date(cursorDate)`, `split('_')`) — malformed cursor could throw |
| F-04 | LOW | `isSearchLoading={isFetchingNextPage}` semantic mismatch — may show wrong loading state for new search vs. load-more |
| F-05 | INFO | No new unit tests for `useInfiniteWallet`, `useInfiniteScroll`, or updated `TimelineView` — consider adding in follow-up |
| F-06 | LOW | Empty state with active filters passes `hasActiveFilter=false` — filtered-no-results vs. empty-wallet distinction may be lost |

## CR Verdict Template

```
### Story 15.8 CR Verdict

**Result:** PASS / CONDITIONAL PASS / FAIL

**AC Coverage:** _/8 verified

**Findings:**
- F-01: ...
- F-02: ...

**Follow-ups (non-blocking):**
- ...

**Evidence:**
- Commit: [hash]
- Tests: 844/844 pass
- TS errors: 0
- Lint errors: 0
```
