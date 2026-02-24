# Story 12.5: Evidence Unification — Data Model + Migration

Status: done

## Story

As a **Developer**,
I want to unify the dual evidence system (`Badge.evidenceUrl` + `EvidenceFile` table) into a single `EvidenceFile`-based model with a data migration,
So that the platform has a consistent evidence data model that all features can build upon.

## Context

- Resolves **TD-010 Phase 1** (Evidence System Unification — data layer)
- Current state: TWO parallel evidence mechanisms exist (see TD-010 document)
  - `Badge.evidenceUrl` (single URL, set at issuance)
  - `EvidenceFile` table (multiple files, uploaded post-issuance)
- These two are disconnected — frontend shows different data on different pages
- This story handles BACKEND ONLY — UI changes in Story 12.6

## Acceptance Criteria

1. [x] `EvidenceFile` model supports a new `type` field: `FILE` | `URL`
2. [x] Migration script converts all existing `Badge.evidenceUrl` values to `EvidenceFile` records (type=URL)
3. [x] `Badge.evidenceUrl` field deprecated (kept for rollback safety, not used in new code)
4. [x] Badge issuance API accepts both file uploads AND URL evidence in a unified request
5. [x] `GET /api/badges/:id` returns unified evidence list (both files and URLs)
6. [x] Verification endpoint returns evidence via SAS token (files) or direct link (URLs)
7. [x] All existing tests pass without regression
8. [x] Migration is reversible (down migration restores `evidenceUrl`)

## Tasks / Subtasks

