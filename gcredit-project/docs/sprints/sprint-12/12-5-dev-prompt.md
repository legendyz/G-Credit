# Dev Prompt: Story 12.5 — Evidence Unification: Data Model + Migration

**Story:** 12.5 (12h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Depends On:** Story 12.4 ACCEPTED (commit `64ab874`)
**Story Spec:** `sprint-12/12-5-evidence-unification-data-model.md`

---

## Objective

Unify the dual evidence system (`Badge.evidenceUrl` string field + `EvidenceFile` table) into a single `EvidenceFile`-based model with `FILE` and `URL` type support. This includes a Prisma schema migration, a standalone data migration script, updating all evidence consumers in the badge-issuance pipeline, and extending the evidence API to support URL-type evidence alongside file uploads.

**This is a BACKEND-ONLY story.** Frontend UI changes are deferred to Story 12.6.

---

## Acceptance Criteria Summary

From the story doc — 8 ACs:

| # | AC | Summary |
|---|-----|---------|
| 1 | EvidenceFile type field | `EvidenceFile` model supports `type` field: `FILE` \| `URL` |
| 2 | Migration script | Converts existing `Badge.evidenceUrl` → `EvidenceFile(type=URL)` records |
| 3 | Badge.evidenceUrl deprecated | Kept in schema for rollback, not used in new code paths |
| 4 | Unified issuance API | Badge issuance accepts both file uploads AND URL evidence |
| 5 | Unified badge detail | `GET /api/badges/:id` returns unified evidence list (files + URLs) |
| 6 | Verification evidence | FILE → SAS token, URL → direct link |
| 7 | No regression | All existing tests pass |
| 8 | Reversible migration | Down migration restores `evidenceUrl` from `EvidenceFile(type=URL)` |

---

## Current Codebase State

### Backend — Prisma Schema (Evidence-Related Models)

**`backend/prisma/schema.prisma`** — Badge model (lines 199–243):
```prisma
model Badge {
  id               String        @id @default(uuid())
  templateId       String
  recipientId      String
  issuerId         String
  evidenceUrl      String?       // Azure Blob Storage URL  ← THIS FIELD IS THE PROBLEM
  issuedAt         DateTime      @default(now())
  expiresAt        DateTime?
  status           BadgeStatus   @default(PENDING)
  visibility       BadgeVisibility @default(PUBLIC)
  claimToken       String?       @unique
  claimedAt        DateTime?
  revokedAt        DateTime?
  revokedBy        String?
  revocationReason String?       @db.Text
  revocationNotes  String?       @db.Text
  assertionJson    Json
  recipientHash    String
  verificationId   String        @unique @default(uuid())
  metadataHash     String?
  template         BadgeTemplate @relation(fields: [templateId], references: [id])
  recipient        User          @relation("BadgesReceived", fields: [recipientId], references: [id])
  issuer           User          @relation("BadgesIssued", fields: [issuerId], references: [id])
  revoker          User?         @relation("RevokedBadges", fields: [revokedBy], references: [id])
  evidenceFiles    EvidenceFile[]
  shares           BadgeShare[]
  @@map("badges")
}
```

**`backend/prisma/schema.prisma`** — EvidenceFile model (lines 286–301):
```prisma
model EvidenceFile {
  id           String   @id @default(uuid())
  badgeId      String
  fileName     String   @db.VarChar(255)
  originalName String   @db.VarChar(255)
  fileSize     Int      // Bytes
  mimeType     String   @db.VarChar(100)
  blobUrl      String   @db.Text // Azure Blob URL
  uploadedBy   String
  uploadedAt   DateTime @default(now())
  badge        Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  uploader     User     @relation("EvidenceUploader", fields: [uploadedBy], references: [id])
  @@index([badgeId])
  @@map("evidence_files")
}
```

**Key Problem:** `Badge.evidenceUrl` stores a single URL string at issuance time, while `EvidenceFile` stores uploaded files post-issuance. These two systems are disconnected — badge detail shows one, evidence list shows the other. Frontend has to check both.

---

### Backend — Evidence Service

**`backend/src/evidence/evidence.service.ts`** (217 lines):
```typescript
@Injectable()
export class EvidenceService {
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf', 'image/png', 'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async uploadEvidence(badgeId, file, uploadedBy, userRole?): Promise<EvidenceFileResponse> {
    // 1. Validate badge exists
    // 2. IDOR protection (issuer or ADMIN only)
    // 3. Validate file size (10MB max)
    // 4. Validate MIME type
    // 5. Magic-byte validation
    // 6. Generate filename: {badgeId}/{fileId}-{sanitized}
    // 7. Upload to Azure Blob Storage
    // 8. Create EvidenceFile record
    return { id, fileName, originalName, fileSize, mimeType, blobUrl, uploadedAt };
  }

  async listEvidence(badgeId, userId, userRole?): Promise<EvidenceFileResponse[]> {
    // RBAC: recipient or ADMIN
    // Returns all EvidenceFile records for badge
  }

  async generateDownloadSas(badgeId, fileId, userId, userRole?): Promise<EvidenceSasResponse> {
    // RBAC check, generate SAS token (5-min expiry)
    return { url, expiresAt, isImage };
  }

  async generatePreviewSas(badgeId, fileId, userId, userRole?): Promise<EvidenceSasResponse> {
    // Same as downloadSas
  }
}
```

**`backend/src/evidence/evidence.controller.ts`** (181 lines):
| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/badges/:badgeId/evidence` | Upload file (multipart, ADMIN/ISSUER) |
| `GET` | `/api/badges/:badgeId/evidence` | List evidence files |
| `GET` | `/api/badges/:badgeId/evidence/:fileId/download` | Generate download SAS |
| `GET` | `/api/badges/:badgeId/evidence/:fileId/preview` | Generate preview SAS |

**`backend/src/evidence/dto/upload-evidence.dto.ts`** (28 lines):
```typescript
export class UploadEvidenceDto {
  @IsOptional()
  @IsString()
  originalName?: string;
}

export interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: Date;
}

