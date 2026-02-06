# Story TD-015: Fix ESLint Type Safety Warnings

**Status:** backlog  
**Epic:** Technical Debt Cleanup  
**Sprint:** Sprint 9  
**Priority:** P2  
**Estimated Hours:** 8h (Phase 1: 4h + Phase 2: 4h)  
**Actual Hours:** TBD  
**Dependencies:** [] (可与其他 Story 并行)  
**Source:** Sprint 8 Technical Debt Review  
**Category:** Code Quality

---

## Story

As a **Developer**,  
I want **to fix ESLint type safety warnings in the backend codebase**,  
So that **potential runtime errors from unsafe types are prevented and code quality is maintained**.

---

## Background

ESLint warnings accumulated to 1100+ from TypeScript strict rules:
- `@typescript-eslint/no-unsafe-call` (300 occurrences)
- `@typescript-eslint/no-unsafe-return` (300 occurrences)
- `@typescript-eslint/no-unsafe-member-access` (300 occurrences)
- `@typescript-eslint/no-unused-vars` (200 occurrences)

These warnings indicate potential type safety issues that could cause runtime errors.  
Sprint 8 cleared 17 P1 items. TD-015 is P2 but risks escalating to P1 in Sprint 10 if not addressed.

---

## Acceptance Criteria

1. [ ] **AC1: Phase 1 — Fix `no-unsafe-call` and `no-unsafe-return` (4h)**
   - All `@typescript-eslint/no-unsafe-call` warnings in backend services fixed
   - All `@typescript-eslint/no-unsafe-return` warnings in controllers fixed
   - Proper type assertions added for Prisma query results
   - Explicit return types added to controller methods
   - ESLint warning count reduced from 1100 → ≤800 (27% reduction)

2. [ ] **AC2: Phase 2 — Fix `no-unsafe-member-access` and `no-unused-vars` (4h)**
   - All `@typescript-eslint/no-unsafe-member-access` warnings fixed
   - Proper type definitions added for Prisma relations
   - Object property access with unknown types fixed
   - All `@typescript-eslint/no-unused-vars` warnings fixed
   - Unused imports removed
   - Unused function parameters cleaned up (underscore prefix where needed)
   - Commented-out code cleaned up
   - ESLint warning count reduced from 800 → ≤500 (55% total reduction)

3. [ ] **AC3: Zero Regressions**
   - Full backend test suite passes (all existing tests)
   - Full frontend test suite passes (all existing tests)
   - All E2E tests pass
   - 0 new test failures introduced
   - Code passes `npx tsc --noEmit` type checking

4. [ ] **AC4: Documentation**
   - Warning reduction progress documented for Sprint 10
   - Remaining ~500 warnings categorized for Phase 3 (Sprint 10) planning

---

## Tasks / Subtasks

### Task 1: Phase 1 — Baseline & Fix unsafe-call/return (4h)

- [ ] **1.1** Run `npm run lint` to generate current warning list (0.5h)
  - Save baseline count
  - Categorize warnings by type and file
- [ ] **1.2** Fix `no-unsafe-call` warnings in backend services (1.5h)
  - Add proper type assertions
  - Fix Prisma query result types
  - Update service method return types
- [ ] **1.3** Fix `no-unsafe-return` warnings in controllers (1.5h)
  - Add explicit return types to controller methods
  - Fix DTO return type mismatches
  - Update response type definitions
- [ ] **1.4** Run full test suite to verify no regressions (0.5h)
  - Backend unit tests
  - E2E tests
  - Target: 0 new failures
  - Verify with `npx tsc --noEmit`

### Task 2: Phase 2 — Fix unsafe-member-access & unused-vars (4h)

- [ ] **2.1** Fix `no-unsafe-member-access` warnings (2h)
  - Add proper type definitions for Prisma relations
  - Fix object property access with unknown types
  - Update GraphQL resolver types (if applicable)
- [ ] **2.2** Fix `no-unused-vars` warnings (1.5h)
  - Remove unused imports
  - Remove unused function parameters (use underscore prefix if needed)
  - Clean up commented-out code
- [ ] **2.3** Run full test suite to verify no regressions (0.5h)
  - All tests pass
  - Final lint count ≤500
  - Document remaining warnings for Sprint 10

---

## Dev Notes

### Approach
- **Incremental:** Split into 2 phases to reduce regression risk
- **Test-driven:** Run full test suite after each phase
- **Non-breaking:** Type fixes should not change runtime behavior
- **Scope:** Backend only (frontend warnings tracked separately)

### Files to Modify
- Multiple backend service files (`backend/src/**/*.ts`)
- Controller files (`backend/src/**/*.controller.ts`)
- DTO files (`backend/src/**/*.dto.ts`)
- No new files created (pure refactoring)

### Testing Standards
- **Unit Tests:** Run existing backend test suite (no new tests required)
- **E2E Tests:** Run existing E2E suite
- **Type Check:** `npx tsc --noEmit` must pass clean
- **Lint Verification:** `npm run lint 2>&1 | wc -l` to count warnings
- **Target Coverage:** No coverage change (pure type fixes)

### Architecture Notes
- These are pure type annotation fixes — no logic changes
- Prisma query results need explicit typing where `any` is inferred
- Controller return types should match DTO definitions explicitly
- Unused vars are safe to remove or prefix with underscore

### Future Work (Deferred)
- **Phase 3 (Sprint 10):** Fix remaining ~500 warnings
- **Phase 4 (Sprint 11):** Enable warnings as errors in CI

---

## Dev Agent Record

### Agent Model Used
**Model:** TBD  
**Date:** TBD

### Completion Notes
**Status:** TBD  
**Blockers:** None

### Test Results
- **Lint Baseline:** TBD (expected ~1100 warnings)
- **Post-Phase 1:** TBD (target ≤800)
- **Post-Phase 2:** TBD (target ≤500)
- **Unit Tests:** TBD
- **E2E Tests:** TBD

### File List
**Files Created:** TBD  
**Files Modified:** TBD

---

## Retrospective Notes

### What Went Well
- TBD

### Challenges Encountered
- TBD

### Lessons Learned
- TBD
