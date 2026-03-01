# Story 15.8: Wallet Cursor-Based Infinite Scroll (P2-2)

**Status:** backlog  
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

1. [ ] Wallet API (`GET /api/badges/wallet` or similar) accepts `cursor` and `limit` params
2. [ ] Response includes `nextCursor` field (null when no more items)
3. [ ] Frontend timeline uses `IntersectionObserver` to trigger next page load
4. [ ] Initial load: first 20 badges (configurable)
5. [ ] Scroll to bottom → loading indicator → next batch appended
6. [ ] "No more badges" indicator when `nextCursor` is null
7. [ ] Smooth scroll experience (no layout jumps when new items append)
8. [ ] Works correctly with existing filter/search (resets cursor on filter change)

## Tasks / Subtasks

- [ ] **Task 1: Backend cursor pagination** (AC: #1, #2)
  - [ ] Add `cursor` (optional string) and `limit` (default: 20) params to wallet endpoint
  - [ ] Implement Prisma cursor-based pagination (`cursor`, `take`, `skip: 1`)
  - [ ] Return `{ data, nextCursor }` response shape
  - [ ] Cursor = last item's ID (or createdAt for chronological ordering)
- [ ] **Task 2: Frontend IntersectionObserver** (AC: #3, #5)
  - [ ] Create `useInfiniteScroll` custom hook
  - [ ] Place sentinel element at bottom of list
  - [ ] IntersectionObserver triggers `loadMore()` when sentinel visible
  - [ ] Debounce to prevent rapid-fire requests
- [ ] **Task 3: Badge list integration** (AC: #4, #5, #6)
  - [ ] Integrate infinite scroll with `TimelineView` component
  - [ ] Append new items to existing list (no re-render of existing items)
  - [ ] Loading spinner at bottom during fetch
  - [ ] "You've seen all your badges" message when nextCursor is null
- [ ] **Task 4: Filter/search reset** (AC: #8)
  - [ ] When filter or search changes, reset cursor to null
  - [ ] Clear existing list and load fresh with new filter
- [ ] **Task 5: Tests** (AC: #1, #2)
  - [ ] Backend: test cursor pagination ordering
  - [ ] Backend: test nextCursor null on last page
  - [ ] Frontend: test IntersectionObserver triggers load

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
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
