# Code Review Prompt: Story 14.4 — ManagerGuard + @RequireManager() Decorator

## Review Metadata

- **Story:** 14.4 — ManagerGuard + @RequireManager() Decorator
- **Story File:** `docs/sprints/sprint-14/14-4-manager-guard-decorator.md`
- **Commit:** `8ef30d9` (single commit)
- **Parent:** `999007f` (Story 14.3 acceptance docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff 999007f..8ef30d9 -- gcredit-project/backend/`

---

## Scope

7 backend files changed (+167, −124), plus 3 docs files:

| File | Change Type | Purpose |
|------|-------------|---------|
| `backend/src/common/guards/manager.guard.ts` | **New** | ManagerGuard — checks `user.isManager` from JWT |
| `backend/src/common/decorators/require-manager.decorator.ts` | **New** | `@RequireManager()` — `SetMetadata` pattern |
| `backend/src/common/guards/manager.guard.spec.ts` | **New** | 7 unit tests for guard + decorator metadata |
| `backend/src/app.controller.ts` | Modified | Refactored: inline guard → `@RequireManager()` + `UseGuards(ManagerGuard)` |
| `backend/src/app.controller.spec.ts` | Modified | Simplified: removed inline guard tests, delegated to guard spec |
| `backend/src/dashboard/dashboard.controller.ts` | Modified | Refactored: inline guard → decorator, removed `PrismaService` dependency |
| `backend/src/dashboard/dashboard.controller.spec.ts` | Modified | Simplified: removed `PrismaService` mock, overrideGuard pattern |
| `docs/sprints/sprint-14/14-4-dev-prompt.md` | **New** | Dev prompt for this story |
| `docs/sprints/sprint-14/14-4-manager-guard-decorator.md` | Modified | Story status → `review`, ACs/tasks checked |
| `docs/sprints/sprint-status.yaml` | Modified | `14-4` → `review` |

---

## Architecture Context

This is **ADR-017 §4.5** — the organization-dimension guard in the dual-dimension identity model:

- **Permission dimension** (existing): `RolesGuard` checks `user.role` (ADMIN/ISSUER/EMPLOYEE)
- **Organization dimension** (new): `ManagerGuard` checks `user.isManager` (true/false from JWT)

The guard reads `isManager` from the JWT claim that was added in Story 14.3 — **no DB query needed**. This replaces inline `prisma.user.count({ where: { managerId } })` checks scattered across controllers in Story 14.2.

---

## Review Checklist

### 1. ManagerGuard Implementation

**File:** `backend/src/common/guards/manager.guard.ts` (new, 50 lines)

**Verify:**
- [ ] Implements `CanActivate` interface
- [ ] Uses `Reflector.getAllAndOverride()` to check for `REQUIRE_MANAGER_KEY` metadata
- [ ] If no `@RequireManager()` metadata → returns `true` (passthrough)
- [ ] ADMIN bypass: `user.role === 'ADMIN'` → `true` (consistent with `RolesGuard`)
- [ ] Checks `user.isManager === true` (strict equality, not truthy)
- [ ] Imports `AuthenticatedUser` type for request typing
- [ ] ADR-017 §4.5 JSDoc with usage examples and composition pattern

**Reviewer questions:**
1. Is `user.isManager === true` the right check vs `user.isManager`? (Answer: `=== true` is safer — avoids truthy values like `1`, but since the type is `boolean`, the difference is academic.)
2. The guard returns `false` when denied, which results in a generic 403. Should it throw `ForbiddenException` with a descriptive message instead (like the inline guards used to do)?

### 2. RequireManager Decorator

**File:** `backend/src/common/decorators/require-manager.decorator.ts` (new, 16 lines)

**Verify:**
- [ ] Exports `REQUIRE_MANAGER_KEY = 'requireManager'` constant
- [ ] `RequireManager` function uses `SetMetadata(REQUIRE_MANAGER_KEY, true)`
- [ ] ADR-017 JSDoc present with usage example
- [ ] Pattern mirrors existing `@Roles()` decorator

### 3. Guard Unit Tests

**File:** `backend/src/common/guards/manager.guard.spec.ts` (new, 101 lines)

7 tests reported:

| Test | Scenario | Expected |
|------|----------|----------|
| Passthrough | No `@RequireManager()` | `true` |
| EMPLOYEE manager | `isManager: true` | `true` |
| EMPLOYEE non-manager | `isManager: false` | `false` |
| ADMIN bypass | `role: ADMIN`, `isManager: false` | `true` |
| ISSUER manager | `isManager: true` | `true` |
| ISSUER non-manager | `isManager: false` | `false` |
| Decorator metadata | `Reflect.getMetadata()` | `true` |

**Verify:**
- [ ] Mock context correctly constructs `switchToHttp().getRequest()` chain
- [ ] Reflector spy correctly set up in `beforeEach` for `@RequireManager()` applied tests
- [ ] Decorator metadata test uses `@RequireManager()` on a class and checks `Reflect.getMetadata(REQUIRE_MANAGER_KEY, ...)`
- [ ] `beforeEach` uses `jest.restoreAllMocks()` or equivalent to avoid leak

**Reviewer questions:**
1. Is there a test for `user.isManager` being `undefined` (edge case from old tokens)? The `=== true` check would correctly deny, but an explicit test would be nice.
2. Is there a test verifying the guard is registered as `@Injectable()`? (Not required but would catch DI issues)

### 4. Controller Refactors — Bonus Scope

Dev completed the **optional bonus** from the dev prompt — refactoring inline guards in two controllers.

#### `app.controller.ts` (lines 118-140)

**Before:**
```typescript
@Get('manager-only')
@Roles('EMPLOYEE', 'ADMIN')
async managerRoute(@CurrentUser() user: JwtUser) {
  if (user.role !== 'ADMIN') {
    const directReportCount = await this.prisma.user.count({ ... });
    if (directReportCount === 0) throw new ForbiddenException(...);
  }
  return { ... };
}
```

**After:**
```typescript
@Get('manager-only')
@Roles('EMPLOYEE', 'ADMIN')
@RequireManager()
@UseGuards(ManagerGuard)
managerRoute(@CurrentUser() user: JwtUser) {
  return { ... };
}
```

**Verify:**
- [ ] Method changed from `async` to sync (no more DB query)
- [ ] `@RequireManager()` + `@UseGuards(ManagerGuard)` decorators added
- [ ] `ForbiddenException` import removed
- [ ] Inline guard logic fully removed
- [ ] `PrismaService` still injected (used by other methods in `AppController`?)

#### `dashboard.controller.ts` (lines 91-115)

**Verify:**
- [ ] `@RequireManager()` + `@UseGuards(ManagerGuard)` on `getManagerDashboard()`
- [ ] Inline `prisma.user.count()` + `ForbiddenException` removed
- [ ] `PrismaService` removed from constructor (only used for inline guard)
- [ ] `ForbiddenException` import removed
- [ ] `PrismaService` import removed
- [ ] Old comment `// IsManager guard TBD (Story 14.4)` replaced with actual guard

**Reviewer question:**
1. In `dashboard.controller.ts`, was `PrismaService` used for anything else besides the inline guard? If so, removing it would break other methods. (Dev says it was only used for the guard — verify.)

### 5. Controller Spec Simplification

#### `app.controller.spec.ts`

**Verify:**
- [ ] Removed mock `prismaService.user.count`
- [ ] Removed 3 inline guard tests (allow manager, deny non-manager, ADMIN bypass)
- [ ] Added single simple test: `managerRoute` returns expected response
- [ ] Comment reference: "Guard behavior tested in manager.guard.spec.ts"
- [ ] `PrismaService` provider simplified to `useValue: {}`

#### `dashboard.controller.spec.ts`

**Verify:**
- [ ] Removed `mockPrismaService` entirely
- [ ] Removed `PrismaService` provider from test module
- [ ] Added `.overrideGuard(ManagerGuard).useValue({ canActivate: () => true })`
- [ ] Removed "EMPLOYEE without directReports" denial test
- [ ] Removed `expect(mockPrismaService.user.count).not.toHaveBeenCalled()` assertion
- [ ] Manager test now just verifies the service is called with correct userId
- [ ] Comment reference: "Guard behavior tested in manager.guard.spec.ts"

### 6. What Was NOT Refactored (Verify Unchanged)

The dev prompt explicitly said NOT to refactor these files:

| File | Reason NOT to refactor |
|------|----------------------|
| `analytics.service.ts` | Inline check does data filtering (filters by `managerId`), not just access control |
| `badge-issuance.service.ts` | Same — business logic interleaved with guard-like check |

- [ ] Verify `analytics.service.ts` is NOT in the diff
- [ ] Verify `badge-issuance.service.ts` is NOT in the diff

### 7. Guard Registration

**Reviewer question:**
1. Is `ManagerGuard` registered in any module's `providers` array, or is it used only via `@UseGuards()` at the controller level? (In NestJS, guards used with `@UseGuards()` can be instantiated per-request without module registration, as long as they're `@Injectable()` and their dependencies (Reflector) are available globally.)

### 8. Story Documentation

- [ ] Story status = `review`
- [ ] All 7 ACs checked
- [ ] All tasks/subtasks checked
- [ ] Dev Agent Record: model, completion notes, file list
- [ ] Test results: 51/51 suites, 931 tests, 0 ESLint warnings
- [ ] `sprint-status.yaml` updated to `review`

---

## Diff Summary for Quick Review

```bash
# Full backend diff
git diff 999007f..8ef30d9 -- gcredit-project/backend/

# New files only (guard + decorator + spec)
git diff 999007f..8ef30d9 -- gcredit-project/backend/src/common/

# Controller refactors
git diff 999007f..8ef30d9 -- gcredit-project/backend/src/app.controller.ts gcredit-project/backend/src/dashboard/dashboard.controller.ts

# Spec simplification
git diff 999007f..8ef30d9 -- gcredit-project/backend/src/app.controller.spec.ts gcredit-project/backend/src/dashboard/dashboard.controller.spec.ts
```

---

## Verdict Options

- **APPROVED** — Guard/decorator correct, ADMIN bypass present, tests comprehensive, controller refactor clean
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking recommendations
- **CHANGES REQUESTED** — Blocking issue found (describe)
