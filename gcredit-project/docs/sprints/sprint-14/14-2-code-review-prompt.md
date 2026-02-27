# Code Review Prompt: Story 14.2 — Schema Migration: Remove MANAGER from UserRole Enum

## Review Metadata

- **Story:** 14.2 — Schema Migration: Remove MANAGER from UserRole Enum
- **Story File:** `docs/sprints/sprint-14/14-2-schema-migration-remove-manager.md`
- **Commit:** `a56bdfb` (single commit)
- **Parent:** `6007ef0` (Story 14.1 docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff 6007ef0..a56bdfb`

---

## Scope

5 files changed (+83, −35):

| File | Change Type | Purpose |
|------|-------------|---------|
| `backend/prisma/schema.prisma` | Modified | Remove `MANAGER` from `UserRole` enum, add ADR comments |
| `backend/prisma/migrations/20260302000000_remove_manager_role/migration.sql` | **New** | Data migration + enum type swap SQL |
| `backend/prisma/seed-uat.ts` | Modified | `UserRole.MANAGER` → `UserRole.EMPLOYEE` (2 occurrences) |
| `docs/sprints/sprint-14/14-2-schema-migration-remove-manager.md` | Modified | Story status → `review`, all AC/tasks checked, Dev Agent Record |
| `docs/sprints/sprint-status.yaml` | Modified | `14-2` status: `backlog` → `review` |

---

## Architecture Context

This is **Step 1 of 11** in the ADR-017 dual-dimension identity refactor. The core design principle:

- **Permission Role** (DB enum): `ADMIN | ISSUER | EMPLOYEE` — "what can you do?"
- **Organization Identity** (derived): `directReports.length > 0` — "are you a manager?"

`MANAGER` was mixing an identity concept into a permissions enum. This migration removes it while preserving all `managerId`/`directReports` relationships.

**Key ADRs:**
- **ADR-015** (DEC-015-01): Remove MANAGER from UserRole — only permission-role values in enum
- **ADR-017** (§3): Schema migration spec — data first, then enum alteration

---

## Review Checklist

### 1. Migration SQL Correctness

Review file: `backend/prisma/migrations/20260302000000_remove_manager_role/migration.sql`

```sql
-- Step 1: Migrate data BEFORE altering the enum
UPDATE "users" SET "role" = 'EMPLOYEE' WHERE "role" = 'MANAGER';

-- Step 2: Remove MANAGER from the enum type
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'ISSUER', 'EMPLOYEE');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
```

**Reviewer questions:**
1. Is the `UPDATE` → `CREATE TYPE` → `ALTER COLUMN` → `RENAME` → `DROP` sequence correct for PostgreSQL enum type removal?
2. Is the `USING ("role"::text::"UserRole_new")` cast safe after the data migration step?
3. Is `DROP DEFAULT` → `ALTER TYPE` → `SET DEFAULT` the correct pattern to avoid "default value is not in enum" errors?
4. Is the migration **idempotent** if run where no MANAGER rows exist? (Answer: yes — `UPDATE` affects 0 rows, enum swap still works)
5. Does the migration timestamp `20260302000000` follow Prisma conventions? (Manual timestamp vs `prisma migrate dev` generated)

### 2. Schema Changes

Review file: `backend/prisma/schema.prisma` (lines 13–20)

**Verify:**
- [  ] `MANAGER` removed from `UserRole` enum
- [  ] Only `ADMIN`, `ISSUER`, `EMPLOYEE` remain
- [  ] ADR-015/017/014 comments present and accurate
- [  ] Inline role descriptions are accurate
- [  ] **`@@map("users")` and all other schema conventions are preserved** (Lesson 22: `prisma format` was NOT run)
- [  ] `managerId`, `manager`, `directReports` relation fields are **untouched** (lines 47-50 in schema)

### 3. Seed Data

Review file: `backend/prisma/seed-uat.ts` (lines 208, 218)

**Verify:**
- [  ] Both `UserRole.MANAGER` occurrences → `UserRole.EMPLOYEE` (update + create blocks)
- [  ] Variable name `manager` retained (it's a variable name, not a role)
- [  ] `email: 'manager@gcredit.com'` retained
- [  ] `jobTitle: 'Engineering Manager'` retained (job title, not role)
- [  ] `managerId` linking logic (lines 278-290) is **untouched** — this is how the manager user gets direct reports
- [  ] No other seed files reference `UserRole.MANAGER` (only `seed-uat.ts` had it; `seed-skills.ts` is clean)

### 4. Data Integrity

Dev agent reported:
- ROLES: ADMIN(2), ISSUER(2), EMPLOYEE(18) — zero MANAGER rows
- 17 `managerId` links preserved
- `manager@gcredit.com` → `role=EMPLOYEE` with directReports intact

**Reviewer questions:**
1. Is the directReports count (17) consistent with what you'd expect from the seed data?
2. After migration, can a user query `directReports` for the former-MANAGER user and get results?

### 5. Rollback Viability

Documented rollback:
```sql
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
```

**Reviewer questions:**
1. Is `ALTER TYPE ... ADD VALUE` valid in PostgreSQL? (Yes — supported since PG 9.1)
2. Is it noted that rollback only re-adds the enum value, not the role data? (Yes)
3. Is there any index or constraint that would be affected? (No — `@@index([role])` works with any enum value)

### 6. Expected Downstream Breakage

Dev noted these **out-of-scope** expected failures:
- `test/helpers/test-setup.ts` — `createManager` uses `UserRole.MANAGER` (→ Story 14.8)
- `src/app.controller.ts` — `@Roles('MANAGER', 'ADMIN')` (→ Story 14.5)
- `src/analytics/analytics.controller.ts` — `@Roles('ADMIN', 'MANAGER')` (→ Story 14.5)
- `src/admin-users/admin-users.service.ts` — references `UserRole.MANAGER` (→ Story 14.5)
- `src/m365-sync/m365-sync.service.ts` — references `UserRole.MANAGER` (→ Story 14.6)

**Reviewer question:** Are there any other files referencing `MANAGER` in the backend `src/` tree that are NOT listed here?

### 7. Story Documentation

- [  ] Story status = `review`
- [  ] All 6 AC marked `[x]`
- [  ] All 5 tasks + subtasks marked `[x]`
- [  ] Dev Agent Record filled (model, completion notes, file list)
- [  ] Rollback SQL documented in Dev Notes
- [  ] Expected test failures listed with story references
- [  ] `sprint-status.yaml` updated to `review`

---

## What Was NOT Changed (Verify Unchanged)

These files MUST NOT be modified in this story (they belong to later stories):

| File/Area | Belongs To |
|-----------|-----------|
| JWT token generation (`auth.service.ts`) | Story 14.3 |
| `IsManager` guard/decorator | Story 14.4 |
| `@Roles('MANAGER')` in controllers | Story 14.5 |
| M365 sync service | Story 14.6 |
| Frontend MANAGER references | Story 14.7 |
| E2E test helpers (`createManager`) | Story 14.8 |

---

## Verdict Options

- **APPROVED** — Migration SQL correct, data integrity verified, scope respected
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking recommendations
- **CHANGES REQUESTED** — Blocking issue found (describe)
