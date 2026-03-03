# Story 15.7: Template List Server-Side Pagination (P2-1)

**Status:** done  
**Priority:** MEDIUM  
**Estimate:** 3h  
**Wave:** 3 — UI Polish  
**Source:** P2-1 (Post-MVP UI Audit), ADR-016 DEC-016-03  
**Dependencies:** None

---

## Story

**As an** ISSUER or ADMIN managing badge templates,  
**I want** the template list to use server-side pagination with page controls,  
**So that** the page loads quickly even with many templates and I can navigate through them efficiently.

## Acceptance Criteria

1. [x] `GET /api/badge-templates` accepts `page` and `pageSize` query parameters
2. [x] Response includes pagination metadata: `{ data, total, page, pageSize, totalPages }`
3. [x] Frontend template list (`BadgeTemplateListPage`) shows page controls (previous/next, page numbers)
4. [x] Default page size: 10 items (configurable via UI dropdown: 10, 20, 50)
5. [x] URL query params reflect current page state (deep-linkable)
6. [x] Loading state shown during page transitions
7. [x] Empty state when no templates on current page
8. [x] Existing search/filter functionality works with pagination (resets to page 1 on filter change)

## Tasks / Subtasks

- [x] **Task 1: Backend pagination** (AC: #1, #2)
  - [x] Add `page` (default: 1) and `pageSize` (default: 10) to existing `PaginationDto`
  - [x] Update `BadgeTemplatesService.findAll()` with Prisma `skip`/`take`
  - [x] Return `{ data, total, page, pageSize, totalPages }` response shape
  - [x] Swagger documentation for pagination params
- [x] **Task 2: Frontend pagination controls** (AC: #3, #4)
  - [x] Add pagination component below template list table
  - [x] Previous/Next buttons + page number indicators
  - [x] Page size selector dropdown (10/20/50)
  - [x] Use shadcn/ui Pagination or custom component
- [x] **Task 3: URL state sync** (AC: #5)
  - [x] Sync `page` and `pageSize` to URL query params
  - [x] On page load, read from URL params (deep-link support)
- [x] **Task 4: UX polish** (AC: #6, #7, #8)
  - [x] Loading skeleton during page fetch
  - [x] Empty state component for "No templates" case
  - [x] Reset to page 1 when search/filter changes
- [x] **Task 5: Tests** (AC: #1, #2)
  - [x] Backend: test paginated response shape
  - [x] Backend: test page boundary (last page with fewer items)
  - [x] Frontend: test pagination control interactions

## Dev Notes

### Architecture Patterns Used
- ADR-016 DEC-016-03: Server-side pagination for template list
- Existing `PaginationDto` infrastructure from Sprint 8
- Prisma `findMany` with `skip`/`take` + `count`
- URL query param sync via `useSearchParams`

### Source Tree Components
- `backend/src/badge-templates/badge-templates.service.ts` (modified)
- `backend/src/badge-templates/badge-templates.controller.ts` (modified)
- `backend/src/badge-templates/dto/pagination.dto.ts` (modified or new)
- `frontend/src/pages/BadgeTemplateListPage.tsx` (modified)
- `frontend/src/components/ui/Pagination.tsx` (new or shadcn/ui)

### References
- ADR-016 DEC-016-03: Pagination strategy decision
- Sprint 8: PaginationDto infrastructure

## Dev Agent Record

## Review Follow-ups (AI)

- [x] **Scope validation:** commit `1ea8734` reviewed against `story-15-7-dev-prompt.md`.
- [x] **API layer migration verified:** `getTemplatesPaginated()` + `TemplateQueryParams` + paginated `meta` response added in `badgeTemplatesApi.ts`; `getAllTemplates()` retained for backward compatibility.
- [x] **Page wiring verified:** `BadgeTemplateListPage` uses `useSearchParams` (`page`, `pageSize`, `status`, `search`) and server query via `getTemplatesPaginated({ page, limit, status, search })`.
- [x] **Pagination UX verified:** previous/next, page-number buttons with ellipsis, page-size selector (`10/20/50`), and results-count text are implemented and rendered from server `meta`.
- [x] **Reset behavior verified:** status change, debounced search, and page-size change all reset page to `1`.
- [x] **Transition/loading behavior verified:** `isFetching && !isLoading` overlay + previous-data placeholder behavior are present.
- [x] **Status-tab counts removed:** tabs no longer render client-side total counts (aligned with server-side pagination model).
- [x] **Quality gates (review-side) passed:**
  - `BadgeTemplateListPage.test.tsx`: `27/27` passing.
  - ESLint (changed files): exit `0`.
  - TypeScript (`tsconfig.app.json`): exit `0`.

### Re-CR Summary (2026-03-02)

- Review scope: Story 15.7 implementation commit `1ea8734`.
- Verdict: **APPROVED**.
- Notes: Implementation matches dev prompt intent (frontend integration with existing backend pagination), no blocking issues found.

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
Backend already fully implemented (Prisma skip/take + count, QueryBadgeTemplatesDto, createPaginatedResponse). This was a frontend-only task:
- Added `getTemplatesPaginated()` + types to `badgeTemplatesApi.ts`
- Refactored `BadgeTemplateListPage.tsx`: URL state sync via `useSearchParams`, server-side query with `useQuery`, pagination controls (prev/next, page numbers with ellipsis, page size selector)
- Debounced search (300ms) with page reset on filter/search change
- Loading overlay during page transitions via `isFetching`, `placeholderData` for smooth transitions
- Removed client-side filtering/status counts (server handles filtering)
- Kept ISSUER "own first" sort client-side within page
- 27 tests pass (5 new pagination tests)
- 0 TS errors | 0 lint errors | 844/844 tests pass

### File List
- `frontend/src/lib/badgeTemplatesApi.ts` — Added `PaginatedTemplateResponse`, `TemplateQueryParams`, `getTemplatesPaginated()`
- `frontend/src/pages/admin/BadgeTemplateListPage.tsx` — Major refactor: URL params, server pagination, pagination controls, page size selector
- `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx` — Updated all mocks to use `getTemplatesPaginated`, added 5 pagination tests
- `docs/sprints/sprint-15/15-7-template-list-pagination.md` — This file, marked done
