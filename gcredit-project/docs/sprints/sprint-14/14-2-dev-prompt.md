# Dev Prompt: Story 14.2 — Schema Migration: Remove MANAGER from UserRole Enum

**Story File:** `docs/sprints/sprint-14/14-2-schema-migration-remove-manager.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** CRITICAL | **Estimate:** 2h | **Wave:** 2 (Role Model Refactor — Backend)

---

## Objective

Remove `MANAGER` from the `UserRole` Prisma enum. Migrate existing `role = 'MANAGER'` rows to `role = 'EMPLOYEE'`. Preserve all `managerId`/`directReports` relationships (zero data loss). This is **Step 1** of the ADR-017 11-step dual-dimension refactor.

---

## Scope — ONLY These Changes

| In Scope | Out of Scope (later stories) |
|----------|------------------------------|
| `schema.prisma` UserRole enum | JWT payload changes (→ 14.3) |
| Prisma migration SQL | Guard/decorator changes (→ 14.4, 14.5) |
| Seed data (`seed-uat.ts`) | M365 sync logic (→ 14.6) |
| ADR-015 code comment on enum | Frontend MANAGER refs (→ 14.7) |
| Rollback SQL documentation | E2E tests using `createManager` (→ 14.8) |

> **Do NOT modify** any `@Roles('MANAGER', ...)` decorators, guards, JWT logic, or frontend code in this story. Those changes happen in Stories 14.3–14.7.

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT run `npx prisma format`** — Lesson 22: it rewrites 137+ files, destroys `@@map()` conventions, and creates a massive diff that obscures real changes.
2. **Prisma version locked at 6.19.2** — do not upgrade.
3. **Migration order matters** — data migration (`UPDATE`) must run BEFORE the enum alteration (`ALTER TYPE`).

---

## Target Files

### 1. `backend/prisma/schema.prisma` (lines 13-18)

**Current:**
```prisma
enum UserRole {
  ADMIN
  ISSUER
  MANAGER
  EMPLOYEE
}
```

**Target:**
```prisma
// ADR-015: Permission roles ONLY.
// Manager identity derived from directReports relation — see ADR-017.
// GUEST will be added when FEAT-009 implemented — see ADR-014.
enum UserRole {
  ADMIN       // Full system administration
  ISSUER      // Badge template creation and issuance
  EMPLOYEE    // Base role — no elevated permissions (default)
}
```

### 2. `backend/prisma/seed-uat.ts` (lines 204-224)

The `manager` user currently uses `role: UserRole.MANAGER`. Change to `role: UserRole.EMPLOYEE`.

**Key locations (search for `UserRole.MANAGER`):**
- Line 208: `role: UserRole.MANAGER` (update block)
- Line 218: `role: UserRole.MANAGER` (create block)

**Important:** Keep the variable name `manager`, keep `email: 'manager@gcredit.com'`, keep `lastName: 'Manager'`, keep `jobTitle: 'Engineering Manager'`. ONLY change the `role` field. The manager identity comes from `managerId` links (lines 278-290), not from the role enum.

### 3. New migration file: `backend/prisma/migrations/<timestamp>_remove_manager_role/migration.sql`

**Migration SQL (must be in this exact order):**
```sql
-- Story 14.2: Remove MANAGER from UserRole enum (ADR-015, ADR-017 §3)
-- Manager identity is now derived from directReports relation, not role enum.

-- Step 1: Migrate data BEFORE altering the enum
UPDATE "users" SET "role" = 'EMPLOYEE' WHERE "role" = 'MANAGER';

