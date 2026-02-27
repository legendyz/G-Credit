# Story 14.1: Fix Flaky BadgeManagementPage Test (TD-036)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 2-4h  
**Wave:** 1 — Quick Win  
**Source:** TD-036 (Sprint 13 closeout)  
**File:** `frontend/src/pages/admin/BadgeManagementPage.test.tsx`

---

## Story

**As a** developer,  
**I want** the BadgeManagementPage test to pass reliably in the full test suite,  
**So that** CI pre-push hooks don't fail intermittently.

## Acceptance Criteria

1. [ ] Test "should show Revoke button for PENDING badges when ADMIN" passes 10/10 runs in full suite
2. [ ] Root cause identified and documented (test isolation / shared mock state / DOM timing)
3. [ ] Fix does not weaken assertion coverage
4. [ ] Pre-push hook passes 5 consecutive times without `--no-verify`

## Tasks / Subtasks

- [ ] **Task 1: Reproduce the failure** (AC: #1, #2)
  - [ ] Run full frontend test suite 5+ times, capture failure pattern
  - [ ] Run the specific test in isolation — confirm it passes
  - [ ] Identify which preceding test(s) cause interference
- [ ] **Task 2: Root cause analysis** (AC: #2)
  - [ ] Check for shared mock state leakage between test files
  - [ ] Check Vitest worker scheduling / parallelism issues
  - [ ] Inspect `getAllByRole` with `toBeGreaterThanOrEqual(2)` — may mask timing
  - [ ] Document root cause in this file
- [ ] **Task 3: Apply fix** (AC: #1, #3)
  - [ ] Fix the root cause (mock isolation / cleanup / explicit waits)
  - [ ] Ensure assertion coverage is not weakened
  - [ ] Add `afterEach` cleanup if shared state was the issue
- [ ] **Task 4: Verify reliability** (AC: #1, #4)
  - [ ] Run full suite 10 consecutive times — 10/10 pass
  - [ ] Run pre-push hook 5 consecutive times without `--no-verify`
  - [ ] Confirm no other tests affected

## Investigation Notes

- Passes in isolation, fails ~1 in 3 full suite runs
- Suspect: Vitest worker scheduling or shared mock state leakage
- Check: `getAllByRole` with `toBeGreaterThanOrEqual(2)` may mask subtle timing

## Dev Notes

### Architecture Patterns Used
- Vitest test isolation best practices
- Mock cleanup patterns (vi.clearAllMocks / vi.restoreAllMocks)

### Testing Standards
- **Reliability:** 10/10 pass rate in full suite (not just isolation)
- **No skip:** Do not `.skip()` as a "fix"
- **Coverage preservation:** Assertion count must not decrease

### References
- ADR: N/A (bug fix)
- Related: TD-036 from Sprint 13 closeout
- Pre-push hook: Husky v9 (Sprint 11)

## Dev Agent Record

### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
