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

## Code Review Report

**Reviewer:** Senior Security Code Reviewer (Claude Opus 4.6)
**Date:** 2026-03-03
**Verdict:** ✅ **APPROVE WITH COMMENTS**

### Security (Critical)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1 | Ownership check at service layer | ✅ PASS | Check is in `badge-issuance.service.ts` `issueBadge()` — defence in depth, not controller-only |
| S2 | Check after validation, before mutation | ✅ PASS | Check occurs after template exists + ACTIVE validation, before recipient lookup and badge creation |
| S3 | ForbiddenException (403) returned | ✅ PASS | `throw new ForbiddenException(...)` — correct HTTP semantics |
| S4 | Error message doesn't leak data | ✅ PASS | Message is generic: `'You can only issue badges using your own templates'` — no IDs or user data leaked |
| S5 | Only ADMIN bypasses | ✅ PASS | Guard: `callerRole === UserRole.ISSUER` — only ISSUER is checked against. ADMIN implicitly passes (no `else if`). EMPLOYEE never reaches this code (see S6) |
| S6 | EMPLOYEE blocked at controller | ✅ PASS | `@Roles(UserRole.ADMIN, UserRole.ISSUER)` on `POST /api/badges` — EMPLOYEE gets 403 from RolesGuard before reaching service |
| S7 | Bulk issuance propagates callerRole | ✅ PASS | `confirmBulkIssuance()` accepts `callerRole` param and forwards to `issueBadge()` per row — ISSUER ownership enforced per-template |
| S8 | No TOCTOU race condition | ✅ PASS | Template is fetched once via `findUnique`, then ownership is checked on the same object. No gap between check and use. Badge creation is in `$transaction` |

### Architecture Consistency

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A1 | Pattern consistency with template CRUD | ✅ PASS | Identical `if (callerRole === UserRole.ISSUER && template.createdBy !== userId)` pattern used in both |
| A2 | Service vs controller layer inconsistency | ⚠️ CONCERN | Issuance ownership check is in **service layer** (good — defence in depth). Template CRUD ownership is in **controller layer** (acceptable but less defensive). This is an intentional trade-off — the issuance service is called from multiple entry points (single + bulk), making service-layer placement correct. Template CRUD only has one entry point (controller), so controller-layer is adequate. **Recommend:** Consider extracting template CRUD ownership checks to service layer in a future refactoring sprint for full consistency. |
| A3 | `callerRole` uses `UserRole` enum | ⚠️ CONCERN | `badge-issuance.service.ts` uses `UserRole` from `@prisma/client` directly (good). However, `bulk-issuance.service.ts` uses `import('@prisma/client').UserRole` inline type import — functional but non-idiomatic. Should use a regular `import { UserRole } from '@prisma/client'` at top level for consistency. **Severity: Low** — no runtime impact. |
| A4 | Comment references present | ✅ PASS | All files have `ARCH-P1-004` and `Story 16.1` references in comments |

### Test Quality

| # | Check | Result | Notes |
|---|-------|--------|-------|
| T1 | Unit tests cover 3 scenarios | ✅ PASS | Owner ✅, Non-owner ❌ (403 + message assertion), Admin bypass ✅ — all 3 present in `badge-issuance.service.spec.ts` |
| T2 | E2E uses real HTTP + JWT | ✅ PASS | Uses `supertest` with `Bearer ${token}` from `createAndLoginUser()` — real auth flow |
| T3 | E2E creates separate Issuers | ✅ PASS | `issuerAUser` and `issuerBUser` created independently with own templates via `ctx.templateFactory.createActive()` |
| T4 | 403 checks exact message | ✅ PASS | `expect(body.message).toBe('You can only issue badges using your own templates')` — strict equality |
| T5 | Existing tests updated | ✅ PASS | All pre-existing `issueBadge()` calls updated with 3rd param `UserRole.ADMIN` (verified in spec file) |
| T6 | Integration test updated | ✅ PASS | `badge-issuance-teams.integration.spec.ts` calls `issueBadge(issueDto, 'issuer-456', UserRole.ISSUER)` with matching `template.createdBy` |
| T7 | (Story 16.3 item) | N/A | |
| T8 | (Story 16.3 item) | N/A | |

