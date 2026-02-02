# Story 8.8 Code Review

**Story/Task:** 8.8 E2E Test Isolation (TD-001)
**Date:** 2026-02-03
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- CI workflow for tests
- E2E isolation helpers
- Test factories
- E2E test suites
- E2E guidelines documentation

---

## Summary
Solid isolation approach and factory pattern, but several correctness issues and one CI reliability blocker must be fixed before calling AC4 “done.”

---

## Findings

### 🔴 High

1) **CI allows E2E failures to pass (AC4 violation)**
- `continue-on-error: true` and `|| echo` allow the E2E job to pass even when tests fail.
- Evidence: [test.yml](.github/workflows/test.yml#L125-L133)
- Impact: CI/CD reliability claim is invalid.

2) **`createAndLoginUser` doesn’t support `issuer`, but tests call it**
- Signature only allows `admin | manager | employee` while E2E suite passes `'issuer'`.
- Evidence: [test-setup.ts](gcredit-project/backend/test/helpers/test-setup.ts#L89-L95), [badge-issuance.e2e-spec.ts](gcredit-project/backend/test/badge-issuance.e2e-spec.ts#L43-L48)
- Impact: Type safety violation; potential runtime mismatch if test data assumptions are wrong.

3) **`createIssuer` factory assigns MANAGER role**
- `createIssuer()` returns a MANAGER user, not ISSUER.
- Evidence: [user.factory.ts](gcredit-project/backend/test/factories/user.factory.ts#L45-L47)
- Impact: Tests claiming issuer permissions may be invalid or misleading.

4) **Verification URL helper uses badge ID, not verification ID**
- Verification endpoint uses `verificationId`, but helper uses `badge.id`.
- Evidence: [badge.factory.ts](gcredit-project/backend/test/factories/badge.factory.ts#L201-L206)
- Impact: Helper generates incorrect URLs; may hide broken verification flows.

---

### 🟡 Medium

5) **CI env uses `THROTTLE_*` but app uses `RATE_LIMIT_*`**
- Workflow sets `THROTTLE_TTL` / `THROTTLE_LIMIT` while test setup uses `RATE_LIMIT_*`.
- Evidence: [test.yml](.github/workflows/test.yml#L100-L101), [setup.ts](gcredit-project/backend/test/setup.ts#L9-L14)
- Impact: Rate limit overrides may not apply in CI; potential 429s or flaky tests.

6) **Guidelines and factories inconsistent for issuer role**
- Guidelines show `createIssuer()` usage, but factory creates MANAGER.
- Evidence: [e2e-test-guidelines.md](gcredit-project/docs/testing/e2e-test-guidelines.md#L78-L97), [user.factory.ts](gcredit-project/backend/test/factories/user.factory.ts#L45-L47)
- Impact: Documentation misleads devs and future tests.

---

## Recommendations
- Make E2E job fail on test failures and remove `continue-on-error`.
- Extend `createAndLoginUser` to support `issuer` or remove issuer usage in tests.
- Fix `createIssuer` to return `UserRole.ISSUER`.
- Fix `getVerificationUrl` to use `badge.verificationId`.
- Align CI env variables with actual rate-limit config.
- Update guidelines after code fixes.

---

## Outcome
**Status:** Changes requested (High severity blockers present).