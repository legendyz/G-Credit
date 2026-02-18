# Story 11.14: CQ-005 — Remove Unused Dependencies

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 15m  
**Source:** Code Quality Audit  

## Story

As a developer,  
I want unused npm dependencies removed from package.json,  
So that the bundle is smaller and the dependency surface is minimized.

## Acceptance Criteria

1. [ ] `keyv` removed from backend package.json (if confirmed unused)
2. [ ] `framer-motion` removed from frontend package.json (if confirmed unused)
3. [ ] `tailwindcss-animate` removed from frontend package.json (if confirmed unused)
4. [ ] No imports referencing removed packages remain in source code
5. [ ] Build passes: `npm run build` on both backend and frontend
6. [ ] All tests pass

## Tasks / Subtasks

- [ ] **Task 1: Verify unused** (AC: #1-3)
  - [ ] `grep -r "keyv" backend/src/ --include="*.ts"` — expect 0
  - [ ] `grep -r "framer-motion" frontend/src/ --include="*.tsx" --include="*.ts"` — expect 0
  - [ ] `grep -r "tailwindcss-animate" frontend/ --include="*.js" --include="*.ts" --include="*.css"` — expect 0

- [ ] **Task 2: Remove** (AC: #1-3)
  - [ ] Backend: `npm uninstall keyv` (if unused)
  - [ ] Frontend: `npm uninstall framer-motion tailwindcss-animate` (if unused)

- [ ] **Task 3: Verify** (AC: #4-6)
  - [ ] `npm run build` on both projects
  - [ ] `npm test` on both projects
  - [ ] `tsc --noEmit` on both projects

## Dev Notes

### Quick Win
- Estimated 15 minutes — simple grep + uninstall
- Low risk — dependencies already identified as unused

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