export interface EvidenceSasResponse {
  url: string;
  expiresAt: Date;
  isImage: boolean;
}
```

**`backend/src/evidence/evidence.module.ts`** (13 lines):
- Imports `PrismaModule`
- Provides `EvidenceService`, `EvidenceController`
- Exports `EvidenceService`

---

### Backend — Badge Issuance Service (Evidence Touchpoints)

**`backend/src/badge-issuance/badge-issuance.service.ts`** (1596 lines) — 6 evidence touchpoints:

**Touchpoint 1: `issueBadge()` (lines 110–170)** — Creates badge with `evidenceUrl`:
```typescript
const created = await tx.badge.create({
  data: {
    templateId: dto.templateId,
    recipientId: dto.recipientId,
    issuerId,
    evidenceUrl: dto.evidenceUrl,  // ← WRITES TO Badge.evidenceUrl
    issuedAt,
    expiresAt,
    status: BadgeStatus.PENDING,
    claimToken,
    recipientHash: this.assertionGenerator.hashEmail(recipient.email),
    assertionJson: {},
  },
  include: {
    template: true,
    recipient: true,
    issuer: true,
    evidenceFiles: true,
  },
});

// Build evidence URLs for assertion
const evidenceUrls =
  created.evidenceFiles?.map((e) => e.blobUrl) ||  // Sprint 4: blobUrl
  (dto.evidenceUrl ? [dto.evidenceUrl] : []);       // Fallback to single URL

