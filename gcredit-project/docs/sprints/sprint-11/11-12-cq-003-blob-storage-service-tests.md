# Story 11.12: CQ-003 — blob-storage.service.ts Unit Tests

**Status:** backlog  
**Priority:** 🟡 HIGH  
**Estimate:** 3-4h  
**Source:** Code Quality Audit  

## Story

As a developer,  
I want unit tests for blob-storage.service.ts (346 lines, critical infrastructure, 0 tests),  
So that Azure Blob Storage operations have regression protection.

## Acceptance Criteria

1. [ ] `blob-storage.service.spec.ts` created with >80% line coverage
2. [ ] Upload, download, delete, list operations tested with mocked Azure SDK
3. [ ] Error handling tested (network failures, auth errors, missing containers)
4. [ ] SAS token generation tested
5. [ ] Container creation logic tested
6. [ ] All existing tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: Test setup** (AC: #1)
  - [ ] Create spec file
  - [ ] Mock `@azure/storage-blob` SDK:
    - `BlobServiceClient`
    - `ContainerClient`  
    - `BlockBlobClient`
  - [ ] Use `jest.mock('@azure/storage-blob')`

- [ ] **Task 2: Upload tests** (AC: #2)
  - [ ] Test successful file upload → returns URL
  - [ ] Test upload with custom content type
  - [ ] Test upload to public container (badges)
  - [ ] Test upload to private container (evidence)

- [ ] **Task 3: Download/Delete/List tests** (AC: #2)
  - [ ] Test download → returns buffer
  - [ ] Test delete → success
  - [ ] Test list blobs → returns array

- [ ] **Task 4: Error handling** (AC: #3)
  - [ ] Test network timeout → throws appropriate error
  - [ ] Test auth failure (invalid connection string) → throws
  - [ ] Test missing container → auto-create behavior

- [ ] **Task 5: SAS token and container tests** (AC: #4, #5)
  - [ ] Test SAS token generation with correct permissions and expiry
  - [ ] Test container creation if not exists

- [ ] **Task 6: Verify** (AC: #6)
  - [ ] Run `npm test` + `tsc --noEmit`

## Dev Notes

### Source Tree Components
- **Service:** `backend/src/common/services/blob-storage.service.ts` (346 lines)
- **Azure SDK:** `@azure/storage-blob` (mock all external calls)

### Testing Patterns
- Schema-based isolation not needed (no DB dependency)
- Pure unit tests with mocked Azure SDK
- Test both happy path and failure scenarios

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
