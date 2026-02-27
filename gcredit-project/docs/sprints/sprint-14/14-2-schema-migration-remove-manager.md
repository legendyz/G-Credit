# Story 14.2: Schema Migration — Remove MANAGER from UserRole Enum

**Status:** backlog  
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

1. [ ] Prisma migration created: `UserRole` enum = `{ ADMIN, ISSUER, EMPLOYEE }`
2. [ ] All existing `role = 'MANAGER'` rows migrated to `role = 'EMPLOYEE'`
3. [ ] `directReports` relationships preserved (zero data loss)
4. [ ] ADR-015 code comments added to `schema.prisma` enum definition
5. [ ] Migration reversible (rollback SQL documented)
6. [ ] All seed data updated (no MANAGER references in seed files)

## Tasks / Subtasks

- [ ] **Task 1: Create Prisma migration** (AC: #1, #2)
  - [ ] Write data migration SQL: `UPDATE users SET role = 'EMPLOYEE' WHERE role = 'MANAGER'`
  - [ ] Alter `UserRole` enum to remove `MANAGER` value
  - [ ] ⚠️ **DO NOT run `npx prisma format`** (Lesson 22 — can break 137+ files)
  - [ ] Run `npx prisma migrate dev --name remove-manager-role`
- [ ] **Task 2: Verify data integrity** (AC: #3)
  - [ ] Query `directReports` relationships — count before/after must match
  - [ ] Verify `managerId` foreign keys are intact
  - [ ] Run spot check: users who had MANAGER role still have their direct reports
- [ ] **Task 3: Update seed data** (AC: #6)
  - [ ] Search seed files for `'MANAGER'` references
  - [ ] Replace with `'EMPLOYEE'` (or appropriate role)
  - [ ] Verify seed script runs cleanly
- [ ] **Task 4: Add code comments** (AC: #4)
  - [ ] Add ADR-015 reference comment to `UserRole` enum in `schema.prisma`
  - [ ] Example: `// ADR-015: Permission roles only. Manager identity is derived from directReports (see ADR-017)`
- [ ] **Task 5: Document rollback** (AC: #5)
  - [ ] Write rollback SQL in migration file or Dev Notes
  - [ ] Test rollback on local DB copy

## Dev Notes

### Architecture Patterns Used
- Prisma schema migration with data migration step
- ADR-driven enum design (ADR-015 + ADR-017)

### Source Tree Components
- `prisma/schema.prisma` — UserRole enum
- `prisma/migrations/` — new migration folder
- `prisma/seed.ts` or seed files — MANAGER references

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
### Completion Notes
### File List

## Retrospective Notes