const assertion = this.assertionGenerator.generateAssertion({
  badgeId: created.id,
  verificationId: created.verificationId,
  template, recipient, issuer: issuer!,
  issuedAt, expiresAt: expiresAt || undefined,
  evidenceUrls,  // Array of all evidence URLs
});
```

**Touchpoint 2: `getReceivedBadges()` (lines 600–680)** — Returns `evidenceUrl` in response:
```typescript
badges.map((badge) => ({
  id: badge.id,
  status: badge.status,
  // ...
  evidenceUrl: badge.evidenceUrl,  // ← READS Badge.evidenceUrl
  template: badge.template,
  issuer: { /* ... */ },
}))
```

**Touchpoint 3: `getIssuedBadges()` (lines 780–860)** — Returns `evidenceUrl` in response:
```typescript
badges.map((badge) => ({
  id: badge.id,
  // ...
  evidenceUrl: badge.evidenceUrl,  // ← READS Badge.evidenceUrl
  template: badge.template,
  recipient: { /* ... */ },
  issuer: { /* ... */ },
}))
```

**Touchpoint 4: `findOne()` (lines 890–940)** — Badge detail (does NOT include evidenceFiles):
```typescript
async findOne(id: string) {
  const badge = await this.prisma.badge.findUnique({
    where: { id },
    include: {
      template: true,
      recipient: true,
      issuer: true,
      revoker: true,
      // NOTE: evidenceFiles NOT included here!
    },
  });
  // Returns badge with evidenceUrl field from Badge model
  return { ...badge, status: effectiveStatus };
}
```

**Touchpoint 5: `bulkIssueBadges()` (lines 950–1010)** — Passes `evidenceUrl` to `issueBadge()`:
```typescript
const badge = await this.issueBadge(
  {
    templateId: row.templateId,
    recipientId: recipient.id,
    evidenceUrl: row.evidenceUrl,  // ← From CSV row
    expiresIn: row.expiresIn,
  },
  issuerId,
);
```

**Touchpoint 6: `generateBakedBadge()` (lines 1400–1480)** — Queries evidenceFiles for baked badge:
```typescript
const badge = await this.prisma.badge.findUnique({
  where: { id: badgeId },
  include: {
    template: { select: { /* ... */ } },
    recipient: { select: { /* ... */ } },
    issuer: { select: { /* ... */ } },
    evidenceFiles: {
      select: { blobUrl: true },  // ← Only queries blobUrl
    },
  },
});
```

---

### Backend — Assertion Generator

**`backend/src/badge-issuance/services/assertion-generator.service.ts`** (188 lines):
```typescript
generateAssertion(params: {
  badgeId: string;
  verificationId: string;
  template: BadgeTemplate;
  recipient: User;
  issuer: User;
  issuedAt: Date;
  expiresAt?: Date;
  evidenceUrl?: string;         // Single URL (backward compat)
  evidenceUrls?: string[];      // Multiple evidence URLs
}) {
  const assertion = {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Assertion',
    // ...
    // Evidence handling: prefers array, falls back to single
    ...(evidenceUrls && evidenceUrls.length > 0 && {
      evidence: evidenceUrls,
    }),
    ...(evidenceUrl && !evidenceUrls && {
      evidence: [evidenceUrl],
    }),
  };
  return assertion;
}
```

---

### Backend — CSV Parser Service

**`backend/src/badge-issuance/services/csv-parser.service.ts`** (150 lines):
```typescript
parseBulkIssuanceCSV(fileBuffer: Buffer): BulkIssuanceRow[] {
  // Headers: recipientEmail (required), templateId (required),
  //          evidenceUrl (optional), expiresIn (optional)
  // Validates URL format for evidenceUrl
}
```

**`backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts`** (31 lines):
```typescript
export class BulkIssuanceRow {
  @IsEmail()
  recipientEmail: string;

  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;     // ← Used to set Badge.evidenceUrl

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresIn?: number;
}
```

**`backend/src/badge-issuance/dto/issue-badge.dto.ts`** (42 lines):
```typescript
export class IssueBadgeDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;     // ← Used to set Badge.evidenceUrl

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresIn?: number;
}
```

---

### Backend — Seed Data

**`backend/prisma/seed-uat.ts`** (lines 977–1010) — 2 evidence file records:
```typescript
const evidenceFile1 = await prisma.evidenceFile.create({
  data: {
    badgeId: badge1.id,
    fileName: `${badge1.id}/cert-cloud-2026.pdf`,
    originalName: 'cloud-cert-2026.pdf',
    fileSize: 245760,
    mimeType: 'application/pdf',
    blobUrl: 'https://gcreditdevstoragelz.blob.core.windows.net/evidence/placeholder-cloud-cert.pdf',
    uploadedBy: admin.id,
  },
});
// Similar for evidenceFile2 (innovation-proposal-q1.pdf)
```

**Note:** No `type` or `sourceUrl` fields exist yet. After migration, these should get `type: 'FILE'` (default).

---

### Backend — Evidence Service Spec

**`backend/src/evidence/evidence.service.spec.ts`** (321 lines):
- Mocks: `PrismaService`, `StorageService`
- Test groups: `uploadEvidence` (file validation, IDOR), `listEvidence` (RBAC), `generateDownloadSas` (SAS token)
- All tests use FILE-type evidence only

---

### Frontend — Evidence References (Informational — UI changes in Story 12.6)

**49+ references** to `evidenceUrl` / `evidenceFile` across codebase:
| File | Refs | Context |
|------|------|---------|
| `badge-issuance.service.ts` | 16 | Core service (covered above) |
| `badge-issuance.service.spec.ts` | 15 | Test mocks/assertions |
| `assertion-generator.service.ts` | 8 | Assertion evidence handling |
| `csv-parser.service.ts` | 5 | Bulk CSV parsing |
| `IssueBadgePage.tsx` | 6+ | Evidence URL input field |
| `BulkPreviewTable.tsx` | 4 | Bulk preview display |
| `BadgeDetailModal/EvidenceSection.tsx` | 8+ | Evidence display UI |
| `VerifyBadgePage.tsx` | 3 | Verification evidence display |
| `types/badge.ts` | 2 | TypeScript interfaces |
| `badgesApi.ts` | 1 | API call `evidenceUrl` |

**These frontend files are NOT modified in Story 12.5.** Backend API changes must maintain backward compatibility for 1 sprint (keep `evidenceUrl` field in responses).

---

## Tasks (1–8)

### Task 1: Prisma Schema Changes — Phase A (AC: #1)

**Goal:** Add `EvidenceType` enum and new fields to `EvidenceFile` model. Schema-only — no data changes.

**File:** `backend/prisma/schema.prisma`

**1a. Add enum before EvidenceFile model:**
```prisma
// Sprint 12 Story 12.5: Evidence Unification
enum EvidenceType {
  FILE
  URL
}
```

**1b. Update EvidenceFile model:**
```prisma
model EvidenceFile {
  id           String       @id @default(uuid())
  badgeId      String
  fileName     String       @db.VarChar(255)
  originalName String       @db.VarChar(255)
  fileSize     Int          // Bytes — 0 for URL-type
  mimeType     String       @db.VarChar(100) // empty string for URL-type
  blobUrl      String       @db.Text // Azure Blob URL — empty string for URL-type
  uploadedBy   String
  uploadedAt   DateTime     @default(now())
  type         EvidenceType @default(FILE)        // NEW: FILE or URL
  sourceUrl    String?      @db.Text              // NEW: For URL-type evidence
  badge        Badge        @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  uploader     User         @relation("EvidenceUploader", fields: [uploadedBy], references: [id])
  @@index([badgeId])
  @@map("evidence_files")
}
```

**1c. Run migration:**
```bash
cd backend
npx prisma migrate dev --name evidence-unification-type-field
npx prisma generate
```

**Verification:**
- `npx prisma db pull` should show `type EvidenceType @default(FILE)` and `sourceUrl String?` on EvidenceFile
- Existing EvidenceFile records should all have `type=FILE` (default)
- No existing data should be affected (additive-only migration)

---

### Task 2: Data Migration Script — Phase B (AC: #2, #8)

**Goal:** Standalone script to migrate all `Badge.evidenceUrl` values to `EvidenceFile(type=URL)` records. NOT inside Prisma migration — separate for control + logging + dry-run.

**File:** `backend/scripts/migrate-evidence.ts`

**Implementation:**

```typescript
/**
 * Story 12.5: Evidence Data Migration Script
 *
 * Migrates Badge.evidenceUrl → EvidenceFile(type=URL) records.
 * - Idempotent: skips if EvidenceFile(type=URL, sourceUrl=X) already exists for badge
 * - Dry-run mode: --dry-run flag to preview without writing
 * - Logging: count migrated, skipped, failed
 *
 * Usage:
 *   npx ts-node scripts/migrate-evidence.ts
 *   npx ts-node scripts/migrate-evidence.ts --dry-run
 */

