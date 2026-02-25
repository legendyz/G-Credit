# Dev Prompt — Story 12.5.2: Remove Legacy `Badge.evidenceUrl` Column (D-4)

## Mission

Remove the dead `evidenceUrl` column from the Badge model. This is a schema-only cleanup — no application logic changes. The column has been superseded by the `EvidenceFile` relation model since Sprint 12.

**Story file:** `gcredit-project/docs/sprints/sprint-12.5/12.5.2-remove-evidence-url.md`
**Branch:** `sprint-12.5/deferred-cleanup`
**Sprint status:** `gcredit-project/docs/sprints/sprint-status.yaml` — key `12.5-2-remove-badge-evidence-url`

---

## Task Execution Order

### Task 1: Remove field from schema

**File:** `backend/prisma/schema.prisma` (line 204)

Remove this line from the `Badge` model:
```prisma
  evidenceUrl      String?       // Azure Blob Storage URL
```

Current surrounding context (lines 198–210):
```prisma
model Badge {
  id               String        @id @default(uuid())
  templateId       String
  recipientId      String
  issuerId         String
  evidenceUrl      String?       // Azure Blob Storage URL    ← REMOVE THIS LINE
  issuedAt         DateTime      @default(now())
  expiresAt        DateTime?     // Calculated from expiresIn
  status           BadgeStatus   @default(PENDING)
```

### Task 2: Generate migration

```bash
cd gcredit-project/backend
npx prisma migrate dev --name remove-badge-evidence-url
```

**Verify the generated SQL contains ONLY:**
```sql
ALTER TABLE "badges" DROP COLUMN "evidenceUrl";
```

If the migration touches ANY other table or column — HALT and investigate.

### Task 3: Regenerate Prisma client

```bash
npx prisma generate
```

Verify: TypeScript types for `Badge` no longer include `evidenceUrl`.

### Task 4: Clean up stale comment

**File:** `backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts` (lines 15–16)

Remove these two comment lines:
```typescript
export interface BulkIssuanceRow {
  recipientEmail: string;
  templateId: string;
  // evidenceUrl REMOVED — PO decision 2026-02-22       ← REMOVE
  // Evidence attached post-issuance via two-step flow (Story 12.6)  ← REMOVE
  expiresIn?: number;
}
```

After cleanup:
```typescript
export interface BulkIssuanceRow {
  recipientEmail: string;
  templateId: string;
  expiresIn?: number;
}
```

### Task 5: Run backend tests

```bash
cd gcredit-project/backend
npx jest --forceExit
```

All 855+ tests must pass. Zero regressions.

### Task 6: Run frontend tests

```bash
cd gcredit-project/frontend
npx vitest run
```

All 730+ tests must pass. No changes expected — frontend never referenced `evidenceUrl`.

### Task 7: Final verification grep

```bash
# From gcredit-project/backend/src:
grep -r "evidenceUrl" --include="*.ts" .
```

**Expected results — these are ALL safe (plural `evidenceUrls`, local variables):**

| File | Line | Content | Safe? |
|------|------|---------|-------|
| `badge-issuance/badge-issuance.service.ts` | 144 | `const evidenceUrls = (created.evidenceFiles \|\| []).map(...)` | ✅ Local var from EvidenceFile |
| `badge-issuance/badge-issuance.service.ts` | 157 | `evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined` | ✅ Passing local var |
| `badge-issuance/services/assertion-generator.service.ts` | 60 | `evidenceUrls?: string[];` | ✅ Method parameter |
| `badge-issuance/services/assertion-generator.service.ts` | 70 | `evidenceUrls,` | ✅ Destructuring param |
| `badge-issuance/services/assertion-generator.service.ts` | 109–111 | `evidenceUrls && evidenceUrls.length > 0 && { evidence: evidenceUrls }` | ✅ Building assertion JSON |
| `badge-issuance/services/assertion-generator.service.spec.ts` | 145–160 | Test data for assertion generator | ✅ Tests the param |

If ANY match references `Badge.evidenceUrl` (singular, on the model) — HALT.

Also verify schema.prisma no longer contains `evidenceUrl`:
```bash
grep "evidenceUrl" backend/prisma/schema.prisma
# Should return: no matches
```

---

## What NOT to Change

| File | Reason |
|------|--------|
| `badge-issuance.service.ts` | Uses `evidenceUrls` (plural) — local variable built from `EvidenceFile[]` |
| `assertion-generator.service.ts` | `evidenceUrls?: string[]` method parameter — unrelated to schema column |
| `assertion-generator.service.spec.ts` | Tests the assertion generator param, not the Badge column |
| `prisma/migrations/20260127020604_add_badge_model/migration.sql` | Historical migration — NEVER modify past migrations |

---

## Coding Standards

| # | Rule |
|---|------|
| 1 | All code in English |
| 5 | Backend: NestJS Logger only — no `console.log` |
| 7 | TODO format: `// TODO(TD-XXX)` |

---

## Definition of Done

1. `evidenceUrl` removed from `schema.prisma` Badge model
2. Migration generated: `ALTER TABLE "badges" DROP COLUMN "evidenceUrl"` only
3. `prisma generate` succeeds — types updated
4. Stale comments removed from `bulk-issue-badges.dto.ts`
5. Backend tests: all pass, zero regressions
6. Frontend tests: all pass (no-op)
7. grep confirms no remaining `Badge.evidenceUrl` references
8. Story status → `review`, sprint-status.yaml updated
