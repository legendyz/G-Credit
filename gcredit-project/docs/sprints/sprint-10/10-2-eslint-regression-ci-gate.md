# Story 10.2: ESLint Full Cleanup + CI Zero-Tolerance Gate

**Status:** backlog  
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

1. [ ] ESLint: **0 errors** (currently 325)
2. [ ] ESLint: **0 warnings** (currently 212)
3. [ ] `package.json` lint script: `--max-warnings=0` (zero-tolerance)
4. [ ] CI gate: `npm run lint` with `--max-warnings=0` blocks any regression
5. [ ] All 1087 existing tests still pass (0 regressions)
6. [ ] New bulk issuance code (Story 8.4) follows ESLint strict typing
7. [ ] PR commit message: `refactor: ESLint full cleanup 537→0 + zero-tolerance CI gate`

## Tasks / Subtasks

- [ ] **Task 1: Auto-fix formatting errors** (AC: #1)
  - [ ] Run `npx eslint . --fix` to auto-fix all fixable errors (prettier, formatting)
  - [ ] Count remaining errors after auto-fix
  - [ ] Manually fix any non-auto-fixable errors

- [ ] **Task 2: Fix `no-unsafe-*` warnings — bulk issuance module** (AC: #2, #6)
  - [ ] Fix warnings in `bulk-issuance/` backend module (highest concentration)
  - [ ] Fix warnings in `BulkIssuance*.tsx` frontend components
  - [ ] Use variable annotations per Lesson 34 (not `as` casts)

- [ ] **Task 3: Fix `no-unsafe-*` warnings — remaining modules** (AC: #2)
  - [ ] `no-unsafe-member-access` (58) — add type annotations to accessed objects
  - [ ] `no-unsafe-assignment` (51) — typed variable declarations
  - [ ] `no-unsafe-argument` (50) — typed function parameters
  - [ ] `no-unsafe-return` (28) — typed return values
  - [ ] `no-unsafe-call` (16) — typed function references
  - [ ] `require-await` (1) — remove unnecessary async or add await
  - [ ] Run `npx eslint . --max-warnings=0` incrementally after each batch

- [ ] **Task 4: Fix test file warnings** (AC: #2)
  - [ ] Fix warnings in `.spec.ts` and `.e2e-spec.ts` files
  - [ ] Include `describe.skip` blocks (Teams TD-006 tests)
  - [ ] Ensure mock objects have proper type annotations

- [ ] **Task 5: Update lint script to zero-tolerance** (AC: #3, #4)
  - [ ] Update `package.json` lint script: `--max-warnings=0`
  - [ ] Verify: `npm run lint` passes with 0 errors and 0 warnings
  - [ ] CI already runs `npm run lint` — no additional gate needed (zero-tolerance built in)

- [ ] **Task 6: Verify zero regressions** (AC: #5)
  - [ ] Run full test suite: `npm test`
  - [ ] Run `tsc --noEmit` (verify Story 10.1 still clean)
  - [ ] Run E2E tests: `npm run test:e2e`

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
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
