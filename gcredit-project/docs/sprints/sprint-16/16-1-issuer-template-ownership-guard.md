# Story 16.1: Backend — Issuer Template Ownership Guard

Status: ready-for-dev

## Story
As an **Issuer**,
I want **badge issuance to be restricted to templates I created**,
So that **I cannot accidentally issue badges using another Issuer's templates, and organizational accountability is clear**.

## Acceptance Criteria
1. [ ] `issueBadge()` checks `template.createdBy === issuerId` for ISSUER role; ADMIN bypasses
2. [ ] `bulkIssuance` upload/confirm checks the same ownership
3. [ ] Returns 403 Forbidden with clear message when ownership fails
4. [ ] ADMIN can issue badges using any template (no ownership check)
5. [ ] Existing E2E tests still pass (no regression)
6. [ ] New E2E tests cover: Issuer own template ✅, Issuer other's template ✗, Admin any template ✅

## Tasks / Subtasks
- [ ] Task 1: Add ownership check in `badge-issuance.service.ts` `issueBadge()` (AC: #1, #3)
  - [ ] After template validation, check `template.createdBy === issuerId` when role is ISSUER
  - [ ] Throw `ForbiddenException('You can only issue badges using your own templates')`
  - [ ] ADMIN role skips this check
- [ ] Task 2: Add ownership check in `bulk-issuance.service.ts` upload/confirm (AC: #2, #3)
  - [ ] Same pattern as Task 1 for bulk issuance flow
- [ ] Task 3: Unit tests for ownership guard (AC: #5, #6)
  - [ ] Test: Issuer issues own template → 201 OK
  - [ ] Test: Issuer issues other's template → 403 Forbidden
  - [ ] Test: Admin issues any template → 201 OK
- [ ] Task 4: E2E tests for ownership guard (AC: #6)
  - [ ] E2E: Create 2 Issuers, each with own template, cross-issuance blocked

## Dev Notes
### Architecture Patterns Used
- **ARCH-P1-004:** Ownership check pattern (already used in `badge-templates.controller.ts` `remove()` method)
- Pattern: `if (userRole === UserRole.ISSUER && template.createdBy !== userId) throw ForbiddenException`
- Reference: [badge-templates.controller.ts](../../../backend/src/badge-templates/badge-templates.controller.ts) lines 312-328

### Source Tree Components
- `backend/src/badge-issuance/badge-issuance.service.ts` — `issueBadge()` method
- `backend/src/bulk-issuance/bulk-issuance.service.ts` — upload/confirm methods
- `backend/test/` — E2E test files

### Testing Standards
- TDD approach: Write ownership check tests first, then implement guard
- Unit test file: `badge-issuance.service.spec.ts`
- E2E: `badge-issuance.e2e-spec.ts` (add ownership scenarios)

### References
- Sprint 14 ADR-017: Dual-dimension role model (ISSUER + isManager)
- Sprint 15 `GET /api/users/me/permissions` — frontend uses permissions for visibility

## Code Review Strategy
- 🔴 HIGH risk — TDD + AI Review + Self-review
- Security-critical: authorization logic change
- Review checklist: Ownership check at correct layer (service, not controller)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
