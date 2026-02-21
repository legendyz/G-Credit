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

- [ ] Task 1: Create shared `<EvidenceList>` component (AC: #3, #5, #6)
  - [ ] Renders both FILE and URL evidence items
  - [ ] FILE item: 📄 Icon │ originalName │ fileSize │ [Preview] [Download] (SAS URL)
  - [ ] FILE thumbnail: if image (PNG/JPG) show 40x40 preview; if PDF/DOCX show file type icon
  - [ ] URL item: 🔗 Icon │ truncated URL │ [Open ↗]
  - [ ] Subtle hover background on items
  - [ ] Props: `items: EvidenceItem[]`, `editable: boolean`
  - [ ] If editable: show remove (✕) button per item
  - [ ] If read-only: hide remove button (VerifyBadgePage, BadgeDetailModal)
  - [ ] Location: `src/components/evidence/EvidenceList.tsx`
  - [ ] Reusable across: BadgeDetailModal, VerifyBadgePage, BadgeManagement, IssueBadgePage
- [ ] Task 2: Update `IssueBadgePage` — stacked upload layout (AC: #1, #2, #7)
  - [ ] Layout (top to bottom):
    ```
    ┌─────────────────────────────────────┐
    │  📎 Drag files here or browse       │
    │     PDF, PNG, JPG, DOCX (max 10MB)  │
    └─────────────────────────────────────┘
    ── OR ──
    🔗 [Enter evidence URL____________] [+ Add]
    📋 Attached Evidence (2/5):
    ├─ 📄 certificate.pdf (2.1 MB)  [✕]
    └─ 🔗 https://coursera.org/cert  [✕]
    ```
  - [ ] Drag zone: native HTML5 drag-and-drop API
  - [ ] Multi-file support (up to 5 total evidence items, mix of files + URLs)
  - [ ] Per-file progress bar (inline, per file — not global spinner)
  - [ ] Progress: filename + percentage + cancel button → green checkmark + size on success
  - [ ] File validation (Sonner toast per coding standards):
    - Too large: "File exceeds 10MB limit"
    - Wrong type: "Only PDF, PNG, JPG, DOCX files are supported"
    - Max reached: disable drop zone, gray out, "Maximum 5 evidence items reached"
  - [ ] **Two-step submit:** issue badge → get badgeId → upload files via `POST /api/badges/:badgeId/evidence` → add URLs via same endpoint → show success
  - [ ] Frontend orchestration: feels like one action to user
- [ ] Task 3: Update `BadgeDetailModal` (AC: #3)
  - [ ] Replace current evidence section with `<EvidenceList editable={false}>`
  - [ ] Fetch unified evidence from updated `GET /api/badges/:id` response (`evidence` field)
- [ ] Task 4: Update Badge Management table (AC: #4)
  - [ ] Add evidence count column
  - [ ] Click to expand/view evidence list (inline or popover)
- [ ] Task 5: Update `VerifyBadgePage` (AC: #5)
  - [ ] Use `<EvidenceList editable={false}>`
  - [ ] FILE type: use SAS token preview endpoint
  - [ ] URL type: render as clickable link
- [ ] Task 6: Update `BulkPreviewTable` evidence display
  - [ ] Remove evidence URL column entirely (Story 12.5 removed `evidenceUrl` from CSV)
  - [ ] Bulk issuance CSV now only has: `recipientEmail, templateId, expiresIn`
  - [ ] Evidence for bulk-issued badges will be attached post-issuance (Sprint 13: two-step grouped flow)
- [ ] Task 7: Tests (AC: #8)
  - [ ] EvidenceList component tests (FILE + URL rendering, editable + read-only)
  - [ ] File upload component tests (drag, browse, validation, progress)
  - [ ] Integration tests for IssueBadgePage two-step flow
  - [ ] Verification page evidence display tests
  - [ ] BulkPreviewTable evidence column tests

## Dev Notes

### Architecture Patterns
- Shared `<EvidenceList>` component in `src/components/evidence/`
- File upload: native HTML5 drag-and-drop + `<input type="file" multiple>`
- Upload: multipart/form-data to `POST /api/badges/:badgeId/evidence`
- URL add: JSON body to same endpoint `POST /api/badges/:badgeId/evidence` `{ type: 'URL', sourceUrl: '...' }`
- SAS token: `GET /api/badges/:badgeId/evidence/:fileId/preview`
- Two-step issuance flow: issue badge → attach evidence (orchestrated in one user action)
- Per-file upload progress (not global spinner)

### EvidenceList Visual Spec
```
FILE item:  📄 [type-icon/thumb] │ originalName │ 2.1 MB │ [Preview] [Download]
URL item:   🔗 [link-icon]       │ truncated-url │        │ [Open ↗]
────────────────────────────────────────────────────────────
Image files (PNG/JPG): 40x40 thumbnail preview
PDF/DOCX: file type icon
Hover: subtle background highlight
Editable mode: ✕ remove button per item
Read-only mode: no remove button
```

### Dependencies
- Story 12.5 (unified evidence API)

### Key Files to Modify
- `frontend/src/pages/IssueBadgePage.tsx` (major: stacked upload + two-step flow)
- `frontend/src/components/BadgeDetailModal/` (swap to EvidenceList)
- `frontend/src/pages/badge-operations/VerifyBadgePage.tsx` (swap to EvidenceList)
- `frontend/src/pages/admin/BadgeManagementPage.tsx` (add evidence count column)
- `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx` (evidence column update)

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Evidence controller already exists with POST/GET/download/preview. Extend POST to accept JSON body for URL-type. Two-step issuance (issue → attach). Existing download/preview endpoints stay FILE-only.
- **UX (Sally):** Stacked layout (drag zone → OR → URL input → attached list), per-file progress bar, specific validation toast messages, thumbnail for images, file type icon for PDF/DOCX, editable/read-only modes in EvidenceList
- **Estimate confirmed:** 10h

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
