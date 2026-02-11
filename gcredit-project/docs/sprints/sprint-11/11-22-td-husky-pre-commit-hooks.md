# Story 11.22: TD — Husky Pre-commit Hooks

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 1.5h  
**Source:** Tech Debt / DX Improvement  

## Story

As a developer,  
I want git pre-commit hooks that run lint and type-check before each commit,  
So that broken code is caught before it enters the repository.

## Acceptance Criteria

1. [ ] `husky` installed and configured at project root
2. [ ] Pre-commit hook runs: `lint-staged` for changed files
3. [ ] `lint-staged` config: run ESLint + Prettier on `.ts/.tsx` files
4. [ ] Pre-push hook runs: `tsc --noEmit` on backend and frontend
5. [ ] Hooks can be bypassed with `--no-verify` for emergencies
6. [ ] Setup documented in README or CONTRIBUTING.md

## Tasks / Subtasks

- [ ] **Task 1: Install husky** (AC: #1)
  - [ ] `npm install -D husky lint-staged` at project root (or monorepo root)
  - [ ] `npx husky init`
  - [ ] Pin version (Lesson: always pin new deps)

- [ ] **Task 2: Pre-commit hook** (AC: #2, #3)
  - [ ] Create `.husky/pre-commit`:
    ```sh
    npx lint-staged
    ```
  - [ ] Add `lint-staged` config to root `package.json`:
    ```json
    "lint-staged": {
      "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md}": ["prettier --write"]
    }
    ```

- [ ] **Task 3: Pre-push hook** (AC: #4)
  - [ ] Create `.husky/pre-push`:
    ```sh
    cd gcredit-project/backend && npx tsc --noEmit
    cd gcredit-project/frontend && npx tsc --noEmit
    ```

- [ ] **Task 4: Documentation** (AC: #6)
  - [ ] Add "Git Hooks" section to development guide
  - [ ] Document `--no-verify` escape hatch

- [ ] **Task 5: Verify** (AC: #5)
  - [ ] Test commit with lint error → blocked
  - [ ] Test commit with `--no-verify` → passes
  - [ ] Test clean commit → passes

## Dev Notes

### Source Tree Components
- **Root config:** `package.json` (root level — may need to create)
- **Husky dir:** `.husky/` at repo root
- **Existing:** No husky currently installed

### Considerations
- Project structure: `gcredit-project/backend` and `gcredit-project/frontend` are separate npm projects
- May need to configure lint-staged per project or from root

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
