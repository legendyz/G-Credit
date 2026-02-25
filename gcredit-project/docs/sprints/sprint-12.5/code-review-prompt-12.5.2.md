# Code Review Prompt — Story 12.5.2: Remove Legacy `Badge.evidenceUrl` Column (D-4)

**Commit:** `59b7e19` — `feat(12.5.2): remove legacy Badge.evidenceUrl column (D-4)`
**Branch:** `sprint-12.5/deferred-cleanup`
**Base:** `f6ccfe8` (12.5.1 acceptance)
**Diff stats:** 9 files changed, +214 / -189 lines

---

## Story Summary

Remove dead `evidenceUrl` column from Badge model. Schema-only cleanup — superseded by `EvidenceFile` relation in Sprint 12. Low risk.

---

## Changed Files (Source Code)

### 1. `backend/prisma/schema.prisma` (-1 line)

```diff
 model Badge {
   id               String        @id @default(uuid())
   templateId       String
   recipientId      String
   issuerId         String
-  evidenceUrl      String?       // Azure Blob Storage URL
   issuedAt         DateTime      @default(now())
   expiresAt        DateTime?     // Calculated from expiresIn
   status           BadgeStatus   @default(PENDING)
```

### 2. `backend/prisma/migrations/20260225033009_remove_badge_evidence_url/migration.sql` (+8 lines, new file)

```sql
/*
  Warnings:

  - You are about to drop the column `evidenceUrl` on the `badges` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "badges" DROP COLUMN "evidenceUrl";
```

### 3. `backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts` (-2 lines)

```diff
 export interface BulkIssuanceRow {
   recipientEmail: string;
   templateId: string;
-  // evidenceUrl REMOVED — PO decision 2026-02-22
-  // Evidence attached post-issuance via two-step flow (Story 12.6)
   expiresIn?: number;
 }
```

### 4. `backend/test/factories/badge.factory.ts` (-5 lines)

```diff
 export interface CreateBadgeOptions {
   issuerId: string; // Required: issuer user ID
   status?: BadgeStatus;
   claimToken?: string;
-  evidenceUrl?: string;
   expiresAt?: Date;
   claimedAt?: Date;

   ...

   async createBadge(options: CreateBadgeOptions): Promise<Badge> {
-    const uniqueId = uuidv4().substring(0, 8);
     const badgeId = uuidv4(); // Generate badge ID upfront for assertion URL
     const status = options.status || BadgeStatus.PENDING;

   ...

         issuerId: options.issuerId,
         status,
         claimToken,
-        evidenceUrl:
-          options.evidenceUrl ||
-          `https://example.com/evidence/${this.testPrefix}-${uniqueId}.pdf`,
         expiresAt,
         claimedAt: options.claimedAt,
```

### 5. `backend/scripts/migrate-evidence.ts` (-98 lines, DELETED)

Data migration script that migrated `Badge.evidenceUrl` → `EvidenceFile(type=URL)`. No longer needed since column is now dropped.

### 6. `backend/scripts/migrate-evidence-down.ts` (-67 lines, DELETED)

Reverse migration script that restored `Badge.evidenceUrl` from `EvidenceFile`. No longer needed.

---

## Doc/Config Changes

| File | Change |
|------|--------|
| `12.5.2-remove-evidence-url.md` | Status → `review`, all 7 ACs checked, Dev Agent Record added |
| `dev-prompt-12.5.2.md` | New — dev prompt (created by SM) |
| `sprint-status.yaml` | `12.5-2-remove-badge-evidence-url: backlog` → `review` |

---

## AC Verification Checklist

| # | Acceptance Criteria | Status | Evidence |
|---|---------------------|--------|----------|
| AC-1 | `evidenceUrl` removed from Badge model in `schema.prisma` | ⬜ | Diff §1: line removed |
| AC-2 | Prisma migration: `ALTER TABLE "badges" DROP COLUMN "evidenceUrl"` | ⬜ | Diff §2: migration SQL — single statement |
| AC-3 | Migration runs without data loss in other columns | ⬜ | Migration SQL touches only `evidenceUrl` column |
| AC-4 | All 855+ backend tests pass | ⬜ | Dev report: 855 passed (28 skipped, 0 failures) |
| AC-5 | All 735+ frontend tests pass | ⬜ | Dev report: 735 passed (no-op, 0 failures) |
| AC-6 | Stale comment in `bulk-issue-badges.dto.ts` cleaned up | ⬜ | Diff §3: 2 comment lines removed |
| AC-7 | `prisma generate` produces types without `evidenceUrl` | ⬜ | Dev reports regenerated client |

---

## Review Focus Areas

### R-1: Migration Safety — Single Column Drop Only
Verify the auto-generated migration at `20260225033009_remove_badge_evidence_url/migration.sql` contains **only** `ALTER TABLE "badges" DROP COLUMN "evidenceUrl"` and no cascade/side effects.

### R-2: No Remaining `Badge.evidenceUrl` References
Grep for `evidenceUrl` (singular, as model field) across the codebase. Expected: **zero** matches in application code. The plural `evidenceUrls` references (local vars from `EvidenceFile`) in these 3 files are safe and should remain:
- `badge-issuance.service.ts` — local array from `created.evidenceFiles`
- `assertion-generator.service.ts` — method parameter `evidenceUrls?: string[]`
- `assertion-generator.service.spec.ts` — test data for assertion params

### R-3: Test Factory Cleanup (Bonus — Not in Prompt)
Dev also cleaned `badge.factory.ts`:
- Removed `evidenceUrl?` from `CreateBadgeOptions` interface
- Removed `evidenceUrl` default in `createBadge()` method
- Removed now-unused `uniqueId` variable (was only used for evidence URL)

**Verify:** No test file passes `evidenceUrl` to the factory (grep `evidenceUrl` in `test/` directory).

### R-4: Migration Script Deletion (Bonus — Not in Prompt)
Dev deleted two scripts that reference the now-dropped column:
- `scripts/migrate-evidence.ts` (98 lines) — forward migration `evidenceUrl` → `EvidenceFile`
- `scripts/migrate-evidence-down.ts` (67 lines) — reverse migration

**Verify:** These scripts are no longer referenced elsewhere (no npm scripts, no docs pointing to them).

### R-5: Historical Migration Untouched
Confirm `prisma/migrations/20260127020604_add_badge_model/migration.sql` was NOT modified (historical migrations must stay intact).

---

## Coding Standards Check

| # | Rule | Check |
|---|------|-------|
| 1 | All code in English | ⬜ N/A — deletions only |
| 5 | NestJS Logger only | ⬜ N/A — no new logging |
| 7 | TODO format `// TODO(TD-XXX)` | ⬜ N/A — no new TODOs |

---

## Verdict Template

```
## Code Review: Story 12.5.2

**Verdict:** Approved / Approved with Comments / Changes Required

### AC Status
- AC-1: ✅/❌
- AC-2: ✅/❌
- AC-3: ✅/❌
- AC-4: ✅/❌
- AC-5: ✅/❌
- AC-6: ✅/❌
- AC-7: ✅/❌

### Findings
(list any issues, blockers, or suggestions)

### Summary
(brief overall assessment)
```
