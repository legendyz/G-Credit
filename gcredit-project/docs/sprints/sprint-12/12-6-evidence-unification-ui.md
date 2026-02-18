# Story 12.6: Evidence Unification — UI Integration

Status: backlog

## Story

As an **Admin/Issuer**,
I want the badge issuance form to support file uploads (not just URL), and badge management/verification pages to display all evidence uniformly,
So that evidence is presented consistently across the entire platform.

## Context

- Depends on Story 12.5 (unified data model)
- Resolves **TD-010 Phase 2** (Evidence System Unification — UI layer)
- Current issues (from TD-010):
  - `IssueBadgePage` only collects URL evidence
  - `BadgeDetailModal` only shows `EvidenceFile` records (misses URLs)
  - `VerifyBadgePage` uses direct blobUrl (no SAS token)
  - Badge Management page has no evidence column/action

## Acceptance Criteria

1. [ ] `IssueBadgePage` supports file upload (drag & drop + browse) in addition to URL
2. [ ] Issuer can attach up to 5 evidence items (mix of files and URLs)
3. [ ] `BadgeDetailModal` displays all evidence (both FILE and URL types) in unified list
4. [ ] Badge Management table shows evidence count column
5. [ ] `VerifyBadgePage` correctly displays evidence with SAS token URLs (files) and direct links (URLs)
6. [ ] Evidence list component is reusable across all pages
7. [ ] File upload shows progress bar and validates size (max 10MB) and type (PDF, PNG, JPG, DOCX)
8. [ ] All existing frontend tests pass

## Tasks / Subtasks

- [ ] Task 1: Create shared `EvidenceList` component (AC: #3, #5, #6)
  - [ ] Renders both FILE and URL evidence items
  - [ ] FILE: icon + name + size + download button (SAS URL)
  - [ ] URL: link icon + URL + open in new tab button
  - [ ] Reusable across BadgeDetailModal, VerifyBadgePage, BadgeManagement
- [ ] Task 2: Update `IssueBadgePage` (AC: #1, #2, #7)
  - [ ] Add file upload zone (drag & drop area)
  - [ ] Multi-file support (up to 5)
  - [ ] File validation: type, size
  - [ ] Upload progress indicator
  - [ ] Keep existing URL input as alternative
  - [ ] Submit: upload files + URL in single API call
- [ ] Task 3: Update `BadgeDetailModal` (AC: #3)
  - [ ] Replace current evidence section with `EvidenceList` component
  - [ ] Fetch unified evidence from updated API
- [ ] Task 4: Update Badge Management table (AC: #4)
  - [ ] Add evidence count column
  - [ ] Click to expand/view evidence list
- [ ] Task 5: Update `VerifyBadgePage` (AC: #5)
  - [ ] Use `EvidenceList` component
  - [ ] FILE type: use SAS token preview endpoint
  - [ ] URL type: render as clickable link
- [ ] Task 6: Tests (AC: #8)
  - [ ] EvidenceList component tests
  - [ ] File upload component tests
  - [ ] Integration tests for IssueBadgePage
  - [ ] Verification page evidence display tests

## Dev Notes

### Architecture Patterns
- Shared `EvidenceList` component in `src/components/evidence/`
- File upload: multipart/form-data to existing `/api/badges/:id/evidence` endpoint
- SAS token: `GET /api/badges/:id/evidence/:evidenceId/preview`
- Drag & drop: use native HTML5 API or lightweight library

### Dependencies
- Story 12.5 (unified evidence API)

### Key Files to Modify
- `frontend/src/pages/badge-operations/IssueBadgePage.tsx`
- `frontend/src/components/BadgeDetailModal/`
- `frontend/src/pages/badge-operations/VerifyBadgePage.tsx`
- `frontend/src/pages/admin/BadgeManagementPage.tsx`

### ⚠️ Phase 2 Review MANDATORY
- **UX Review:** File upload interaction, evidence display layout
- **Architecture Review:** Multipart upload strategy, SAS token flow

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