-- Step 2: Remove MANAGER from the enum type
-- PostgreSQL requires creating a new type, migrating, and dropping the old one
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'ISSUER', 'EMPLOYEE');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
```

> **How to create:** Run `npx prisma migrate dev --name remove-manager-role` after editing `schema.prisma`. Prisma may generate its own SQL — verify it handles the data migration (`UPDATE`) step. If Prisma doesn't include the `UPDATE`, you must manually prepend it to the generated migration file.

---

## Execution Steps

### Step 1: Pre-flight Checks
```bash
cd gcredit-project/backend
# Verify current state
npx prisma migrate status
# Check for any pending migrations
```

### Step 2: Edit schema.prisma
- Remove `MANAGER` from the `UserRole` enum
- Add ADR-015/017 code comments (see Target above)
- ⚠️ Do NOT run `npx prisma format`

### Step 3: Create Migration
```bash
npx prisma migrate dev --name remove-manager-role
```
- Review the generated SQL in `prisma/migrations/<timestamp>_remove_manager_role/migration.sql`
- Ensure the `UPDATE` statement runs BEFORE the enum alteration
- If Prisma didn't include the `UPDATE`, manually prepend it

### Step 4: Verify Data Integrity
```bash
# After migration, verify directReports are intact
npx prisma studio
# Or via psql/query:
# SELECT COUNT(*) FROM users WHERE "managerId" IS NOT NULL;
# SELECT id, email, role, "managerId" FROM users WHERE email = 'manager@gcredit.com';
```

### Step 5: Update Seed Data
- Edit `prisma/seed-uat.ts`: change `UserRole.MANAGER` → `UserRole.EMPLOYEE` (2 occurrences)
- Verify seed runs: `npx prisma db seed`

### Step 6: Document Rollback
Add rollback SQL to the story file's Dev Notes section:
```sql
-- Rollback: Re-add MANAGER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
-- Note: Re-adding the enum value is sufficient.
-- No data migration needed for rollback (users already have valid roles).
```

### Step 7: Run Backend Tests
```bash
npm test -- --passWithNoTests --forceExit
```
- **Expect some test failures** in files that reference `'MANAGER'` role. These are:
  - `test/helpers/test-setup.ts` — `createManager` uses `UserRole.MANAGER`
  - `test/analytics.e2e-spec.ts` — creates manager users
  - `src/app.controller.ts` — `@Roles('MANAGER', 'ADMIN')`
  - `src/analytics/analytics.controller.ts` — `@Roles('ADMIN', 'MANAGER')`
- **These failures are expected and OK** — they will be fixed in Stories 14.3–14.6
- Document which tests fail in the story file's Dev Notes

### Step 8: Commit
```bash
git add prisma/schema.prisma prisma/migrations/ prisma/seed-uat.ts
git commit -m "feat: remove MANAGER from UserRole enum (ADR-015) [14.2]"
```

---

## Acceptance Criteria Checklist

| AC | Verification |
|----|-------------|
| #1 Prisma migration created: UserRole = {ADMIN, ISSUER, EMPLOYEE} | Check `schema.prisma` and generated migration SQL |
| #2 Existing role='MANAGER' rows → 'EMPLOYEE' | Migration SQL includes `UPDATE` before `ALTER` |
| #3 directReports relationships preserved | Query `managerId` counts before/after — must match |
| #4 ADR-015 code comments on enum | Comments present in `schema.prisma` |
| #5 Migration reversible (rollback documented) | Rollback SQL in story file Dev Notes |
| #6 Seed data updated (no MANAGER refs) | `seed-uat.ts` uses `UserRole.EMPLOYEE` for manager user |

---

## Key References

- **ADR-015:** `docs/decisions/ADR-015-userrole-enum-clean-design.md` — DEC-015-01: Remove MANAGER
- **ADR-017:** `docs/decisions/ADR-017-dual-dimension-identity-architecture.md` — §3 Schema Changes
- **Lesson 22:** Never run `npx prisma format` (destroys `@@map()` conventions)
- **Story 14.3** (next): JWT payload `isManager` flag — depends on this migration completing first

---

## What NOT To Do

1. ❌ Do NOT modify `@Roles('MANAGER')` decorators (→ Story 14.5)
2. ❌ Do NOT modify JWT token generation (→ Story 14.3)
3. ❌ Do NOT create `IsManager` guard/decorator (→ Story 14.4)
4. ❌ Do NOT modify M365 sync service (→ Story 14.6)
5. ❌ Do NOT modify frontend code (→ Story 14.7)
6. ❌ Do NOT fix backend test failures caused by MANAGER removal (→ Stories 14.3–14.8)
7. ❌ Do NOT run `npx prisma format`
8. ❌ Do NOT upgrade Prisma from 6.19.2
