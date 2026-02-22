# Code Review Prompt — Story 12.5: Evidence Unification — Data Model + Migration

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-5-evidence-unification-data-model.md` (ACs #1–8)
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-5-dev-prompt.md` (Tasks 1–8)
**Branch:** `sprint-12/management-uis-evidence`
**Commits:** `40502b4` (main feat), `175df06` (E2E fix: remove evidenceUrl from bulk CSV E2E tests)
**Base:** `519f61c` (dev prompt commit)

### Story Summary

Story 12.5 is a backend-focused evidence unification effort (Phase 1 of TD-010). It replaces:

1. **Dual evidence system** (`Badge.evidenceUrl` + `EvidenceFile` table) → unified `EvidenceFile`-based model with `type` discriminator (`FILE` | `URL`)
2. **Prisma schema** — new `EvidenceType` enum + `type`/`sourceUrl` fields on `EvidenceFile`
3. **URL evidence endpoint** — new `POST /api/badges/:badgeId/evidence/url` for adding URL-type evidence
4. **Unified badge detail response** — `findOne()` builds `evidence: EvidenceItem[]` combining FILE and URL evidence
5. **Bulk CSV `evidenceUrl` removal** — PO decision 2026-02-22: remove column entirely, evidence attached post-issuance via two-step flow (Story 12.6)
6. **Data migration scripts** — standalone `migrate-evidence.ts` (up) and `migrate-evidence-down.ts` (down) with dry-run and idempotency

---

## Scope of Changes

**23 files changed, +623 / −110 lines** (all code files — markdown excluded from diff)

### New Backend Files (2 files)

| File | Lines | Purpose |
|------|-------|---------|
| `scripts/migrate-evidence.ts` | 98 | Standalone data migration: `Badge.evidenceUrl` → `EvidenceFile(type=URL)`. Idempotent, dry-run mode, logging |
| `scripts/migrate-evidence-down.ts` | 67 | Reversible down migration: restores `Badge.evidenceUrl` from `EvidenceFile(type=URL)` records |

### New Backend File (Migration)

| File | Lines | Purpose |
|------|-------|---------|
| `prisma/migrations/20260222010445_evidence_unification_type_field/migration.sql` | 6 | Schema-only: creates `EvidenceType` enum + adds `type`/`sourceUrl` columns to `evidence_files` |

### Modified Backend Files (14 files)

| File | Change | LOC |
|------|--------|-----|
| `prisma/schema.prisma` | New `EvidenceType` enum (`FILE`/`URL`), `type` and `sourceUrl` fields on `EvidenceFile` model | +6/−0 |
| `badge-issuance/badge-issuance.service.ts` | `EvidenceItem` interface, `issueBadge()` creates `EvidenceFile(type=URL)`, `findOne()` returns unified `evidence[]`, `bulkIssueBadges()` removes `evidenceUrl`, `generateBakedBadge()` includes `type`/`sourceUrl` | +72/−8 |
| `evidence/evidence.service.ts` | New `addUrlEvidence()` method (67 lines), `uploadEvidence()` returns `type: 'FILE'`, `listEvidence()` returns `type`/`sourceUrl`, `generateDownloadSas()` rejects URL-type | +71/−0 |
| `evidence/evidence.controller.ts` | New `POST /url` endpoint with Swagger docs, RBAC guards | +32/−0 |
| `evidence/dto/upload-evidence.dto.ts` | New `AddUrlEvidenceDto`, `EvidenceFileResponse` gains `type`/`sourceUrl` fields | +10/−1 |
| `badge-issuance/dto/bulk-issue-badges.dto.ts` | `evidenceUrl` field removed from `BulkIssuanceRow` | +2/−1 |
| `badge-issuance/services/csv-parser.service.ts` | `evidenceUrl` removed from `optionalHeaders`, URL validation logic removed | +1/−7 |
| `bulk-issuance/bulk-issuance.service.ts` | CSV template header/examples updated, `evidenceUrl` removed from `PreviewRow`, sanitization, validation flow, and `issueBadge()` call | +3/−12 |
| `bulk-issuance/csv-validation.service.ts` | `validateEvidenceUrl()` calls removed from both `validateRow()` and `validateRowWithDbCheck()` | +0/−6 |
| `badge-issuance/badge-issuance.service.spec.ts` | Tests for unified evidence in `findOne()`, `issueBadge()` URL evidence creation, `generateBakedBadge()` evidence includes | +56/−0 |
| `evidence/evidence.service.spec.ts` | `addUrlEvidence()` tests (5): create, validate URL, IDOR, 404, ADMIN access. `listEvidence` unified test. Download/preview URL-type rejection | +177/−0 |
| `bulk-issuance/bulk-issuance.service.spec.ts` | `evidenceUrl` references removed from template, CSV content, validation tests | +5/−13 |
| `bulk-issuance/csv-validation.service.spec.ts` | `evidenceUrl` removed from all `validateRow()` test inputs, URL validation test deleted, error count assertions updated | +3/−23 |
| `docs/sprints/sprint-status.yaml` | `12-5-evidence-unification-data-model: backlog` → `review` | +1/−1 |

