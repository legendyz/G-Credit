# Dev Prompt: Story 14.4 — ManagerGuard + @RequireManager() Decorator

**Story File:** `docs/sprints/sprint-14/14-4-manager-guard-decorator.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** HIGH | **Estimate:** 1h | **Wave:** 2 (Role Model Refactor — Backend)  
**Depends On:** 14.3 ✅ (JWT `isManager` claim — commit `d0c2dc5`)

---

## Objective

Create a reusable `ManagerGuard` + `@RequireManager()` decorator to replace inline `directReports` count checks that were added in Story 14.2. The guard reads `isManager` from the JWT-populated `request.user` — **no additional DB query needed** (the claim was computed at login time in Story 14.3).

This is **ADR-017 §4.5** — separating organization-dimension access control from permission-dimension.

---

## Scope — ONLY These Changes

| In Scope | Out of Scope (later stories) |
|----------|------------------------------|
| New: `src/common/guards/manager.guard.ts` | Refactoring controllers to USE the guard (optional bonus) |
| New: `src/common/decorators/require-manager.decorator.ts` | Frontend MANAGER removal (→ 14.7) |
| New: `src/common/guards/manager.guard.spec.ts` | E2E test matrix (→ 14.8) |
| Unit tests for guard + decorator | |

> **Optional bonus:** If time permits, refactor the inline guards in `app.controller.ts` and `dashboard.controller.ts` to use `@RequireManager()` + `UseGuards(ManagerGuard)`. But this is NOT required — the guard and decorator must work correctly even if no controller uses them yet.

---

## ⚠️ CRITICAL WARNINGS

1. **The guard checks `user.isManager` from JWT claim — NOT a DB query.** Story 14.3 already computes `isManager` at login/refresh time. The guard simply reads `request.user.isManager`.
2. **ADMIN bypass is required** — consistent with `RolesGuard`. If `user.role === 'ADMIN'`, the guard returns `true` regardless of `isManager`.
3. **The guard must use Reflector** to check if `@RequireManager()` is applied. If no metadata, the guard should return `true` (passthrough).
4. **DO NOT run `npx prisma format`** — Lesson 22.

---

## Target Files

### 1. NEW: `backend/src/common/guards/manager.guard.ts`

Follow the exact ADR-017 §4.5 spec:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MANAGER_KEY } from '../decorators/require-manager.decorator';
import type { AuthenticatedUser } from '../interfaces/request-with-user.interface';

/**
 * ManagerGuard — ADR-017 §4.5: Organization Dimension
 *
 * Checks the `isManager` claim from the JWT token (set in Story 14.3).
 * This is the ORGANIZATION dimension of the dual-dimension identity model:
 * - Permission dimension: RolesGuard checks role (ADMIN/ISSUER/EMPLOYEE)
 * - Organization dimension: ManagerGuard checks isManager (true/false)
 *
 * ADMIN always bypasses this guard (consistent with RolesGuard).
 *
 * Usage:
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, ManagerGuard)
 *   async getTeamDashboard() { ... }
 *
 * Composition (both dimensions):
 *   @Roles('ISSUER')
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, RolesGuard, ManagerGuard)
 *   async issuerManagerEndpoint() { ... }
 */
@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireManager = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MANAGER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If @RequireManager() not applied, allow through
    if (!requireManager) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    // ADMIN bypasses manager check (consistent with RolesGuard)
    if (user.role === 'ADMIN') return true;

    // Check JWT claim (computed at login/refresh in auth.service.ts)
    return user.isManager === true;
  }
}
```

### 2. NEW: `backend/src/common/decorators/require-manager.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MANAGER_KEY = 'requireManager';

/**
 * RequireManager Decorator — ADR-017 §4.5
 *
 * Marks an endpoint as requiring manager identity (isManager: true in JWT).
 * Must be used with ManagerGuard:
 *
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, ManagerGuard)
 *
 * ADMIN users bypass this check automatically.
 */
export const RequireManager = () => SetMetadata(REQUIRE_MANAGER_KEY, true);
```

### 3. NEW: `backend/src/common/guards/manager.guard.spec.ts`

Create comprehensive unit tests following the existing guard test patterns:

```typescript
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ManagerGuard } from './manager.guard';
import { REQUIRE_MANAGER_KEY } from '../decorators/require-manager.decorator';

