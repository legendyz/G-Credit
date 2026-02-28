# Code Review Prompt: Story 14.7 — Frontend Type Updates + Remove MANAGER References

## Review Metadata

- **Story:** 14.7 — Frontend Type Updates + Remove MANAGER References
- **Story File:** `docs/sprints/sprint-14/14-7-frontend-remove-manager.md`
- **Commit:** `81bcd7b` (single commit)
- **Parent:** `b76709d` (Story 14.4 acceptance docs)
- **Branch:** `sprint-14/role-model-refactor`
- **Diff command:** `git diff b76709d..81bcd7b -- gcredit-project/frontend/`

---

## Scope

9 frontend files changed (+130, −72), plus 3 docs files:

| File | Change Type | Purpose |
|------|-------------|---------|
| `frontend/src/stores/authStore.ts` | Modified | `isManager: boolean` on User, `useIsManager()` selector, 5 mapping points |
| `frontend/src/components/ProtectedRoute.tsx` | Modified | `requireManager` prop, dual-dimension access check |
| `frontend/src/App.tsx` | Modified | Badge Management route: `MANAGER` → `requireManager` |
| `frontend/src/components/Navbar.tsx` | Modified | `role === 'MANAGER'` → `isManager && role === 'EMPLOYEE'` |
| `frontend/src/components/layout/MobileNav.tsx` | Modified | `navLinks` type + `managerAccess` flag, filter updated |
| `frontend/src/pages/admin/BadgeManagementPage.tsx` | Modified | `isManager` prop replaces `'MANAGER'` type/checks |
| `frontend/src/pages/dashboard/DashboardPage.tsx` | Modified | Removed `case 'MANAGER':`, conditional render via `user.isManager` |
| `frontend/src/hooks/useDashboard.ts` | Modified | `isManager` param, removed `case 'MANAGER':` |
| `frontend/src/stores/authStore.loginViaSSO.test.ts` | Modified | Added `isManager: false` to mockUser |
| `docs/sprints/sprint-14/14-7-dev-prompt.md` | **New** | Dev prompt |
| `docs/sprints/sprint-14/14-7-frontend-remove-manager.md` | Modified | Story status → `review`, ACs/record |
| `docs/sprints/sprint-14/14-4-code-review-result.md` | Modified | Re-review update from 14.4 |

---

## Architecture Context

This is **ADR-017 §5** — the frontend half of the dual-dimension identity model:

- **Role dimension** (existing): `user.role` = `ADMIN | ISSUER | EMPLOYEE`
- **Organization dimension** (new): `user.isManager` = `boolean` from JWT claim (Story 14.3)

The MANAGER role enum was removed from the backend schema in Story 14.2. Some frontend refs were cleaned there (adminUsersApi, RoleBadge, AdminUserManagementPage). This story completes the remaining frontend cleanup.

---

## Review Checklist

### 1. Auth Store — `isManager` Integration

**File:** `frontend/src/stores/authStore.ts`

**Verify:**
- [ ] `User` interface: `role` type is `'ADMIN' | 'ISSUER' | 'EMPLOYEE'` (no `'MANAGER'`)
- [ ] `User` interface: `isManager: boolean` field added
- [ ] 5 mapping points all use `{ ...data.user, isManager: data.user?.isManager ?? false }` pattern:
  - `login()` response mapping
  - `register()` response mapping
  - `loginViaSSO()` profile mapping
  - `validateSession()` initial profile mapping
  - `validateSession()` retry profile mapping
- [ ] `useIsManager()` selector exported at module level
- [ ] `useIsManager()` defaults to `false` if user is null

