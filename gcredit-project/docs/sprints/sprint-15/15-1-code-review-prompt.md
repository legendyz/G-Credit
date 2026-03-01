# Code Review Prompt: Story 15.1 — Dashboard Tabbed Composite View (TD-035-A)

## Review Metadata

- **Story:** 15.1 — Dashboard Tabbed Composite View
- **Story File:** `docs/sprints/sprint-15/15-1-dashboard-composite-view.md`
- **Commit:** `4daf87e` (single commit)
- **Parent:** `19dc086` (Story 15.3 done — last pushed commit)
- **Branch:** `sprint-15/ui-overhaul-dashboard`
- **Priority:** CRITICAL (8h story, Wave 2 — Core UI)
- **Depends On:** Story 15.2 (Permissions API) + Story 15.3 (Sidebar, shadcn/ui Tabs installed)

---

## Diff Commands

```bash
# Full diff (all files, excluding package-lock.json)
git diff 19dc086..4daf87e -- ":(exclude)**/package-lock.json"

# Core implementation file
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/pages/dashboard/DashboardPage.tsx

# Test file
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/pages/dashboard/DashboardPage.test.tsx

# Sub-dashboard enabled prop changes
git diff 19dc086..4daf87e -- \
  gcredit-project/frontend/src/pages/dashboard/ManagerDashboard.tsx \
  gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx \
  gcredit-project/frontend/src/pages/dashboard/AdminDashboard.tsx

# CSS changes
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/index.css

# Story doc changes
git diff 19dc086..4daf87e -- gcredit-project/docs/sprints/sprint-15/15-1-dashboard-composite-view.md
```

---

## Scope

7 files changed (+535, −109 lines):

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `src/pages/dashboard/DashboardPage.tsx` | REWRITTEN | +226 (was role-switch) | Tabbed composite dashboard with forceMount + CSS hidden |
| `src/pages/dashboard/DashboardPage.test.tsx` | NEW | +286 | 17 tests: 6 combos, default/deep-link, switching, data gating |
| `src/pages/dashboard/ManagerDashboard.tsx` | MODIFIED | +9 | Added `enabled` prop for React Query gating |
| `src/pages/dashboard/IssuerDashboard.tsx` | MODIFIED | +9 | Added `enabled` prop for React Query gating |
| `src/pages/dashboard/AdminDashboard.tsx` | MODIFIED | +9 | Added `enabled` prop for React Query gating |
| `src/index.css` | MODIFIED | +11 | Mobile scroll CSS for dashboard tabs |
| `15-1-dashboard-composite-view.md` | MODIFIED | +94 | Story doc updated (Dev Agent Record, status) |

---

## Architecture Context

This story **replaces the old role-switched dashboard** (which showed a single dashboard per role) with a **tabbed composite view** showing all applicable dashboards based on dual-dimension permissions (role × isManager).

**Key Architecture Decisions:**
- **ADR-016 DEC-016-01:** Default tab is "My Badges" for all users
- **DEC-15-01:** Hybrid permission computation — JWT claims for instant tab rendering + background `GET /api/users/me/permissions` API call to verify
- **DEC-15-03:** Mount ALL visible tab content on load with `forceMount`; hide non-active via CSS `hidden` class; gate data fetching via React Query `enabled` flag
- **CROSS-001:** Uses shared `computeDashboardTabs()` from `utils/permissions.ts` (created in Story 15.2, also used by Story 15.3)
- **REC-15.1-003:** Mobile (<768px) uses horizontal scroll, not dropdown
- **REC-15.1-004:** URL deep-link via `?tab=` query param; tab clicks use `replace: true` (no browser history push)
- **MEDIUM-15.1-001:** React Query `enabled` prevents 4× parallel API calls on mount

**Dashboard Tab Permission Matrix (ADR-016 §DEC-016-01):**

| Role | isManager | Visible Tabs |
|------|-----------|-------------|
| EMPLOYEE | false | My Badges |
| EMPLOYEE | true | My Badges, Team Overview |
| ISSUER | false | My Badges, Issuance |
| ISSUER | true | My Badges, Team Overview, Issuance |
| ADMIN | false | My Badges, Issuance, Administration |
| ADMIN | true | My Badges, Team Overview, Issuance, Administration |