### Modified Test Files (2 E2E files)

| File | Change | LOC |
|------|--------|-----|
| `test/badge-issuance.e2e-spec.ts` | Bulk CSV content: `evidenceUrl` column removed from test CSV strings | +5/−9 |
| `test/bulk-issuance-template.e2e-spec.ts` | Template header assertion: `toContain('evidenceUrl')` → `not.toContain('evidenceUrl')` | +1/−1 |

### Modified Frontend Files (3 files)

| File | Change | LOC |
|------|--------|-----|
| `components/BulkIssuance/BulkPreviewPage.tsx` | `evidenceUrl` removed from `PreviewRow` interface | +0/−1 |
| `components/BulkIssuance/BulkPreviewTable.tsx` | Evidence URL column removed from table header + body (link cell, dash fallback) | +0/−18 |
| `components/BulkIssuance/__tests__/BulkPreviewTable.test.tsx` | `evidenceUrl` removed from test data + header assertion | +0/−2 |

---

## Review Checklist

### 1. Architecture & Patterns Compliance

- [ ] **Two-phase migration strategy:** Schema migration (Prisma, additive) separate from data migration (standalone script). Clean separation — no data manipulation inside Prisma migration file. ✓
- [ ] **Backward compatibility pattern:** `Badge.evidenceUrl` still written during `issueBadge()` (line 125: `evidenceUrl: dto.evidenceUrl, // KEEP for backward compat (1 sprint)`). `findOne()` returns both `evidenceUrl` (legacy) and `evidence[]` (unified). Verify removal plan documented for Sprint 13.
- [ ] **IDOR protection pattern:** `addUrlEvidence()` mirrors `uploadEvidence()` — checks `badge.issuerId === userId || userRole === 'ADMIN'`. Consistent with existing security pattern. ✓
- [ ] **URL evidence endpoint:** `POST /api/badges/:badgeId/evidence/url` — new route alongside existing multipart `POST /api/badges/:badgeId/evidence`. Both on same controller with same RBAC guards. ✓
- [ ] **PO decision compliance:** `evidenceUrl` fully removed from CSV/bulk flow per PO decision 2026-02-22. Comments in code reference the decision. ✓

### 2. Backend — Prisma Migration (AC: #1)

#### migration.sql (6 lines)

```sql
CREATE TYPE "EvidenceType" AS ENUM ('FILE', 'URL');
ALTER TABLE "evidence_files" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "type" "EvidenceType" NOT NULL DEFAULT 'FILE';
```

- [ ] **Schema-only, no data:** Additive change — no existing rows affected. `type` defaults to `FILE` so all existing records automatically typed correctly. ✓
- [ ] **Default value correct:** `DEFAULT 'FILE'` — existing evidence files are all file uploads. ✓
- [ ] **`sourceUrl` nullable:** `TEXT` without `NOT NULL` — correct for `FILE` type evidence where `sourceUrl` is not applicable. ✓
- [ ] **No down migration needed:** Additive columns can be kept even if story rolls back — non-destructive. ✓

#### schema.prisma — EvidenceType enum + model fields

```prisma
enum EvidenceType {
  FILE
  URL
}

model EvidenceFile {
  // ... existing fields ...
  type         EvidenceType @default(FILE)        // Story 12.5: FILE or URL
  sourceUrl    String?      @db.Text              // Story 12.5: For URL-type evidence
}
```

- [ ] **Enum definition matches migration:** `FILE`, `URL` — exact match. ✓
- [ ] **Field naming:** `sourceUrl` matches story spec (not `externalUrl` per Phase 2 review decision). ✓
- [ ] **No index on `type`:** Consider if future queries will filter by `type` (e.g., "list only URL evidence"). Currently low volume — acceptable. ✓

### 3. Backend — Data Migration Scripts (AC: #2, #8)

#### scripts/migrate-evidence.ts (98 lines)

```typescript
const badges = await prisma.badge.findMany({
  where: { evidenceUrl: { not: null } },
  select: { id, evidenceUrl, issuerId, issuedAt, evidenceFiles: { where: { type: EvidenceType.URL } } },
});
// For each badge: skip if EvidenceFile(type=URL, sourceUrl=evidenceUrl) already exists
if (!isDryRun) {
  await prisma.evidenceFile.create({ data: { type: URL, sourceUrl: badge.evidenceUrl, ... } });
}
```

