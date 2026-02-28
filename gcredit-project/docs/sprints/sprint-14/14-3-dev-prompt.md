# Dev Prompt: Story 14.3 — JWT Payload: Add `isManager` Claim

**Story File:** `docs/sprints/sprint-14/14-3-jwt-payload-ismanager.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** CRITICAL | **Estimate:** 2h | **Wave:** 2 (Role Model Refactor — Backend)  
**Depends On:** 14.2 ✅ (MANAGER removed from enum — commit `a56bdfb`–`25c0ae3`)

---

## Objective

Add `isManager: boolean` to the JWT payload and request user object, so the frontend and guards can determine manager identity from the token instead of the removed `MANAGER` role enum. This is **ADR-017 Steps 2-3** (§4.1–§4.3).

`isManager` is **computed, not stored** — derived from `prisma.user.count({ where: { managerId: userId } }) > 0` using the existing `@@index([managerId])` (O(1) index lookup).

---

## Scope — ONLY These Changes

| In Scope | Out of Scope (later stories) |
|----------|------------------------------|
| `JwtPayload` interface — add `isManager` | `@RequireManager()` decorator (→ 14.4) |
| `AuthenticatedUser` interface — add `isManager` | Frontend type updates (→ 14.7) |
| `auth.service.ts` — `computeIsManager()` helper | E2E test matrix (→ 14.8) |
| `auth.service.ts` — 4 JWT generation points | Design tokens (→ 14.9) |
| `jwt.strategy.ts` — pass `isManager` through | |
| Unit tests for `isManager` in JWT | |

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT run `npx prisma format`** — Lesson 22: destroys `@@map()` conventions.
2. **Prisma version locked at 6.19.2** — do not upgrade.
3. **Backward compatibility required** — old tokens without `isManager` must work (`?? false` fallback).
4. **4 JWT generation points, not 3** — registration, login, SSO login, token refresh. The story file says 3 but SSO login (`ssoLogin()` at line 631) is a 4th point that must also be updated.

---

## Target Files

### 1. `backend/src/modules/auth/strategies/jwt.strategy.ts`

**Update `JwtPayload` interface (lines 7-11):**

```typescript
// Current:
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
}

// Target:
export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;       // UserRole: 'ADMIN' | 'ISSUER' | 'EMPLOYEE'
  isManager: boolean; // ADR-017: derived from directReports count > 0
}
```

**Update `validate()` method (lines 60-67):**

```typescript
// Current:
validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

// Target:
validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    isManager: payload.isManager ?? false, // ADR-017: backward compat for old tokens
  };
}
```

### 2. `backend/src/common/interfaces/request-with-user.interface.ts`

**Update `AuthenticatedUser` interface (lines 10-14):**

```typescript
// Current:
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

// Target:
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;       // Permission dimension
  isManager: boolean;   // ADR-017: Organization dimension
}
```

### 3. `backend/src/modules/auth/auth.service.ts`

**Add `computeIsManager()` private helper method:**

```typescript
/**
 * ADR-017 §4.1: Compute isManager from directReports count.
 * Uses @@index([managerId]) — O(1) index lookup, ~1ms.
 */
private async computeIsManager(userId: string): Promise<boolean> {
  const count = await this.prisma.user.count({
    where: { managerId: userId },
  });
  return count > 0;
}
```

**Update 4 JWT generation points:**

#### Point 1: Registration (`register()`, ~line 72)
```typescript
// Current:
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};

// Target:
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
  isManager: false, // ADR-017: new users never have direct reports
};
```

#### Point 2: Login (`login()`, ~line 198)
```typescript
// Current:
const payload = {
  sub: freshUser.id,
  email: freshUser.email,
  role: freshUser.role,
};

// Target:
const isManager = await this.computeIsManager(freshUser.id);
const payload = {
  sub: freshUser.id,
  email: freshUser.email,
  role: freshUser.role,
  isManager,
};
```

#### Point 3: SSO Login (`ssoLogin()`, ~line 722)
```typescript
// Current:
const payload = {
  sub: freshUser.id,
  email: freshUser.email,
  role: freshUser.role,
};

// Target:
const isManager = await this.computeIsManager(freshUser.id);
const payload = {
  sub: freshUser.id,
  email: freshUser.email,
  role: freshUser.role,
  isManager,
};
```

#### Point 4: Token Refresh (`refreshAccessToken()`, ~line 410)
```typescript
// Current:
const newPayload = {
  sub: tokenRecord.user.id,
  email: tokenRecord.user.email,
  role: tokenRecord.user.role,
};

