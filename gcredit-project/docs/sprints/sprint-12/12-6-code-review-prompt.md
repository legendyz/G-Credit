# Code Review Prompt: Story 12.6 — Evidence Unification: UI Integration

**Reviewer:** SM (Bob)
**Commit:** `f8a9c1c` — `feat(story-12.6): Evidence Unification UI Integration`
**Branch:** `sprint-12/management-uis-evidence`
**Baseline:** `475e8a6` (dev prompt commit)
**Story Spec:** `docs/sprints/sprint-12/12-6-evidence-unification-ui.md`
**Dev Prompt:** `docs/sprints/sprint-12/12-6-dev-prompt.md`

---

## Change Summary

| Metric | Value |
|--------|-------|
| Files Changed | 20 |
| Lines Added | +2,266 |
| Lines Deleted | −189 |
| New Files | 8 |
| Modified Files | 12 |
| Backend Files | 2 (minor) |
| Frontend Files | 10 |
| Test Files | 5 (3 new, 2 updated) |

---

## Files Changed

### New Files (8)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| N1 | `frontend/src/components/evidence/EvidenceList.tsx` | 157 | Shared evidence list component (FILE + URL rendering, editable/read-only modes) |
| N2 | `frontend/src/components/evidence/FileUploadZone.tsx` | 142 | Drag & drop + browse file upload zone with validation |
| N3 | `frontend/src/components/evidence/EvidenceAttachmentPanel.tsx` | 242 | Combined panel: FileUploadZone + URL input + pending evidence list |
| N4 | `frontend/src/lib/evidenceApi.ts` | 203 | Evidence API client (upload, URL add, list, preview, download, helpers) |
| N5 | `frontend/src/components/BulkIssuance/BulkResultPage.tsx` | 762 | Template-grouped bulk result page with evidence attachment flow |
| N6 | `frontend/src/components/BulkIssuance/__tests__/BulkResultPage.test.tsx` | 195 | BulkResultPage tests (grouping, expansion, skip flow) |
| N7 | `frontend/src/components/evidence/__tests__/EvidenceList.test.tsx` | 110 | EvidenceList tests (FILE/URL rendering, editable/read-only) |
| N8 | `frontend/src/components/evidence/__tests__/FileUploadZone.test.tsx` | 79 | FileUploadZone tests (drag/drop, browse, disabled state) |

### Modified Files (12)

| # | File | +/− | Purpose |
|---|------|-----|---------|
| M1 | `backend/src/badge-issuance/badge-issuance.service.ts` | +5/−0 | Add `_count: { evidenceFiles }` to `findAll()` + `evidenceCount` in response |
| M2 | `backend/src/bulk-issuance/bulk-issuance.service.ts` | +3/−0 | Add `badgeId` to bulk confirm results |
| M3 | `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` | +10/−3 | Replace `<EvidenceSection>` with `<EvidenceList>` using unified `badge.evidence` |
| M4 | `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` | +25/−1 | Route to `<BulkResultPage>` after processing when badges have IDs |
| M5 | `frontend/src/pages/IssueBadgePage.tsx` | +95/−27 | Two-step issue flow: stacked upload + URL + per-file progress |
| M6 | `frontend/src/pages/VerifyBadgePage.tsx` | +22/−23 | Replace inline evidence links with `<EvidenceList>`, map to `EvidenceItem[]` |
| M7 | `frontend/src/pages/admin/BadgeManagementPage.tsx` | +31/−6 | Add Evidence column (table + mobile card) with `Paperclip` icon + count |
| M8 | `frontend/src/lib/badgesApi.ts` | +1/−0 | Add `evidenceCount?: number` to `Badge` interface |
| M9 | `frontend/src/types/badge.ts` | +17/−0 | Add `EvidenceItem` interface, `evidence?: EvidenceItem[]` on `BadgeDetail`, extend `VerificationResponse.evidenceFiles` |
| M10 | `frontend/src/pages/IssueBadgePage.test.tsx` | +20/−11 | Mock evidenceApi, update assertions for new evidence UI |
| M11 | `docs/sprints/sprint-12/12-6-evidence-unification-ui.md` | +146/−117 | Mark all 13 ACs and 11 tasks [x], update status to `review`, add dev agent record |
| M12 | `docs/sprints/sprint-status.yaml` | +1/−1 | `12-6: backlog` → `12-6: review` |

---

## Review Checklist

### Architecture & Design

