# Dev Prompt: Story 14.1 — Fix Flaky BadgeManagementPage Test (TD-036)

**Story File:** `docs/sprints/sprint-14/14-1-fix-flaky-badge-management-test.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** HIGH | **Estimate:** 2-4h | **Wave:** 1 (Quick Win — do first)

---

## Objective

Fix the flaky test `"should show Revoke button for PENDING badges when ADMIN"` in `BadgeManagementPage.test.tsx`. It passes in isolation but fails ~1 in 3 full suite runs. **This must be fixed before the Wave 2 refactor begins.**

---

## Target File

`frontend/src/pages/admin/BadgeManagementPage.test.tsx` (598 lines)

### The Flaky Test (Line ~270)

```tsx
it('should show Revoke button for PENDING badges when ADMIN', async () => {
  render(<BadgeManagementPage userRole="ADMIN" />, { wrapper: createWrapper() });

  await waitFor(() => {
    const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
    // Mobile + desktop layouts: 2 revocable badges × 2 layouts = up to 4 buttons
    // But minimum should be 2 (one per revocable badge in at least one layout)
    expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
  });
});
```

---

## Investigation Guide

### Step 1: Reproduce the Failure

```bash
cd frontend

# Run full suite 5+ times — capture which run fails
for i in {1..5}; do echo "=== Run $i ===" && npx vitest run --reporter=verbose 2>&1 | tail -20; done

# Or on Windows PowerShell:
1..5 | ForEach-Object { Write-Host "=== Run $_ ==="; npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 20 }

# Run the specific test in isolation — should always pass
npx vitest run src/pages/admin/BadgeManagementPage.test.tsx
```

### Step 2: Root Cause Analysis — Check These Suspects

**Suspect 1: Shared mock state leakage**
- The file uses `vi.mock()` at module level for `badgesApi`, `evidenceApi`, `useSkills`, `sonner`
- `beforeEach` calls `vi.clearAllMocks()`, `afterEach` calls `vi.resetAllMocks()`
- Check: Is another test file also mocking `@/lib/badgesApi` and leaking state across workers?
- Check: Does `vi.clearAllMocks()` vs `vi.restoreAllMocks()` matter here?

**Suspect 2: Responsive layout timing**
- The component renders **both mobile card and desktop table layouts** simultaneously
- `getAllByRole('button', { name: /Revoke/i })` expects ≥2 buttons
- If the render hasn't completed both layouts, the count may be wrong
- Line 277: `toBeGreaterThanOrEqual(2)` → this weak assertion may hide a timing issue
- Fix idea: Use a more specific query or wait for the full render explicitly

**Suspect 3: QueryClient cache pollution**
- `createWrapper()` creates a **new QueryClient per test** (✅ good pattern)
- But check: Is `staleTime: 0` sufficient? Could a previous test's query cache leak?
- Check: The `beforeAll` setting `window.innerWidth = 1024` — is this shared across workers?

**Suspect 4: Vitest worker scheduling**
- Vitest runs test files in parallel workers by default
- If another test file modifies global state (window, document), it can interfere
- Check: `--pool=forks` vs `--pool=threads` behavior difference
- Try: `npx vitest run --pool=forks` to see if isolation improves

### Step 3: Common Fix Patterns

**Pattern A: Improve waitFor specificity**
```tsx
// Instead of weak assertion inside waitFor:
await waitFor(() => {
  const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
  expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
});

// Wait for data to load first, then assert:
await waitFor(() => {
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
// Now assert buttons after data is confirmed loaded
const revokeButtons = screen.getAllByRole('button', { name: /Revoke/i });
expect(revokeButtons.length).toBeGreaterThanOrEqual(2);
```

**Pattern B: Add explicit cleanup**
```tsx
afterEach(() => {
  vi.restoreAllMocks(); // stronger than resetAllMocks
  cleanup(); // RTL cleanup (usually automatic, but force it)
});
```

**Pattern C: Isolate the test from responsive rendering**
```tsx
// If mobile+desktop dual rendering causes non-deterministic button count,
// filter by a parent container:
await waitFor(() => {
  const desktopTable = screen.getByRole('table');
  const revokeButtons = within(desktopTable).getAllByRole('button', { name: /Revoke/i });
  expect(revokeButtons).toHaveLength(2); // Exact count in desktop layout
});
```

---

## Acceptance Criteria

1. [ ] Test passes **10/10 runs** in full suite (`npx vitest run` × 10)
2. [ ] Root cause identified and documented in Story file Dev Notes
3. [ ] Fix does **NOT** weaken assertion coverage (no `.skip()`, no removing assertions)
4. [ ] Pre-push hook passes 5 consecutive times without `--no-verify`

---

## Coding Standards Reminders

- **No Chinese characters** in code/comments
- **No `console.log`** — use NestJS Logger (backend only, N/A here)
- Do NOT use `.skip()` as a "fix"
- Keep existing test count — do not delete assertions

---

## After Completion

1. Update Story file status: `backlog` → `done`
2. Update `sprint-status.yaml`: `14-1-fix-flaky-badge-management-test: done`
3. Document root cause in Story file `Dev Notes` section
4. Commit: `fix: resolve flaky BadgeManagementPage test (TD-036) [14.1]`
5. Proceed to **Story 14.2** (Schema Migration)