---

## Review Checklist

### 1. DashboardPage.tsx — Outer Component (Lines 53–72)

**Auth Guard Pattern:**
- [ ] `isLoading` → shows `PageLoader`
- [ ] `!isAuthenticated || !user` → shows `ErrorDisplay`
- [ ] `role` defaults to `'EMPLOYEE'` when `user.role` is undefined (safe fallback)
- [ ] Guards run BEFORE hooks — avoids conditional hook calls
- [ ] `DashboardTabs` inner component used to keep hooks unconditional after guards

**Reviewer Questions:**
1. `role = (user.role ?? 'EMPLOYEE') as UserRole` — the `as` cast is safe because `user.role` is already typed, but should this use a runtime validation (e.g., `Object.values(UserRole).includes(...)`) to guard against corrupted JWT data?

---

### 2. DashboardPage.tsx — DashboardTabs Component (Lines 81–182)

**Tab Computation (AC#1, AC#3, CROSS-001):**
- [ ] Uses `computeDashboardTabs(role, isManager)` from `utils/permissions.ts`
- [ ] `useMemo` correctly memoizes on `[role, isManager]`
- [ ] No duplicated permission logic — fully delegates to shared utility
- [ ] Returns correct tabs per the 6-combination matrix above

**URL Deep-Link (AC#9, REC-15.1-004):**
- [ ] `activeTab` derived from `searchParams.get('tab')` — URL is single source of truth
- [ ] Falls back to `'my-badges'` if URL tab is not in `visibleTabs`
- [ ] `setSearchParams({ tab: value }, { replace: true })` — no history push on tab click
- [ ] Validates `urlTab` against `visibleTabs.includes()` before using
- [ ] Deep-link to a tab the user doesn't have permission for falls back gracefully

**Background Permission Verification (DEC-15-01):**
- [ ] `useQuery` calls `GET /users/me/permissions` with `staleTime: 5 * 60 * 1000` (5 minutes)
- [ ] `useEffect` compares API response to current JWT role/isManager
- [ ] If mismatch, uses `useAuthStore.setState()` to update (triggers re-render with correct tabs)
- [ ] Does NOT redirect or flash — just silently corrects stale JWT
- [ ] `useEffect` dependencies include `[apiPermissions, role, isManager]`

**Mount All + CSS Hidden Pattern (AC#5, DEC-15-03):**
- [ ] Each `TabsContent` uses `forceMount` — content stays in DOM
- [ ] Non-active tabs get `className={activeTab !== 'xxx' ? 'hidden' : ''}`
- [ ] `hidden` class hides content via CSS `display: none` (Tailwind utility)
- [ ] Tab order in JSX: my-badges → team → issuance → admin (consistent with trigger order)

**Data Gating (MEDIUM-15.1-001):**
- [ ] `ManagerDashboard enabled={activeTab === 'team'}`
- [ ] `IssuerDashboard enabled={activeTab === 'issuance'}`
- [ ] `AdminDashboard enabled={activeTab === 'admin'}`
- [ ] `EmployeeDashboard` does NOT receive `enabled` prop — always fetches *(see Reviewer Question #2)*
- [ ] `enabled` is reactive — switching tabs toggles data fetching on/off

**Error Isolation:**
- [ ] Each `TabsContent` wrapped in `<ErrorBoundary>` — error in one tab doesn't crash others
- [ ] `ErrorBoundary` is imported from `components/common/ErrorBoundary`

**shadcn/ui Usage:**
- [ ] `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `components/ui/tabs`
- [ ] `data-testid="dashboard-tabs"` on `<Tabs>` root
- [ ] `data-dashboard-tabs` attribute on `<TabsList>` (targeted by mobile CSS)
- [ ] `TabsTrigger` has `min-w-[100px]` class for consistent width

**Responsive (AC#7, REC-15.1-003):**
- [ ] `TabsList` has `overflow-x-auto` for mobile horizontal scroll
- [ ] `md:justify-center` — centered on desktop, left-aligned on mobile
- [ ] Mobile scroll CSS handled in `index.css` (separate checklist item)

**Reviewer Questions:**
1. `EmployeeDashboard` has no `enabled` prop — its data loads even when user is on another tab. Is this intentional because "My Badges" is always the first tab and likely already loaded, or should it also be gated for consistency? (Low impact since Employee data is fetched on initial render anyway)
2. `useAuthStore.setState((state) => ...)` is called directly inside `useEffect` — is this safe across React 18 concurrent mode? (Should be fine since Zustand `setState` is synchronous and batched, but worth confirming)
3. The `staleTime: 5 * 60 * 1000` on the permissions query means the background check won't re-fetch for 5 minutes. If an admin changes a user's role, the stale JWT won't be corrected for up to 5 minutes. Is this acceptable per the story scope? (Likely yes — "background" verification implies eventual consistency)
4. `visibleTabs.includes(urlTab as DashboardTab)` uses `Array.includes` with a type assertion — `urlTab` is `string | null`, and `as DashboardTab` suppresses type safety. Consider: `(visibleTabs as readonly string[]).includes(urlTab ?? '')`.
5. Tab labels are hardcoded in `TAB_LABELS` constant. Should these be localized (i18n) or is English-only acceptable for MVP?

---

### 3. Sub-Dashboard Changes (ManagerDashboard, IssuerDashboard, AdminDashboard)

All three follow the same pattern:

**Pattern per file (+9 lines each):**
- [ ] New `interface XxxDashboardProps { enabled?: boolean }` added
- [ ] Component signature changed from `React.FC` to `React.FC<XxxDashboardProps>`
- [ ] Default value: `{ enabled = true }` — backward compatible (standalone usage still works)
- [ ] `enabled` forwarded to `useXxxDashboard({ enabled })` hook
- [ ] JSDoc comment: `/** When false, React Query is disabled — no API calls (DEC-15-03) */`
- [ ] No other logic changes — rest of component untouched

**Reviewer Questions:**
1. `EmployeeDashboard` does NOT get this change — is this intentional? (see DashboardPage question #1)
2. `enabled` defaults to `true` — so existing direct usages (e.g., in storybook, tests, or old routing) still work without changes. Verify no callsites pass `enabled={undefined}` which would trigger the default correctly.

---

### 4. index.css — Mobile Scroll CSS (+11 lines)

```css
/* === Dashboard Tabs Mobile Scroll — Story 15.1 (REC-15.1-003) === */
@media (max-width: 767px) {
  [data-dashboard-tabs] {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  [data-dashboard-tabs]::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] Targets `[data-dashboard-tabs]` attribute (matches `TabsList` in DashboardPage.tsx)
- [ ] Breakpoint `max-width: 767px` matches `md:` Tailwind equivalent (md = 768px+)
- [ ] `-webkit-overflow-scrolling: touch` for smooth iOS scroll
- [ ] `scrollbar-width: none` (Firefox) + `::-webkit-scrollbar { display: none }` (Chrome/Safari) — hides scrollbar
- [ ] Section comment includes story reference and decision reference

**Reviewer Questions:**
1. Hidden scrollbar on mobile — does this meet accessibility requirements? Users may not realize the tabs are scrollable. Story AC#7 mentions "fade indicator" but no fade gradient is implemented in CSS. Is this a gap or was fade deferred?
2. Does `overflow-x-auto` on `TabsList` (from Tailwind class in TSX) conflict with or complement this CSS? Both are needed — Tailwind provides `overflow-x: auto`, CSS hides the scrollbar.

---

### 5. Test Coverage (DashboardPage.test.tsx — 286 lines, 17 tests)

**Test Structure:**
- [ ] Proper mocking of all 4 sub-dashboards (`vi.mock`) with `data-testid` and `data-enabled` attributes
- [ ] `apiFetchJson` mocked to prevent real API calls (returns `null`)
- [ ] `createTestQueryClient()` with `retry: false, gcTime: 0` — no retry noise in tests
- [ ] `renderDashboard(initialPath)` helper wraps in `QueryClientProvider` + `MemoryRouter`
- [ ] `beforeEach` resets auth state + clears mocks

**Loading & Auth Guards (2 tests):**
- [ ] `isLoading: true` → shows "Loading..." text
- [ ] `!isAuthenticated` → shows "Not Authenticated" text

**6-Combination Tab Visibility (6 tests, AC#3, AC#8):**
- [ ] All 6 role×isManager combos tested via parameterized `testCases` array
- [ ] Each test checks `expectedTabs` exist as `role="tab"` elements
- [ ] Each test checks `notExpectedTabs` are NOT in the document
- [ ] Uses `screen.getByRole('tab', { name })` — semantically correct selector

**Default Tab & Deep-Link (4 tests, AC#2, AC#9):**
- [ ] Default = "My Badges" with `data-state="active"` assertion
- [ ] Deep-link `/?tab=issuance` → Issuance tab active (for ISSUER)
- [ ] Invalid deep-link `/?tab=admin` for EMPLOYEE → falls back to "My Badges"
- [ ] Unknown string `/?tab=nonexistent` → falls back to "My Badges"

**Tab Switching & CSS Hidden (3 tests, DEC-15-03):**
- [ ] Default: my-badges visible, team/issuance/admin all have `hidden` class
- [ ] After click "Issuance": issuance loses `hidden`, others gain `hidden`
- [ ] All 4 dashboards mounted in DOM (`forceMount` verified via `getByTestId`)
- [ ] `userEvent.setup()` used (not `fireEvent`) — more realistic user interaction
- [ ] `waitFor()` used for async tab switching assertions

**Data Gating (2 tests, MEDIUM-15.1-001):**
- [ ] Default: employee `data-enabled="true"`, manager/issuer/admin all `"false"`
- [ ] After switching to "Administration": admin `"true"`, manager/issuer `"false"`, employee still `"true"`

**Reviewer Questions:**
1. The last data gating test expects `employee-dashboard` to have `data-enabled="true"` even when "Administration" tab is active. This is because EmployeeDashboard has no `enabled` prop. Is this test asserting the correct intentional behavior, or revealing a gap?
2. No test for the background permission verification (`useQuery` for `GET /users/me/permissions`). Should there be a test where the API returns a different role and verifies authStore is updated? (May be acceptable to defer to E2E in Story 15.14)
3. No test for `replace: true` behavior on tab click (URL update without history push). Is this testable in jsdom? (Likely not — better suited for E2E)
4. `QueryClient` with `gcTime: 0` means garbage collection is immediate. Does this accurately simulate production behavior where `gcTime` may be 5 minutes?

---

### 6. Story Documentation

- [ ] Story status = `done`, all ACs marked `[x]`
- [ ] All tasks/subtasks marked `[x]`
- [ ] Dev Agent Record filled: model, completion notes, file list
- [ ] 837 total tests passing documented
- [ ] Architecture references (DEC-15-01, DEC-15-03, CROSS-001, etc.) all cited

---

## What Was NOT Changed (Verify Unchanged)

These files/areas MUST NOT be modified in this story:

| File/Area | Reason |
|-----------|--------|
| `utils/permissions.ts` | Story 15.2 — shared logic, reused not modified |
| `App.tsx` route definitions | Not in scope — routes unchanged |
| `stores/authStore.ts` | Not in scope — `useIsManager()` already exists |
| `EmployeeDashboard.tsx` | No `enabled` prop needed (always-loaded default tab) |
| Backend files | No backend changes in this story |
| `components/ui/tabs.tsx` | Auto-generated by shadcn/ui in Story 15.3, should not be hand-edited |

**Verification commands:**
```bash
# Verify no changes to permissions.ts
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/utils/permissions.ts

# Verify no changes to App.tsx
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/App.tsx

# Verify no changes to authStore
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/stores/authStore.ts

# Verify no changes to EmployeeDashboard
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx

# Verify no changes to tabs.tsx
git diff 19dc086..4daf87e -- gcredit-project/frontend/src/components/ui/tabs.tsx
```

---

## Verdict Options

- **APPROVED** — Tabbed view correctly replaces role-switch, permission matrix matches ADR-016, forceMount+hidden+enabled pattern implements DEC-15-03, tests cover all 6 combos and key behaviors
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking items (e.g., EmployeeDashboard enabled prop, mobile fade indicator, type assertion cleanup)
- **CHANGES REQUESTED** — Blocking issue found (describe)
