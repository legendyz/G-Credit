# Code Review Report — Story 12.6: Evidence Unification UI Integration

## Scope

- Story: `docs/sprints/sprint-12/12-6-evidence-unification-ui.md`
- Dev Prompt: `docs/sprints/sprint-12/12-6-dev-prompt.md`
- Review Prompt: `docs/sprints/sprint-12/12-6-code-review-prompt.md`
- Base commit: `475e8a6`
- Reviewed commit: `f8a9c1c`

## Verdict

**Request Changes (Not approved yet).**

The implementation is strong overall (shared evidence components, two-step issuance orchestration, bulk result UX, and minimal backend deltas), but there are blocking correctness gaps against Story 12.6 ACs.

## What Was Verified

### Architecture / Implementation

- ✅ Shared evidence component stack is present and wired: `EvidenceList`, `FileUploadZone`, `EvidenceAttachmentPanel`.
- ✅ `IssueBadgePage` implements two-step flow (issue badge first, then attach pending files/URLs with progress).
- ✅ `BulkPreviewPage` transitions to `BulkResultPage` when successful rows include `badgeId`.
- ✅ Backend changes are minimal and scoped:
  - `_count.evidenceFiles` → `evidenceCount` in badge listing
  - `badgeId` added in bulk confirm success results

### Static checks and tests

- ✅ Frontend: `npm run build`
- ✅ Frontend: `npm run lint`
- ✅ Frontend targeted tests: `EvidenceList`, `FileUploadZone`, `BulkResultPage`, `IssueBadgePage` (37/37)
- ✅ Backend: `npm run type-check`
- ✅ Backend: `npm run lint`
- ✅ Backend targeted tests: `badge-issuance.service.spec.ts` (31/31), `bulk-issuance.service.spec.ts` (57/57), `badge-verification.controller.spec.ts` (4/4)

## Blocking Findings (Must Fix)

### B1 — Verify flow cannot correctly render URL-type evidence

- **Severity:** Medium
- **Files:**
  - `backend/src/badge-verification/badge-verification.service.ts`
  - `frontend/src/pages/VerifyBadgePage.tsx`
- **Issue:** Verify UI logic expects evidence items with type-aware fields (`type`, `sourceUrl`) to distinguish FILE vs URL and route actions correctly. However, backend verify service currently returns `_meta.evidenceFiles` with only `{ fileName, blobUrl, uploadedAt }`.
- **Impact:** URL evidence cannot be rendered as direct links on verify page (AC #5). Current mapping falls back to FILE and can produce empty/invalid URL behavior for URL-type records.
- **Required fix:** Include `type` and `sourceUrl` (and preferably stable `id`, `originalName`, `fileSize`, `mimeType`) in verify service evidence payload, then map from those canonical fields in `VerifyBadgePage`.

### B2 — AC #4 “click to expand/view evidence list” not implemented in badge management

- **Severity:** Medium
- **File:** `frontend/src/pages/admin/BadgeManagementPage.tsx`
- **Issue:** Evidence column currently displays count only (`Paperclip + evidenceCount`) with no click interaction, inline expansion, or popover/detail view.
- **Impact:** Story AC #4 is only partially satisfied.
- **Required fix:** Add click affordance for evidence count and show evidence list/details (inline row expansion or popover/modal) as specified.

## Non-Blocking Findings (Should Fix)

1. **Duplicate `EvidenceItem` type** exists in both `frontend/src/lib/evidenceApi.ts` and `frontend/src/types/badge.ts` (maintenance drift risk).
2. **Module-level mutable counter** in `IssueBadgePage` (`let fileIdCounter = 0`) is functional but non-idiomatic; use `useRef` or UUID.
3. **`pendingToDisplayItems()` dead code** in `EvidenceAttachmentPanel.tsx` (computed but not used in render path).
4. **Security consistency:** FILE preview/download in `EvidenceList` opens new tab without `noopener,noreferrer` (URL path already uses both).
5. **Tests:** no dedicated coverage for shared evidence fan-out API behavior and verify-page type-aware evidence mapping.

## AC Coverage Summary

- **Met:** AC #1, #2, #3, #6, #7, #8, #9, #10, #11, #12, #13
- **Not fully met:**
  - **AC #4** (evidence count click-to-view behavior missing)
  - **AC #5** (verify evidence type handling incomplete due backend payload contract)

## Approval Decision

**Request Changes**

Please resolve **B1** and **B2**, then re-run targeted checks for verify evidence rendering and badge management evidence interaction. After those are fixed, Story 12.6 should be ready for approval.
