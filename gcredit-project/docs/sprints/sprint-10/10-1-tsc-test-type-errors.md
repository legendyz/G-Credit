# Story 10.1: TD-017 — Fix tsc Test Type Errors

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 7h  
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

1. [ ] `tsc --noEmit` returns 0 errors (currently 114)
2. [ ] All 1087 existing tests still pass (0 regressions)
3. [ ] No new `any` types introduced (checked via ESLint)
4. [ ] Test mock objects include all required interface fields
5. [ ] CI pipeline includes `tsc --noEmit` check step
6. [ ] PR commit message: `refactor: fix 114 tsc test type errors (TD-017)`

## Tasks / Subtasks

- [ ] **Task 1: Analyze error distribution** (AC: #1)
  - [ ] Run `tsc --noEmit 2>&1 | Select-String "error TS"` to get full error list
  - [ ] Categorize by error type (TS2345, TS2322, TS2339, etc.)
  - [ ] Group by file (identify which test files have most errors)
  - [ ] Prioritize: files with most errors first

- [ ] **Task 2: Fix Prisma mock type errors** (AC: #1, #4)
  - [ ] Update Prisma mock objects to match generated client types
  - [ ] Use `Partial<>` or proper mock factories where needed
  - [ ] Verify with `tsc --noEmit` after each batch

- [ ] **Task 3: Fix RequestWithUser interface errors** (AC: #1, #4)
  - [ ] Update test mocks with required fields (`role`, `email`, `id`)
  - [ ] Use shared `RequestWithUser` interface from Sprint 9 TD-015
  - [ ] Apply `import type` for decorated signatures (Lesson 34)

- [ ] **Task 4: Fix remaining type errors** (AC: #1, #3)
  - [ ] Use variable annotations (not `as` casts) per Lesson 34
  - [ ] Fix `no-unsafe-*` patterns in test files
  - [ ] Handle generic type parameters for service mocks

- [ ] **Task 5: Add tsc --noEmit to CI** (AC: #5)
  - [ ] Add `tsc --noEmit` step to GitHub Actions workflow
  - [ ] Verify CI runs and passes

- [ ] **Task 6: Verify zero regressions** (AC: #2)
  - [ ] Run full backend test suite: `npm test`
  - [ ] Run full frontend test suite: `npm test`
  - [ ] Run E2E tests: `npm run test:e2e`

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
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