// Target:
const isManager = await this.computeIsManager(tokenRecord.user.id);
const newPayload = {
  sub: tokenRecord.user.id,
  email: tokenRecord.user.email,
  role: tokenRecord.user.role,
  isManager,
};
```

---

## Downstream Impact — Check These Files

After adding `isManager` to `AuthenticatedUser`, any file that constructs a mock `AuthenticatedUser` for testing may need updating. **Search for these patterns** to find affected test files:

```bash
# Find all mock AuthenticatedUser objects
grep -rn "userId:" --include="*.spec.ts" --include="*.e2e-spec.ts" | grep -i "role:"
```

Each mock `AuthenticatedUser` needs `isManager: false` (or `true` where testing manager scenarios). Common locations:
- Controller spec files that mock `request.user`
- Guard spec files
- Service spec files that receive `AuthenticatedUser`

**Do NOT skip this step.** TypeScript will flag any mock missing `isManager` — fix all of them.

---

## Execution Steps

### Step 1: Pre-flight Checks
```bash
cd gcredit-project/backend
git log --oneline -3  # Verify on sprint-14/role-model-refactor
npm test -- --passWithNoTests --forceExit  # Confirm green baseline (49 suites, 919 tests)
```

### Step 2: Update Interfaces
- Edit `jwt.strategy.ts` — `JwtPayload` + `validate()`
- Edit `request-with-user.interface.ts` — `AuthenticatedUser`

### Step 3: Add `computeIsManager()` Helper
- Add private method to `AuthService` class
- Place it near the other private helpers (before `calculateExpiryDate()`)

### Step 4: Update 4 JWT Generation Points
- Registration (`register()`)
- Login (`login()`)
- SSO Login (`ssoLogin()`)
- Token Refresh (`refreshAccessToken()`)

### Step 5: Fix Downstream TypeScript Errors
- Run `npx tsc --noEmit` to find all `AuthenticatedUser` type errors
- Add `isManager: false` (or contextually appropriate value) to all mock objects
- This may touch 5-15 spec files — that's expected

### Step 6: Update auth.service.spec.ts
Add `user.count` to `mockPrismaService`:
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),  // ADD THIS
  },
  // ... rest unchanged
};
```

Add new tests:
```typescript
describe('JWT isManager claim (ADR-017)', () => {
  it('should include isManager: false for user with no direct reports', async () => {
    mockPrismaService.user.count.mockResolvedValue(0);
    // ... login flow → verify jwtService.sign called with { isManager: false }
  });

  it('should include isManager: true for user with direct reports', async () => {
    mockPrismaService.user.count.mockResolvedValue(3);
    // ... login flow → verify jwtService.sign called with { isManager: true }
  });

  it('should recompute isManager on token refresh', async () => {
    mockPrismaService.user.count.mockResolvedValue(2);
    // ... refresh flow → verify new payload has isManager: true
  });

  it('should set isManager: false for registration (no direct reports possible)', async () => {
    // ... register flow → verify payload has isManager: false
    // Note: user.count should NOT be called for registration
  });
});
```

### Step 7: Run Full Test Suite
```bash
npm test -- --passWithNoTests --forceExit
```
- All 49 backend suites should pass
- Check frontend tests too: `cd ../frontend && npm test -- --run`

### Step 8: Commit
```bash
git add -A
git commit -m "feat: add isManager claim to JWT payload (ADR-017 §4.1-4.3) [14.3]

- JwtPayload interface: add isManager: boolean
- AuthenticatedUser interface: add isManager: boolean  
- computeIsManager() helper: prisma.user.count with @@index([managerId])
- 4 JWT generation points updated (register, login, SSO, refresh)
- jwt.strategy.ts: backward compat with ?? false fallback
- Unit tests: isManager true/false/refresh/registration"
git push --no-verify
```

---

## Acceptance Criteria Checklist

| AC | Verification |
|----|-------------|
| #1 `JwtPayload` interface has `isManager: boolean` | Check `jwt.strategy.ts` |
| #2 `AuthenticatedUser` interface has `isManager: boolean` | Check `request-with-user.interface.ts` |
| #3 Registration: `isManager: false` | Check `register()` payload, unit test |
| #3 Login: `isManager` computed from DB | Check `login()` calls `computeIsManager()`, unit test |
| #3 SSO Login: `isManager` computed from DB | Check `ssoLogin()` calls `computeIsManager()` |
| #3 Token Refresh: `isManager` recomputed | Check `refreshAccessToken()` calls `computeIsManager()`, unit test |
| #4 `jwt.strategy.ts` `validate()` passes `isManager` with `?? false` | Check validate method |
| #5 `computeIsManager()` uses `prisma.user.count` with `managerId` | Check helper method |
| #6 Old tokens without `isManager` treated as `false` | `?? false` fallback in validate() |
| #7 Unit tests for with/without direct reports | New test describe block |

---

## Key References

- **ADR-017 §4.1:** JwtPayload changes — `docs/decisions/ADR-017-dual-dimension-identity-architecture.md` lines 142-200
- **ADR-017 §4.2:** AuthenticatedUser changes — lines 203-218
- **ADR-017 §4.3:** JwtStrategy changes — lines 225-237
- **Schema `@@index([managerId])`:** `prisma/schema.prisma` line 75
- **Lesson 22:** Never run `npx prisma format`

---

## What NOT To Do

1. ❌ Do NOT create `@RequireManager()` decorator or `ManagerGuard` (→ Story 14.4)
2. ❌ Do NOT modify frontend code (→ Story 14.7)
3. ❌ Do NOT modify `schema.prisma` or create migrations
4. ❌ Do NOT modify `@Roles()` decorators on controllers
5. ❌ Do NOT modify M365 sync `deriveRole()` logic
6. ❌ Do NOT run `npx prisma format`
7. ❌ Do NOT store `isManager` as a database column — it's computed at JWT generation time
