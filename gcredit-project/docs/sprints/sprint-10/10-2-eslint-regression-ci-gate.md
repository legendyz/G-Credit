# Story 10.2: ESLint Regression Fix + CI Gate

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 5h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** ESLint Regression (Sprint 9 Retro Action Item #1, #2)

---

## Story

As a **developer**,  
I want **ESLint warnings reduced from 423 to <300 and a CI gate preventing future regression**,  
So that **code quality is maintained and regressions are automatically blocked**.

## Background

Sprint 9 TD-015 reduced ESLint warnings from 1303 → 282 (78% reduction). However, Story 8.4 (Batch Processing) introduced 141 new warnings, regressing to 423. The `max-warnings` was bumped from 282 → 423 without authorization.

## Acceptance Criteria

1. [ ] ESLint warning count ≤ 280 (back to TD-015 peak)
2. [ ] `package.json` max-warnings set to 280
3. [ ] CI gate: `max-warnings` value must not increase from previous commit
4. [ ] All 1087 existing tests still pass (0 regressions)
5. [ ] New bulk issuance code (Story 8.4) follows ESLint strict typing
6. [ ] PR commit message: `refactor: fix ESLint regression 423→<280 + add CI gate`

## Tasks / Subtasks

- [ ] **Task 1: Analyze warning sources** (AC: #1)
  - [ ] Run `npx eslint . --format json` to identify warning categories
  - [ ] Identify Story 8.4 files with most warnings
  - [ ] Categorize: `@typescript-eslint/no-unsafe-*`, `@typescript-eslint/no-explicit-any`, etc.

- [ ] **Task 2: Fix bulk issuance module warnings** (AC: #1, #5)
  - [ ] Fix warnings in `bulk-issuance/` backend module
  - [ ] Fix warnings in `BulkIssuance*.tsx` frontend components
  - [ ] Use variable annotations per Lesson 34 (not `as` casts)

- [ ] **Task 3: Fix remaining warnings** (AC: #1)
  - [ ] Fix warnings in test files added during Sprint 9
  - [ ] Fix any remaining warnings from other modules
  - [ ] Target: ≤ 280 total

- [ ] **Task 4: Update max-warnings** (AC: #2)
  - [ ] Update `package.json` lint script: `--max-warnings 280`
  - [ ] Verify: `npm run lint` passes

- [ ] **Task 5: Add ESLint CI gate** (AC: #3)
  - [ ] Add CI step: compare current `max-warnings` with previous commit
  - [ ] Block PR if `max-warnings` increased
  - [ ] Document: "Developer must run `npm run lint` before PR"

- [ ] **Task 6: Verify zero regressions** (AC: #4)
  - [ ] Run full test suite
  - [ ] Run `tsc --noEmit` (after Story 10.1)

## Dev Notes

### Dependencies
- Story 10.1 should ideally complete first (tsc fixes may affect ESLint)
- But can run in parallel if needed

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