### Code Quality

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C1 | All callers updated | ✅ PASS | Controller, bulk-issuance service, all unit tests, integration tests, and E2E tests all pass 3-arg signature |
| C2 | JSDoc `@param callerRole` added | ✅ PASS | `@param callerRole - Story 16.1: Caller's role for ownership check (ARCH-P1-004)` |
| C3 | No debug artifacts | ✅ PASS | No `console.log`, `TODO`, or debug code found |
| C4 | `ForbiddenException` imported | ✅ PASS | Already in import block at top of `badge-issuance.service.ts` |
| C5 | Inline import type in bulk service | ⚠️ CONCERN | `callerRole: import('@prisma/client').UserRole` is functional but non-idiomatic NestJS. `UserRole` is already used elsewhere via normal imports. Recommend changing to standard import for consistency. **Severity: Low** |

### Edge Cases

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E1 | EMPLOYEE role at service layer | ⚠️ CONCERN | If `callerRole` is `EMPLOYEE`, the ownership check would **PASS** (since `EMPLOYEE !== ISSUER`, the guard doesn't trigger — same as ADMIN). However, EMPLOYEE is blocked at controller by `@Roles` guard, so this path is unreachable in production. **Recommend:** Add a defensive `else if` for unknown/unexpected roles, or an explicit allowlist check. Not a vulnerability today, but could be if a new role (e.g., `GUEST`) is added without updating guards. |
| E2 | `template.createdBy` is null | ⚠️ CONCERN | If `createdBy` is null (legacy templates), comparison `null !== issuerId` would be `true`, blocking ISSUER access to orphan templates. This is the **safe default** (deny access for unowned templates) but could confuse users. **Recommend:** Add documentation noting legacy templates without `createdBy` are ADMIN-only. |
| E3 | Bulk mixed templates | ✅ PASS | Bulk issuance processes rows individually via `for` loop. If template X is owned and Y is not, X succeeds and Y fails with 403 caught as error. Individual failures don't stop the batch. Results array reports per-row status. |

### Summary

**Verdict: ✅ APPROVE WITH COMMENTS**

**Security: 8/8 PASS** — All critical security checks are correctly implemented. The ownership guard is at the right layer, uses correct exceptions, and propagates through bulk issuance.

**Concerns (non-blocking):**
1. **A2 (Architecture):** Service vs controller layer inconsistency for ownership checks — acceptable given different call patterns, but worth tracking for future alignment
2. **A3/C5 (Code Style):** Inline `import()` type in `bulk-issuance.service.ts` — change to standard import
3. **E1 (Edge Case):** EMPLOYEE role would bypass ownership check at service layer (blocked at controller) — add defensive guard for future-proofing
4. **E2 (Edge Case):** `createdBy=null` templates silently blocked for ISSUER — document this behavior

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Added `callerRole: UserRole` parameter to `issueBadge()` with ARCH-P1-004 ownership check
- Updated `badge-issuance.controller.ts` to pass `req.user.role`
- Updated `bulk-issuance.service.ts` and controller for callerRole propagation
- 3 new unit tests, 4 new E2E tests, all existing tests updated for new signature
- All tests passing

### File List
| File | Action |
|------|--------|
| `backend/src/badge-issuance/badge-issuance.service.ts` | **MODIFIED** — Added `callerRole` param + ownership check |
| `backend/src/badge-issuance/badge-issuance.controller.ts` | **MODIFIED** — Pass `req.user.role` to `issueBadge()` |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | **MODIFIED** — Added `callerRole` param + forward to `issueBadge()` |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | **MODIFIED** — Pass `req.user.role` to `confirmBulkIssuance()` |
| `backend/src/badge-issuance/badge-issuance.service.spec.ts` | **MODIFIED** — 3 new ownership tests + updated existing call signatures |
| `backend/src/badge-issuance/badge-issuance-teams.integration.spec.ts` | **MODIFIED** — Updated `issueBadge()` calls with `callerRole` |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | **MODIFIED** — Updated `confirmBulkIssuance()` calls with `callerRole` |
| `backend/test/badge-issuance.e2e-spec.ts` | **MODIFIED** — 4 new ownership E2E tests |

## Retrospective Notes
