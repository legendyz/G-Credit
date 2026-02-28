# Code Review Result: Story 14.4 — ManagerGuard + `@RequireManager()` Decorator

## Review Metadata

- **Story:** 14.4 — ManagerGuard + `@RequireManager()` Decorator
- **Story File:** `docs/sprints/sprint-14/14-4-manager-guard-decorator.md`
- **Commit Reviewed:** `8ef30d9`
- **Parent:** `999007f`
- **Branch:** `sprint-14/role-model-refactor`
- **Diff Basis:** `git diff 999007f..8ef30d9 -- gcredit-project/backend/`
- **Date:** 2026-02-28

---

## Verdict

**APPROVED**

The guard/decorator implementation is correct, the inline controller DB checks were cleanly refactored, and previously noted follow-up items have been addressed.

---

## Checklist Review

### 1) ManagerGuard Implementation

File: `backend/src/common/guards/manager.guard.ts`

- [x] Implements `CanActivate`
- [x] Uses `Reflector.getAllAndOverride()` with `REQUIRE_MANAGER_KEY`
- [x] Passthrough when metadata is absent
- [x] ADMIN bypass present (`user.role === 'ADMIN'`)
- [x] Uses strict check `user.isManager === true`
- [x] Uses `AuthenticatedUser` typing for request user
- [x] ADR-017 §4.5 JSDoc/comments present with composition examples

**Reviewer notes:**
1. `=== true` is a good defensive choice.
2. Guard now throws `ForbiddenException('Manager access required')` for denied access, improving diagnostics.

### 2) `@RequireManager()` Decorator

File: `backend/src/common/decorators/require-manager.decorator.ts`

- [x] Exports `REQUIRE_MANAGER_KEY = 'requireManager'`
- [x] Uses `SetMetadata(REQUIRE_MANAGER_KEY, true)`
- [x] ADR-017 comment and usage guidance present
- [x] Follows the same pattern style as existing metadata decorators

### 3) Guard Unit Tests

File: `backend/src/common/guards/manager.guard.spec.ts`

- [x] 8 tests present and passing (including undefined `isManager` edge case)
- [x] Mocked `ExecutionContext` request chain is correct
- [x] Reflector metadata spy is used correctly for applied/non-applied paths
- [x] Decorator metadata test verifies `Reflect.getMetadata(REQUIRE_MANAGER_KEY, ...) === true`
- [x] Test isolation is adequate for current setup

**Reviewer notes:**
1. Explicit test for `user.isManager` undefined (old token edge case) is now present and passing.
2. DI wiring is covered by explicit `ManagerGuard` registration in `AppModule` providers.

### 4) Controller Refactors (Bonus Scope)

#### `app.controller.ts`
- [x] `managerRoute` changed from async inline DB check to sync method with `@RequireManager()` + `@UseGuards(ManagerGuard)`
- [x] Inline guard logic removed
- [x] `ForbiddenException` import removed
- [x] `PrismaService` kept (still used by `/ready` endpoint)

#### `dashboard.controller.ts`
- [x] `getManagerDashboard()` now uses `@RequireManager()` + `@UseGuards(ManagerGuard)`
- [x] Inline `prisma.user.count()` check removed
- [x] `ForbiddenException` import removed
- [x] `PrismaService` import/constructor dependency removed
- [x] Old "guard TBD" state replaced with actual guard usage

### 5) Controller Spec Simplification

#### `app.controller.spec.ts`
- [x] Inline manager-guard behavioral tests removed (moved to `manager.guard.spec.ts`)
- [x] `PrismaService` provider simplified
- [x] Method-level response test retained

#### `dashboard.controller.spec.ts`
- [x] `PrismaService` mock/provider removed
- [x] `ManagerGuard` overridden via `overrideGuard(ManagerGuard)`
- [x] Manager-path test now validates delegation to service
- [x] Removed inline DB-check assertions

### 6) Files Intentionally Not Refactored

From commit diff scope check (`999007f..8ef30d9` backend files):
- [x] `analytics.service.ts` not changed
- [x] `badge-issuance.service.ts` not changed

Scope adherence is correct.

### 7) Guard Registration

- `ManagerGuard` is used via `@UseGuards(ManagerGuard)` at controller methods and is marked `@Injectable()`.
- Explicit module-level registration has been added in `AppModule` providers.

### 8) Story Documentation

- [x] Story status = `review`
- [x] ACs/tasks checked in story file
- [x] Dev Agent Record present
- [x] `sprint-status.yaml` updated to `14-4: review`

---

## Verification Runs (This Review)

Executed and passed:
- `npm test -- src/common/guards/manager.guard.spec.ts --runInBand`
- `npm test -- src/app.controller.spec.ts --runInBand`
- `npm test -- src/dashboard/dashboard.controller.spec.ts --runInBand`

---

## Re-review Update

- Reviewed follow-up commit: `6d820ac`
- Closed items:
	1. Added undefined `isManager` edge-case denial test in `manager.guard.spec.ts`
	2. `ManagerGuard` now throws `ForbiddenException('Manager access required')`
	3. `ManagerGuard` registered in `AppModule` providers

---

## Final Decision

**APPROVED**

Story 14.4 implementation is correct, aligns with ADR-017 §4.5, and follow-up hardening items are complete.