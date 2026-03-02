# Story 15.8: Wallet Cursor-Based Infinite Scroll (P2-2)

**Status:** done  
**Priority:** MEDIUM  
**Estimate:** 3h  
**Wave:** 3 — UI Polish  
**Source:** P2-2 (Post-MVP UI Audit), ADR-016 DEC-016-03  
**Dependencies:** None

---

## Story

**As an** employee browsing my badge wallet,  
**I want** the timeline to load more badges as I scroll down,  
**So that** I get a fluid browsing experience without page breaks.

## Acceptance Criteria

1. [x] Wallet API (`GET /api/badges/wallet` or similar) accepts `cursor` and `limit` params
2. [x] Response includes `nextCursor` field (null when no more items)
3. [x] Frontend timeline uses `IntersectionObserver` to trigger next page load
4. [x] Initial load: first 20 badges (configurable)
5. [x] Scroll to bottom → loading indicator → next batch appended
6. [x] "No more badges" indicator when `nextCursor` is null
7. [x] Smooth scroll experience (no layout jumps when new items append)
8. [x] Works correctly with existing filter/search (resets cursor on filter change)

## Tasks / Subtasks

- [x] **Task 1: Backend cursor pagination** (AC: #1, #2)
  - [x] Add `cursor` (optional string) and `limit` (default: 20) params to wallet endpoint
  - [x] Implement cursor-based pagination (sortDate_id cursor in merged allItems)
  - [x] Return `{ data, nextCursor }` response shape
  - [x] Cursor = last item's sortDate ISO + ID combo
- [x] **Task 2: Frontend IntersectionObserver** (AC: #3, #5)
  - [x] Create `useInfiniteScroll` custom hook
  - [x] Place sentinel element at bottom of list
  - [x] IntersectionObserver triggers `fetchNextPage()` when sentinel visible
  - [x] 200px rootMargin for pre-fetching
- [x] **Task 3: Badge list integration** (AC: #4, #5, #6)
  - [x] Integrate infinite scroll with `TimelineView` component
  - [x] Append new items via `useInfiniteQuery` page flattening
  - [x] Loading spinner (Loader2) at bottom during fetch
  - [x] "You've seen all your badges" message when nextCursor is null
- [x] **Task 4: Filter/search reset** (AC: #8)
  - [x] When filter or search changes, queryKey changes → auto-refetch from cursor=null
  - [x] Debounced search (300ms) to avoid rapid-fire requests
- [x] **Task 5: Tests** (AC: #1, #2)
  - [x] Backend: 6/6 wallet tests pass (cursor + offset paths)
  - [x] Frontend: 844/844 tests pass
  - [x] 0 TS errors, 0 lint errors

## Dev Notes

### Architecture Patterns Used
- ADR-016 DEC-016-03: Cursor pagination for wallet
- Prisma cursor-based pagination
- IntersectionObserver API
- Custom `useInfiniteScroll` hook pattern

### Source Tree Components
- `backend/src/badges/badges.service.ts` (modified — cursor pagination)
- `backend/src/badges/badges.controller.ts` (modified — query params)
- `frontend/src/hooks/useInfiniteScroll.ts` (new)
- `frontend/src/pages/WalletPage.tsx` or `TimelineView.tsx` (modified)

### References
- ADR-016 DEC-016-03: Pagination strategy decision
- IntersectionObserver API: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Backend: Added `cursor` param to `WalletQueryDto`, changed default limit 50→20, added cursor-based pagination logic in `getWalletBadges()` (find position after `sortDate_id` cursor in merged allItems, slice from there), returns `nextCursor` alongside existing `meta` for backward compat
- Frontend: New `useInfiniteWallet` hook (`useInfiniteQuery`), new `useInfiniteScroll` hook (IntersectionObserver with 200px rootMargin), major refactor of `TimelineView.tsx` — replaced client-side `useBadgeSearch` with server-side filtering via `useInfiniteWallet` params, added debounced search (300ms), filter chips generated directly, sentinel + Loader2 spinner + "all badges seen" end indicator
- All existing tests pass (844 frontend, 6 wallet backend), 0 TS errors, 0 lint errors

### File List
- `backend/src/badge-issuance/dto/wallet-query.dto.ts` — Modified (cursor param, limit default, nextCursor in WalletResponse)
- `backend/src/badge-issuance/badge-issuance.service.ts` — Modified (cursor pagination logic in getWalletBadges)
- `frontend/src/hooks/useInfiniteWallet.ts` — New (useInfiniteQuery wrapper)
- `frontend/src/hooks/useInfiniteScroll.ts` — New (IntersectionObserver hook)
- `frontend/src/components/TimelineView/TimelineView.tsx` — Modified (infinite scroll, server-side filtering)
- `docs/sprints/sprint-15/15-8-wallet-infinite-scroll.md` — Updated (status → done)