- [ ] **R1: Shared `EvidenceList` component reusability** — Verify the `EvidenceList` component is properly abstracted for use across BadgeDetailModal, VerifyBadgePage, IssueBadgePage, and BulkResultPage (AC #6)
- [ ] **R2: `EvidenceItem` type consistency** — The type is defined in BOTH `types/badge.ts` AND `lib/evidenceApi.ts`. Check for duplication and ensure one canonical source is used. `EvidenceList.tsx` re-exports from `evidenceApi.ts` — is `types/badge.ts` also needed?
- [ ] **R3: Two-step issuance orchestration** — `IssueBadgePage` issues badge first, then attaches evidence. Verify the user experience feels like one action (button text changes: "Issuing..." → "Attaching evidence...") (AC #1, #2, #7)
- [ ] **R4: Bulk result page integration** — `BulkPreviewPage` routes to `BulkResultPage` after processing. Check that fallback to `ProcessingComplete` works when no badgeIds exist (backward compat)
- [ ] **R5: Backend changes minimal and correct** — Only 2 backend files changed (8 lines total): `_count` for evidenceCount + `badgeId` in bulk confirm. Verify no unintended side effects in existing APIs

### Functional Correctness

- [ ] **R6: File upload progress tracking** — `evidenceApi.ts` uses `XMLHttpRequest` for upload progress (correct: Fetch API doesn't support upload progress). Verify `withCredentials = true` matches `apiFetch` behavior
- [ ] **R7: File validation** — `validateEvidenceFile()` checks size (10MB max) and MIME type. Verify MIME types match backend (`ALLOWED_MIME_TYPES`). Check: does the backend also validate, or is this frontend-only?
- [ ] **R8: Combined evidence limit (5 items)** — Verify enforcement across: IssueBadgePage (files + URLs), BulkResultPage shared evidence, BulkResultPage shared + individual combined. `MAX_EVIDENCE_ITEMS = 5`
- [ ] **R9: Shared evidence fan-out** — `applySharedEvidence()` iterates badges sequentially. Check: handles partial failures (some uploads succeed, others fail). Does it respect remaining slots per badge?
- [ ] **R10: Skip flow confirmation** — When evidence is partially attached, "Skip — No Evidence" should show confirm dialog. Only when NO evidence attached should it navigate directly

### Error Handling & Edge Cases

- [ ] **R11: Module-level mutable state** — `IssueBadgePage.tsx` has `let fileIdCounter = 0` at module level. This persists across renders/navigation. Should this be a ref or otherwise scoped per instance?
- [ ] **R12: `uploadEvidence` error handling** — In `IssueBadgePage.handleSubmit()`, if file upload fails mid-way, the badge is already created. Verify: does user see success toast even if some evidence fails? Should navigation still happen?
- [ ] **R13: URL validation consistency** — `EvidenceAttachmentPanel` validates URLs with `new URL()` + protocol check (http/https only). Does this match backend's `@IsUrl()` validation on `AddUrlEvidenceDto`?
- [ ] **R14: VerifyBadgePage IIFE pattern** — Evidence rendering uses `(() => { ... })()` inside JSX. This works but is unusual. Consider whether a helper function or memo would be cleaner
- [ ] **R15: "Done" button auto-upload** — `BulkResultPage.handleDone()` automatically uploads all pending evidence before navigating. If this fails silently, user may lose pending evidence without knowing

### Type Safety

- [ ] **R16: Duplicate `EvidenceItem` type** — Defined in `types/badge.ts` (lines 10–18) AND `lib/evidenceApi.ts` (lines 11–19). Both have identical shape. This creates maintenance risk — changes in one may not propagate to the other
- [ ] **R17: VerifyBadgePage evidence mapping** — `badge.evidenceFiles` mapped to `EvidenceItem[]` with fallback: `type: f.type || ('FILE' as const)`. Verify the backend verify endpoint actually returns `type` and `sourceUrl` fields on evidence items
- [ ] **R18: `BadgeResult.badgeId` optional** — Bulk results check `r.badgeId` before showing BulkResultPage. What if ALL results are failed (no badgeIds)? The `hasSuccessfulBadges` check should handle this correctly

### Test Coverage

- [ ] **R19: EvidenceList tests** — 7 test cases cover: empty state, FILE rendering, URL rendering, mixed rendering, editable remove button, remove callback, read-only mode. Missing: SAS preview/download interaction tests (mocked but not asserted)
- [ ] **R20: FileUploadZone tests** — 5 test cases. Missing: actual file drop/validation test (no DataTransfer mock with real files). Drag visual feedback test checks element existence but not class changes
- [ ] **R21: BulkResultPage tests** — 11 test cases cover grouping, expansion, skip flow. Missing: shared evidence upload tests (fan-out API calls), individual evidence attachment, combined limit enforcement
- [ ] **R22: IssueBadgePage test update** — Removed `Evidence URL` label assertion, added evidence attachment area check. Missing: two-step submission flow assertion (issue badge → attach evidence)
- [ ] **R23: Integration test gap** — No test verifies the end-to-end flow of: BulkPreviewPage → ProcessingComplete → BulkResultPage transition

### Security

- [ ] **R24: XMLHttpRequest credentials** — `uploadEvidenceFile()` uses `xhr.withCredentials = true`. Verify this correctly sends httpOnly cookies matching `apiFetch` with `credentials: 'include'`
- [ ] **R25: Window.open for evidence** — Multiple `window.open()` calls for preview/download/open URL. All use `noopener,noreferrer` for URL type? Check FILE preview/download — they use `window.open(url, '_blank')` without noreferrer

### Performance

- [ ] **R26: Sequential fan-out** — `applySharedEvidence()` uploads to each badge sequentially (no concurrency). For groups with 15+ badges, this could be slow. The dev prompt mentioned considering concurrency limits — was this addressed?
- [ ] **R27: BulkResultPage state management** — Uses multiple `useState` + `useCallback` with inline state updates (`getGroupState`, `getBadgeState`). For large result sets (50+ badges), these nested state objects and re-renders could be expensive. Consider whether `useReducer` would be more appropriate

### Code Quality

- [ ] **R28: `EvidenceSection.tsx` not deleted** — Dev prompt marked this file for deprecation. Is it still in the codebase? `BadgeDetailModal` no longer imports it, but the file may still exist (dead code)
- [ ] **R29: `pendingToDisplayItems` unused** — `EvidenceAttachmentPanel` defines `pendingToDisplayItems()` helper function but the returned items are not rendered via `EvidenceList` — instead files are rendered with custom progress UI and URLs are rendered via a separate `EvidenceList` instance. The function may be dead code
- [ ] **R30: `crypto.randomUUID()` availability** — `BulkResultPage` uses `crypto.randomUUID()` for pending file IDs. This is available in modern browsers but may need a polyfill for older targets. `IssueBadgePage` uses a simpler `++fileIdCounter` approach. Inconsistent ID generation across the two pages

### Consistency

- [ ] **R31: AC #4 "Click to expand/view evidence list"** — Story spec says evidence count column should be "clickable to expand/view evidence list (inline or popover)". The implementation shows count only — no click-to-expand. Is this intentional or a deviation?
- [ ] **R32: Task 2 "cancel button" during upload** — Story spec mentions "Progress: filename + percentage + cancel button → green checkmark + size on success". The implementation shows progress but no cancel button during upload. Remove buttons only appear for `pending` or `error` status
- [ ] **R33: Task 1 "FILE thumbnail"** — Story spec mentions "if image (PNG/JPG) show 40x40 preview". The EvidenceList component uses emoji icons (📷/📄/📝) rather than actual image thumbnails. Is this an intentional simplification?

---

## Per-File Review Notes

### N1: `evidence/EvidenceList.tsx` (157 lines) — Shared Evidence List

**Good:**
- Clean separation of FILE vs URL rendering
- Proper `useCallback` for event handlers to prevent re-renders
- Empty state returns `null` (matches existing `EvidenceSection` convention)
- Accessible: `aria-label` on all buttons
- Uses brand color classes consistently

**Check:**
- `handlePreview` for URL type opens `window.open(item.url, '_blank', 'noopener,noreferrer')` ✓
- But `handlePreview` for FILE type opens `window.open(url, '_blank')` without `noreferrer` — security inconsistency (R25)
- `handleDownload` similarly opens `window.open(url, '_blank')` without `noreferrer`

### N2: `evidence/FileUploadZone.tsx` (142 lines) — File Upload

**Good:**
- Native HTML5 drag-and-drop API (no library dependency)
- Keyboard accessible (`onKeyDown` handles Enter/Space)
- Proper validation before passing files to parent
- Reset file input so same file can be re-selected
- `ALLOWED_EXTENSIONS` used as `accept` attribute

**Check:**
- `processFiles` validates per file but breaks out of loop on max reached — does it toast for each invalid file or just once?

### N3: `evidence/EvidenceAttachmentPanel.tsx` (242 lines) — Combined Panel

**Good:**
- URL protocol validation (http/https only) consistent with backend Story 12.5 fix
- Enter key support on URL input
- Visual progress bar per file with uploading/done/error states
- Clean separation: files rendered with custom progress UI, URLs rendered via EvidenceList

**Check:**
- `pendingToDisplayItems()` function is defined but never called for rendering — appears to be dead code (R29)
- URL remove uses index-based `pending-url-${i}` IDs which can shift if middle items are removed while mapping

### N4: `lib/evidenceApi.ts` (203 lines) — Evidence API Client

**Good:**
- `XMLHttpRequest` for upload with progress tracking (correct approach)
- `withCredentials = true` matches `apiFetch` auth pattern
- Type-safe response handling with proper error extraction
- Clean helper functions (`formatFileSize`, `getFileIcon`, `truncateUrl`)
- `toEvidenceItem()` mapper for backend → frontend transformation

**Check:**
- Uses `API_BASE_URL` directly for XHR but `apiFetch` for other calls. Verify `API_BASE_URL` includes `/api` prefix — the URL constructed is `${baseUrl}/badges/${badgeId}/evidence`. If `API_BASE_URL` already ends with `/api`, this would be `/api/badges/...` which is correct. But if not, it would miss the prefix
- `validateEvidenceFile()` returns string error message — consider whether file extension check is also needed (MIME types can be incorrect for renamed files)

### N5: `BulkIssuance/BulkResultPage.tsx` (762 lines) — Template-Grouped Evidence

**Good:**
- Clean template grouping with `Map`-based logic
- Shared evidence fan-out with per-badge progress tracking
- Individual badge evidence with combined limit enforcement (shared + individual ≤ 5)
- Skip confirmation when evidence partially attached
- "Done" button auto-uploads pending evidence before navigating
- Failed badges shown per group with error messages

**Check:**
- This is the largest new file (762 lines). Consider whether it should be broken into smaller components (e.g., `TemplateGroup.tsx`, `BulkBadgeRow.tsx`)
- `handleDone()` calls `applySharedEvidence()` and `uploadBadgeEvidence()` which themselves show toast notifications — could result in many toasts appearing rapidly for large groups
- `getGroupState` and `getBadgeState` create new objects on every call when state doesn't exist — this triggers re-renders in callbacks that depend on them

### M1: `badge-issuance.service.ts` (+5 lines) — Evidence Count

**Good:**
- Minimal change: adds `_count: { select: { evidenceFiles: true } }` to Prisma include
- Maps to `evidenceCount` field in response — clean

**Check:** None — straightforward Prisma aggregate addition

### M2: `bulk-issuance.service.ts` (+3 lines) — Badge ID in Results

**Good:**
- Adds `badgeId?: string` to result type and `badgeId: issueResult.id` to success results
- Essential for BulkResultPage evidence API calls

**Check:** None — minimal and correct

### M5: `IssueBadgePage.tsx` (+95/−27) — Two-Step Issuance

**Good:**
- Clean two-step flow: issue badge → attach evidence → navigate
- Per-file progress tracking with status transitions (pending → uploading → done/error)
- Button text changes contextually: "Issuing..." → "Attaching evidence..."
- Removed old `isValidUrl` helper (validation now in `EvidenceAttachmentPanel`)

**Check:**
- Module-level `let fileIdCounter = 0` — persists across SPA navigations (R11). If user issues badge A (counter=3), navigates away, comes back — counter starts at 3. Functionally fine but unconventional. Could use `useRef` or `crypto.randomUUID()` instead
- If badge issuance succeeds but evidence upload fails, user still sees `toast.success('Badge issued successfully!')` and navigates away — evidence attachment errors are toasted per-file but don't block success (R12). Confirm this is intentional (badge exists, evidence is best-effort)

### M6: `VerifyBadgePage.tsx` (+22/−23) — Unified Evidence Display

**Good:**
- Clean mapping from `evidenceFiles` to `EvidenceItem[]` format
- Handles both FILE and URL types with proper field mapping
- Removed unused `ExternalLink` import

**Check:**
- Uses IIFE `(() => { ... })()` in JSX (R14) — works but slightly unusual
- Fallback for `type`: `f.type || ('FILE' as const)` — assumes old evidence items without `type` field are FILE. Check: does the verify endpoint's `_meta.evidenceFiles` actually include `type`/`sourceUrl` from Story 12.5?
- `id: f.blobUrl || 'evidence-${idx}'` — using `blobUrl` as ID is fragile if blob URLs change. The backend returns evidence `id` — is it available here?

### M7: `BadgeManagementPage.tsx` (+31/−6) — Evidence Column

**Good:**
- Evidence count shown with `Paperclip` icon — clean, minimal
- Both mobile card and desktop table views updated
- Column widths adjusted appropriately
- Dash (`—`) for zero evidence

**Check:**
- AC #4 in story spec says "Click to expand/view evidence list (inline or popover)" — current implementation is count-only with no click interaction (R31)

---

## Severity Classification

| Severity | Description | Action |
|----------|-------------|--------|
| **S1** (Blocking) | Must fix before merge | Block |
| **S2** (Important) | Should fix, non-critical | Fix before merge |
| **S3** (Minor) | Nice to have, can defer | Note for future |
| **S4** (Observation) | Style/design preference | Optional |

---

## Initial Observations (Pre-Review)

| ID | Severity | Area | Finding |
|----|----------|------|---------|
| **O1** | S3 | Types | Duplicate `EvidenceItem` in `types/badge.ts` and `evidenceApi.ts`. Should have single canonical source (R16) |
| **O2** | S4 | IssueBadgePage | Module-level `fileIdCounter` — functional but unconventional. Consider `useRef` or `crypto.randomUUID()` (R11) |
| **O3** | S3 | EvidenceAttachmentPanel | `pendingToDisplayItems()` appears to be dead code — defined but not used for actual rendering (R29) |
| **O4** | S4 | VerifyBadgePage | IIFE pattern `(() => { ... })()` in JSX — valid but unusual (R14) |
| **O5** | S3 | EvidenceList | `window.open(url, '_blank')` for FILE preview/download lacks `noreferrer` (SAS URLs from own backend, low risk) (R25) |
| **O6** | S3 | BulkResultPage | Sequential fan-out for shared evidence — no concurrency limit for large groups per dev prompt guidance (R26) |
| **O7** | S4 | BulkResultPage | 762 lines — large component, could benefit from sub-component decomposition (R27) |
| **O8** | S3 | Tests | BulkResultPage tests don't cover shared evidence upload/fan-out (R21). EvidenceList tests don't assert SAS preview/download calls (R19) |
| **O9** | S3 | AC #4 | Story spec says "click to expand/view evidence list" — implementation is count-only (R31) |
| **O10** | S4 | AC Task 2 | Story spec mentions upload "cancel button" — not implemented (R32) |
| **O11** | S4 | AC Task 1 | Story spec mentions image thumbnail preview — emoji icons used instead (R33) |
| **O12** | S3 | Dead code | `EvidenceSection.tsx` may still exist but is no longer imported (R28) |

---

## Quick Verification Commands

```bash
# Frontend type check
cd gcredit-project/frontend && npx tsc --noEmit

# Frontend lint
cd gcredit-project/frontend && npx eslint --max-warnings=0 src/

# Frontend tests
cd gcredit-project/frontend && npx vitest run

# Backend type check
cd gcredit-project/backend && npx tsc --noEmit

# Backend tests (evidence + badge-issuance + bulk-issuance)
cd gcredit-project/backend && npx jest --testPathPattern="evidence|badge-issuance|bulk-issuance" --passWithNoTests
```

---

## Summary

Story 12.6 delivers a comprehensive frontend evidence integration across 20 files (+2,266/−189 lines). The implementation correctly follows the dev prompt architecture: shared `EvidenceList` component, `EvidenceAttachmentPanel` composition, two-step issuance flow, template-grouped bulk evidence with fan-out, and skip flow. Two minor backend additions (`evidenceCount`, `badgeId` in bulk results) are minimal and correct.

**Key strengths:** Clean component architecture, proper upload progress via XMLHttpRequest, consistent brand styling, good error handling per file/URL.

**Key risks:** Duplicate `EvidenceItem` type definition, some dead code (`pendingToDisplayItems`), test coverage gaps for fan-out and download interactions, AC #4 deviation (no click-to-expand for evidence count).

**Recommendation:** No blocking issues identified in initial observation. Several S3 items worth discussing but all can be deferred to 12.9 cleanup if needed. Proceed with detailed review using the checklist above.
