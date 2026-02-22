# Story 12.6: Evidence Unification �?UI Integration

Status: done

## Story

As an **Admin/Issuer**,
I want the badge issuance form to support file uploads (not just URL), badge management/verification pages to display all evidence uniformly, and bulk-issued badges to support evidence attachment grouped by template,
So that evidence is presented consistently across the entire platform and bulk issuance has the same evidence capabilities as single badge issuance.

## Context

- Depends on Story 12.5 (unified data model)
- Resolves **TD-010 Phase 2** (Evidence System Unification �?UI layer)
- Current issues (from TD-010):
  - `IssueBadgePage` only collects URL evidence
  - `BadgeDetailModal` only shows `EvidenceFile` records (misses URLs)
  - `VerifyBadgePage` uses direct blobUrl (no SAS token)
  - Badge Management page has no evidence column/action
  - Bulk issuance has no evidence capability (CSV `evidenceUrl` removed in Story 12.5)
- **PO Decision 2026-02-22:** Bulk evidence attached post-issuance via two-step grouped flow (by template), with optional per-badge individual evidence

## Acceptance Criteria

1. [x] `IssueBadgePage` supports file upload (drag & drop + browse) in addition to URL
2. [x] Issuer can attach up to 5 evidence items (mix of files and URLs)
3. [x] `BadgeDetailModal` displays all evidence (both FILE and URL types) in unified list
4. [x] Badge Management table shows evidence count column
5. [x] `VerifyBadgePage` correctly displays evidence with SAS token URLs (files) and direct links (URLs)
6. [x] Evidence list component is reusable across all pages
7. [x] File upload shows progress bar and validates size (max 10MB) and type (PDF, PNG, JPG, DOCX)
8. [x] All existing frontend tests pass
9. [x] Bulk issuance result page displays badges grouped by template
10. [x] Each template group has shared evidence attachment area (files + URLs, up to 5 per badge)
11. [x] Shared evidence applied to ALL badges in template group via API fan-out
12. [x] Individual per-badge evidence can be added via [+ Individual Evidence] button
13. [x] User can skip evidence attachment entirely ("Skip �?No Evidence" button)

## Tasks / Subtasks