**Reviewer questions:**
1. The spread pattern `{ ...data.user, isManager: data.user?.isManager ?? false }` — does this safely handle the case where `data.user` already has `isManager: true`? (Yes — the explicit `isManager` property after spread overwrites... wait, actually `?? false` means if `data.user.isManager` is `true`, it stays `true`. If `undefined`, it becomes `false`. Correct.)
2. Is the Zustand `persist` middleware affected by the User shape change? Could stale persisted state cause issues? (Old persisted users won't have `isManager`, but the `?? false` fallback in selectors handles this.)

### 2. ProtectedRoute — `requireManager` Prop

**File:** `frontend/src/components/ProtectedRoute.tsx`

**Verify:**
- [ ] `'MANAGER'` removed from `requiredRoles` type union
- [ ] `requireManager?: boolean` prop added to interface
- [ ] Destructured in component signature
- [ ] Access check logic: `hasRole || isManager || isAdmin` → allowed
- [ ] ADMIN bypass: `user.role === 'ADMIN'` always passes (consistent with backend ManagerGuard)
- [ ] Manager check uses `user.isManager ?? false`

**Reviewer questions:**
1. The logic `if (!hasRole && !isManager && !isAdmin)` — is this correct for the case where `requireManager` is false/undefined but `requiredRoles` has entries? Let's trace: if `requireManager` is undefined, then `isManager = undefined && (user.isManager ?? false) = false`. So `!isManager = true`. Then it falls to `!hasRole`. If user has the role → `hasRole = true` → `!hasRole = false` → not denied. Correct.
2. What about when both `requiredRoles` is empty AND `requireManager` is true? The outer `if (requiredRoles && requiredRoles.length > 0)` gate would skip the manager check entirely. Is this a problem? (Currently no route uses `requireManager` without `requiredRoles`, so no issue in practice. But it's a design gap to note.)

### 3. App.tsx Route Update

**File:** `frontend/src/App.tsx`

**Verify:**
- [ ] Badge Management route changed from `requiredRoles={['ADMIN', 'ISSUER', 'MANAGER']}` to `requiredRoles={['ADMIN', 'ISSUER']} requireManager`
- [ ] No other routes reference `'MANAGER'`

### 4. Navbar — Manager Link Visibility

**File:** `frontend/src/components/Navbar.tsx`

**Verify:**
- [ ] Imports `useIsManager` from authStore
- [ ] `isManager` hook called at component top level
- [ ] Manager link condition: `isManager && user?.role === 'EMPLOYEE'`
- [ ] Comment updated to reference ADR-017
- [ ] No duplicate badge nav item for ADMIN/ISSUER (they see it via admin section)

**Reviewer question:**
1. What about an ISSUER who is also a manager? They see Badges via the existing admin section, so the manager link condition (`role === 'EMPLOYEE'`) correctly hides the duplicate. Good.

### 5. MobileNav — `managerAccess` Flag

**File:** `frontend/src/components/layout/MobileNav.tsx`

**Verify:**
- [ ] `navLinks` array typed with `managerAccess?: boolean`
- [ ] All `'MANAGER'` removed from role arrays:
  - Dashboard: `['ADMIN', 'ISSUER', 'EMPLOYEE']` (was `['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE']`)
  - My Wallet: same
  - Badge Management: `['ADMIN', 'ISSUER']` + `managerAccess: true`
  - Profile: `['ADMIN', 'ISSUER', 'EMPLOYEE']`
- [ ] `isManager` derived from `user?.isManager ?? false`
- [ ] Filter logic: `link.roles.includes(user.role) || (link.managerAccess && isManager)`

**Reviewer question:**
1. Role arrays that were `['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE']` now become `['ADMIN', 'ISSUER', 'EMPLOYEE']` — which is ALL roles. Should these be simplified to just check `isAuthenticated`? (Not a blocker — the role array pattern is consistent and future-proof for GUEST role per ADR-014.)

### 6. BadgeManagementPage — `isManager` Prop

**File:** `frontend/src/pages/admin/BadgeManagementPage.tsx`

**Verify:**
- [ ] Props interface: `userRole?: 'ADMIN' | 'ISSUER' | 'EMPLOYEE'` (no `'MANAGER'`)
- [ ] New prop: `isManager?: boolean`
- [ ] `isManager` resolved: `isManagerProp ?? currentUser?.isManager ?? false`
- [ ] Revoke permission: `if (isManager) return true;` (was `userRole === 'MANAGER'`)
- [ ] Description text: `isManager ? 'Manage badges for your department'` (was `userRole === 'MANAGER'`)
- [ ] Comment updated: "manager employees see department badges"
- [ ] `isManager` added to `useMemo` dependency array `[userRole, userId, isManager]`

### 7. DashboardPage — Conditional Manager Dashboard

**File:** `frontend/src/pages/dashboard/DashboardPage.tsx`

**Verify:**
- [ ] `case 'MANAGER':` block entirely removed (15 lines)
- [ ] `EMPLOYEE/default` case: conditionally renders `<ManagerDashboard />` when `user.isManager` is true
- [ ] Manager employee sees: ManagerDashboard → separator → "Your Personal Dashboard" heading → EmployeeDashboard
- [ ] Non-manager employee sees: only EmployeeDashboard
- [ ] `<ManagerDashboard />` import retained (still used)
- [ ] ADMIN case unchanged (sees AdminDashboard without ManagerDashboard — correct, ADMIN has separate admin view)

**Reviewer question:**
1. ADMIN users don't see ManagerDashboard in the current implementation (ADMIN case returns `<AdminDashboard />`). Should an ADMIN who is also a manager see both? (Current behavior matches pre-14.7 — ADMIN always only saw AdminDashboard. Sprint 15 will address composite views.)

### 8. useDashboard Hook

**File:** `frontend/src/hooks/useDashboard.ts`

**Verify:**
- [ ] Function signature: `role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN', isManager?: boolean` (no `'MANAGER'`)
- [ ] `case 'MANAGER':` removed
- [ ] `default` case: `if (isManager)` returns `{ employee, manager }`, else `{ employee }`
- [ ] ADMIN case unchanged (still includes `manager: managerQuery`)
- [ ] `useManagerDashboard()` still called unconditionally (React hooks can't be conditional) — API will 403 for non-managers, React Query handles gracefully

**Reviewer question:**
1. `useManagerDashboard()` fires for ALL users (unconditional hook call). Is there a performance concern? (The query is lightweight, backend returns 403 quickly for non-managers, React Query won't retry on 403. Acceptable for now.)

### 9. Test Updates

**File:** `frontend/src/stores/authStore.loginViaSSO.test.ts`

**Verify:**
- [ ] `mockUser` now includes `isManager: false`
- [ ] No other test files needed updating (dev reports 77/77 suites, 794 tests pass)

### 10. Grep Verification (AC #10)

**Verify dev ran grep check.** Remaining `MANAGER` strings in frontend should ONLY be:
- Domain terms: `managerId`, `managerName`, `ManagerDashboard`, `useManagerDashboard`, `UpdateManagerRequest`
- Comments: "MANAGER removed", "Admin/Manager only"
- UI copy: "your manager" (user-facing text)
- Test fixtures: `lastName: 'Manager'`, `@ts-expect-error` for RoleBadge fallback

No `'MANAGER'` as a role enum value should remain.

### 11. Files Intentionally Not Changed

| File | Reason |
|------|--------|
| `lib/adminUsersApi.ts` | `UserRole` already cleaned in 14.2; `managerId`/`managerName` are domain terms |
| `hooks/useAdminUsers.ts` | `useUpdateUserManager()` — manager relationship, not role |
| `components/admin/CreateUserDialog.tsx` | `managerId` state — relationship assignment |
| `types/dashboard.ts` | `ManagerDashboard` interface — dashboard for managers |
| `hooks/useDashboard.test.tsx` | Tests for `useManagerDashboard()` — domain term |
| `components/admin/RoleBadge.test.tsx` | `@ts-expect-error` fallback test — intentional |

- [ ] Verify none of these files appear in the diff

### 12. Story Documentation

- [ ] Story status = `review`
- [ ] All 12 ACs checked
- [ ] Dev Agent Record: model, completion notes, file list
- [ ] Test results: 77/77 suites, 794 tests, 0 ESLint warnings

---

## Diff Summary for Quick Review

```bash
# Full frontend diff
git diff b76709d..81bcd7b -- gcredit-project/frontend/

# Auth store changes (core: User interface + isManager mapping)
git diff b76709d..81bcd7b -- gcredit-project/frontend/src/stores/authStore.ts

# Routing/access control changes
git diff b76709d..81bcd7b -- gcredit-project/frontend/src/components/ProtectedRoute.tsx gcredit-project/frontend/src/App.tsx

# Navigation changes
git diff b76709d..81bcd7b -- gcredit-project/frontend/src/components/Navbar.tsx gcredit-project/frontend/src/components/layout/MobileNav.tsx

# Page component changes
git diff b76709d..81bcd7b -- gcredit-project/frontend/src/pages/admin/BadgeManagementPage.tsx gcredit-project/frontend/src/pages/dashboard/DashboardPage.tsx

# Hook changes
git diff b76709d..81bcd7b -- gcredit-project/frontend/src/hooks/useDashboard.ts
```

---

## Verdict Options

- **APPROVED** — All MANAGER refs cleanly removed, isManager integration correct, tests pass
- **APPROVED WITH FOLLOW-UP** — Approve with non-blocking recommendations (e.g., optimize unconditional useManagerDashboard call)
- **CHANGES REQUESTED** — Blocking issue found (describe)
