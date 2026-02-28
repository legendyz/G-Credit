# Code Review Prompt: Story 14.8 — 6-Combination Test Matrix (ADR-017 §7)

## Review Metadata

- **Story:** 14.8 — 6-Combination Test Matrix
- **Story File:** `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md`
- **Commit:** `f9b2778`
- **Parent:** `db5003e` (Story 14.7 acceptance docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff db5003e..f9b2778 -- gcredit-project/backend/test/`

---

## Scope

1 new test file (+257 lines), 1 story file updated, 1 dev prompt committed:

| File | Change Type | Purpose |
|------|-------------|---------|
| `backend/test/role-matrix.e2e-spec.ts` | **New** | 29 E2E tests: 6 combos × 4 endpoints + JWT backward compat + dashboard matrix |
| `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md` | Modified | Status → `done`, ACs checked, dev agent record |
| `docs/sprints/sprint-14/14-8-dev-prompt.md` | **New** | Dev prompt (docs only) |

---

## Architecture Context

This story is **ADR-017 §7** — the final validation gate before Sprint 15 UI overhaul.

The dual-dimension identity model separates two concerns:
- **Permission dimension:** `role` = `ADMIN | ISSUER | EMPLOYEE` (RolesGuard)
- **Organization dimension:** `isManager` = `boolean` from JWT claim (ManagerGuard, Story 14.3/14.4)

This test matrix verifies all 6 valid combinations against 4 access dimensions using real E2E infrastructure.

### Expected Access Matrix (ADR-017 §7)

| # | Role | isManager | `/profile` | `/manager-only` | `/issuer-only` | `/admin-only` |
|---|------|-----------|-----------|-----------------|---------------|--------------|
| 1 | EMPLOYEE | false | 200 | 403 | 403 | 403 |
| 2 | EMPLOYEE | true | 200 | 200 | 403 | 403 |
| 3 | ISSUER | false | 200 | 403 | 200 | 403 |
| 4 | ISSUER | true | 200 | 403* | 200 | 403 |
| 5 | ADMIN | false | 200 | 200** | 200 | 200 |
| 6 | ADMIN | true | 200 | 200 | 200 | 200 |

\* Combo #4: ISSUER+manager gets 403 on `/manager-only` because `@Roles('EMPLOYEE','ADMIN')` blocks ISSUER before ManagerGuard runs. This is by design.
\*\* Combo #5: ADMIN bypasses ManagerGuard even with `isManager: false` — ManagerGuard has ADMIN exception.

---

## Review Checklist

### 1. Test Setup — `beforeAll` User Creation & Login Strategy

**File:** `backend/test/role-matrix.e2e-spec.ts`, lines 44–88

**Verify:**
- [ ] Uses `setupE2ETest('role-matrix')` for schema isolation
- [ ] 5 real logins via `createAndLoginUser()` for combos #1–#5
- [ ] Combo #4 (ISSUER+manager): manual setup — create ISSUER → add subordinate → login
- [ ] Combo #6 (ADMIN+manager): uses `JwtService.sign()` to avoid exceeding 5-login/min rate limit
- [ ] `teardownE2ETest()` in `afterAll`
- [ ] All 6 tokens declared at describe scope for reuse

**Reviewer questions:**
1. Token strategy: Combos #1–#5 log in via HTTP (5 real logins). Combo #6 synthesizes a JWT via `JwtService.sign()`. Is the login count within the 5/min rate limit? (5 logins via `createAndLoginUser` + 1 direct login for combo #4 = 6 total HTTP logins. But the rate limit is per-IP per-minute. Does `beforeAll` run fast enough that all 6 fall within one minute window?)
2. Combo #6 JWT: The `jwtService.sign()` call passes `{ sub, email, role, isManager: true }`. Does this match the production JWT payload structure from `auth.service.ts`? Are any other claims missing (e.g. `name`, `iat`, `exp`)? (`iat` and `exp` are auto-set by `JwtService.sign()`. Check if any guard relies on `name` or other claims beyond `sub`, `email`, `role`, `isManager`.)
3. The backward compatibility test in `JWT backward compatibility` block also creates an employee via `ctx.userFactory.createEmployee()`. This creates a 7th DB user. Verify it doesn't trigger a 7th login (it doesn't — it uses `JwtService.sign()` instead).

### 2. Auth Helper — Request Pattern

**File:** `backend/test/role-matrix.e2e-spec.ts`, lines 94–97

**Verify:**
- [ ] `authGet()` helper uses `Authorization: Bearer ${token}` header
- [ ] Consistent with existing E2E test pattern from `test-setup.ts` `authRequest()` helper
- [ ] No cookie-based auth — Bearer token only (matches current E2E convention, Story 11.25 L-7 fallback)

**Reviewer note:** The test file defines its own inline `authGet()` helper rather than using the exported `authRequest()` from `test-setup.ts`. This is a minor style inconsistency but functionally equivalent. Consider whether to flag for consistency.

### 3. Combo #1–#6: Endpoint Access Tests (24 tests)

**File:** `backend/test/role-matrix.e2e-spec.ts`, lines 99–218

**Verify each combo against the access matrix above:**

- [ ] **Combo #1** (EMPLOYEE, isManager=false): 200, 403, 403, 403
- [ ] **Combo #2** (EMPLOYEE, isManager=true): 200, 200, 403, 403
- [ ] **Combo #3** (ISSUER, isManager=false): 200, 403, 200, 403
- [ ] **Combo #4** (ISSUER, isManager=true): 200, **403**, 200, 403 — verify comment explains ISSUER blocked by `@Roles` before ManagerGuard
- [ ] **Combo #5** (ADMIN, isManager=false): 200, **200**, 200, 200 — verify comment explains ADMIN bypass
- [ ] **Combo #6** (ADMIN, isManager=true): 200, 200, 200, 200

**Reviewer question:**
4. Combo #4 test at line ~175: The comment says "ISSUER+manager gets 403 because @Roles('EMPLOYEE','ADMIN') blocks ISSUER. ManagerGuard never runs." Verify this against `app.controller.ts` line 125: `@Roles('EMPLOYEE', 'ADMIN')` — correct, ISSUER is not in the roles list, so RolesGuard returns 403 before ManagerGuard executes.

### 4. JWT Backward Compatibility (AC #2)

**File:** `backend/test/role-matrix.e2e-spec.ts`, lines 220–240

**Verify:**
- [ ] Creates employee user (no login — factory only)
- [ ] Signs JWT via `JwtService.sign()` **without** `isManager` field
- [ ] Tests `/manager-only` → 403 (treated as non-manager)
- [ ] Tests `/profile` → 200 (no 500 — graceful degradation)

**Reviewer question:**
5. Does the ManagerGuard handle `undefined` isManager gracefully? Check `manager.guard.ts`: `user.isManager === true` — if `isManager` is `undefined`, strict `=== true` returns `false`. Correct — no crash.
6. Is there a test for when `isManager` is explicitly `false` (vs. missing)? The combo #1 and #3 tests cover `isManager: false` from real login tokens. The backward compat test covers `isManager: undefined`. Good coverage.

### 5. Dashboard Endpoint Matrix (4 additional tests)

**File:** `backend/test/role-matrix.e2e-spec.ts`, lines 242–258

**Verify:**
- [ ] `EMPLOYEE+manager` → `/api/dashboard/manager` → 200
- [ ] `EMPLOYEE non-manager` → `/api/dashboard/manager` → 403
- [ ] `ADMIN` → `/api/dashboard/manager` → 200 (bypass)
- [ ] `ISSUER` → `/api/dashboard/manager` → 403

**Reviewer questions:**
7. Dashboard controller at `dashboard.controller.ts` line 94: `@Roles(UserRole.EMPLOYEE, UserRole.ADMIN)` + `@RequireManager()` + `@UseGuards(ManagerGuard)`. This matches the test expectations. The ISSUER→403 is because `@Roles` blocks ISSUER (same pattern as `/manager-only`). Verify alignment.
8. Should combo #4 (ISSUER+manager) and combo #6 (ADMIN+manager) also be tested against `/api/dashboard/manager`? Currently only 4 dashboard tests vs 6 possible combos. Is this sufficient coverage or a gap?

### 6. Story File Updates

**File:** `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md`

**Verify:**
- [ ] Status: `done`
- [ ] ACs #1, #2, #5 checked (`[x]`)
- [ ] ACs #3, #4 marked N/A (`[~]`) with justification
- [ ] Dev Agent Record filled: model, completion notes, file list
- [ ] Regression counts: backend 932, frontend 794, E2E 29 = total 1,755

---

## Potential Issues to Investigate

### P1: Rate Limit Risk in `beforeAll`

The test makes **6 HTTP login requests** (5 via `createAndLoginUser` + 1 direct login for combo #4) in `beforeAll`. The auth controller rate limit is `5 logins/min/IP` (hardcoded in `@Throttle`, see TD-038). If `beforeAll` completes within ~1 second, all 6 logins hit the same minute window → the 6th login should get 429.

**Investigation:** Did the dev confirm all 29 tests pass? The story records "29/29 ✅". How was this achieved?
- Possibility 1: The test module inherits `ThrottlerModule` but E2E schema isolation may reset throttle state
- Possibility 2: `setupE2ETest()` overrides providers in a way that relaxes throttling
- Possibility 3: NestJS throttler uses in-memory storage by default; each test app instance gets its own throttle counters (most likely — each `setupE2ETest` creates a new app instance)

**Ask dev to confirm:** Does each `setupE2ETest()` create a fresh NestJS app instance with its own in-memory throttle state? If so, the 6-login concern is moot for tests. But document this understanding.

### P2: Combo #6 JWT Payload Completeness

Combo #6 uses `JwtService.sign({ sub, email, role, isManager: true })`. Production JWTs (from `auth.service.ts`) may include additional claims. If any middleware, guard, or interceptor reads a claim not in this payload, the test could pass falsely or mask a bug.

**Investigation:** Verify the JWT payload structure in `auth.service.ts` `buildJwtPayload()` or equivalent. Do production tokens include `name`, `isActive`, or other claims that guards/interceptors depend on?

### P3: `authGet()` vs `authRequest()` Consistency

The test defines a local `authGet()` helper instead of using the shared `authRequest()` from `test-setup.ts`. Both use the same `Authorization: Bearer` pattern. This is functional but inconsistent with other E2E test files.

**Severity:** Low — style only. No functional impact.

---

## Test Evidence Required

- [ ] Backend unit tests: `npm test` → 51 suites, 932 passed
- [ ] Frontend tests: `npm run test` → 77 suites, 794 passed
- [ ] E2E tests: `npx jest --config ./test/jest-e2e.json --runInBand` → includes role-matrix 29 passed
- [ ] No new ESLint warnings (pre-push hook passes or `--max-warnings=0`)

---

## Decision Points for Reviewer

1. **APPROVE if:** All 29 tests correctly map to ADR-017 §7 access matrix, JWT backward compat verified, no false positives from incomplete JWT payload.
2. **REQUEST CHANGES if:** Rate limit causes flaky tests in CI, JWT payload missing critical claims, or access matrix expectations are wrong.
3. **AC #3/#4 N/A justification:** Accept if reviewer agrees that MANAGER role migration is complete (14.2) and M365 sync is covered by existing E2E.

---

**Created:** 2026-02-28  
**Created By:** SM Agent (Bob)
