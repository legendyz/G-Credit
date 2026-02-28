# Code Review Prompt: Story 14.1 — Fix Flaky BadgeManagementPage Test (TD-036)

**Commit:** `a60cc20` — `fix: resolve flaky BadgeManagementPage test (TD-036) [14.1]`  
**Branch:** `sprint-14/role-model-refactor`  
**Files Changed:** 3 files, +50 insertions, -31 deletions  
**Review Type:** Self-review + AI Agent review (LOW risk — test-only change)

---

## Review Scope

| File | Change Type | Lines Changed |
|------|------------|---------------|
| `frontend/src/pages/admin/BadgeManagementPage.test.tsx` | **Bug Fix** | +12/-7 |
| `docs/sprints/sprint-14/14-1-fix-flaky-badge-management-test.md` | Documentation | +38/-24 |
| `docs/sprints/sprint-status.yaml` | Status update | +1/-1 |

**Focus your review on the test file only.** Documentation and status changes are informational.

---

## Context

A flaky test `"should show Revoke button for PENDING badges when ADMIN"` in `BadgeManagementPage.test.tsx` was failing ~1 in 3 full-suite runs but always passing in isolation. The root cause was identified as a dual-layout rendering issue: the component renders both mobile and desktop layouts simultaneously, and the test queried buttons across both layouts with a weak assertion (`toBeGreaterThanOrEqual(2)`) inside `waitFor`, which produced non-deterministic results under load.

---

## Code Diff (Test File Only)

### Change 1: Import additions (Line 9)

```diff
-import { render, screen, waitFor } from '@testing-library/react';
+import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
```

**Review:** `within` is used to scope queries to the desktop table. `cleanup` is used for explicit teardown. Both are standard RTL imports.

### Change 2: afterEach cleanup strengthening (Lines 170-172)

```diff
 afterEach(() => {
-    vi.resetAllMocks();
+    cleanup();
+    vi.restoreAllMocks();
 });
```

**Review points:**
- `vi.restoreAllMocks()` is stronger than `vi.resetAllMocks()` — it restores original implementations, not just clears call history
- `cleanup()` is explicitly called even though RTL auto-cleanup is typically enabled
- **Question:** Is this change safe for other tests in the same `describe` block? Could `vi.restoreAllMocks()` break any test that relies on mocks persisting across `beforeEach`/test boundaries?
- **Check:** The `beforeEach` block re-mocks `getAllBadges` and `getIssuedBadges` on every test, so `restoreAllMocks` followed by fresh mocking in `beforeEach` should be safe.

### Change 3: The flaky test fix (Lines 271-286)

**Before:**
```tsx
it('should show Revoke button for PENDING badges when ADMIN', async () => {
  render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

  await waitFor(() => {
    const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
    expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
  });
});
```

**After:**
```tsx
it('should show Revoke button for PENDING badges when ADMIN', async () => {
  render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

  // Wait for badge data to fully load before asserting buttons
  await waitFor(() => {
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
  });

  // Scope to desktop table to avoid non-deterministic dual-layout button count
  const desktopTable = screen.getByRole('table');
  const revokeButtons = within(desktopTable).getAllByRole('button', { name: /Revoke/i });
  // Exactly 2 revocable badges in desktop layout: PENDING (badge-1) + CLAIMED (badge-2)
  expect(revokeButtons).toHaveLength(2);
});
```

---

## Review Checklist

### Correctness
- [ ] **Data wait strategy:** Does `await waitFor(() => expect(screen.getAllByText('John Doe')...))` reliably indicate that the component has finished rendering? Could there be a race where text is visible but buttons haven't rendered yet?
- [ ] **Table assumption:** Is `screen.getByRole('table')` always present in the desktop layout? Will this throw if the table hasn't rendered yet (since it's outside `waitFor`)?
- [ ] **Button count:** The comment says "PENDING (badge-1) + CLAIMED (badge-2)" are revocable. Verify: is CLAIMED status revocable? Check the component logic — does badge status `CLAIMED` show a Revoke button? (The mock data has 4 badges: PENDING, CLAIMED, REVOKED, EXPIRED.)
- [ ] **Exact vs flexible assertion:** `toHaveLength(2)` is now exact. If the component implementation changes (e.g., adds a "Revoke All" button), this test will fail. Is that the desired behavior?

### Test Isolation
- [ ] **`vi.restoreAllMocks()` safety:** Confirm that no other test in the same describe block relies on module-level mock state surviving across tests. The `beforeEach` re-establishes mocks, so this should be safe.
- [ ] **`cleanup()` redundancy:** RTL v14+ has automatic cleanup. Adding explicit `cleanup()` is harmless but redundant. Is there a reason to believe auto-cleanup is not working?
- [ ] **Module-level `vi.mock()` calls:** These are hoisted and persist for the entire file. `restoreAllMocks` does NOT undo `vi.mock()` — it only restores `vi.fn()` implementations. Confirm this is understood.

### Regression Risk
- [ ] **Other tests using `screen.getAllByRole('button', { name: /Revoke/i })`:** Do any other tests in this file query Revoke buttons without scoping to the table? Could the same dual-layout issue affect them?
- [ ] **No weakened coverage:** The fix changes from `≥2` to `exactly 2` — this is STRONGER, not weaker. Confirm no assertion was removed.

### Best Practices
- [ ] **No `.skip()` used** — the test is fixed, not skipped ✅
- [ ] **No `console.log` added** ✅
- [ ] **No Chinese characters** ✅
- [ ] **Comments are clear and explain "why"** ✅

---

## Questions for Reviewer

1. Is the two-step approach (wait for data → then assert buttons outside `waitFor`) a robust pattern, or should the button assertion also be inside `waitFor`?
2. Could the `getByRole('table')` call fail if it runs before the table renders? Should it be inside `waitFor` as well?
3. Are there other tests in this file that suffer from the same dual-layout querying issue and should be proactively fixed?

---

## Expected Review Outcome

- **APPROVED:** Fix is correct, test isolation improved, assertion is stronger.
- **APPROVED WITH CHANGES:** Minor suggestions (e.g., move `getByRole('table')` inside `waitFor`).
- **CHANGES REQUIRED:** Only if a correctness issue is found (e.g., CLAIMED badges should NOT show Revoke button, making `toHaveLength(2)` wrong).

---

## Verification Data (from Dev Agent)

- Post-fix full suite: **10/10 pass** (794 tests each run)
- Test count preserved: 25 tests in this file
- Assertion count: same or stronger (exact count replaces weak minimum)
