# Code Review Result: Story 14.8 — 6-Combination Test Matrix (ADR-017 §7)

## Review Metadata

- **Story:** 14.8 — 6-Combination Test Matrix
- **Story File:** `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md`
- **Commit Reviewed:** `f9b2778`
- **Parent:** `db5003e`
- **Branch:** `sprint-14/role-model-refactor`
- **Diff Basis:** `git diff db5003e..f9b2778 -- gcredit-project/backend/test/`
- **Date:** 2026-02-28

---

## Verdict

**APPROVED**

The new E2E matrix implementation correctly validates ADR-017 §7 dual-dimension behavior and passes execution verification (29/29 tests). No blocking defects were found.

---

## Checklist Review

### 1) Test Setup — `beforeAll` User Creation & Login Strategy

File: `backend/test/role-matrix.e2e-spec.ts`

- [x] Uses `setupE2ETest('role-matrix')` for schema isolation
- [x] Uses real logins for combos #1, #2, #3, #4, #5
- [x] Combo #4 (ISSUER+manager) is manually created (issuer + subordinate + login)
- [x] Combo #6 (ADMIN+manager) uses `JwtService.sign()` token
- [x] Uses `teardownE2ETest()` in `afterAll`
- [x] All 6 tokens are declared at describe scope and reused

Reviewer notes:
- Actual HTTP login count is **5**, not 6: helper logins for #1/#2/#3/#5 (4) + direct login for #4 (1). Combo #6 does not hit `/api/auth/login`.
- This aligns with auth throttle limit `5/min` in `auth.controller.ts`, so the prompt’s “6th login 429” risk is not reproduced in implementation.

### 2) Auth Helper — Request Pattern

File: `backend/test/role-matrix.e2e-spec.ts`

- [x] `authGet()` uses `Authorization: Bearer <token>`
- [x] Pattern matches shared `authRequest()` behavior in `test/helpers/test-setup.ts`
- [x] No cookie-only dependency in this suite (consistent with current E2E convention)

Reviewer note:
- Local `authGet()` helper is functionally equivalent to shared helper; consistency refactor is optional.

### 3) Combo #1–#6 Access Matrix (24 tests)

File: `backend/test/role-matrix.e2e-spec.ts`

- [x] Combo #1 (EMPLOYEE,false): `200 / 403 / 403 / 403`
- [x] Combo #2 (EMPLOYEE,true): `200 / 200 / 403 / 403`
- [x] Combo #3 (ISSUER,false): `200 / 403 / 200 / 403`
- [x] Combo #4 (ISSUER,true): `200 / 403 / 200 / 403`
- [x] Combo #5 (ADMIN,false): `200 / 200 / 200 / 200`
- [x] Combo #6 (ADMIN,true): `200 / 200 / 200 / 200`

Implementation alignment:
- `/manager-only` in `app.controller.ts` is `@Roles('EMPLOYEE', 'ADMIN') + @RequireManager() + @UseGuards(ManagerGuard)`.
- Therefore ISSUER is blocked by `RolesGuard` before `ManagerGuard` (Combo #4 expected 403), and ADMIN bypasses manager guard (Combo #5 expected 200).

### 4) JWT Backward Compatibility

File: `backend/test/role-matrix.e2e-spec.ts`

- [x] Creates user without login (factory only)
- [x] Signs JWT without `isManager` claim
- [x] `/manager-only` returns 403
- [x] `/profile` returns 200 (no crash)

Implementation alignment:
- `jwt.strategy.ts` maps `isManager: payload.isManager ?? false`.
- `manager.guard.ts` uses strict `user.isManager === true`, so missing claim safely degrades to non-manager behavior.

### 5) Dashboard Endpoint Matrix (4 tests)

File: `backend/test/role-matrix.e2e-spec.ts`

- [x] EMPLOYEE+manager -> `/api/dashboard/manager` -> 200
- [x] EMPLOYEE non-manager -> 403
- [x] ADMIN -> 200
- [x] ISSUER -> 403

Implementation alignment:
- `dashboard.controller.ts` manager route is `@Roles(UserRole.EMPLOYEE, UserRole.ADMIN) + @RequireManager() + @UseGuards(ManagerGuard)`.

Coverage note:
- Not all 6 combinations are repeated for dashboard endpoint, but representative guard-path coverage is sufficient for current AC intent.

### 6) Story File Updates

File: `docs/sprints/sprint-14/14-8-test-matrix-6-combinations.md`

- [x] Status is `done`
- [x] AC #1, #2, #5 marked complete
- [x] AC #3, #4 marked N/A with rationale
- [x] Dev Agent Record populated
- [x] Regression summary present: backend 932 + frontend 794 + E2E 29 = 1,755

Process note:
- Story-level status and AC checkboxes are consistent with completion, but some Task/Subtask checklist items remain unchecked in the story document.
- This is non-blocking for code quality/review verdict.
- Per team workflow, unified task-checklist synchronization is handed off to Scrum Master.

---

## Verification Runs (This Review)

Executed and passed:
- `npx jest --config ./test/jest-e2e.json --runInBand --testPathPatterns role-matrix.e2e-spec.ts`
  - Result: **1 suite passed, 29 tests passed**

---

## Non-blocking Follow-up Suggestions

1. Consider switching local `authGet()` to shared `authRequest()` helper for consistency across E2E files.
2. Optionally add dashboard assertions for Combo #4 (ISSUER+manager) and Combo #6 (ADMIN+manager) to make dashboard coverage table fully symmetrical with the 6-combo matrix.

---

## Final Decision

**APPROVED**

Story 14.8 meets ADR-017 §7 validation intent, execution evidence is strong, and no blocking gaps were identified.