describe('ManagerGuard (ADR-017 §4.5)', () => {
  let guard: ManagerGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ManagerGuard(reflector);
  });

  function createMockContext(user: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  describe('when @RequireManager() is NOT applied', () => {
    it('should allow access (passthrough)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = createMockContext({ userId: 'u1', role: 'EMPLOYEE', isManager: false });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @RequireManager() IS applied', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    });

    it('should allow EMPLOYEE with isManager: true', () => {
      const ctx = createMockContext({ userId: 'u1', role: 'EMPLOYEE', isManager: true });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny EMPLOYEE with isManager: false', () => {
      const ctx = createMockContext({ userId: 'u1', role: 'EMPLOYEE', isManager: false });
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should allow ADMIN regardless of isManager (bypass)', () => {
      const ctx = createMockContext({ userId: 'u1', role: 'ADMIN', isManager: false });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow ISSUER with isManager: true', () => {
      const ctx = createMockContext({ userId: 'u1', role: 'ISSUER', isManager: true });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny ISSUER with isManager: false', () => {
      const ctx = createMockContext({ userId: 'u1', role: 'ISSUER', isManager: false });
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
```

Also add a decorator metadata test:

```typescript
describe('RequireManager decorator', () => {
  it('should set requireManager metadata to true', () => {
    // Apply decorator to test class
    @RequireManager()
    class TestHandler {
      method() {}
    }
    // Verify metadata
    const metadata = Reflect.getMetadata(REQUIRE_MANAGER_KEY, TestHandler);
    expect(metadata).toBe(true);
  });
});
```

---

## Execution Steps

### Step 1: Pre-flight Checks
```bash
cd gcredit-project/backend
git log --oneline -3  # Verify on sprint-14/role-model-refactor
npm test -- --passWithNoTests --forceExit  # Confirm green baseline
```

### Step 2: Create Decorator File
- Create `src/common/decorators/require-manager.decorator.ts`
- Export `REQUIRE_MANAGER_KEY` constant and `RequireManager` function

### Step 3: Create Guard File
- Create `src/common/guards/manager.guard.ts`
- Import `REQUIRE_MANAGER_KEY` from the decorator
- Import `AuthenticatedUser` from request-with-user interface
- Implement `canActivate()` with Reflector check → ADMIN bypass → `isManager` check

### Step 4: Create Guard Spec File
- Create `src/common/guards/manager.guard.spec.ts`
- Test passthrough (no decorator), manager allowed, non-manager denied, ADMIN bypass
- Test decorator metadata via `Reflect.getMetadata()`
- Test ISSUER + isManager combinations

### Step 5: (Optional Bonus) Refactor Inline Guards
If time permits, replace the inline `directReports` count checks in these controllers with the new decorator + guard:

#### `app.controller.ts` (lines 122-132) — Current inline guard:
```typescript
@Get('manager-only')
@Roles('EMPLOYEE', 'ADMIN')
async managerRoute(@CurrentUser() user: JwtUser) {
  if (user.role !== 'ADMIN') {
    const directReportCount = await this.prisma.user.count({
      where: { managerId: user.userId },
    });
    if (directReportCount === 0) {
      throw new ForbiddenException('Manager access required...');
    }
  }
  // ...
}
```

**Refactored:**
```typescript
@Get('manager-only')
@Roles('EMPLOYEE', 'ADMIN')
@RequireManager()
@UseGuards(JwtAuthGuard, RolesGuard, ManagerGuard)
async managerRoute(@CurrentUser() user: JwtUser) {
  return { message: 'Manager access granted', user: { ... } };
}
```

Same pattern for `dashboard.controller.ts` `getManagerDashboard()`.

**⚠️ Important:** If you refactor these controllers:
- The guard reads `user.isManager` from JWT (already computed), so the inline `prisma.user.count()` is **no longer needed**.
- Remove the `PrismaService` injection from controllers if it was only used for the inline guard.
- Update the corresponding spec files (`app.controller.spec.ts`, `dashboard.controller.spec.ts`) to test the guard behavior instead of the inline check.
- **Do NOT refactor `analytics.service.ts`** — its inline check also filters data by `managerId`, so it's more than just access control.

### Step 6: Run Full Test Suite
```bash
npm test -- --passWithNoTests --forceExit
# Expect: 50+ suites, 930+ tests, 0 failures
```

### Step 7: Commit
```bash
git add -A
git commit -m "feat: add ManagerGuard + @RequireManager() decorator (ADR-017 §4.5) [14.4]

- New: src/common/guards/manager.guard.ts — organization dimension guard
- New: src/common/decorators/require-manager.decorator.ts
- New: src/common/guards/manager.guard.spec.ts — 7 unit tests
- Guard reads isManager from JWT claim (no DB query)
- ADMIN bypass consistent with RolesGuard
- Composable with @Roles() for dual-dimension access control"
git push --no-verify
```

---

## Acceptance Criteria Checklist

| AC | Verification |
|----|-------------|
| #1 New file `manager.guard.ts` | File exists, implements `CanActivate`, checks `user.isManager` |
| #2 New file `require-manager.decorator.ts` | File exists, exports `RequireManager` and `REQUIRE_MANAGER_KEY` |
| #3 ADMIN bypasses ManagerGuard | Unit test: ADMIN + isManager:false → allowed |
| #4 Composable with @Roles() | Unit test or code example showing dual-dimension |
| #5 ADR-017 code comments | JSDoc in guard file references ADR-017 §4.5 |
| #6 Unit tests: manager/non-manager/ADMIN | 3+ tests covering positive, negative, bypass |
| #7 Decorator metadata test | `Reflect.getMetadata()` returns `true` |

---

## Key References

- **ADR-017 §4.5:** ManagerGuard specification — `docs/decisions/ADR-017-dual-dimension-identity-architecture.md` lines 267-330
- **Existing pattern:** `src/common/guards/roles.guard.ts` — ADMIN bypass, Reflector usage
- **Existing pattern:** `src/common/decorators/roles.decorator.ts` — `SetMetadata` pattern
- **Story 14.3:** JWT `isManager` claim — the data source for this guard
- **Lesson 22:** Never run `npx prisma format`

---

## What NOT To Do

1. ❌ Do NOT make a DB query in the guard — `isManager` is already in the JWT token
2. ❌ Do NOT modify `auth.service.ts` or `jwt.strategy.ts`
3. ❌ Do NOT modify frontend code (→ Story 14.7)
4. ❌ Do NOT modify `schema.prisma` or create migrations
5. ❌ Do NOT run `npx prisma format`
6. ❌ Do NOT refactor `analytics.service.ts` inline guard — it does data filtering, not just access control
