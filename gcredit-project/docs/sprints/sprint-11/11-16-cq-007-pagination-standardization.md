# Story 11.16: CQ-007 — Pagination Response Standardization

**Status:** backlog  
**Priority:** 🟡 HIGH  
**Estimate:** 3-4h  
**Source:** Code Quality Audit  

## Story

As a developer,  
I want all paginated endpoints to return a consistent `PaginatedResponse<T>` format,  
So that the frontend and API consumers have a predictable pagination contract.

## Acceptance Criteria

1. [ ] `PaginatedResponse<T>` generic interface defined in `common/dto/`
2. [ ] All 6 paginated controllers use standardized response format
3. [ ] Query params standardized: `page`, `limit` (with defaults: page=1, limit=10)
4. [ ] Response includes: `data`, `total`, `page`, `limit`, `totalPages`
5. [ ] Frontend services updated to consume new format
6. [ ] Swagger documentation reflects standard pagination
7. [ ] All existing tests pass (updated to new format)

## Tasks / Subtasks

- [ ] **Task 1: Create PaginatedResponse DTO** (AC: #1, #4)
  ```typescript
  // backend/src/common/dto/paginated-response.dto.ts
  export class PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  ```
  - [ ] Add Swagger decorators

- [ ] **Task 2: Create PaginationQuery DTO** (AC: #3)
  ```typescript
  export class PaginationQueryDto {
    @IsOptional() @IsInt() @Min(1)
    page?: number = 1;
    @IsOptional() @IsInt() @Min(1) @Max(100)
    limit?: number = 10;
  }
  ```

- [ ] **Task 3: Update 6 controllers** (AC: #2, #3)
  Current inconsistencies found:
  | Controller | Current Params | Current Response |
  |-----------|---------------|-----------------|
  | admin-users | `page` + `limit` | `{ data, total, page, limit }` |
  | bulk-issuance | `page` + `pageSize` | `{ items, total, page, pageSize }` |
  | analytics | `limit` + `offset` | `{ data, total, limit, offset }` |
  | badge-templates | `page` + `limit` | `{ data, count }` |
  | issued-badges | `page` + `limit` | `{ data, total }` |
  | milestones | `take` + `skip` | `{ data, total }` |
  
  For each: update query params → `PaginationQueryDto`, return → `PaginatedResponse<T>`

- [ ] **Task 4: Update services** (AC: #2)
  - [ ] Each service's list/findAll method should return `PaginatedResponse<T>`
  - [ ] Calculate `totalPages = Math.ceil(total / limit)`

- [ ] **Task 5: Update frontend** (AC: #5)
  - [ ] Update API service functions to expect new format
  - [ ] Update TanStack Query hooks if response shape changed
  - [ ] Update component pagination props

- [ ] **Task 6: Update tests** (AC: #7)
  - [ ] Update e2e/integration tests for new query params
  - [ ] Update unit tests for new response shapes
  - [ ] Verify all tests pass

## Dev Notes

### Source Tree Components (6 controllers)
- `backend/src/admin/admin-users.controller.ts`
- `backend/src/bulk-issuance/bulk-issuance.controller.ts`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/badge-templates/badge-templates.controller.ts`
- `backend/src/issued-badges/issued-badges.controller.ts`
- `backend/src/milestones/milestones.controller.ts`

### Risk
- Breaking change for frontend — coordinate update
- Test updates may cascade (budget extra time per Lesson 36)

### Wave
- Wave 3 → do after security stories stabilize

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