- [x] Task 1: Schema changes — Phase A (AC: #1)
  - [x] Add `type` enum: `FILE`, `URL` to `EvidenceFile` model
  - [x] Add `sourceUrl` field (nullable, `@db.Text`) to `EvidenceFile` for URL-type evidence
  - [x] `npx prisma migrate dev`
  - [x] NOTE: This is schema-only, no data changes
- [x] Task 2: Data migration script — Phase B (AC: #2, #8)
  - [x] Standalone script: `scripts/migrate-evidence.ts` (NestJS CLI or ts-node)
  - [x] Iterate all `Badge` records where `evidenceUrl IS NOT NULL`
  - [x] For each: create `EvidenceFile` record (type=URL, sourceUrl=evidenceUrl)
  - [x] Idempotent: skip if EvidenceFile already exists for that badge+URL combo
  - [x] Dry-run mode: `--dry-run` flag to preview without writing
  - [x] Logging: count migrated, skipped, failed
  - [x] Reversible: separate down script restores from EvidenceFile type=URL → Badge.evidenceUrl
  - [x] **DO NOT put data migration inside Prisma migration file** — separate script for control + logging
- [x] Task 3: Update `badge-issuance.service.ts` (AC: #4)
  - [x] Accept `evidenceFiles[]` (multipart) AND `evidenceUrl` in issuance
  - [x] Store URL evidence as `EvidenceFile(type=URL, sourceUrl=...)`
  - [x] Deprecate direct `Badge.evidenceUrl` write (still populate for backward compat this sprint)
- [x] Task 4: Update badge detail response (AC: #5)
  - [x] `GET /api/badges/:id` returns unified `evidence: EvidenceItem[]` field
  - [x] **Backward compat:** Keep `evidenceUrl` field in response for 1 sprint (Sprint 12), remove in Sprint 13
  - [ ] Normalized `EvidenceItem` interface:
    ```typescript
    interface EvidenceItem {
      id: string;
      type: 'FILE' | 'URL';
      name: string;        // originalName for FILE, URL hostname for URL
      url: string;         // SAS token URL for FILE, direct URL for URL
      size?: number;       // only for FILE
      mimeType?: string;   // only for FILE
      uploadedAt: string;
    }
    ```
- [x] Task 5: Update verification endpoint (AC: #6)
  - [x] FILE type: generate SAS token URL
  - [x] URL type: return direct URL (sourceUrl)
- [x] Task 6: Extend evidence controller for URL-type evidence
  - [x] `POST /api/badges/:badgeId/evidence/url` — dedicated endpoint for URL evidence (separate from multipart upload)
  - [x] Existing download/preview endpoints: FILE-only (URL types rejected with 400)
- [x] Task 7: **Remove `evidenceUrl` from Bulk Issuance CSV** (REVISED — PO decision 2026-02-22)
  - [x] `csv-parser.service.ts`: Remove `evidenceUrl` from `optionalHeaders`, remove URL validation logic
  - [x] `BulkIssuanceRow` DTO: Remove `evidenceUrl` field
  - [x] `badge-issuance.service.ts` → `bulkIssueBadges()`: Stop passing `evidenceUrl` to `issueBadge()`
  - [x] `BulkPreviewTable.tsx`: Remove evidence URL column
  - [x] Clean up all bulk issuance tests (20+ references to evidenceUrl — DELETE, not convert)
  - [x] **Rationale:** Evidence will be attached post-issuance via two-step grouped flow (Story 12.6, Tasks 7–10). CSV simplified to `recipientEmail, templateId, expiresIn` only.
- [x] Task 8: Tests (AC: #7)
  - [x] Unit tests for migration script (mock Prisma, test idempotency)
  - [x] Unit tests for unified evidence retrieval
  - [x] Integration tests for issuance with file + URL
  - [x] Bulk issuance evidence tests
  - [x] E2E impact assessment: `grep evidenceUrl` across frontend + test files

## Dev Notes

### Architecture Patterns
- **Two-phase migration strategy:**
  - Phase A: Prisma migration (schema-only, additive)
  - Phase B: Standalone data migration script (separate, idempotent, with dry-run)
- `Badge.evidenceUrl` kept in schema through Sprint 12 for rollback safety — removal in Sprint 13
- Evidence controller extended to accept both multipart (FILE) and JSON (URL) in same endpoint
- Follow Lesson 43: check E2E tests for `evidenceUrl` field consumers before committing

### Schema Changes
```prisma
enum EvidenceType {
  FILE
  URL
}

model EvidenceFile {
  // ... existing fields ...
  type        EvidenceType @default(FILE)
  sourceUrl   String?      @db.Text  // For URL-type evidence (renamed from externalUrl per review)
}
```

### API Contract: EvidenceItem
```typescript
interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;        // originalName for FILE, URL hostname for URL
  url: string;         // SAS token URL for FILE, direct URL for URL
  size?: number;       // only for FILE
  mimeType?: string;   // only for FILE
  uploadedAt: string;
}
```

### Bulk Issuance — Remove evidenceUrl from CSV (PO Decision 2026-02-22)
**Decision:** Remove `evidenceUrl` column from CSV template entirely. Evidence will be attached post-issuance via a two-step grouped flow (Story 12.6, Tasks 7–10).
**Rationale:** (1) No production data exists — safe to clean up, (2) CSV only used for bulk issuance — small impact surface, (3) Simpler UX — avoids confusing dual-path (CSV + post-issuance).
Files affected:
- `backend/src/badge-issuance/services/csv-parser.service.ts` — remove from optionalHeaders + validation
- `backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts` — remove field
- `backend/src/badge-issuance/badge-issuance.service.ts` — stop passing evidenceUrl in bulk
- `backend/src/badge-issuance/badge-issuance.service.spec.ts` — clean up 15+ refs
- `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx` — remove column
- `frontend/src/lib/badgesApi.ts` — remove from interface

### Risk Assessment
- **HIGH:** Migration affects existing data — test with dry-run first, then execute
- **LOW:** Bulk issuance CSV `evidenceUrl` removal — deletion is simpler than conversion
- **MEDIUM:** API contract change for badge detail response — backward compat `evidenceUrl` field kept 1 sprint
- **LOW:** `evidenceUrl` deprecation — field stays in schema for rollback, removed Sprint 13

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Two-phase migration (schema + data script separately), `sourceUrl` field name (not `externalUrl`), backward-compat `evidenceUrl` in response for 1 sprint, bulk issuance impact identified (+2h), `EvidenceItem` interface contract
- **Bulk Issuance:** Task 7 REVISED (PO decision 2026-02-22) — remove `evidenceUrl` from CSV entirely instead of converting. Story 12.6 (Tasks 7–10) will add two-step grouped evidence flow for bulk issuance.
- **Estimate revised:** 12h → **12h** (bulk removal simpler than conversion, net zero change)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
