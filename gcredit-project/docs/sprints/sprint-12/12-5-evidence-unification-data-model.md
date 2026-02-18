# Story 12.5: Evidence Unification — Data Model + Migration

Status: backlog

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

- [ ] Task 1: Schema changes (AC: #1)
  - [ ] Add `type` enum: `FILE`, `URL` to `EvidenceFile` model
  - [ ] Add `externalUrl` field (nullable) to `EvidenceFile` for URL-type evidence
  - [ ] `npx prisma migrate dev`
- [ ] Task 2: Data migration script (AC: #2, #8)
  - [ ] Script: iterate all `Badge` records where `evidenceUrl IS NOT NULL`
  - [ ] For each: create `EvidenceFile` record (type=URL, externalUrl=evidenceUrl)
  - [ ] Reversible: down migration restores from EvidenceFile type=URL → Badge.evidenceUrl
  - [ ] Logging: count migrated, skipped, failed
- [ ] Task 3: Update `badge-issuance.service.ts` (AC: #4)
  - [ ] Accept `evidenceFiles[]` (multipart) AND `evidenceUrl` in issuance
  - [ ] Store URL evidence as `EvidenceFile(type=URL)`
  - [ ] Deprecate direct `Badge.evidenceUrl` write
- [ ] Task 4: Update `badge-issuance.service.ts findOne()` (AC: #5)
  - [ ] Include all `EvidenceFile` records (both types) in badge detail response
  - [ ] Return normalized evidence list: `{ id, type, name, url, size?, mimeType? }`
- [ ] Task 5: Update verification endpoint (AC: #6)
  - [ ] FILE type: generate SAS token URL
  - [ ] URL type: return direct URL
- [ ] Task 6: Tests (AC: #7)
  - [ ] Unit tests for migration logic
  - [ ] Unit tests for unified evidence retrieval
  - [ ] Integration tests for issuance with file + URL
  - [ ] E2E impact assessment (grep test/ for evidenceUrl consumers)

## Dev Notes

### Architecture Patterns
- Prisma migration for schema changes
- Migration script as a standalone NestJS command or seed script
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
  externalUrl String?      @db.Text  // For URL-type evidence
}
```

### Risk Assessment
- **HIGH:** Migration affects existing data — must be tested thoroughly
- **MEDIUM:** API contract change for badge detail response — check all frontend consumers
- **LOW:** `evidenceUrl` deprecation — field stays in schema for rollback

### ⚠️ Phase 2 Review MANDATORY
- **Architecture Review:** Migration strategy, API contract changes, rollback plan
- **E2E Impact:** Grep `evidenceUrl` across frontend + test files

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
