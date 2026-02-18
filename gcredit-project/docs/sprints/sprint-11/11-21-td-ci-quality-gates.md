# Story 11.21: TD — CI Quality Gates (Chinese Characters + console.log)

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 1.5h  
**Source:** Tech Debt / Code Quality Audit  

## Story

As a developer,  
I want CI pipeline rules that block Chinese characters and console.log in source code,  
So that i18n readiness and logging standards are enforced automatically.

## Acceptance Criteria

1. [ ] ESLint custom rule or script blocks Chinese characters in `.ts/.tsx` source files
2. [ ] ESLint `no-console` rule enabled (error level) for source files
3. [ ] Spec/test files excluded from both rules
4. [ ] CI pipeline validates: `npm run lint` returns 0 warnings, 0 errors
5. [ ] Existing Chinese characters in source code cleaned up first
6. [ ] Documentation updated

## Tasks / Subtasks

- [ ] **Task 1: Audit current state** (AC: #5)
  - [ ] `grep -rn "[\u4e00-\u9fff]" frontend/src/ backend/src/ --include="*.ts" --include="*.tsx" | grep -v spec | grep -v test`
  - [ ] Catalog occurrences and replace with English
  - [ ] `grep -rn "console\." frontend/src/ backend/src/ --include="*.ts" --include="*.tsx" | grep -v spec | grep -v test`

- [ ] **Task 2: ESLint no-console rule** (AC: #2, #3)
  - [ ] Backend `eslint.config.mjs`: add `'no-console': 'error'`
  - [ ] Frontend `eslint.config.js`: add `'no-console': 'error'`
  - [ ] Exclude test files from rule

- [ ] **Task 3: Chinese character detection** (AC: #1, #3)
  - [ ] Option A: ESLint plugin `eslint-plugin-no-chinese` (if exists)
  - [ ] Option B: Custom ESLint rule with regex `/[\u4e00-\u9fff]/`
  - [ ] Option C: CI script as supplementary check
  - [ ] Exclude test files and i18n files

- [ ] **Task 4: Verify** (AC: #4, #6)
  - [ ] `npm run lint` passes on both projects
  - [ ] Document in coding-standards.md

## Dev Notes

### Current State
- From audit: ~3 console.log in non-test backend source
- Chinese characters: quantity unknown — needs audit
- ESLint currently configured with `--max-warnings=0`

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
