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

1. [ ] `EvidenceFile` model supports a new `type` field: `FILE` | `URL`
2. [ ] Migration script converts all existing `Badge.evidenceUrl` values to `EvidenceFile` records (type=URL)
3. [ ] `Badge.evidenceUrl` field deprecated (kept for rollback safety, not used in new code)
4. [ ] Badge issuance API accepts both file uploads AND URL evidence in a unified request
5. [ ] `GET /api/badges/:id` returns unified evidence list (both files and URLs)
6. [ ] Verification endpoint returns evidence via SAS token (files) or direct link (URLs)
7. [ ] All existing tests pass without regression
8. [ ] Migration is reversible (down migration restores `evidenceUrl`)

## Tasks / Subtasks

- [ ] Task 1: Schema changes — Phase A (AC: #1)
  - [ ] Add `type` enum: `FILE`, `URL` to `EvidenceFile` model
  - [ ] Add `sourceUrl` field (nullable, `@db.Text`) to `EvidenceFile` for URL-type evidence
  - [ ] `npx prisma migrate dev`
  - [ ] NOTE: This is schema-only, no data changes
- [ ] Task 2: Data migration script — Phase B (AC: #2, #8)
  - [ ] Standalone script: `scripts/migrate-evidence.ts` (NestJS CLI or ts-node)
  - [ ] Iterate all `Badge` records where `evidenceUrl IS NOT NULL`
  - [ ] For each: create `EvidenceFile` record (type=URL, sourceUrl=evidenceUrl)
  - [ ] Idempotent: skip if EvidenceFile already exists for that badge+URL combo
  - [ ] Dry-run mode: `--dry-run` flag to preview without writing
  - [ ] Logging: count migrated, skipped, failed
  - [ ] Reversible: separate down script restores from EvidenceFile type=URL → Badge.evidenceUrl
  - [ ] **DO NOT put data migration inside Prisma migration file** — separate script for control + logging
- [ ] Task 3: Update `badge-issuance.service.ts` (AC: #4)
  - [ ] Accept `evidenceFiles[]` (multipart) AND `evidenceUrl` in issuance
  - [ ] Store URL evidence as `EvidenceFile(type=URL, sourceUrl=...)`
  - [ ] Deprecate direct `Badge.evidenceUrl` write (still populate for backward compat this sprint)
- [ ] Task 4: Update badge detail response (AC: #5)
  - [ ] `GET /api/badges/:id` returns unified `evidence: EvidenceItem[]` field
  - [ ] **Backward compat:** Keep `evidenceUrl` field in response for 1 sprint (Sprint 12), remove in Sprint 13
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
- [ ] Task 5: Update verification endpoint (AC: #6)
  - [ ] FILE type: generate SAS token URL
  - [ ] URL type: return direct URL (sourceUrl)
- [ ] Task 6: Extend evidence controller for URL-type evidence
  - [ ] `POST /api/badges/:badgeId/evidence` — accept JSON body `{ type: 'URL', sourceUrl: '...' }` alongside existing multipart upload
  - [ ] Existing download/preview endpoints: FILE-only (URL types don't need them)
- [ ] Task 7: **Remove `evidenceUrl` from Bulk Issuance CSV** (REVISED — PO decision 2026-02-22)
  - [ ] `csv-parser.service.ts`: Remove `evidenceUrl` from `optionalHeaders`, remove URL validation logic
  - [ ] `BulkIssuanceRow` DTO: Remove `evidenceUrl` field
  - [ ] `badge-issuance.service.ts` → `bulkIssueBadges()`: Stop passing `evidenceUrl` to `issueBadge()`
  - [ ] `BulkPreviewTable.tsx`: Remove evidence URL column
  - [ ] Clean up all bulk issuance tests (20+ references to evidenceUrl — DELETE, not convert)
  - [ ] **Rationale:** Evidence will be attached post-issuance via two-step grouped flow (Story 12.6, Tasks 7–10). CSV simplified to `recipientEmail, templateId, expiresIn` only.
- [ ] Task 8: Tests (AC: #7)
  - [ ] Unit tests for migration script (mock Prisma, test idempotency)
  - [ ] Unit tests for unified evidence retrieval
  - [ ] Integration tests for issuance with file + URL
  - [ ] Bulk issuance evidence tests
  - [ ] E2E impact assessment: `grep evidenceUrl` across frontend + test files

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
