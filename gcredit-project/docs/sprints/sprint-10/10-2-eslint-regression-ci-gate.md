# Story 10.2: ESLint Full Cleanup + CI Zero-Tolerance Gate

**Status:** review  
**Priority:** 🔴 HIGH  
**Estimate:** 8h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** ESLint Regression (Sprint 9 Retro Action Item #1, #2)

---

## Story

As a **developer**,  
I want **all ESLint errors and warnings eliminated (0 errors, 0 warnings) with a zero-tolerance CI gate**,  
So that **v1.0.0 ships with a completely clean codebase and any future regression is immediately blocked**.

## Background

Sprint 9 TD-015 reduced ESLint warnings from 1303 → 282 (78% reduction). However, Story 8.4 (Batch Processing) introduced 141 new warnings, regressing to 423. The `max-warnings` was bumped from 282 → 423 without authorization.

**Updated Scope (2026-02-08):** After Story 10.1 tsc fixes, remaining count is **325 errors + 212 warnings = 537 problems**. All 204 warnings are `@typescript-eslint/no-unsafe-*` type-safety rules (same root cause: `any` type propagation). The 325 errors are predominantly auto-fixable formatting issues. Target upgraded from ≤280 warnings → **0 errors, 0 warnings** for a truly clean v1.0.0 release.

## Acceptance Criteria

1. [x] ESLint: **0 errors** (currently 325)
2. [x] ESLint: **0 warnings** (currently 212)
3. [x] `package.json` lint script: `--max-warnings=0` (zero-tolerance)
4. [x] CI gate: `npm run lint` with `--max-warnings=0` blocks any regression
5. [x] All 1087 existing tests still pass (0 regressions)
6. [x] New bulk issuance code (Story 8.4) follows ESLint strict typing
7. [x] PR commit message: `refactor: ESLint full cleanup 537→0 + zero-tolerance CI gate`

## Tasks / Subtasks

- [x] **Task 1: Auto-fix formatting errors** (AC: #1)
  - [x] Run `npx eslint . --fix` to auto-fix all fixable errors (prettier, formatting)
  - [x] Count remaining errors after auto-fix
  - [x] Manually fix any non-auto-fixable errors

- [x] **Task 2: Fix `no-unsafe-*` warnings — bulk issuance module** (AC: #2, #6)
  - [x] Fix warnings in `bulk-issuance/` backend module (highest concentration)
  - [x] Fix warnings in `BulkIssuance*.tsx` frontend components
  - [x] Use variable annotations per Lesson 34 (not `as` casts)

- [x] **Task 3: Fix `no-unsafe-*` warnings — remaining modules** (AC: #2)
  - [x] `no-unsafe-member-access` (58) — add type annotations to accessed objects
  - [x] `no-unsafe-assignment` (51) — typed variable declarations
  - [x] `no-unsafe-argument` (50) — typed function parameters
  - [x] `no-unsafe-return` (28) — typed return values
  - [x] `no-unsafe-call` (16) — typed function references
  - [x] `require-await` (1) — remove unnecessary async or add await
  - [x] Run `npx eslint . --max-warnings=0` incrementally after each batch

- [x] **Task 4: Fix test file warnings** (AC: #2)
  - [x] Fix warnings in `.spec.ts` and `.e2e-spec.ts` files
  - [x] Include `describe.skip` blocks (Teams TD-006 tests)
  - [x] Ensure mock objects have proper type annotations

- [x] **Task 5: Update lint script to zero-tolerance** (AC: #3, #4)
  - [x] Update `package.json` lint script: `--max-warnings=0`
  - [x] Verify: `npm run lint` passes with 0 errors and 0 warnings
  - [x] CI already runs `npm run lint` — no additional gate needed (zero-tolerance built in)

- [x] **Task 6: Verify zero regressions** (AC: #5)
  - [x] Run full test suite: `npm test`
  - [x] Run `tsc --noEmit` (verify Story 10.1 still clean)
  - [x] Run E2E tests: `npm run test:e2e`

## Dev Notes

### Dependencies
- **Story 10.1 MUST complete first** — tsc fixes significantly reduce ESLint problems (423→212 warnings observed)
- Story 10.1 already resolved many `any` type issues that cause ESLint `no-unsafe-*` warnings

### ESLint Problem Distribution (post Story 10.1)
| Category | Count | Fix Method |
|----------|-------|------------|
| Errors (formatting/prettier) | ~325 | `--fix` auto-fixes most |
| `no-unsafe-member-access` | 58 | Type annotations |
| `no-unsafe-assignment` | 51 | Typed variable declarations |
| `no-unsafe-argument` | 50 | Typed function parameters |
| `no-unsafe-return` | 28 | Typed return values |
| `no-unsafe-call` | 16 | Typed function references |
| `require-await` | 1 | Remove async or add await |
| **Total** | **~537** | **Target: 0** |

### References
- Sprint 9 Retrospective: ESLint regression section
- Sprint 9 TD-015: ESLint cleanup methodology
- Lesson 34: Use variable annotations, not `as` casts

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes
- ESLint: 537 problems (325 errors + 212 warnings) → 0 errors, 0 warnings
- Auto-fix resolved all 325 formatting errors; remaining 212 warnings fixed manually
- Created `test/helpers/jest-typed-matchers.ts` — centralized typed wrappers for Jest asymmetric matchers (`expect.any()`, `expect.objectContaining()`, etc.) to avoid `no-unsafe-return` from Jest's `any` return types
- Key patterns: typed `$transaction.mockImplementation` callbacks as `(callback: (tx: unknown) => unknown)`, `toHaveProperty()` for avoiding unsafe member access, `catch (error: unknown)` with `instanceof Error` guards
- `auth.module.ts`: Replaced `as any` on signOptions with `import type { StringValue } from 'ms'` + precise type assertion
- `package.json` lint script: `--max-warnings=423` → `--max-warnings=0`
- All 534 tests pass, `tsc --noEmit` 0 errors, `npm run lint` 0 warnings

### File List
- `package.json` — lint script `--max-warnings=0` (removed `--fix` per code review)
- `docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md` (this file)
- `docs/sprints/sprint-10/sprint-status.yaml`
- `test/helpers/jest-typed-matchers.ts` (NEW) — typed Jest matcher wrappers
- `src/admin-users/admin-users.controller.spec.ts`
- `src/admin-users/admin-users.service.spec.ts`
- `src/analytics/analytics.service.spec.ts`
- `src/badge-issuance/badge-issuance.service-baked.spec.ts`
- `src/badge-issuance/badge-issuance.service.spec.ts`
- `src/badge-issuance/services/assertion-generator-integrity.spec.ts`
- `src/badge-issuance/services/badge-notification.service.ts`
- `src/badge-sharing/badge-sharing.service.ts`
- `src/badge-sharing/controllers/teams-sharing.controller.spec.ts`
- `src/badge-sharing/controllers/widget-embed.controller.ts`
- `src/badge-sharing/services/badge-analytics.service.spec.ts`
- `src/badge-templates/recommendations.service.spec.ts`
- `src/badge-verification/badge-verification.controller.ts`
- `src/badge-verification/badge-verification.service.spec.ts`
- `src/bulk-issuance/bulk-issuance.service.spec.ts`
- `src/bulk-issuance/csv-validation.service.spec.ts`
- `src/common/services/blob-storage.service.ts`
- `src/common/storage.service.ts`
- `src/dashboard/dashboard.controller.spec.ts`
- `src/evidence/evidence.service.spec.ts`
- `src/m365-sync/m365-sync.controller.spec.ts`
- `src/microsoft-graph/microsoft-graph.module.spec.ts`
- `src/microsoft-graph/services/graph-email.service.spec.ts`
- `src/microsoft-graph/services/graph-email.service.ts`
- `src/microsoft-graph/services/graph-teams.service.spec.ts`
- `src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts`
- `src/microsoft-graph/teams/teams-action.controller.spec.ts`
- `src/microsoft-graph/teams/teams-badge-notification.service.spec.ts`
- `src/milestones/milestones.service.spec.ts`
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/auth.service.spec.ts`
- `test/badge-integrity.e2e-spec.ts`
