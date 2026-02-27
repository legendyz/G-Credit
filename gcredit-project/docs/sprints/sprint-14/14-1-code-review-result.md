# Code Review Result: Story 14.1 — Fix Flaky BadgeManagementPage Test (TD-036)

## Review Metadata

- **Story:** 14.1
- **Commit Reviewed:** `a60cc20`
- **Branch:** `sprint-14/role-model-refactor`
- **Reviewer:** AI Dev Agent (Code Review mode)
- **Date:** 2026-02-28
- **Scope Applied:** Test-file change only (`frontend/src/pages/admin/BadgeManagementPage.test.tsx`)

---

## Verdict

**APPROVED**

Final re-review confirms the follow-up hardening was applied and the story is ready for acceptance.

---

## What Was Reviewed

### Diff Validation

Confirmed commit `a60cc20` changes in test file:
1. Added RTL imports: `within`, `cleanup`
2. `afterEach` changed from `vi.resetAllMocks()` to `cleanup()` + `vi.restoreAllMocks()`
3. Flaky test updated from unscoped weak count (`>=2`) to scoped exact assertion (`within(table)`, `toHaveLength(2)`)

### Runtime Verification

Executed repeated runs for the target test file:
- Command: `npx vitest run src/pages/admin/BadgeManagementPage.test.tsx --reporter=dot`
- Repetitions: **5/5 passed**
- File test count remained **25/25 passed each run**

Observed non-blocking existing warnings (not introduced by this change):
- React Router v7 future flags warning
- Dialog accessibility warning (`Description` / `aria-describedby`)

---

## Checklist Assessment

### Correctness

- [x] **Data wait strategy**: Acceptable. Waiting for `John Doe` before button assertions materially reduces timing risk.
- [x] **Table assumption**: Valid under current component logic. The table is rendered in the loaded non-empty state and remains in DOM (`hidden md:block`).
- [x] **Button count logic**: Correct. Component logic allows revoke for **PENDING** and **CLAIMED** statuses.
- [x] **Exact vs flexible assertion**: `toHaveLength(2)` is intentionally stricter and improves regression detection.

### Test Isolation

- [x] **`vi.restoreAllMocks()` safety**: Safe in this file because `beforeEach` re-establishes API mock implementations every test.
- [x] **`cleanup()` redundancy**: Redundant with RTL auto-cleanup in many setups, but harmless as explicit teardown.
- [x] **Module-level `vi.mock()` semantics**: Correct understanding: `restoreAllMocks` does not undo hoisted module mocks.

### Regression Risk

- [x] **Other revoke-button queries checked**: There are other unscoped revoke queries in this file, but they use tolerant assertions (`>=1`, range checks) and are not currently showing flakiness.
- [x] **No weakened coverage**: Confirmed. Assertion strength increased for the flaky case.

### Best Practices

- [x] No `.skip()` introduced
- [x] No debug `console.log` introduced
- [x] Comments explain intent clearly

---

## Answers to Reviewer Questions

1. **Two-step approach robustness (wait for data → assert outside `waitFor`)**  
   Robust enough for this case, because once loaded state is reached, both mobile and desktop branches render from the same data path. Keeping final assertion outside `waitFor` is acceptable and improves failure clarity.

2. **Could `getByRole('table')` fail before render?**  
   Theoretically yes in highly delayed render edges, but practically mitigated by the prior wait on loaded content (`John Doe`). Under current implementation, this is low risk.

3. **Other dual-layout risk tests in same file?**  
   Yes, there are other unscoped `Revoke` queries. They are currently less brittle due to non-exact expectations. No immediate blocker, but they are candidates for future consistency hardening.

---

## Recommended Follow-up (Non-blocking)

1. Prefer `const desktopTable = await screen.findByRole('table')` in this flaky test for maximal timing robustness.
2. Optionally standardize revoke-button assertions to a scoped container (`within(table)` or explicit mobile container) when exact counts matter.
3. Track and clean up existing test warnings separately (React Router future flags, dialog a11y warning).

---

## Re-review Update (Post CR Follow-up)

- **Follow-up Commit Reviewed:** `b12876d`
- **Change Applied:** replaced `screen.getByRole('table')` with `await screen.findByRole('table')` in the flaky test for stronger timing robustness
- **Recheck Runs:** target file rerun and stable (`25/25` pass in repeated runs)

## Final Decision

**APPROVED**

The fix addresses the root flake cause (dual-layout unscoped query + weak count assertion), improves determinism, and preserves/strengthens coverage. Follow-up timing hardening is in place.