- [x] Task 1: Create shared `<EvidenceList>` component (AC: #3, #5, #6)
  - [x] Renders both FILE and URL evidence items
  - [x] FILE item: 📄 Icon �?originalName �?fileSize �?[Preview] [Download] (SAS URL)
  - [x] FILE thumbnail: if image (PNG/JPG) show 40x40 preview; if PDF/DOCX show file type icon
  - [x] URL item: 🔗 Icon �?truncated URL �?[Open ↗]
  - [x] Subtle hover background on items
  - [x] Props: `items: EvidenceItem[]`, `editable: boolean`
  - [x] If editable: show remove (�? button per item
  - [x] If read-only: hide remove button (VerifyBadgePage, BadgeDetailModal)
  - [x] Location: `src/components/evidence/EvidenceList.tsx`
  - [x] Reusable across: BadgeDetailModal, VerifyBadgePage, BadgeManagement, IssueBadgePage
- [x] Task 2: Update `IssueBadgePage` �?stacked upload layout (AC: #1, #2, #7)
  - [x] Layout (top to bottom):
    ```
    ┌─────────────────────────────────────�?
    �? 📎 Drag files here or browse       �?
    �?    PDF, PNG, JPG, DOCX (max 10MB)  �?
    └─────────────────────────────────────�?
    ── OR ──
    🔗 [Enter evidence URL____________] [+ Add]
    📋 Attached Evidence (2/5):
    ├─ 📄 certificate.pdf (2.1 MB)  [✕]
    └─ 🔗 https://coursera.org/cert  [✕]
    ```
  - [x] Drag zone: native HTML5 drag-and-drop API
  - [x] Multi-file support (up to 5 total evidence items, mix of files + URLs)
  - [x] Per-file progress bar (inline, per file �?not global spinner)
  - [x] Progress: filename + percentage + cancel button �?green checkmark + size on success
  - [x] File validation (Sonner toast per coding standards):
    - Too large: "File exceeds 10MB limit"
    - Wrong type: "Only PDF, PNG, JPG, DOCX files are supported"
    - Max reached: disable drop zone, gray out, "Maximum 5 evidence items reached"
  - [x] **Two-step submit:** issue badge �?get badgeId �?upload files via `POST /api/badges/:badgeId/evidence` �?add URLs via same endpoint �?show success
  - [x] Frontend orchestration: feels like one action to user
- [x] Task 3: Update `BadgeDetailModal` (AC: #3)
  - [x] Replace current evidence section with `<EvidenceList editable={false}>`
  - [x] Fetch unified evidence from updated `GET /api/badges/:id` response (`evidence` field)
- [x] Task 4: Update Badge Management table (AC: #4)
  - [x] Add evidence count column
  - [x] Click to expand/view evidence list (inline or popover)
- [x] Task 5: Update `VerifyBadgePage` (AC: #5)
  - [x] Use `<EvidenceList editable={false}>`
  - [x] FILE type: use SAS token preview endpoint
  - [x] URL type: render as clickable link
- [x] Task 6: Update `BulkPreviewTable` �?remove evidence column
  - [x] Remove evidence URL column entirely (Story 12.5 removed `evidenceUrl` from CSV)
  - [x] Bulk issuance CSV now only has: `recipientEmail, templateId, expiresIn`
- [x] Task 7: Bulk result page �?template group layout (AC: #9)
  - [x] After bulk issuance completes, show result page with badges grouped by `templateId`
  - [x] Collapsible group sections with template name + badge count
  - [x] Show recipient list per group with status indicators (�?success, �?failed)
  - [x] Layout:
    ```
    ┌──────────────────────────────────────────────────────�?
    �?📋 Bulk Issuance Complete �?18 badges issued         �?
    �?                                                     �?
    �?🏆 Cloud Architecture (15 badges)           [展开 ▼] �?
    �? ├─ 📋 Shared Evidence (0/5):                        �?
    �? �? ┌────────────────────────────────�?              �?
    �? �? �?📎 Drag files here or browse    �?              �?
    �? �? └────────────────────────────────�?              �?
    �? �? 🔗 [Enter URL______________] [+ Add]             �?
    �? �?                                                  �?
    �? ├─ 📧 alice@gcredit.com  �? [+ Individual Evidence] �?
    �? ├─ 📧 bob@gcredit.com    �? [+ Individual Evidence] �?
    �? └─ 📧 carol@gcredit.com  �? [+ Individual Evidence] �?
    �?                                                     �?
    �?🏆 Innovation Award (3 badges)              [展开 ▼] �?
    �? ├─ 📋 Shared Evidence (0/5):  [Add Evidence]        �?
    �? ├─ 📧 dave@gcredit.com   �?                        �?
    �? └─ 📧 emma@gcredit.com   �?                        �?
    �?                                                     �?
    �?                         [完成] [Skip �?No Evidence]  �?
    └──────────────────────────────────────────────────────�?
    ```
- [x] Task 8: Shared evidence upload per template group (AC: #10, #11)
  - [x] Reuse `<EvidenceList editable={true}>` from Task 1
  - [x] On "完成" �?iterate all badges in group, call evidence API for each badge
  - [x] Show group-level progress (X/N badges processed)
  - [x] Handle partial failures gracefully (some uploads fail, others succeed)
  - [x] API fan-out: 1 set of evidence items �?N API calls (one per badge)
- [x] Task 9: Individual per-badge evidence (AC: #12)
  - [x] `[+ Individual Evidence]` button per badge row
  - [x] Inline expand �?`<EvidenceList editable={true}>` for that specific badge
  - [x] Combined count: shared + individual �?5 per badge
  - [x] Clear indicator when limit reached
- [x] Task 10: Skip flow (AC: #13)
  - [x] "Skip �?No Evidence" button �?navigate to success/dashboard
  - [x] Confirm dialog if evidence partially attached ("Some evidence has been attached. Skip remaining?")
- [x] Task 11: Tests (AC: #8)
  - [x] EvidenceList component tests (FILE + URL rendering, editable + read-only)
  - [x] File upload component tests (drag, browse, validation, progress)
  - [x] Integration tests for IssueBadgePage two-step flow
  - [x] Verification page evidence display tests
  - [x] Template grouping logic tests
  - [x] Shared evidence API fan-out tests
  - [x] Individual evidence limit enforcement tests
  - [x] Skip flow navigation tests

## Dev Notes

### Architecture Patterns
- Shared `<EvidenceList>` component in `src/components/evidence/`
- File upload: native HTML5 drag-and-drop + `<input type="file" multiple>`
- Upload: multipart/form-data to `POST /api/badges/:badgeId/evidence`
- URL add: JSON body to same endpoint `POST /api/badges/:badgeId/evidence` `{ type: 'URL', sourceUrl: '...' }`
- SAS token: `GET /api/badges/:badgeId/evidence/:fileId/preview`
- Two-step issuance flow: issue badge �?attach evidence (orchestrated in one user action)
- Per-file upload progress (not global spinner)

### EvidenceList Visual Spec
```
FILE item:  📄 [type-icon/thumb] �?originalName �?2.1 MB �?[Preview] [Download]
URL item:   🔗 [link-icon]       �?truncated-url �?       �?[Open ↗]
────────────────────────────────────────────────────────────
Image files (PNG/JPG): 40x40 thumbnail preview
PDF/DOCX: file type icon
Hover: subtle background highlight
Editable mode: �?remove button per item
Read-only mode: no remove button
```

### Bulk Evidence �?Template Group Architecture
- **Shared evidence = fan-out:** 1 set of evidence items �?N API calls (one per badge in group)
- Consider parallelism with concurrency limit for large groups (15+ badges)
- All API endpoints already exist from Story 12.5:
  - `POST /api/badges/:badgeId/evidence` �?file upload (multipart)
  - `POST /api/badges/:badgeId/evidence/url` �?URL evidence (JSON body)
  - `GET /api/badges/:badgeId/evidence` �?list evidence per badge
- **5-item limit enforcement:** shared + individual combined �?5 per badge
- **Frontend-only implementation** �?no new backend APIs needed

### Dependencies
- Story 12.5 (unified evidence API)

### Key Files to Modify
- `frontend/src/pages/IssueBadgePage.tsx` (major: stacked upload + two-step flow)
- `frontend/src/components/BadgeDetailModal/` (swap to EvidenceList)
- `frontend/src/pages/badge-operations/VerifyBadgePage.tsx` (swap to EvidenceList)
- `frontend/src/pages/admin/BadgeManagementPage.tsx` (add evidence count column)
- `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx` (remove evidence column)
- `frontend/src/components/BulkIssuance/BulkResultPage.tsx` (NEW: template-grouped evidence attachment)
- `frontend/src/components/evidence/EvidenceList.tsx` (NEW: shared component)

### �?Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Evidence controller already exists with POST/GET/download/preview. Extend POST to accept JSON body for URL-type. Two-step issuance (issue �?attach). Existing download/preview endpoints stay FILE-only.
- **UX (Sally):** Stacked layout (drag zone �?OR �?URL input �?attached list), per-file progress bar, specific validation toast messages, thumbnail for images, file type icon for PDF/DOCX, editable/read-only modes in EvidenceList
- **Estimate revised:** 10h �?**17h** (+7h for bulk evidence grouped attachment �?PO decision 2026-02-22 to merge Sprint 13 story into 12.6 for feature completeness)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)
### Completion Notes
All 11 tasks and 13 ACs implemented. Frontend: 684 tests pass. Backend: 845 tests pass. TSC clean on both sides. Key changes:
- Created shared evidence components: EvidenceList, FileUploadZone, EvidenceAttachmentPanel, evidenceApi
- IssueBadgePage: two-step issue→attach flow with drag-drop upload + URL input
- BadgeDetailModal: unified evidence display via EvidenceList
- VerifyBadgePage: EvidenceList with SAS token support
- BadgeManagementPage: evidence count column (backend _count + frontend Paperclip icon)
- BulkResultPage: template-grouped results with shared/individual evidence attachment + skip flow
- Backend: added badgeId to bulk confirm response, added _count.evidenceFiles to badge list
### File List
#### New Files
- `frontend/src/lib/evidenceApi.ts` — Evidence API module (upload, addUrl, list, preview, download, helpers)
- `frontend/src/components/evidence/EvidenceList.tsx` — Shared evidence list component
- `frontend/src/components/evidence/FileUploadZone.tsx` — Drag & drop file upload zone
- `frontend/src/components/evidence/EvidenceAttachmentPanel.tsx` — Combined upload panel
- `frontend/src/components/BulkIssuance/BulkResultPage.tsx` — Template-grouped bulk result page
- `frontend/src/components/evidence/__tests__/EvidenceList.test.tsx` — EvidenceList tests (8)
- `frontend/src/components/evidence/__tests__/FileUploadZone.test.tsx` — FileUploadZone tests (5)
- `frontend/src/components/BulkIssuance/__tests__/BulkResultPage.test.tsx` — BulkResultPage tests (13)
#### Modified Files
- `frontend/src/types/badge.ts` — EvidenceItem re-exported from evidenceApi (deduplicated), enhanced VerificationResponse.evidenceFiles
- `frontend/src/pages/IssueBadgePage.tsx` — Major: stacked upload + two-step flow, crypto.randomUUID for file IDs
- `frontend/src/pages/IssueBadgePage.test.tsx` — Updated for new evidence attachment
- `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` — Replaced EvidenceSection with EvidenceList
- `frontend/src/pages/VerifyBadgePage.tsx` — Replaced inline evidence with EvidenceList, type-aware FILE/URL mapping
- `frontend/src/pages/VerifyBadgePage.test.tsx` — New: verify evidence type-aware rendering tests (4)
- `frontend/src/pages/admin/BadgeManagementPage.tsx` — Evidence count column with click-to-expand evidence list
- `frontend/src/pages/admin/BadgeManagementPage.test.tsx` — Evidence expansion tests (3)
- `frontend/src/lib/badgesApi.ts` — Added evidenceCount to Badge interface
- `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` — Added BulkResultPage integration, badgeId in types
- `backend/src/badge-issuance/badge-issuance.service.ts` — Added _count.evidenceFiles to getIssuedBadges, evidenceCount mapping
- `backend/src/bulk-issuance/bulk-issuance.service.ts` — Added badgeId to confirmBulkIssuance results
- `backend/src/badge-verification/badge-verification.service.ts` — Expanded evidenceFiles to include id, type, sourceUrl, originalName, fileSize, mimeType
## SM Acceptance Record

- **Date**: 2026-02-22
- **SM Agent**: Claude Opus 4.6 (Bob)
- **Verdict**: ✅ **ACCEPTED**

### Verification Summary

| AC | Description | Verdict |
|----|-------------|---------|
| #1 | File upload (drag & drop + browse) + URL on IssueBadgePage | ✅ PASS |
| #2 | Up to 5 evidence items (mix of files and URLs) | ✅ PASS |
| #3 | BadgeDetailModal displays unified EvidenceList | ✅ PASS |
| #4 | Badge Management evidence count column with click-to-expand | ✅ PASS |
| #5 | VerifyBadgePage displays FILE (SAS) and URL evidence | ✅ PASS |
| #6 | Reusable EvidenceList component (used in 5 locations) | ✅ PASS |
| #7 | Progress bar + 10MB size limit + file type validation | ✅ PASS |
| #8 | All tests pass (691 FE / 845 BE) | ✅ PASS |
| #9 | Bulk result page groups badges by template | ✅ PASS |
| #10 | Shared evidence area per template group | ✅ PASS |
| #11 | Fan-out logic applies shared evidence to all badges | ✅ PASS |
| #12 | Individual evidence button per badge | ✅ PASS |
| #13 | Skip flow — complete without evidence | ✅ PASS |

### Notes

- All 13 ACs verified against source code
- Code review: Approved (2 blocking findings B1+B2 resolved before acceptance)
- Frontend: 66 test files, 691 tests pass; Backend: 46 suites, 845 tests pass
- Minor housekeeping: legacy `EvidenceSection.tsx` is orphaned (low priority cleanup)