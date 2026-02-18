# Story 11.10: CQ-001 — badge-templates.service.ts Unit Tests

**Status:** backlog  
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Source:** Code Quality Audit  

## Story

As a developer,  
I want comprehensive unit tests for badge-templates.service.ts (386 lines, 0 tests),  
So that this core module has regression protection.

## Acceptance Criteria

1. [ ] `badge-templates.service.spec.ts` created with >80% line coverage
2. [ ] All CRUD operations tested (create, findAll, findOne, update, delete)
3. [ ] Template search functionality tested
4. [ ] Criteria template management tested
5. [ ] Image upload integration logic tested (with mocked Blob storage)
6. [ ] Error handling paths tested (not found, validation errors, duplicate names)
7. [ ] Template status lifecycle tested (DRAFT → ACTIVE → ARCHIVED)
8. [ ] All existing tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: Test setup** (AC: #1)
  - [ ] Create `badge-templates.service.spec.ts` 
  - [ ] Mock PrismaService, BlobStorageService
  - [ ] Use `createMockRequestWithUser()` pattern if needed (Lesson 36)

- [ ] **Task 2: CRUD tests** (AC: #2)
  - [ ] Test `create()`: valid DTO → template created
  - [ ] Test `findAll()`: returns paginated list
  - [ ] Test `findOne()`: valid ID → returns template; invalid ID → NotFoundException
  - [ ] Test `update()`: valid update → fields changed
  - [ ] Test `delete()`: soft delete / hard delete behavior

- [ ] **Task 3: Search tests** (AC: #3)
  - [ ] Test `search()`: by name query → filtered results
  - [ ] Test search with category filter
  - [ ] Test search with status filter

- [ ] **Task 4: Criteria tests** (AC: #4)
  - [ ] Test criteria validation logic
  - [ ] Test criteria template CRUD

- [ ] **Task 5: Image upload tests** (AC: #5)
  - [ ] Mock BlobStorageService.uploadFile()
  - [ ] Test image URL stored on template
  - [ ] Test image upload failure handling

- [ ] **Task 6: Error and lifecycle tests** (AC: #6, #7)
  - [ ] Test duplicate name rejection
  - [ ] Test status transitions (DRAFT→ACTIVE, ACTIVE→ARCHIVED)
  - [ ] Test invalid status transition rejection

- [ ] **Task 7: Verify** (AC: #8)
  - [ ] Run `npm test`
  - [ ] Run `tsc --noEmit`

## Dev Notes

### Source Tree Components
- **Service:** `backend/src/badge-templates/badge-templates.service.ts` (386 lines)
- **Test file:** `backend/src/badge-templates/badge-templates.service.spec.ts` (new)

### Testing Patterns
- Lesson 36: Replacing `any` → strict types cascades to test mocks (budget 30-50% extra)
- Lesson 37: Jest matchers return `any` — use typed wrappers
- Pattern: Use `Test.createTestingModule()` with mock providers

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