import { PrismaClient, EvidenceType } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`Evidence Migration ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // 1. Find all badges with evidenceUrl set
  const badges = await prisma.badge.findMany({
    where: {
      evidenceUrl: { not: null },
    },
    select: {
      id: true,
      evidenceUrl: true,
      issuerId: true,
      issuedAt: true,
      evidenceFiles: {
        where: { type: EvidenceType.URL },
        select: { sourceUrl: true },
      },
    },
  });

  console.log(`Found ${badges.length} badges with evidenceUrl`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const badge of badges) {
    try {
      // Idempotency check: skip if URL-type evidence already exists
      const alreadyMigrated = badge.evidenceFiles.some(
        (ef) => ef.sourceUrl === badge.evidenceUrl,
      );

      if (alreadyMigrated) {
        skipped++;
        continue;
      }

      if (!isDryRun) {
        await prisma.evidenceFile.create({
          data: {
            badgeId: badge.id,
            type: EvidenceType.URL,
            sourceUrl: badge.evidenceUrl!,
            fileName: '',            // Not applicable for URLs
            originalName: new URL(badge.evidenceUrl!).hostname,
            fileSize: 0,
            mimeType: '',
            blobUrl: '',             // Not applicable for URLs
            uploadedBy: badge.issuerId,
            uploadedAt: badge.issuedAt,
          },
        });
      }

      migrated++;
      console.log(`  ✓ Badge ${badge.id}: ${badge.evidenceUrl}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Badge ${badge.id}: ${(error as Error).message}`);
    }
  }

  console.log('='.repeat(50));
  console.log(`Results: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);

  if (isDryRun) {
    console.log('\nDry run complete. No data was written.');
    console.log('Run without --dry-run to execute migration.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Down migration script:** `backend/scripts/migrate-evidence-down.ts`

```typescript
/**
 * Story 12.5: Evidence Down Migration
 * Restores Badge.evidenceUrl from EvidenceFile(type=URL) records.
 *
 * Usage:
 *   npx ts-node scripts/migrate-evidence-down.ts
 *   npx ts-node scripts/migrate-evidence-down.ts --dry-run
 */

import { PrismaClient, EvidenceType } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`Evidence Down Migration ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // Find all URL-type evidence files
  const urlEvidence = await prisma.evidenceFile.findMany({
    where: { type: EvidenceType.URL },
    select: {
      id: true,
      badgeId: true,
      sourceUrl: true,
    },
  });

  console.log(`Found ${urlEvidence.length} URL-type evidence records`);

  let restored = 0;
  let failed = 0;

  for (const evidence of urlEvidence) {
    try {
      if (!isDryRun) {
        // Restore evidenceUrl on badge
        await prisma.badge.update({
          where: { id: evidence.badgeId },
          data: { evidenceUrl: evidence.sourceUrl },
        });

        // Delete the URL-type evidence file record
        await prisma.evidenceFile.delete({
          where: { id: evidence.id },
        });
      }

      restored++;
      console.log(`  ✓ Badge ${evidence.badgeId}: restored ${evidence.sourceUrl}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Badge ${evidence.badgeId}: ${(error as Error).message}`);
    }
  }

  console.log('='.repeat(50));
  console.log(`Results: ${restored} restored, ${failed} failed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Verification:**
- Run `--dry-run` first: should list all badges with evidenceUrl without writing
- Run without flag: should create EvidenceFile records
- Run again: should report all as "skipped" (idempotent)
- Run down migration: should restore Badge.evidenceUrl and delete URL-type records

---

### Task 3: Update `badge-issuance.service.ts` — Issuance (AC: #4)

**Goal:** When `evidenceUrl` is provided during issuance, create an `EvidenceFile(type=URL)` record instead of only setting `Badge.evidenceUrl`. Still populate `Badge.evidenceUrl` for backward compat (1 sprint).

**File:** `backend/src/badge-issuance/badge-issuance.service.ts`

**3a. Update `issueBadge()` transaction (lines 110–170):**

After creating the badge, add URL evidence as EvidenceFile within the same transaction:

```typescript
// Inside $transaction, after badge.create:
const created = await tx.badge.create({
  data: {
    templateId: dto.templateId,
    recipientId: dto.recipientId,
    issuerId,
    evidenceUrl: dto.evidenceUrl,  // KEEP for backward compat (1 sprint)
    issuedAt,
    expiresAt,
    status: BadgeStatus.PENDING,
    claimToken,
    recipientHash: this.assertionGenerator.hashEmail(recipient.email),
    assertionJson: {},
  },
  include: {
    template: true,
    recipient: true,
    issuer: true,
    evidenceFiles: true,
  },
});

// Story 12.5: Create EvidenceFile(type=URL) for URL evidence
if (dto.evidenceUrl) {
  await tx.evidenceFile.create({
    data: {
      badgeId: created.id,
      type: 'URL',                                  // EvidenceType.URL
      sourceUrl: dto.evidenceUrl,
      fileName: '',
      originalName: new URL(dto.evidenceUrl).hostname,
      fileSize: 0,
      mimeType: '',
      blobUrl: '',
      uploadedBy: issuerId,
      uploadedAt: issuedAt,
    },
  });
}

// Re-query to include the newly created URL evidence
const badgeWithEvidence = dto.evidenceUrl
  ? await tx.badge.findUnique({
      where: { id: created.id },
      include: { evidenceFiles: true },
    })
  : created;

// Build evidence URLs from unified EvidenceFile records
const evidenceUrls = (badgeWithEvidence?.evidenceFiles || []).map((e) =>
  e.type === 'URL' ? e.sourceUrl! : e.blobUrl,
);

const assertion = this.assertionGenerator.generateAssertion({
  badgeId: created.id,
  verificationId: created.verificationId,
  template,
  recipient,
  issuer: issuer!,
  issuedAt,
  expiresAt: expiresAt || undefined,
  evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
});
```

**⚠️ IMPORTANT:** The `import { EvidenceType } from '@prisma/client'` must be added at the top of the file. Or use the string literal `'URL'` which Prisma also accepts.

**3b. Evidence URLs in assertion:** After the change, `evidenceUrls` comes entirely from `EvidenceFile` records (both FILE and URL types). The fallback to `dto.evidenceUrl` is no longer needed since URL evidence is now stored as EvidenceFile.

---

### Task 4: Update Badge Detail Response (AC: #5)

**Goal:** `GET /api/badges/:id` (via `findOne()`) returns unified `evidence: EvidenceItem[]` combining both FILE and URL evidence. Keep `evidenceUrl` in response for 1-sprint backward compat.

**File:** `backend/src/badge-issuance/badge-issuance.service.ts`

**4a. Add `EvidenceItem` interface** (at top of file or in a shared DTO):
```typescript
// Story 12.5: Unified evidence item
interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;        // originalName for FILE, URL hostname for URL
  url: string;         // blobUrl for FILE (SAS generated on demand), sourceUrl for URL
  size?: number;       // only for FILE
  mimeType?: string;   // only for FILE
  uploadedAt: string;
}
```

**4b. Update `findOne()` (line 890):**
```typescript
async findOne(id: string) {
  const badge = await this.prisma.badge.findUnique({
    where: { id },
    include: {
      template: true,
      recipient: true,
      issuer: true,
      revoker: true,
      evidenceFiles: true,  // ← ADD THIS
    },
  });

  if (!badge) return null;

  // Compute effective status
  const isExpired = badge.expiresAt && badge.expiresAt < new Date()
    && badge.status !== BadgeStatus.REVOKED;
  const effectiveStatus = isExpired ? 'EXPIRED' : badge.status;

  // Story 12.5: Build unified evidence list
  const evidence: EvidenceItem[] = (badge.evidenceFiles || []).map((ef) => ({
    id: ef.id,
    type: ef.type as 'FILE' | 'URL',
    name: ef.type === 'URL'
      ? (ef.sourceUrl ? new URL(ef.sourceUrl).hostname : 'URL')
      : ef.originalName,
    url: ef.type === 'URL' ? ef.sourceUrl! : ef.blobUrl,
    ...(ef.type === 'FILE' && { size: ef.fileSize, mimeType: ef.mimeType }),
    uploadedAt: ef.uploadedAt.toISOString(),
  }));

  const response: Record<string, unknown> = {
    ...badge,
    status: effectiveStatus,
    evidence,                          // NEW: unified evidence list
    // evidenceUrl kept for backward compat (1 sprint)
  };

  // ... revocation details (unchanged)

  return response;
}
```

**4c. Update `getReceivedBadges()` (line 660):**
Currently returns `evidenceUrl: badge.evidenceUrl`. Keep this for backward compat but consider also including `evidenceFiles` in the query. Since this is a list endpoint, the story spec focuses on badge detail — keep existing behavior, just ensure `evidenceUrl` field is still present.

**4d. Update `getIssuedBadges()` (line 830):**
Same as 4c — keep `evidenceUrl: badge.evidenceUrl` for backward compat.

---

### Task 5: Update Verification Endpoint (AC: #6)

**Goal:** Evidence in verification/assertion context distinguishes FILE vs URL. FILE evidence → SAS token URL; URL evidence → direct URL.

**File:** `backend/src/badge-issuance/badge-issuance.service.ts`

**5a. Update `generateBakedBadge()` (lines 1400–1480):**

Currently queries `evidenceFiles: { select: { blobUrl: true } }`. Update to include type and sourceUrl:

```typescript
evidenceFiles: {
  select: {
    blobUrl: true,
    type: true,
    sourceUrl: true,
  },
},
```

The assertion already stored in `badge.assertionJson` contains evidence URLs. For baked badge, the assertion is read from stored JSON, not regenerated. **No further changes needed** unless evidence URLs in assertion need updating — but since assertion is immutable (Story 6.5 integrity hash), evidence in baked badge uses stored assertion.

**5b. Update assertion evidence URL generation in `issueBadge()`:**

Already handled in Task 3 — evidence URLs for assertion now come from unified `EvidenceFile` records. For FILE type, use `blobUrl`; for URL type, use `sourceUrl`.

**⚠️ Note:** The `verifyBadgeIntegrity()` method (line 1530) checks assertion hash integrity. It does NOT involve evidence directly and needs NO changes.

---

### Task 6: Extend Evidence Controller for URL-Type Evidence (AC: #4)

**Goal:** `POST /api/badges/:badgeId/evidence` should accept BOTH multipart file upload (existing) AND JSON body `{ type: 'URL', sourceUrl: '...' }` for URL-type evidence.

**File:** `backend/src/evidence/evidence.controller.ts`

**6a. Add new endpoint for URL evidence** (or modify existing POST):

The cleanest approach is to add a **new POST route** for URL-type evidence since the existing route uses `FileInterceptor` for multipart:

```typescript
@Post('url')
@Roles(UserRole.ADMIN, UserRole.ISSUER)
@ApiOperation({ summary: 'Add URL evidence (Story 12.5)' })
@ApiBody({
  description: 'URL evidence for a badge',
  schema: {
    type: 'object',
    required: ['sourceUrl'],
    properties: {
      sourceUrl: { type: 'string', format: 'uri' },
    },
  },
})
@ApiResponse({ status: 201, description: 'URL evidence added' })
@ApiResponse({ status: 400, description: 'Invalid URL' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@ApiResponse({ status: 404, description: 'Badge not found' })
async addUrlEvidence(
  @Param('badgeId') badgeId: string,
  @Body() body: AddUrlEvidenceDto,
  @Request() req: RequestWithUser,
) {
  return this.evidenceService.addUrlEvidence(
    badgeId,
    body.sourceUrl,
    req.user.userId,
    req.user.role,
  );
}
```

**File:** `backend/src/evidence/dto/upload-evidence.dto.ts`

Add new DTO:
```typescript
export class AddUrlEvidenceDto {
  @IsUrl()
  sourceUrl: string;
}
```

**File:** `backend/src/evidence/evidence.service.ts`

Add new method:
```typescript
/**
 * Story 12.5: Add URL-type evidence
 */
async addUrlEvidence(
  badgeId: string,
  sourceUrl: string,
  userId: string,
  userRole?: string,
): Promise<EvidenceFileResponse> {
  // Validate badge exists
  const badge = await this.prisma.badge.findUnique({
    where: { id: badgeId },
  });

  if (!badge) {
    throw new NotFoundException(`Badge ${badgeId} not found`);
  }

  // IDOR protection: issuer or ADMIN only
  if (userRole !== 'ADMIN' && badge.issuerId !== userId) {
    throw new ForbiddenException(
      'You can only add evidence for badges you issued',
    );
  }

  // Validate URL
  try {
    new URL(sourceUrl);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  // Create URL-type evidence record
  const evidenceFile = await this.prisma.evidenceFile.create({
    data: {
      badgeId,
      type: 'URL',
      sourceUrl,
      fileName: '',
      originalName: new URL(sourceUrl).hostname,
      fileSize: 0,
      mimeType: '',
      blobUrl: '',
      uploadedBy: userId,
    },
  });

  return {
    id: evidenceFile.id,
    fileName: evidenceFile.fileName,
    originalName: evidenceFile.originalName,
    fileSize: evidenceFile.fileSize,
    mimeType: evidenceFile.mimeType,
    blobUrl: evidenceFile.blobUrl,
    uploadedAt: evidenceFile.uploadedAt,
  };
}
```

**6b. Update `listEvidence()`** to return type info:

The existing `listEvidence()` returns `EvidenceFileResponse`. Now it should also return `type` and `sourceUrl`. Update the response interface:

```typescript
// Updated response interface
export interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: Date;
  type?: string;       // NEW: 'FILE' | 'URL'
  sourceUrl?: string;  // NEW: For URL-type evidence
}
```

Update `listEvidence()` return mapping to include `type` and `sourceUrl` fields.

**6c. Download/preview endpoints:** Keep FILE-only. If someone calls download/preview for a URL-type evidence, throw `BadRequestException('URL-type evidence does not support download/preview. Use the source URL directly.')`.

---

### Task 7: Remove `evidenceUrl` from Bulk Issuance CSV (PO Decision 2026-02-22)

**Goal:** Remove the `evidenceUrl` column from CSV bulk issuance entirely. Evidence will be attached post-issuance via a two-step grouped flow (Story 12.6, Tasks 7–10). This simplifies the CSV template and avoids confusing dual-path UX.

**Rationale:** (1) No production data exists — safe to clean up, (2) CSV only used for bulk issuance — small impact surface, (3) Simpler UX — avoids "fill URL in CSV AND attach evidence after".

**7a. Update CSV Parser** — `backend/src/badge-issuance/services/csv-parser.service.ts`:

```typescript
// BEFORE:
const optionalHeaders = ['evidenceUrl', 'expiresIn'];
// AFTER:
const optionalHeaders = ['expiresIn'];
```

Remove the `evidenceUrl` validation block in `validateRow()`:
```typescript
// DELETE this block:
// Validate evidenceUrl (optional)
if (row.evidenceUrl && !this.isValidURL(row.evidenceUrl)) {
  errors.push(`Invalid evidenceUrl: ${row.evidenceUrl}`);
}
```

Remove `evidenceUrl` from the return object in `validateRow()`:
```typescript
// BEFORE:
return {
  recipientEmail: row.recipientEmail.toLowerCase().trim(),
  templateId: row.templateId.trim(),
  evidenceUrl: row.evidenceUrl?.trim() || undefined,
  expiresIn: row.expiresIn ? parseInt(row.expiresIn) : undefined,
};
// AFTER:
return {
  recipientEmail: row.recipientEmail.toLowerCase().trim(),
  templateId: row.templateId.trim(),
  expiresIn: row.expiresIn ? parseInt(row.expiresIn) : undefined,
};
```

**7b. Update BulkIssuanceRow DTO** — `backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts`:

Remove `evidenceUrl` field entirely:
```typescript
export class BulkIssuanceRow {
  @IsEmail()
  recipientEmail: string;

  @IsUUID()
  templateId: string;

  // evidenceUrl REMOVED — PO decision 2026-02-22
  // Evidence attached post-issuance via two-step flow (Story 12.6)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expiresIn?: number;
}
```

**7c. Update `bulkIssueBadges()`** — `backend/src/badge-issuance/badge-issuance.service.ts` (line ~990):

```typescript
// BEFORE:
const badge = await this.issueBadge(
  {
    templateId: row.templateId,
    recipientId: recipient.id,
    evidenceUrl: row.evidenceUrl,  // ← REMOVE THIS
    expiresIn: row.expiresIn,
  },
  issuerId,
);
// AFTER:
const badge = await this.issueBadge(
  {
    templateId: row.templateId,
    recipientId: recipient.id,
    expiresIn: row.expiresIn,
  },
  issuerId,
);
```

**7d. Update `BulkPreviewTable.tsx`** — `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx`:

Remove the evidence URL column from the table. Remove all `evidenceUrl` references (4 occurrences).

**7e. Clean up tests** — Delete all `evidenceUrl` references from:
- `badge-issuance.service.spec.ts` (bulk issuance test cases)
- `badge-issuance.controller.spec.ts` (if any bulk refs)
- Any CSV parser tests

**7f. Update `IssueBadgeDto`** — `backend/src/badge-issuance/dto/issue-badge.dto.ts`:

The `evidenceUrl` field in `IssueBadgeDto` is KEPT for single badge issuance (used by Task 3). Only the bulk CSV path removes it.

**7g. Update Swagger/API doc** — Update the bulk endpoint's `@ApiBody` description:
```typescript
@ApiBody({
  description: 'CSV file with columns: recipientEmail, templateId, expiresIn (optional)',
  // ...
})
```

---

### Task 8: Tests (AC: #7)

**Goal:** All existing tests pass. Add new tests for migration script, unified evidence, and URL evidence.

**8a. Migration script tests** — `backend/scripts/migrate-evidence.spec.ts` or inline tests:

```typescript
describe('migrate-evidence', () => {
  it('should create EvidenceFile(type=URL) for badges with evidenceUrl');
  it('should skip badges already migrated (idempotent)');
  it('should handle invalid URLs gracefully');
  it('should report dry-run results without writing');
});
```

**8b. Evidence service tests** — `backend/src/evidence/evidence.service.spec.ts`:

Add tests for new `addUrlEvidence()` method:
```typescript
describe('addUrlEvidence', () => {
  it('should create URL-type evidence record');
  it('should validate URL format');
  it('should enforce IDOR protection (issuer or ADMIN)');
  it('should throw NotFoundException for invalid badge');
});
```

Add test for `listEvidence()` returning type info:
```typescript
describe('listEvidence - unified', () => {
  it('should return both FILE and URL type evidence');
  it('should include type and sourceUrl fields');
});
```

**8c. Badge issuance tests** — `backend/src/badge-issuance/badge-issuance.service.spec.ts`:

Update existing `issueBadge` tests to verify:
```typescript
it('should create EvidenceFile(type=URL) when evidenceUrl is provided');
it('should still set Badge.evidenceUrl for backward compat');
it('should build evidenceUrls from unified EvidenceFile records');
```

Update `findOne` tests to verify unified `evidence` field:
```typescript
it('should return unified evidence list with FILE and URL items');
it('should include evidenceUrl for backward compat');
```

**8d. Bulk issuance tests:**
Verify that bulk issuance WITHOUT `evidenceUrl` works correctly. All CSV-related evidence references should be removed.

**8e. E2E impact assessment:**
```bash
# Run this to find all evidenceUrl consumers that may need attention:
grep -rn "evidenceUrl" gcredit-project/frontend/src/ --include="*.ts" --include="*.tsx"
grep -rn "evidenceUrl" gcredit-project/backend/src/ --include="*.ts"
grep -rn "evidenceUrl" gcredit-project/backend/test/ --include="*.ts"
```

Frontend consumers should continue working because `evidenceUrl` is still present in all API responses for backward compat.

**8f. Existing test verification:**
```bash
cd backend
npx jest --passWithNoTests
# All existing tests should pass (AC #7)
```

---

## Dev Notes

### Architecture Patterns

- **Two-phase migration strategy:**
  - Phase A: Prisma migration (schema-only, additive) — `npx prisma migrate dev`
  - Phase B: Standalone data migration script — `npx ts-node scripts/migrate-evidence.ts`
  - DO NOT put data migration inside Prisma migration SQL
- **Backward compatibility:** `Badge.evidenceUrl` kept in schema AND in API responses for 1 sprint (Sprint 12). Removed in Sprint 13.
- **URL evidence naming:** `sourceUrl` field name (not `externalUrl`) — per Phase 2 architecture review
- **EvidenceFile for URLs:** Uses empty strings for `fileName`, `blobUrl`, `mimeType` and 0 for `fileSize` — these fields are FILE-only but required by schema (non-nullable)

### Key Decision: Empty Strings vs Nullable Fields

For URL-type evidence, `fileName`, `blobUrl`, `mimeType` are not applicable. Two options:
1. **Make them nullable** — requires Prisma migration, breaks existing code
2. **Use empty strings / zero** — no schema change for existing fields, simple guards

**Choose option 2** (empty strings/zero) to minimize migration scope. The `type` field discriminates — any code handling evidence should check `type` first.

### Schema Change Minimal Impact

Only **2 new fields** added to `EvidenceFile`:
- `type EvidenceType @default(FILE)` — existing records auto-get `FILE`
- `sourceUrl String? @db.Text` — nullable, existing records get `NULL`

No existing fields modified or removed. Additive-only migration = minimal risk.

### Assertion Immutability

The Open Badges 2.0 assertion stored in `badge.assertionJson` includes evidence URLs at issuance time. This assertion is **immutable** — changing evidence after issuance does NOT update the assertion. The integrity hash (`metadataHash`) would break if we modified it. Therefore:
- Evidence added post-issuance (via `POST /api/badges/:badgeId/evidence`) is NOT reflected in the stored assertion
- Only evidence present at issuance time appears in the assertion
- This is by design (Open Badges 2.0 spec)

### Bulk Issuance — Remove evidenceUrl from CSV (PO Decision 2026-02-22)

**Decision:** Remove `evidenceUrl` column from CSV template entirely. Evidence will be attached post-issuance via a two-step grouped flow (Story 12.6, Tasks 7–10: template-grouped bulk evidence attachment).

**Rationale:**
1. No production data exists — safe to clean up without backward compat concerns
2. CSV only used for bulk issuance — small impact surface
3. Simpler UX — avoids confusing dual-path ("fill URL in CSV" vs "attach evidence after")

**Impact:** This is a deletion, not a conversion — simpler than the original Task 7 plan. Estimated time saved: ~2h.

### Frontend Impact (Story 12.6 Scope)

Frontend currently reads both `badge.evidenceUrl` (badge detail) and `badge.evidenceFiles[]` (evidence list). After 12.5:
- `badge.evidenceUrl` still present in responses (backward compat)
- New `badge.evidence[]` field in badge detail response (unified)
- Story 12.6 will update frontend to use unified `evidence[]` instead of dual sources

### References

- [Source: sprint-12/12-5-evidence-unification-data-model.md] — Story specification with 8 ACs
- [Source: backend/prisma/schema.prisma#L199-243] — Badge model
- [Source: backend/prisma/schema.prisma#L286-301] — EvidenceFile model
- [Source: backend/src/evidence/evidence.service.ts] — Evidence service (217 lines)
- [Source: backend/src/evidence/evidence.controller.ts] — Evidence controller (181 lines)
- [Source: backend/src/evidence/dto/upload-evidence.dto.ts] — Evidence DTOs
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L110-170] — issueBadge evidence
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L890-940] — findOne
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L660,L830] — getReceivedBadges/getIssuedBadges
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L970-1010] — bulkIssueBadges
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L1400-1480] — generateBakedBadge
- [Source: backend/src/badge-issuance/services/assertion-generator.service.ts] — Assertion evidence handling
- [Source: backend/src/badge-issuance/services/csv-parser.service.ts] — CSV parser
- [Source: backend/src/badge-issuance/dto/issue-badge.dto.ts] — IssueBadgeDto
- [Source: backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts] — BulkIssuanceRow DTO
- [Source: backend/prisma/seed-uat.ts#L977-1010] — Seed evidence files
- [Source: backend/src/evidence/evidence.service.spec.ts] — Evidence tests (321 lines)

### Checklist Before Marking Done

- [ ] Prisma migration applied (`evidence-unification-type-field`)
- [ ] `npx prisma generate` successful
- [ ] EvidenceFile model has `type` (EvidenceType) and `sourceUrl` (String?) fields
- [ ] Data migration script runs successfully (`--dry-run` then real)
- [ ] Data migration is idempotent (re-run produces 0 new records)
- [ ] Down migration restores Badge.evidenceUrl from URL-type evidence
- [ ] `issueBadge()` creates EvidenceFile(type=URL) when evidenceUrl provided
- [ ] `Badge.evidenceUrl` still populated for backward compat
- [ ] `findOne()` returns unified `evidence: EvidenceItem[]`
- [ ] `findOne()` still returns `evidenceUrl` for backward compat
- [ ] `POST /api/badges/:badgeId/evidence/url` accepts URL evidence
- [ ] `listEvidence()` returns type and sourceUrl fields
- [ ] Download/preview endpoints reject URL-type evidence with clear error
- [ ] Bulk issuance CSV no longer accepts `evidenceUrl` column
- [ ] `BulkIssuanceRow` DTO has no `evidenceUrl` field
- [ ] `csv-parser.service.ts` only has `expiresIn` as optional header
- [ ] `BulkPreviewTable.tsx` has no evidence URL column
- [ ] Bulk issuance tests cleaned up (no evidenceUrl references)
- [ ] Assertion evidence URLs built from unified EvidenceFile records
- [ ] seed-uat.ts evidence records still work (type=FILE default)
- [ ] All existing backend tests pass (no regression)
- [ ] New tests for URL evidence, migration, unified retrieval
- [ ] `npx tsc --noEmit` clean (both BE + FE)
- [ ] `npx eslint --max-warnings=0` clean
- [ ] `sprint-status.yaml` updated: `12-5: review`

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
