# Code Review Result: Story 14.2 — Schema Migration: Remove MANAGER from UserRole Enum

## Review Metadata

- Story: 14.2
- Commit Reviewed: a56bdfb
- Parent: 6007ef0
- Branch: sprint-14/role-model-refactor
- Review Scope: 5 files (schema, migration SQL, seed, story doc, sprint-status)
- Date: 2026-02-28

---

## Verdict

APPROVED

The migration implementation is correct and safe for Story 14.2 scope. The previously requested non-blocking documentation follow-up has been completed.

---

## Executive Summary

- Migration SQL uses the correct PostgreSQL enum-removal pattern: data migration first, then enum type swap.
- Prisma schema now contains only ADMIN, ISSUER, EMPLOYEE in UserRole, while manager identity fields (managerId/manager/directReports) remain intact.
- Seed updates correctly replace UserRole.MANAGER with UserRole.EMPLOYEE in both upsert update/create blocks for manager@gcredit.com.
- Story and sprint tracking were updated to review as required.

---

## Detailed Checklist Review

### 1) Migration SQL Correctness

File reviewed: backend/prisma/migrations/20260302000000_remove_manager_role/migration.sql

1. Sequence correctness (UPDATE → CREATE TYPE → ALTER COLUMN → RENAME → DROP): PASS  
   This is the standard PostgreSQL-safe approach for removing enum values.

2. Cast safety USING (role::text::UserRole_new): PASS  
   Safe because MANAGER values are converted to EMPLOYEE before the cast.

3. DROP DEFAULT before type change, then SET DEFAULT after: PASS  
   Correct pattern to avoid default/type mismatch during enum swap.

4. Idempotence when no MANAGER rows exist: PASS (practical)  
   UPDATE affects 0 rows and enum swap still succeeds.

5. Migration timestamp convention: PASS WITH NOTE  
   20260302000000 format is acceptable for Prisma migration directories. It appears manually named but still valid.

### 2) Schema Changes

File reviewed: backend/prisma/schema.prisma

- MANAGER removed from UserRole enum: PASS
- Only ADMIN, ISSUER, EMPLOYEE remain: PASS
- ADR comments present and accurate (ADR-015/ADR-017/ADR-014): PASS
- Role descriptions accurate: PASS
- Schema conventions preserved (including @@map("users"), indexes, formatting style): PASS
- managerId/manager/directReports fields untouched: PASS

### 3) Seed Data

File reviewed: backend/prisma/seed-uat.ts

- Both UserRole.MANAGER occurrences replaced with UserRole.EMPLOYEE: PASS
- Variable name manager retained: PASS
- manager@gcredit.com retained: PASS
- jobTitle Engineering Manager retained: PASS
- managerId linkage logic untouched (employee/employee2 linked to manager.id): PASS
- Other prisma seed files checked for MANAGER role usage: PASS (no remaining UserRole.MANAGER usage found)

### 4) Data Integrity

- Dev-reported counts and relationship preservation are internally consistent with this migration design.
- Migration does not touch managerId/directReports columns or relation definitions, so relation integrity should remain intact.
- Direct query execution was not performed in this review session (no DB verification run), but implementation-level evidence supports the claim.

### 5) Rollback Viability

- ALTER TYPE "UserRole" ADD VALUE 'MANAGER' validity: PASS
- Limitation (enum value restore only, not original assignments) documented: PASS
- Index/constraint concerns: PASS (role index remains valid)

### 6) Expected Downstream Breakage Coverage

Question: Are there backend src references to MANAGER not listed in story notes?  
Answer: YES.

Additional references exist beyond the listed set, for example:
- backend/src/badge-issuance/badge-issuance.controller.ts
- backend/src/badge-issuance/badge-issuance.service.ts
- backend/src/analytics/analytics.service.ts
- backend/src/analytics/dto/system-overview.dto.ts
- backend/src/badge-issuance/badge-issuance.controller.spec.ts

This is non-blocking for Story 14.2 (scope is schema/migration/seed), but the story doc should acknowledge that breakage list is representative, not exhaustive.

### 7) Story Documentation

- Story status = review: PASS
- AC all checked: PASS
- Tasks/subtasks checked: PASS
- Dev Agent Record filled: PASS
- Rollback SQL documented: PASS
- Expected test failures listed with story references: PASS (but incomplete set; see follow-up)
- sprint-status updated to review: PASS

---

## Additional Validation Performed

- Prisma schema validation command executed successfully from backend root:
  - npx prisma validate
  - Result: schema valid

---

## Follow-up Recommendations (Non-blocking)

1. In Story 14.2 Dev Notes, update expected breakage section to explicitly state that listed files are examples, and include key additional backend/src references discovered in review.
2. Keep Story 14.5, 14.6, and 14.8 implementation order tight, since multiple backend runtime and test paths still reference MANAGER semantics.

---

## Re-review Update (Post Follow-up)

- Follow-up commit reviewed: `ddea5fd`
- Story notes now explicitly mark the breakage list as representative and include key additional backend references.
- Scope remains correct (documentation-only adjustment on top of accepted schema/migration/seed changes).

## Final Decision

APPROVED

No blocking migration/schema/seed defects were found, and the requested documentation hardening is now complete.

---

## Incremental Re-review Update (Post-acceptance code changes)

### Reviewed Commit

- `0c03a72` — `fix: unify manager identity model across codebase (ADR-017) [14.2]`

### Incremental Verdict

**CHANGES REQUESTED**

This increment fixes the previously reported badge-issued access risk, but introduces/retains one blocking authorization gap in `app.controller.ts`.

### Confirmed Improvements

- `badge-issuance.service.ts`: non-manager `EMPLOYEE` now receives `ForbiddenException` in `getIssuedBadges`.
- `analytics.service.ts`: manager identity switched to `directReports` check; non-manager `EMPLOYEE` blocked.
- `dashboard.controller.ts`: directReports gate added for manager dashboard (admin bypass preserved).
- Frontend role/type cleanup aligned with ADR-017 (`MANAGER` removed from role unions).

### Blocking Issue

- `backend/src/app.controller.ts` `GET /manager-only` currently allows `@Roles('EMPLOYEE', 'ADMIN')` but does not enforce manager identity (`directReports > 0`) in handler logic.
- This can allow ordinary `EMPLOYEE` users without direct reports to access manager-only route, which is inconsistent with ADR-017 semantics and route comments.

### Required Fix (Minimal)

1. Add directReports check in `managerRoute` for non-admin users (same guard logic used in `dashboard.controller.ts`), and throw `ForbiddenException` when count is 0.
2. Add/adjust unit tests for:
   - EMPLOYEE with directReports → allowed
   - EMPLOYEE without directReports → forbidden
   - ADMIN → allowed and bypasses directReports check

### Verification Run Summary for Increment

- Passed: `analytics.service.spec.ts`, `dashboard.controller.spec.ts`, `badge-issuance.service.spec.ts`, `app.controller.spec.ts`, `RoleBadge.test.tsx`
- Passed: backend `tsc --noEmit`, frontend `tsc --noEmit -p tsconfig.app.json`
- Note: Existing `app.controller.spec.ts` is minimal and does not currently assert manager-only authorization behavior.