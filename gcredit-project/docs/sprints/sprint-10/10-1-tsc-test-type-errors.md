# Story 10.1: TD-017 — Fix tsc Test Type Errors

**Status:** ✅ complete  
**Priority:** 🔴 HIGH  
**Estimate:** 7.5h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** TD-017

---

## Story

As a **developer**,  
I want **all 114 tsc test-only type errors resolved**,  
So that **`tsc --noEmit` passes cleanly for both src/ and test/ files, enabling strict CI enforcement**.

## Background

Across Sprints 1-9, 114 type errors accumulated in test files because `tsc --noEmit` was never enforced in CI. `nest build` (transpile-only), ESLint (rule-based), and `ts-jest` (lenient) all passed green, masking these errors.

**Root Cause (Lesson 35):** Three TypeScript compilation layers have different strictness levels. Only `tsc --noEmit` provides full type resolution.

**Risk (Lesson 36):** Replacing `any` cascades into test mock failures — budget 30-50% extra time for test mock updates.

## Acceptance Criteria

1. [x] `tsc --noEmit` returns 0 errors (currently 114)
2. [x] All 1087 existing tests still pass (0 regressions)
3. [x] No new `any` types introduced (checked via ESLint)
4. [x] Test mock objects include all required interface fields
5. [x] CI pipeline includes `tsc --noEmit` check step
6. [x] PR commit message: `refactor: fix 114 tsc test type errors (TD-017)`

## Tasks / Subtasks

- [x] **Task 1: Analyze error distribution** (AC: #1)
  - [x] Run `tsc --noEmit 2>&1 | Select-String "error TS"` to get full error list
  - [x] Categorize by error type (TS2345, TS2322, TS2339, etc.)
  - [x] Group by file (identify which test files have most errors)
  - [x] Prioritize: files with most errors first

- [x] **Task 2: Fix Prisma mock type errors** (AC: #1, #4)
  - [x] Update Prisma mock objects to match generated client types
  - [x] Use `Partial<>` or proper mock factories where needed
  - [x] Verify with `tsc --noEmit` after each batch

- [x] **Task 3: Fix RequestWithUser interface errors** (AC: #1, #4)
  - [x] Update test mocks with required fields (`role`, `email`, `id`)
  - [x] Use shared `RequestWithUser` interface from Sprint 9 TD-015
  - [x] Apply `import type` for decorated signatures (Lesson 34)

- [x] **Task 4: Fix remaining type errors** (AC: #1, #3)
  - [x] Use variable annotations (not `as` casts) per Lesson 34
  - [x] Fix `no-unsafe-*` patterns in test files
  - [x] Handle generic type parameters for service mocks

- [x] **Task 5: Fix password reset transaction gap** (AC: #2) 🏗️ _Architecture Audit_
  - [x] Wrap password update + token invalidation in `$transaction` in `auth.service.ts` (lines 218-232)
  - [x] Prevents theoretical token reuse on crash between the two queries
  - [x] Add test case verifying atomic behavior
  - _Source: Architecture Release Audit — Winston, Transaction Safety finding #1_

- [x] **Task 6: Add tsc --noEmit to CI** (AC: #5)
  - [x] Add `tsc --noEmit` step to GitHub Actions workflow
  - [x] Verify CI runs and passes

- [x] **Task 7: Verify zero regressions** (AC: #2)
  - [x] Run full backend test suite: `npm test`
  - [x] Run full frontend test suite: `npm test`
  - [x] Run E2E tests: `npm run test:e2e`

## Dev Notes

### Key Lessons Applied
- **L35:** `tsc --noEmit` is the only complete type check tool
- **L36:** Budget 30-50% extra for test mock updates when eliminating `any`
- **L34:** Use `const x: Type = expr` instead of `expr as Type` — ESLint --fix strips `as`

### References
- Sprint 9 Retrospective: TD-017 section
- Sprint 9 TD-015: `RequestWithUser` shared interface
- Lessons Learned: #34, #35, #36

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (via GitHub Copilot)

### Completion Notes
Fixed all 114 tsc type errors across 19 test files + 1 production file. Key patterns applied:
- **Describe-scope mock promotion**: Moved `mockPrismaService` from `beforeEach` to `describe` scope to preserve `jest.Mock` types (eliminated TS2339 `.mockResolvedValue()` errors)
- **Non-null assertions (`!`)**: Added on `.items`, `.columns`, `.facts`, `.title` accesses where `toBeDefined()` precedes (TS18048)
- **`Record<string, string>` config typing**: Fixed TS7053 indexing errors on config objects across 7 files
- **`RequestWithUser` + `UserRole` enum**: Added `role: UserRole.EMPLOYEE` to mock request objects (TS2345)
- **Explicit type annotations**: Broke circular references in `badge-issuance.service.spec.ts` (TS7022/TS7024)
- **`Prisma.InputJsonValue`**: Fixed JsonValue→InputJsonValue type mismatches (TS2322)
- **Password reset `$transaction`**: Wrapped `user.update` + `passwordResetToken.update` in atomic transaction (Architecture Audit finding)
- **CI integration**: Added `tsc --noEmit` step to `.github/workflows/test.yml` + `type-check` script to `package.json`

Results: 114 → 0 tsc errors. 1089 tests passing (534 backend + 397 frontend + 158 E2E). +2 new tests for password reset transaction.

### File List
- `.github/workflows/test.yml`
- `gcredit-project/backend/package.json`
- `gcredit-project/backend/src/admin-users/admin-users.service.spec.ts`
- `gcredit-project/backend/src/badge-issuance/badge-issuance-teams.integration.spec.ts`
- `gcredit-project/backend/src/badge-issuance/badge-issuance-wallet.service.spec.ts`
- `gcredit-project/backend/src/badge-issuance/badge-issuance.service-baked.spec.ts`
- `gcredit-project/backend/src/badge-issuance/badge-issuance.service.spec.ts`
- `gcredit-project/backend/src/badge-issuance/services/assertion-generator.service.spec.ts`
- `gcredit-project/backend/src/badge-sharing/badge-sharing.controller.spec.ts`
- `gcredit-project/backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts`
- `gcredit-project/backend/src/badge-sharing/services/email-template.service.spec.ts`
- `gcredit-project/backend/src/common/guards/security.spec.ts`
- `gcredit-project/backend/src/microsoft-graph/services/graph-teams.service.spec.ts`
- `gcredit-project/backend/src/microsoft-graph/services/graph-token-provider.service.spec.ts`
- `gcredit-project/backend/src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts`
- `gcredit-project/backend/src/microsoft-graph/teams/teams-action.controller.spec.ts`
- `gcredit-project/backend/src/microsoft-graph/teams/teams-badge-notification.service.spec.ts`
- `gcredit-project/backend/src/modules/auth/auth.service.spec.ts`
- `gcredit-project/backend/src/modules/auth/auth.service.ts`
- `gcredit-project/backend/test/badge-integrity.e2e-spec.ts`
- `gcredit-project/backend/test/badge-issuance-isolated.e2e-spec.ts`
- `gcredit-project/backend/test/factories/badge-template.factory.ts`
- `gcredit-project/docs/sprints/sprint-10/10-1-dev-prompt.md`
- `gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md`
- `gcredit-project/docs/sprints/sprint-10/sprint-status.yaml`
