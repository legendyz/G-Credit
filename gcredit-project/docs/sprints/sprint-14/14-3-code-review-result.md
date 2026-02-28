# Code Review Result: Story 14.3 — JWT Payload: Add `isManager` Claim

## Review Metadata

- **Story:** 14.3 — JWT Payload: Add `isManager` Claim
- **Story File:** `docs/sprints/sprint-14/14-3-jwt-payload-ismanager.md`
- **Commit Reviewed:** `d74a65a`
- **Parent:** `9ad751d`
- **Branch:** `sprint-14/role-model-refactor`
- **Review Scope:** backend changes + story/status docs updates in the target commit
- **Date:** 2026-02-28

---

## Verdict

**APPROVED WITH FOLLOW-UP**

The implementation is correct for ADR-017 steps 4.1–4.3 and updates all expected JWT generation paths. A few non-blocking test/completeness follow-ups are recommended.

---

## Checklist Review

### 1) Interface Changes

#### `JwtPayload` (`backend/src/modules/auth/strategies/jwt.strategy.ts`)
- [x] `isManager: boolean` added
- [x] ADR-017 comment present
- [x] No unrelated field changes

#### `AuthenticatedUser` (`backend/src/common/interfaces/request-with-user.interface.ts`)
- [x] `isManager: boolean` added (required)
- [x] Dual-dimension comments are clear and aligned with ADR-017
- [x] `RequestWithUser` shape unchanged

### 2) `computeIsManager()` Helper (`auth.service.ts`)
- [x] Uses `prisma.user.count()`
- [x] Uses correct direction: `where: { managerId: userId }`
- [x] Returns boolean (`count > 0`)
- [x] Declared `private`
- [x] Includes ADR-017 and performance note in JSDoc

**Reviewer note:** keeping this helper inside `AuthService` is acceptable for this story. Story 14.4 can extract shared logic later if duplication appears in guard/decorator implementation.

### 3) JWT Generation Points (4)

- [x] **Registration:** `isManager: false` (no DB query)  
- [x] **Login:** `computeIsManager(freshUser.id)` after sync and before payload signing  
- [x] **SSO Login:** `computeIsManager(freshUser.id)` after JIT/sync flow  
- [x] **Refresh:** `computeIsManager(tokenRecord.user.id)` with `include: { user: true }`

**Additional check:** all access-token payload signing call sites in `auth.service.ts` include `isManager`; refresh-token-only signing calls remain unchanged as expected.

### 4) JWT Validation Backward Compatibility

- [x] `validate()` maps `isManager: payload.isManager ?? false`
- [x] `?? false` is correct fallback behavior for old tokens missing claim
- [x] Backward-compat rationale comment present

**Type note:** runtime fallback is correct. For stricter type honesty, `JwtPayload.isManager?: boolean` could be considered, but not required for correctness.

### 5) Mock Updates in Downstream Specs

The listed files were updated and include `isManager` where `RequestWithUser`/`AuthenticatedUser` is explicitly constructed:
- [x] `admin-users.controller.spec.ts`
- [x] `badge-analytics.controller.spec.ts`
- [x] `teams-sharing.controller.spec.ts`
- [x] `dashboard.controller.spec.ts` (includes one `isManager: true` case for manager mock)

**Finding:** one additional typed cast exists in `badge-issuance.controller.spec.ts` (`as RequestWithUser`) with minimal `userId` shape only. This predates Story 14.3 changes and is not a blocker for this story, but should be tightened later to avoid hidden type-drift.

### 6) Test Coverage (New Tests)

- [x] `mockPrismaService.user.count` added in `auth.service.spec.ts` and `auth.service.jit.spec.ts`
- [x] Login (`count=0`) → `isManager: false`
- [x] Login (`count=3`) → `isManager: true`
- [x] Refresh recomputation path covered
- [x] Registration avoids count query and sets `isManager: false`
- [x] `beforeEach` uses `jest.clearAllMocks()`

**Coverage gaps (non-blocking):**
1. No dedicated unit test for `jwt.strategy.validate()` old-token fallback (`isManager` omitted).  
2. No explicit SSO `isManager: true` assertion test (SSO path is updated in code, but positive manager-case assertion is not isolated).

### 7) Story Documentation

- [x] Story status = `review` in reviewed commit context
- [x] ACs all checked
- [x] Tasks/subtasks checked (including SSO as 4th generation point)
- [x] Dev Agent Record filled with model/notes/file list
- [x] sprint-status updated to `review` in reviewed commit context

---

## Reviewer Questions — Answers

1. **Should `computeIsManager()` be shared now?**  
   Not necessary in 14.3. Current placement in `AuthService` is acceptable; refactor when Story 14.4 introduces guard-level reuse.

2. **Is refresh path user relation fetched correctly?**  
   Yes. `refreshAccessToken()` uses `findUnique(... include: { user: true })`, so `tokenRecord.user.id` is safe for recomputation.

3. **Any other JWT generation paths missed?**  
   No missed access-token payload paths in `auth.service.ts` for this story scope.

4. **Is `JwtPayload.isManager: boolean` type perfectly honest for old tokens?**  
   Runtime behavior is safe due to `?? false`. Type-level optionality (`isManager?: boolean`) would be more explicit but is optional.

5. **Any other spec mocks missing `isManager`?**  
   In explicitly updated `RequestWithUser` mock files listed by prompt, coverage is complete. One older cast-based shortcut exists in `badge-issuance.controller.spec.ts` and should be cleaned up later.

6. **Is `dashboard.controller.spec.ts` `isManager: true` mock meaningfully used?**  
   It is present in manager-path test input; however, current manager authorization in that controller uses directReports DB count, not the claim itself.

---

## Non-blocking Follow-up Recommendations

1. Add a focused `jwt.strategy` unit test: payload without `isManager` returns `isManager: false`.
2. Add a focused SSO test asserting `isManager: true` when directReports count > 0.
3. Normalize cast-based `RequestWithUser` mocks (e.g., in `badge-issuance.controller.spec.ts`) to full interface shape for stronger compile-time safety.

---

## Final Decision

**APPROVED WITH FOLLOW-UP**

The Story 14.3 implementation is functionally correct and aligned with ADR-017. Suggested follow-ups are test hardening and mock consistency improvements, not blockers.