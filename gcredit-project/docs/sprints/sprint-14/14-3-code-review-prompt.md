# Code Review Prompt: Story 14.3 — JWT Payload: Add `isManager` Claim

## Review Metadata

- **Story:** 14.3 — JWT Payload: Add `isManager` Claim
- **Story File:** `docs/sprints/sprint-14/14-3-jwt-payload-ismanager.md`
- **Commit:** `d74a65a` (single commit)
- **Parent:** `9ad751d` (Sprint 14 backlog reconciliation docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff 9ad751d..d74a65a -- gcredit-project/backend/`

---

## Scope

9 backend files changed (+118, −3), plus 2 docs files:

| File | Change Type | Purpose |
|------|-------------|---------|
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | Modified | `JwtPayload` interface + `validate()` — add `isManager` |
| `backend/src/common/interfaces/request-with-user.interface.ts` | Modified | `AuthenticatedUser` interface — add `isManager` |
| `backend/src/modules/auth/auth.service.ts` | Modified | `computeIsManager()` helper + 4 JWT generation points |
| `backend/src/modules/auth/auth.service.spec.ts` | Modified | `user.count` mock + 4 new isManager tests |
| `backend/src/modules/auth/__tests__/auth.service.jit.spec.ts` | Modified | `user.count` mock for JIT tests |
| `backend/src/admin-users/admin-users.controller.spec.ts` | Modified | `isManager: false` in mock |
| `backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts` | Modified | `isManager: false` in mock |
| `backend/src/badge-sharing/controllers/teams-sharing.controller.spec.ts` | Modified | `isManager: false` in 2 mocks |
| `backend/src/dashboard/dashboard.controller.spec.ts` | Modified | `isManager` in 7 mocks (6× false, 1× true for manager-1) |
| `docs/sprints/sprint-14/14-3-jwt-payload-ismanager.md` | Modified | Story status → `review`, ACs/tasks checked, Dev Agent Record |
| `docs/sprints/sprint-status.yaml` | Modified | `14-3` status → `review` |

---

## Architecture Context

This is **ADR-017 Steps 2-3** (§4.1–§4.3) of the dual-dimension identity refactor.

**Core concept:** Now that `MANAGER` has been removed from the `UserRole` enum (Story 14.2), manager identity is **computed, not stored**:
- `isManager = prisma.user.count({ where: { managerId: userId } }) > 0`
- Uses existing `@@index([managerId])` — O(1) index lookup
- Included in JWT token so frontend/guards can make decisions without additional DB queries

**6 identity combinations** (ADR-017 §2):
| Permission Role | isManager | Example |
|----------------|-----------|---------|
| ADMIN | false | System admin |
| ADMIN | true | Admin who manages team |
| ISSUER | false | Badge issuer |
| ISSUER | true | Issuer who manages team |
| EMPLOYEE | false | Regular employee |
| EMPLOYEE | true | Team lead |

---

## Review Checklist

### 1. Interface Changes

**`JwtPayload`** — `backend/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;       // UserRole: 'ADMIN' | 'ISSUER' | 'EMPLOYEE'
  isManager: boolean; // ADR-017: derived from directReports count > 0
}
```

**Verify:**
- [ ] `isManager: boolean` added (not optional — intentional, since all new tokens will have it)
- [ ] ADR-017 reference comment present
- [ ] No other fields changed

**`AuthenticatedUser`** — `backend/src/common/interfaces/request-with-user.interface.ts`

```typescript
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;       // Permission dimension
  isManager: boolean;   // ADR-017: Organization dimension
}
```

**Verify:**
- [ ] `isManager: boolean` added (required, not optional)
- [ ] Dual-dimension comments match ADR-017 terminology
- [ ] `RequestWithUser` interface unchanged

### 2. `computeIsManager()` Helper

**Location:** `backend/src/modules/auth/auth.service.ts` (private method)

```typescript
private async computeIsManager(userId: string): Promise<boolean> {
  const count = await this.prisma.user.count({
    where: { managerId: userId },
  });
  return count > 0;
}
```

**Verify:**
- [ ] Uses `prisma.user.count()` (not `findMany`) — O(1) with `@@index([managerId])`
- [ ] `where: { managerId: userId }` — correct direction (finds users whose manager IS this user)
- [ ] Returns `boolean` (not count)
- [ ] Is `private` — not exposed externally
- [ ] JSDoc includes ADR-017 reference and performance note

**Reviewer question:**
1. Should this be a standalone utility/service for reuse by Story 14.4's `@RequireManager()` guard, or is duplication acceptable?

### 3. JWT Generation Points (4 total)

Dev prompt warned there are **4 generation points**, not the 3 listed in the story file. Verify all 4 are updated:

#### Point 1: Registration (`register()`)
```typescript
isManager: false, // ADR-017: new users never have direct reports
```
- [ ] Hardcoded `false` — correct (new users can never have reports)
- [ ] `computeIsManager()` is NOT called — avoiding unnecessary DB query

#### Point 2: Login (`login()`)
```typescript
const isManager = await this.computeIsManager(freshUser.id);
```
- [ ] Uses `freshUser.id` (post-sync user, not stale `user` variable)
- [ ] `isManager` included in payload object
- [ ] Called AFTER M365 mini-sync (correct — sync may change `managerId` links)

#### Point 3: SSO Login (`ssoLogin()`)
```typescript
const isManager = await this.computeIsManager(freshUser.id);
```
- [ ] Uses `freshUser.id` (post-JIT/sync user)
- [ ] Same pattern as login flow — consistent
- [ ] Called AFTER M365 sync / JIT provisioning

#### Point 4: Token Refresh (`refreshAccessToken()`)
```typescript
const isManager = await this.computeIsManager(tokenRecord.user.id);
```
- [ ] Uses `tokenRecord.user.id` (from DB, not from token claims)
- [ ] Recomputes `isManager` — correct (may change between refreshes if employees are reassigned)

**Reviewer questions:**
1. In token refresh, `tokenRecord.user` comes from `include: { user: true }` — verify the `user` relation is fetched correctly (check Prisma query at line ~379)
2. Are there any code paths where JWT is generated that were NOT updated? (Check for any other `.sign()` calls in `auth.service.ts`)

### 4. JWT Validation — Backward Compatibility

**`jwt.strategy.ts` `validate()` method:**

```typescript
validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    isManager: payload.isManager ?? false, // ADR-017: backward compat for old tokens
  };
}
```

**Verify:**
- [ ] `?? false` fallback (not `|| false`) — correct for `undefined` handling
- [ ] Old tokens without `isManager` field → user gets `isManager: false` → safe degradation
- [ ] Comment explains backward compatibility rationale

**Reviewer question:**
1. `JwtPayload.isManager` is declared as `boolean` (not `boolean | undefined`), but `?? false` handles undefined. Is the type technically correct for incoming payloads from old tokens? (Answer: at runtime, old JWTs won't have the field, so `payload.isManager` will be `undefined` despite the type. The `?? false` is the practical fix. Consider whether `isManager?: boolean` would be more type-honest.)

### 5. Mock Updates — Downstream Spec Files

Dev reported fixing 11 `AuthenticatedUser` mock locations across 4 spec files.

**Verify completeness — ALL mock `AuthenticatedUser` objects must have `isManager`:**

| Spec File | Mock Count | Value |
|-----------|------------|-------|
| `admin-users.controller.spec.ts` | 1 | `isManager: false` (admin mock) |
| `badge-analytics.controller.spec.ts` | 1 | `isManager: false` (employee mock) |
| `teams-sharing.controller.spec.ts` | 2 | `isManager: false` (employee + issuer mocks) |
| `dashboard.controller.spec.ts` | 7 | 6× `false` + 1× `true` (manager-1 mock) |

**Reviewer questions:**
1. Are there any OTHER spec files in the codebase that construct `AuthenticatedUser` or `RequestWithUser` mocks that were NOT updated? Run: `grep -rn "userId:" --include="*.spec.ts" --include="*.e2e-spec.ts" gcredit-project/backend/src/ | grep "role:"` to verify completeness.
2. The `dashboard.controller.spec.ts` has `isManager: true` for `manager-1` user — is this used in a test that verifies manager-specific dashboard behavior? If so, is the test assertion updated to match?

### 6. Test Coverage — New Tests

4 new tests added in `auth.service.spec.ts` under `describe('JWT isManager claim (ADR-017)')`:

| Test | Scenario | Key Assertion |
|------|----------|---------------|
| isManager: false — login | User with 0 direct reports | `sign()` called with `{ isManager: false }` |
| isManager: true — login | User with 3 direct reports | `sign()` called with `{ isManager: true }` |
| Recompute on refresh | Token refresh path | `user.count` called + `{ isManager: true }` |
| Registration — always false | New user registration | `user.count` NOT called + `{ isManager: false }` |

**Verify:**
- [ ] `mockPrismaService.user.count` added to mock setup (default: `mockResolvedValue(0)`)
- [ ] Same mock added to `auth.service.jit.spec.ts`
- [ ] Login test with `count=0` → `isManager: false`
- [ ] Login test with `count=3` → `isManager: true`
- [ ] Refresh test verifies `computeIsManager` is called with correct userId
- [ ] Registration test verifies `count` is NOT called (optimization check)

**Reviewer questions:**
1. Is there a test for the `?? false` backward compatibility path in `jwt.strategy.ts`? (i.e., calling `validate()` with a payload that has no `isManager` field)
2. Is there a test for SSO login with `isManager: true`? The current 4 tests cover registration, login (2×), and refresh — but not SSO login.
3. Are `mockPrismaService.user.count` calls properly reset between tests? (Check `beforeEach` for `jest.clearAllMocks()`)

### 7. Story Documentation

- [ ] Story status = `review`
- [ ] All 7 AC marked `[x]`
- [ ] All tasks/subtasks marked `[x]` (including SSO as 4th generation point)
- [ ] Dev Agent Record filled: model, plan, completion notes, file list, change log
- [ ] Test results documented: 49/49 suites, 923 tests, 0 ESLint warnings
- [ ] `sprint-status.yaml` updated to `review`

---

## What Was NOT Changed (Verify Unchanged)

These files/areas MUST NOT be modified in this story:

| File/Area | Belongs To |
|-----------|-----------|
| `@RequireManager()` decorator / ManagerGuard | Story 14.4 |
| `@Roles()` decorators on controllers | Already done in 14.2 |
| Frontend MANAGER references | Story 14.7 |
| `schema.prisma` / migrations | Already done in 14.2 |
| M365 sync `deriveRole()` logic | Already done in 14.2 |
| E2E test helpers (`createManager`) | Already done in 14.2, refined in 14.8 |

---

## Diff Summary for Quick Review

```bash
# View the full diff
git diff 9ad751d..d74a65a -- gcredit-project/backend/

# View just the core auth changes (3 files)
git diff 9ad751d..d74a65a -- gcredit-project/backend/src/modules/auth/ gcredit-project/backend/src/common/interfaces/

# View just mock updates (4 spec files)
git diff 9ad751d..d74a65a -- gcredit-project/backend/src/admin-users/ gcredit-project/backend/src/badge-sharing/ gcredit-project/backend/src/dashboard/
```

---

## Verdict Options

- **APPROVED** — Interfaces correct, all 4 generation points updated, backward compat handled, tests adequate
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking recommendations (e.g., missing SSO test)
- **CHANGES REQUESTED** — Blocking issue found (describe)
