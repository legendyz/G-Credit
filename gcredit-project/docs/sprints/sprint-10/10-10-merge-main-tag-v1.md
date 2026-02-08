# Story 10.10: Merge to Main + Tag v1.0.0

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 2h  
**Sprint:** Sprint 10  
**Type:** Release  
**Dependencies:** ALL Stories 10.1-10.9 complete + UAT passed

---

## Story

As a **project owner**,  
I want **the Sprint 10 branch merged to main and tagged as v1.0.0**,  
So that **the MVP is officially released with a stable, versioned codebase**.

## Background

v1.0.0 represents the culmination of 10 Sprints of development. This is the final story of the MVP phase, creating a clean merge to main with a proper semantic version tag.

## Acceptance Criteria

1. [ ] All Stories 10.1-10.9 are SM accepted (DoD met)
2. [ ] All tests pass on Sprint 10 branch (1087+ tests, 0 failures)
3. [ ] `tsc --noEmit` passes (0 errors)
4. [ ] ESLint passes with ≤280 warnings
5. [ ] UAT results: 100% P0 pass rate
6. [ ] Sprint branch merged to main (no conflicts)
7. [ ] Git tag `v1.0.0` created on main
8. [ ] Tag pushed to remote: `git push origin v1.0.0`
9. [ ] All documentation up-to-date (project-context.md, CHANGELOG, README)

## Tasks / Subtasks

- [ ] **Task 1: Pre-merge verification** (AC: #1-5)
  - [ ] Confirm all stories SM accepted
  - [ ] Run full test suite: backend + frontend + E2E
  - [ ] Run `tsc --noEmit` — 0 errors
  - [ ] Run `npm run lint` — ≤280 warnings
  - [ ] Confirm UAT pass rate

- [ ] **Task 2: Merge to main** (AC: #6)
  ```bash
  git checkout main
  git pull origin main
  git merge sprint-10/v1-release --no-ff -m "Merge sprint-10/v1-release: v1.0.0 MVP Release"
  git push origin main
  ```

- [ ] **Task 3: Create and push tag** (AC: #7, #8)
  ```bash
  git tag -a v1.0.0 -m "v1.0.0 - G-Credit MVP Release (10 Epics, 1087+ tests)"
  git push origin v1.0.0
  ```

- [ ] **Task 4: Post-merge verification** (AC: #9)
  - [ ] Verify main branch builds successfully
  - [ ] Verify tag visible on remote
  - [ ] Final documentation check

- [ ] **Task 5: Sprint 10 Retrospective** (AC: n/a)
  - [ ] Facilitate retrospective
  - [ ] Create `docs/sprints/sprint-10/retrospective.md`
  - [ ] Update project-context.md with final Sprint 10 status

## Dev Notes

### Git Commands (Complete Sequence)
```bash
# 1. Ensure clean state
git status  # Should be clean
git checkout sprint-10/v1-release

# 2. Final test run
cd backend && npm test && cd ../frontend && npm test && cd ..

# 3. Merge
git checkout main
git pull origin main
git merge sprint-10/v1-release --no-ff -m "Merge sprint-10/v1-release: v1.0.0 MVP Release"

# 4. Tag
git tag -a v1.0.0 -m "v1.0.0 - G-Credit MVP Release (10 Epics, 1087+ tests)"

# 5. Push
git push origin main
git push origin v1.0.0

# 6. Verify
git log --oneline -5
git tag -l "v1.*"
```

### Rollback Plan
If merge fails or tests break on main:
```bash
git checkout main
git reset --hard HEAD~1  # Undo merge
git push origin main --force  # Only if no one else pulled
```

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
