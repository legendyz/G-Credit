# Story 14.2: Schema Migration — Remove MANAGER from UserRole Enum

**Status:** done  
**Priority:** CRITICAL  
**Estimate:** 2h  
**Wave:** 2 — Role Model Refactor (Backend)  
**Source:** ADR-015 DEC-015-01, ADR-017 §3  
**Depends On:** —

---

## Story

**As a** system architect,  
**I want** the UserRole enum to only contain permission-role values,  
**So that** organization identity (manager) is cleanly separated from permission identity.

## Acceptance Criteria

1. [x] Prisma migration created: `UserRole` enum = `{ ADMIN, ISSUER, EMPLOYEE }`
2. [x] All existing `role = 'MANAGER'` rows migrated to `role = 'EMPLOYEE'`
3. [x] `directReports` relationships preserved (zero data loss)
4. [x] ADR-015 code comments added to `schema.prisma` enum definition
5. [x] Migration reversible (rollback SQL documented)
6. [x] All seed data updated (no MANAGER references in seed files)

## Tasks / Subtasks

- [x] **Task 1: Create Prisma migration** (AC: #1, #2)
  - [x] Write data migration SQL: `UPDATE users SET role = 'EMPLOYEE' WHERE role = 'MANAGER'`
  - [x] Alter `UserRole` enum to remove `MANAGER` value
  - [x] ⚠️ **DO NOT run `npx prisma format`** (Lesson 22 — can break 137+ files)
  - [x] Run `npx prisma migrate dev --name remove-manager-role`
- [x] **Task 2: Verify data integrity** (AC: #3)
  - [x] Query `directReports` relationships — count before/after must match
  - [x] Verify `managerId` foreign keys are intact
  - [x] Run spot check: users who had MANAGER role still have their direct reports
- [x] **Task 3: Update seed data** (AC: #6)
  - [x] Search seed files for `'MANAGER'` references
  - [x] Replace with `'EMPLOYEE'` (or appropriate role)
  - [x] Verify seed script runs cleanly
- [x] **Task 4: Add code comments** (AC: #4)
  - [x] Add ADR-015 reference comment to `UserRole` enum in `schema.prisma`
  - [x] Example: `// ADR-015: Permission roles only. Manager identity is derived from directReports (see ADR-017)`
- [x] **Task 5: Document rollback** (AC: #5)
  - [x] Write rollback SQL in migration file or Dev Notes
  - [x] Test rollback on local DB copy

## Dev Notes

### Architecture Patterns Used
- Prisma schema migration with data migration step
- ADR-driven enum design (ADR-015 + ADR-017)

### Source Tree Components
- `prisma/schema.prisma` — UserRole enum
- `prisma/migrations/20260302000000_remove_manager_role/` — migration SQL
- `prisma/seed-uat.ts` — MANAGER references updated to EMPLOYEE

### Rollback SQL
```sql
-- Rollback: Re-add MANAGER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
-- Note: Re-adding the enum value is sufficient.
-- No data migration needed for rollback (users already have valid roles).
-- To restore original role assignments, you would need a separate data restore.
```

### Expected Test/Compilation Failures (Out of Scope)
These failures are caused by code referencing `'MANAGER'` / `UserRole.MANAGER` and will be fixed in later stories.
The list below is representative — additional references may exist in other controllers, services, and DTOs:
- `test/helpers/test-setup.ts` — `createManager` uses `UserRole.MANAGER` (→ 14.8)
- `src/app.controller.ts` — `@Roles('MANAGER', 'ADMIN')` (→ 14.5)
- `src/analytics/analytics.controller.ts` — `@Roles('ADMIN', 'MANAGER')` (→ 14.5)
- `src/analytics/analytics.service.ts` — MANAGER role references (→ 14.5)
- `src/analytics/dto/system-overview.dto.ts` — MANAGER in DTO (→ 14.5)
- `src/badge-issuance/badge-issuance.controller.ts` — `@Roles('MANAGER', ...)` (→ 14.5)
- `src/badge-issuance/badge-issuance.service.ts` — MANAGER logic (→ 14.5)
- `src/badge-issuance/badge-issuance.controller.spec.ts` — test references (→ 14.8)
- `src/admin-users/admin-users.service.ts` — multiple MANAGER references (→ 14.5)
- `src/m365-sync/m365-sync.service.spec.ts` — manager sync tests (→ 14.6)

### Testing Standards
- Run all backend tests after migration to verify no breakage
- Verify seed data with `npx prisma db seed`

### Project Structure Notes
- ⚠️ **Prisma version locked at 6.19.2** — do not upgrade
- ⚠️ **Do NOT run `npx prisma format`** after changes

### References
- ADR-015: `docs/decisions/ADR-015-*.md`
- ADR-017: `docs/decisions/ADR-017-*.md` (§3 — Schema Changes)
- Lesson 22: Prisma format risk

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- **Migration:** Created `20260302000000_remove_manager_role/migration.sql` with proper 2-step approach:
  1. `UPDATE users SET role='EMPLOYEE' WHERE role='MANAGER'` (data first)
  2. PostgreSQL enum swap (`CREATE TYPE new → ALTER COLUMN → RENAME → DROP old`)
- **Data Integrity Verified:** ROLES: ADMIN(2), ISSUER(2), EMPLOYEE(18) — zero MANAGER rows. 17 managerId links preserved.
- **manager@gcredit.com:** Confirmed `role=EMPLOYEE`, identity preserved via directReports.
- **Seed:** `seed-uat.ts` updated — 2 occurrences of `UserRole.MANAGER` → `UserRole.EMPLOYEE`.
- **Schema Comments:** ADR-015/017/014 references added to `UserRole` enum.
- **Rollback:** Documented in Dev Notes — `ALTER TYPE "UserRole" ADD VALUE 'MANAGER'`.
- **Test Results:** 48/49 suites pass, 912/942 tests pass. 1 suite fails (`m365-sync.service.spec.ts`, 2 tests) — expected, will be fixed in Story 14.6.
- **TS Compilation:** Expected errors in `admin-users.service.ts` and `m365-sync.service.ts` referencing removed `UserRole.MANAGER` — out of scope per dev prompt (Stories 14.3–14.8).

### File List
- `backend/prisma/schema.prisma` — removed MANAGER from UserRole enum, added ADR comments
- `backend/prisma/migrations/20260302000000_remove_manager_role/migration.sql` — new migration
- `backend/prisma/seed-uat.ts` — UserRole.MANAGER → UserRole.EMPLOYEE (2 occurrences)

## Retrospective Notes
