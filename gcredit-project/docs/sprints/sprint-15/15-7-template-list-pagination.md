# Story 15.7: Template List Server-Side Pagination (P2-1)

**Status:** backlog  
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

1. [ ] `GET /api/badge-templates` accepts `page` and `pageSize` query parameters
2. [ ] Response includes pagination metadata: `{ data, total, page, pageSize, totalPages }`
3. [ ] Frontend template list (`BadgeTemplateListPage`) shows page controls (previous/next, page numbers)
4. [ ] Default page size: 10 items (configurable via UI dropdown: 10, 20, 50)
5. [ ] URL query params reflect current page state (deep-linkable)
6. [ ] Loading state shown during page transitions
7. [ ] Empty state when no templates on current page
8. [ ] Existing search/filter functionality works with pagination (resets to page 1 on filter change)

## Tasks / Subtasks

- [ ] **Task 1: Backend pagination** (AC: #1, #2)
  - [ ] Add `page` (default: 1) and `pageSize` (default: 10) to existing `PaginationDto`
  - [ ] Update `BadgeTemplatesService.findAll()` with Prisma `skip`/`take`
  - [ ] Return `{ data, total, page, pageSize, totalPages }` response shape
  - [ ] Swagger documentation for pagination params
- [ ] **Task 2: Frontend pagination controls** (AC: #3, #4)
  - [ ] Add pagination component below template list table
  - [ ] Previous/Next buttons + page number indicators
  - [ ] Page size selector dropdown (10/20/50)
  - [ ] Use shadcn/ui Pagination or custom component
- [ ] **Task 3: URL state sync** (AC: #5)
  - [ ] Sync `page` and `pageSize` to URL query params
  - [ ] On page load, read from URL params (deep-link support)
- [ ] **Task 4: UX polish** (AC: #6, #7, #8)
  - [ ] Loading skeleton during page fetch
  - [ ] Empty state component for "No templates" case
  - [ ] Reset to page 1 when search/filter changes
- [ ] **Task 5: Tests** (AC: #1, #2)
  - [ ] Backend: test paginated response shape
  - [ ] Backend: test page boundary (last page with fewer items)
  - [ ] Frontend: test pagination control interactions

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

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
