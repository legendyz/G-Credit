# Story 10.4: i18n — Hardcoded Chinese String Scan & Fix

**Status:** backlog  
**Priority:** 🟢 LOW  
**Estimate:** 2h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** Sprint 9 Retro Action Item #6

---

## Story

As a **developer**,  
I want **all hardcoded Chinese strings in source code replaced with English**,  
So that **the application is consistent in English for the MVP release**.

## Background

Sprint 9 discovered Chinese strings in `ProcessingModal.tsx` from early development. Story 8.4 translated them to English, but a global scan was recommended to ensure no other instances remain.

**Note:** This is NOT about full i18n framework setup. This is a simple find-and-replace to ensure English consistency for v1.0.0.

## Acceptance Criteria

1. [ ] Global scan of `src/` (frontend + backend) for Chinese characters (Unicode range `\u4E00-\u9FFF`)
2. [ ] All found Chinese strings replaced with English equivalents
3. [ ] UI text remains consistent and grammatically correct
4. [ ] All tests pass (0 regressions)
5. [ ] PR commit message: `fix: replace hardcoded Chinese strings with English`

## Tasks / Subtasks

- [ ] **Task 1: Scan for Chinese characters** (AC: #1)
  - [ ] Run regex search: `[\u4E00-\u9FFF]` across `frontend/src/` and `backend/src/`
  - [ ] Catalog all found instances with file:line references
  - [ ] Exclude: comments, documentation, test data

- [ ] **Task 2: Replace with English** (AC: #2, #3)
  - [ ] Translate each Chinese string to appropriate English
  - [ ] Verify context-appropriate translation
  - [ ] Update component props/labels as needed

- [ ] **Task 3: Verify** (AC: #4)
  - [ ] Run frontend tests
  - [ ] Visual verification of affected components (if any)

## Dev Notes

### Scan Command
```powershell
# PowerShell scan for Chinese characters
Select-String -Path "frontend/src/**/*.tsx","frontend/src/**/*.ts","backend/src/**/*.ts" -Pattern "[\u4E00-\u9FFF]" -Recurse
```

### References
- Sprint 9 Retrospective: Chinese string issue in ProcessingModal
- Sprint 9 Story 8.4: ProcessingModal translation fix

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