- [ ] **Idempotency (AC #2):** Checks `badge.evidenceFiles.some(ef => ef.sourceUrl === badge.evidenceUrl)` before creating. Re-running script is safe. ✓
- [ ] **Dry-run mode:** `--dry-run` flag prevents writes. Logs what would be migrated. ✓
- [ ] **Logging:** Counts `migrated`, `skipped`, `failed`. Per-badge log line with badge ID and URL. ✓
- [ ] **Error handling:** Per-badge try/catch — one failure doesn't abort the batch. ✓
- [ ] **`originalName` derivation:** `new URL(badge.evidenceUrl!).hostname` — could throw if `evidenceUrl` is malformed despite `{ not: null }` filter. **The URL constructor is called after the non-null check, but existing data may have invalid URLs.** The outer try/catch handles this, but the error message may be confusing. Consider wrapping URL parse separately.
- [ ] **`uploadedAt` preservation:** Uses `badge.issuedAt` — matches original evidence creation time. ✓
- [ ] **No transaction:** Runs individual creates without wrapping in `$transaction()`. Acceptable for migration — partial completion is handled by idempotency on re-run. ✓
- [ ] **Prisma disconnect:** `.finally(() => prisma.$disconnect())` — clean shutdown. ✓

#### scripts/migrate-evidence-down.ts (67 lines)

```typescript
const urlEvidence = await prisma.evidenceFile.findMany({
  where: { type: EvidenceType.URL },
});
// For each: update badge.evidenceUrl, delete EvidenceFile record
```

- [ ] **Reversibility (AC #8):** Restores `Badge.evidenceUrl` from `EvidenceFile.sourceUrl`, then deletes the URL-type record. ✓
- [ ] **Non-atomic operations:** `badge.update()` and `evidenceFile.delete()` are separate calls, not in a transaction. **If delete fails after update, badge has `evidenceUrl` set but URL evidence record still exists.** Low risk — re-running the script would re-process and hit `update` again (idempotent for badge), then retry delete.
- [ ] **Multiple URL evidence per badge:** If a badge has multiple URL-type evidence files (e.g., from manual addition), only the last one processed will set `Badge.evidenceUrl` (previous values overwritten). **Data loss risk if badge has multiple URL evidence.** Migration up creates one per `evidenceUrl`, so 1:1 mapping is expected. New `addUrlEvidence()` could create additional ones — but down migration would run before Story 12.6 adds bulk flow. Acceptable.
- [ ] **Missing dry-run logging:** Dry-run counts `restored` but doesn't log per-badge details before the `if (!isDryRun)` block. Consider moving log line outside the conditional. **Minor.**

### 4. Backend — Badge Issuance Service (AC: #3, #4, #5)

#### badge-issuance.service.ts — `EvidenceItem` interface (line 36)

```typescript
interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}
```

- [ ] **Matches spec contract:** Fields align with story spec's `EvidenceItem` interface. ✓
- [ ] **Not exported:** Interface is module-private. Frontend (Story 12.6) will consume the JSON shape, not this TypeScript type. If 12.6 needs to share the type, it should define its own or import a shared DTO. Acceptable for 12.5 scope. ✓

#### badge-issuance.service.ts — `issueBadge()` (lines 124–181)

```typescript
// Still writes Badge.evidenceUrl for backward compat
evidenceUrl: dto.evidenceUrl, // KEEP for backward compat (1 sprint)
// ...
// Story 12.5: Create EvidenceFile(type=URL) for URL evidence
if (dto.evidenceUrl) {
  await tx.evidenceFile.create({ data: { type: 'URL', sourceUrl: dto.evidenceUrl, ... } });
}
// Re-query to include the newly created URL evidence
const badgeWithEvidence = dto.evidenceUrl
  ? await tx.badge.findUnique({ where: { id: created.id }, include: { evidenceFiles: true } })
  : created;
const evidenceUrls = (badgeWithEvidence?.evidenceFiles || []).map(e =>
  e.type === 'URL' ? e.sourceUrl! : e.blobUrl
);
```

- [ ] **Dual write (AC #3):** Both `Badge.evidenceUrl` (legacy) and `EvidenceFile(type=URL)` are written. Backward compat maintained. ✓
- [ ] **Re-query pattern:** After creating URL evidence, re-queries to get all evidence files for assertion generation. This re-query inside the transaction adds latency but ensures data consistency. ✓
- [ ] **Conditional re-query:** Only re-queries when `dto.evidenceUrl` is truthy — if no URL evidence, uses `created` (which already includes `evidenceFiles` from the `include`). Optimization. ✓
- [ ] **Non-null assertion:** `e.sourceUrl!` — safe within the `e.type === 'URL'` branch since URL evidence always has `sourceUrl`. ✓
- [ ] **Empty `fileName`/`blobUrl`/`mimeType`:** URL-type evidence uses empty strings for file-oriented fields. Consistent with `addUrlEvidence()` in `evidence.service.ts`. ✓
- [ ] **`originalName` from URL:** `new URL(dto.evidenceUrl).hostname` — extracts hostname (e.g., `example.com`). Could throw if `evidenceUrl` is malformed — but `issueBadge()` has no URL validation. **Potential runtime error if `dto.evidenceUrl` is not a valid URL** (e.g., relative path, ftp://). Consider validating URL in `IssueBadgeDto` or wrapping in try/catch here.
- [ ] **Transaction integrity:** `evidenceFile.create()` runs inside the existing `$transaction()` block. If it fails, the entire issuance rolls back. ✓

#### badge-issuance.service.ts — `findOne()` (lines 928–996)

```typescript
include: {
  // ... existing includes ...
  evidenceFiles: true, // Story 12.5
},
// ...
const evidence: EvidenceItem[] = (badge.evidenceFiles || []).map((ef) => ({
  id: ef.id,
  type: ef.type as 'FILE' | 'URL',
  name: ef.type === 'URL'
    ? ef.sourceUrl ? new URL(ef.sourceUrl).hostname : 'URL'
    : ef.originalName,
  url: ef.type === 'URL' ? ef.sourceUrl! : ef.blobUrl,
  ...(ef.type === 'FILE' && { size: ef.fileSize, mimeType: ef.mimeType }),
  uploadedAt: ef.uploadedAt.toISOString(),
}));
const response = { ...badge, status: effectiveStatus, evidence };
```

- [ ] **Unified response (AC #5):** Both FILE and URL evidence returned in single `evidence[]` array. ✓
- [ ] **Backward compat:** `evidenceUrl` field still present in response via `...badge` spread (Prisma model includes `evidenceUrl`). ✓
- [ ] **Conditional spread:** `...(ef.type === 'FILE' && { size, mimeType })` — URL evidence won't have `size`/`mimeType` in response. Clean. ✓
- [ ] **Name derivation for URL type:** `new URL(ef.sourceUrl).hostname` — same pattern as issuance. **Same potential throw risk for malformed URLs.** Since these have been validated during creation (either via `issueBadge` or `addUrlEvidence`), risk is low.
- [ ] **`blobUrl` for FILE type:** Returns Azure Blob URL directly (not SAS token). Viewers will need to call the SAS endpoint separately. This is the existing pattern for `findOne()`. ✓
- [ ] **No SAS token generation for URL-type evidence:** Correct — URL-type evidence returns `sourceUrl` directly (no Azure storage involved). ✓

#### badge-issuance.service.ts — `generateBakedBadge()` (line 1490)

```typescript
evidenceFiles: {
  select: {
    blobUrl: true,
    type: true, // Story 12.5
    sourceUrl: true, // Story 12.5
  },
},
```

- [ ] **Baked badge evidence:** Includes both file and URL evidence in the Prisma query for assertion embedding. ✓
- [ ] **Assertion generation:** The evidence URLs from `generateBakedBadge` feed into the Open Badges assertion. URL-type evidence's `sourceUrl` will appear in the baked badge. Correct behavior — external evidence URLs should be in the assertion. ✓

#### badge-issuance.service.ts — `bulkIssueBadges()` (line 1047)

```typescript
// Previously: { templateId, recipientId, evidenceUrl: row.evidenceUrl, expiresIn }
// Now: { templateId: row.templateId, recipientId: recipient.id, expiresIn }
```

- [ ] **Clean removal:** `evidenceUrl` no longer passed to `issueBadge()` from bulk flow. ✓
- [ ] **No replacement:** Evidence will be attached post-issuance via Story 12.6. ✓

### 5. Backend — Evidence Service (AC: #4, #6)

#### evidence.service.ts — `addUrlEvidence()` (lines 131–188)

```typescript
async addUrlEvidence(badgeId, sourceUrl, userId, userRole?): Promise<EvidenceFileResponse> {
  // Badge exists check
  // IDOR: issuer or ADMIN only
  // URL validation: new URL(sourceUrl)
  // Create EvidenceFile(type=URL, sourceUrl, fileName='', fileSize=0, mimeType='', blobUrl='')
}
```

- [ ] **IDOR protection:** Mirrors `uploadEvidence()` — checks `badge.issuerId` or `ADMIN` role. ✓
- [ ] **URL validation:** Uses `new URL(sourceUrl)` — accepts any valid URL (including `ftp://`, `file://`, custom schemes). **Should restrict to `http://` and `https://` only** per spec's `@IsUrl()` in DTO. The controller validates via `AddUrlEvidenceDto` with `@IsUrl()`, but this service method can also be called directly (e.g., from `issueBadge()`). **Defense-in-depth: consider adding protocol check in service.**
- [ ] **`userRole` optional parameter:** Defaults to `undefined` → non-ADMIN path. Works for internal calls from `issueBadge()` where role is not passed. ✓
- [ ] **Response includes `type` and `sourceUrl`:** New fields in `EvidenceFileResponse`. Consistent with spec. ✓
- [ ] **Duplicate URL check missing:** No check for whether this exact `sourceUrl` already exists as evidence for this badge. Calling `addUrlEvidence()` twice with the same URL creates duplicate records. **Consider idempotency check** — query `EvidenceFile` where `{ badgeId, type: URL, sourceUrl }` before creating. Low severity — UI will prevent double-submit in 12.6.

#### evidence.service.ts — `uploadEvidence()` return (line 125)

```typescript
return {
  // ... existing fields ...
  type: 'FILE', // Story 12.5: always FILE for upload
};
```

- [ ] **Existing upload returns `type`:** Ensures all evidence responses include `type` field. ✓

#### evidence.service.ts — `listEvidence()` (lines 220–230)

```typescript
return evidenceFiles.map(file => ({
  // ... existing fields ...
  type: file.type, // Story 12.5: FILE or URL
  sourceUrl: file.sourceUrl ?? undefined, // Story 12.5: For URL-type
}));
```

- [ ] **Unified listing:** Returns both FILE and URL evidence from `findMany()`. ✓
- [ ] **`sourceUrl ?? undefined`:** Converts `null` (from Prisma) to `undefined` (for JSON serialization — omitted from response). ✓
- [ ] **Sorting:** `orderBy: { uploadedAt: 'desc' }` — most recent first. Both FILE and URL evidence sorted together. ✓

#### evidence.service.ts — `generateDownloadSas()` guard (line 255)

```typescript
if (evidenceFile.type === EvidenceType.URL) {
  throw new BadRequestException(
    'URL-type evidence does not support download/preview. Use the source URL directly.'
  );
}
```

- [ ] **URL download rejection (AC #6):** URL-type evidence cannot be downloaded/previewed via SAS. Correct — URLs point to external resources. ✓
- [ ] **Error message helpful:** Tells the user to use the source URL directly. ✓
- [ ] **Applies to both download and preview:** `generatePreviewSas()` delegates to `generateDownloadSas()`. ✓

### 6. Backend — Evidence Controller

#### evidence.controller.ts — `POST /url` endpoint (lines 90–121)

```typescript
@Post('url')
@Roles(UserRole.ADMIN, UserRole.ISSUER)
@ApiOperation({ summary: 'Add URL evidence (Story 12.5)' })
@ApiBody({ schema: { type: 'object', required: ['sourceUrl'], properties: { sourceUrl: { type: 'string', format: 'uri' } } } })
async addUrlEvidence(@Param('badgeId') badgeId, @Body() body: AddUrlEvidenceDto, @Request() req) {
  return this.evidenceService.addUrlEvidence(badgeId, body.sourceUrl, req.user.userId, req.user.role);
}
```

- [ ] **Route:** `POST /api/badges/:badgeId/evidence/url` — nested under existing evidence routes. ✓
- [ ] **RBAC:** `@Roles(ADMIN, ISSUER)` — consistent with `uploadEvidence()`. ✓
- [ ] **DTO validation:** `AddUrlEvidenceDto` with `@IsUrl()` validates URL format at controller level. ✓
- [ ] **Swagger docs:** `@ApiOperation`, `@ApiBody`, `@ApiResponse` decorators present. ✓
- [ ] **Response codes:** 201 (success), 400 (invalid URL), 403 (insufficient permissions), 404 (badge not found). ✓
- [ ] **Route ordering concern:** `@Post('url')` is defined AFTER `@Post()` (file upload). NestJS routes are matched top-to-bottom; `@Post('url')` is a more specific match than `@Post()` with `@UseInterceptors(FileInterceptor)`. **Verify that `POST /url` is not caught by the file upload interceptor.** The `FileInterceptor` would only process requests with `multipart/form-data` content type, and `POST /url` sends JSON. No conflict expected. ✓

#### evidence/dto/upload-evidence.dto.ts — `AddUrlEvidenceDto`

```typescript
export class AddUrlEvidenceDto {
  @IsUrl()
  sourceUrl: string;
}
```

- [ ] **Minimal DTO:** Single field, single validator. Clean. ✓
- [ ] **`@IsUrl()` defaults:** By default `class-validator`'s `@IsUrl()` accepts `http` and `https` protocols and requires TLD. This is more restrictive than the service's `new URL()` check. The DTO validation runs first, so protocol restriction is enforced. ✓

#### evidence/dto/upload-evidence.dto.ts — `EvidenceFileResponse` updates

```typescript
export interface EvidenceFileResponse {
  // ... existing fields ...
  type?: string; // Story 12.5: 'FILE' | 'URL'
  sourceUrl?: string; // Story 12.5: For URL-type evidence
}
```

- [ ] **Optional fields:** `type?` and `sourceUrl?` — backward compatible with existing consumers that don't expect these fields. ✓
- [ ] **`type?: string`:** Could be more specific as `type?: 'FILE' | 'URL'`. Using `string` is technically looser. Since this is an interface (not runtime), it's a minor type safety concern. ✓

### 7. Backend — Bulk Issuance CSV Changes (Task 7)

#### csv-parser.service.ts

```typescript
// Before: const optionalHeaders = ['evidenceUrl', 'expiresIn'];
// After:  const optionalHeaders = ['expiresIn'];
// URL validation block removed
// Return object: evidenceUrl field removed
```

- [ ] **Header change:** `evidenceUrl` no longer recognized. CSVs with this header will fail validation (`unknown header` error or silently ignored). **Verify behavior:** The `validateHeaders()` method checks all actual headers against `allHeaders`. If old CSV with `evidenceUrl` header is uploaded, it should fail with "Unknown headers" error. This is correct — forces users to use new template. ✓
- [ ] **URL validation removed:** `isValidURL(row.evidenceUrl)` block deleted. No orphaned `isValidURL()` method concern — it's used elsewhere. ✓
- [ ] **Return object clean:** No `evidenceUrl` in parsed row output. ✓

#### bulk-issue-badges.dto.ts

```typescript
export interface BulkIssuanceRow {
  recipientEmail: string;
  templateId: string;
  // evidenceUrl REMOVED — PO decision 2026-02-22
  // Evidence attached post-issuance via two-step flow (Story 12.6)
  expiresIn?: number;
}
```

- [ ] **Comment preserved:** PO decision reference kept for audit trail. ✓
- [ ] **`narrativeJustification` missing:** This field exists in the bulk issuance v2 flow (`BulkIssuanceService.createSession`) but not in the legacy `BulkIssuanceRow` used by `CSVParserService`. Two separate bulk paths — no issue. ✓

#### bulk-issuance.service.ts — Template + Flow

- [ ] **CSV template header:** `badgeTemplateId,recipientEmail,narrativeJustification` (3 columns, down from 4). ✓
- [ ] **Template comments:** `evidenceUrl` field specification removed. ✓
- [ ] **Example rows:** No evidence URL in examples. ✓
- [ ] **`PreviewRow` interface:** `evidenceUrl` removed. Clean. ✓
- [ ] **Sanitization:** `row.evidenceUrl` sanitization call removed. ✓
- [ ] **Validation flow:** `row.evidenceUrl` no longer passed to preview or error rows. ✓
- [ ] **`issueBadge()` call:** `evidenceUrl` no longer passed. ✓

#### csv-validation.service.ts

```typescript
// Removed from validateRow():
//   const urlResult = this.validateEvidenceUrl(row.evidenceUrl);
//   if (!urlResult.valid) errors.push(urlResult.error!);
// Removed from validateRowWithDbCheck() (same pattern)
```

- [ ] **Both paths cleaned:** `validateRow()` and `validateRowWithDbCheck()` — both remove URL validation. ✓
- [ ] **`validateEvidenceUrl()` method retained:** The private method still exists in the class but is no longer called. **Dead code.** Consider removing the method itself. **Non-blocking — can be cleaned in 12.9 pre-UAT hygiene.**

### 8. Frontend — Bulk Preview Changes

#### BulkPreviewTable.tsx

```tsx
// Removed from interface: evidenceUrl?: string;
// Removed from thead: <th>Evidence URL</th>
// Removed from tbody: <td>{row.evidenceUrl ? <a>...</a> : <span>—</span>}</td>
```

- [ ] **Column fully removed:** Header, body cell, link rendering — all clean. ✓
- [ ] **No orphan styles:** The `truncate max-w-[200px]` class was evidence-URL-specific. No other columns affected. ✓

#### BulkPreviewPage.tsx

- [ ] **Interface update:** `evidenceUrl` removed from `PreviewRow` interface. Matches backend's `PreviewRow`. ✓

#### BulkPreviewTable.test.tsx

- [ ] **Test data:** `evidenceUrl` removed from mock row. ✓
- [ ] **Header assertion:** `Evidence URL` header no longer asserted. ✓

### 9. Backend — Tests

#### evidence.service.spec.ts (177 new lines)

**addUrlEvidence Tests (5 tests):**
- [ ] `should create URL-type evidence record` — verifies `type: 'URL'`, `sourceUrl`, `originalName` from hostname. ✓
- [ ] `should validate URL format` — `'not-a-url'` → `BadRequestException`. ✓
- [ ] `should enforce IDOR protection (issuer or ADMIN)` — non-issuer, non-ADMIN → `ForbiddenException`. ✓
- [ ] `should throw NotFoundException for invalid badge` — `null` badge → `NotFoundException`. ✓
- [ ] `should allow ADMIN to add URL evidence for any badge` — ADMIN bypasses issuer check. ✓

**listEvidence Unified Test (1 test):**
- [ ] `should return both FILE and URL type evidence` — verifies `result[0].type === 'FILE'`, `result[1].type === 'URL'`, `sourceUrl` present for URL, `undefined` for FILE. ✓

**Download/Preview Guard (1 test):**
- [ ] `should reject download/preview for URL-type evidence` — `type: 'URL'` → `BadRequestException`. ✓

**Test coverage assessment:**
- [ ] Missing: `addUrlEvidence` with duplicate URL (same badge + same sourceUrl). **Non-blocking** — no dedup logic exists in implementation.
- [ ] Missing: `listEvidence` with only FILE evidence (pre-12.5 scenario). Existing tests cover this implicitly. ✓
- [ ] Missing: `addUrlEvidence` with very long URL. `@IsUrl()` in DTO handles this at controller level. ✓

#### badge-issuance.service.spec.ts (56 new lines)

- [ ] **`issueBadge` creates URL evidence:** Verifies `evidenceFile.create` called with `type: 'URL'`, `sourceUrl`. ✓
- [ ] **`findOne` returns unified evidence:** Verifies `evidence[]` array in response with correct `EvidenceItem` shape. ✓
- [ ] **`generateBakedBadge` includes type/sourceUrl:** Verifies evidence query includes new fields. ✓
- [ ] **Mock setup:** `evidenceFile.create` and `badge.findUnique` (re-query) properly mocked. ✓

#### bulk-issuance.service.spec.ts (5 additions, 13 deletions)

- [ ] **Template tests:** `evidenceUrl` removed from `toContain` assertions. `not.toContain` NOT added (unlike E2E test). **Consider adding negative assertion** (`expect(headerLine).not.toContain('evidenceUrl')`) for completeness. Minor.
- [ ] **CSV content:** Test strings updated to 2-column format. ✓
- [ ] **Pass-through test:** Renamed from "should pass evidenceUrl through to issueBadge" to "should pass expiresIn through to issueBadge when no evidenceUrl". ✓

#### csv-validation.service.spec.ts (3 additions, 23 deletions)

- [ ] **`evidenceUrl` removed from all `validateRow()` inputs.** ✓
- [ ] **URL validation test deleted:** "should reject row with invalid URL" test removed. ✓
- [ ] **Error count assertions:** `>= 3` → `>= 2` (one fewer validation: no URL check). ✓
- [ ] **DB validation tests:** All `evidenceUrl` fields removed from `validateRowWithDbCheck()` test data. ✓

#### E2E Tests (test/badge-issuance.e2e-spec.ts)

- [ ] **Bulk CSV content:** `evidenceUrl` column removed from 3 test CSV strings. ✓
- [ ] **Partial failure test:** CSV no longer includes evidence URLs. ✓

#### E2E Tests (test/bulk-issuance-template.e2e-spec.ts)

- [ ] **Template header assertion:** `toContain('evidenceUrl')` → `not.toContain('evidenceUrl')`. Clean inversion. ✓

### 10. Cross-Cutting Concerns

#### Security

- [ ] **IDOR on new endpoint:** `addUrlEvidence()` checks `badge.issuerId === userId || ADMIN`. Consistent with existing pattern. ✓
- [ ] **URL injection:** `sourceUrl` stored as-is (validated by `@IsUrl()` at DTO level and `new URL()` at service level). Frontend must sanitize when rendering (Story 12.6 responsibility). No XSS risk in backend. ✓
- [ ] **SSRF risk:** `sourceUrl` is stored, not fetched server-side. No SSRF concern. ✓

#### Performance

- [ ] **`findOne()` now includes `evidenceFiles`:** Additional JOIN. Low impact — evidence files per badge are typically 0–3. ✓
- [ ] **Re-query in `issueBadge()` transaction:** Extra `findUnique` inside `$transaction`. Only triggered when `dto.evidenceUrl` is present. Acceptable. ✓
- [ ] **Migration script:** Sequential per-badge processing without `$transaction`. For large datasets, consider batching (`createMany` with `skipDuplicates`). Current implementation acceptable for expected data volume (< 1000 badges with `evidenceUrl`). ✓

#### Data Integrity

- [ ] **No unique constraint on `(badgeId, sourceUrl, type)`:** Multiple URL-type evidence files with the same `sourceUrl` can be created for the same badge. Intentional — different issuers may add the same URL as evidence. ✓ (but see duplicate concern in Section 5)
- [ ] **`Badge.evidenceUrl` and `EvidenceFile(type=URL)` can diverge:** If `Badge.evidenceUrl` is updated directly (bypassing service), the corresponding `EvidenceFile` won't be updated. Since `evidenceUrl` is deprecated and only written at issuance, this is acceptable. ✓

---

## Summary of Issues

### Must Fix (Blocking)

None identified. Implementation is clean and consistent.

### Should Fix (Non-Blocking)

| # | Issue | Severity | File |
|---|-------|----------|------|
| **S1** | `issueBadge()`: `new URL(dto.evidenceUrl).hostname` can throw if `evidenceUrl` is malformed (no URL validation in `IssueBadgeDto`) | Low | `badge-issuance.service.ts` |
| **S2** | `addUrlEvidence()` service method accepts any valid URL scheme (`ftp://`, `file://`, etc.) — `@IsUrl()` on DTO restricts to http/https, but direct service calls don't. Defense-in-depth: add protocol check in service | Low | `evidence.service.ts` |
| **S3** | `validateEvidenceUrl()` method in `csv-validation.service.ts` is now dead code — no longer called anywhere | Low | `csv-validation.service.ts` |
| **S4** | Down migration (`migrate-evidence-down.ts`): per-badge log line is inside `if (!isDryRun)` block — dry-run doesn't show which badges would be restored | Low | `migrate-evidence-down.ts` |
| **S5** | `EvidenceFileResponse.type` typed as `string` instead of `'FILE' | 'URL'` union — minor type safety gap | Low | `upload-evidence.dto.ts` |

### Design Deviations (Informational)

| # | Deviation | Impact |
|---|-----------|--------|
| **D1** | No duplicate URL evidence check in `addUrlEvidence()` — same URL can be added multiple times to same badge | None — UI will prevent in Story 12.6 |
| **D2** | Story spec AC #3 mentions "accepts both file uploads AND URL evidence in a unified request" — implementation uses separate endpoints (`POST /evidence` for files, `POST /evidence/url` for URLs) | None — separate endpoints are cleaner for content-type handling |
| **D3** | `EvidenceItem` interface in `badge-issuance.service.ts` is not exported/shared — Story 12.6 frontend will need its own type definition | None — standard API contract approach |

---

## Checklist Before Approval

- [ ] S1–S5 triaged (fix or defer to 12.9)
- [ ] All 8 ACs verified against implementation
- [ ] `tsc --noEmit` clean (both BE + FE)
- [ ] `eslint --max-warnings=0` clean (both BE + FE)
- [ ] Backend tests pass (`npx jest --testPathPatterns="evidence"`)
- [ ] Badge issuance tests pass (`npx jest --testPathPatterns="badge-issuance"`)
- [ ] Bulk issuance tests pass (`npx jest --testPathPatterns="bulk-issuance"`)
- [ ] CSV validation tests pass (`npx jest --testPathPatterns="csv-validation"`)
- [ ] E2E tests pass (`npx jest --config test/jest-e2e.json`)
- [ ] Prisma migration applies cleanly (`npx prisma migrate deploy`)
- [ ] Migration script runs with `--dry-run` (no errors)
- [ ] `POST /api/badges/:badgeId/evidence/url` returns 201 with valid URL
- [ ] `POST /api/badges/:badgeId/evidence/url` returns 400 with invalid URL
- [ ] `POST /api/badges/:badgeId/evidence/url` returns 403 for non-issuer
- [ ] `GET /api/badges/:id` returns `evidence[]` with both FILE and URL items
- [ ] `GET /api/badges/:badgeId/evidence/:fileId/download` returns 400 for URL-type evidence
- [ ] Bulk CSV template no longer includes `evidenceUrl` column
- [ ] Bulk preview table no longer shows evidence URL column
