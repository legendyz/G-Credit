# Code Review Result: Story 14.7 — Frontend Type Updates + Remove MANAGER References

## Review Metadata

- **Story:** 14.7 — Frontend Type Updates + Remove MANAGER References
- **Story File:** `docs/sprints/sprint-14/14-7-frontend-remove-manager.md`
- **Commit Reviewed:** `81bcd7b`
- **Parent:** `b76709d`
- **Branch:** `sprint-14/role-model-refactor`
- **Diff Basis:** `git diff b76709d..81bcd7b -- gcredit-project/frontend/`
- **Date:** 2026-02-28

---

## Verdict

**APPROVED WITH FOLLOW-UP**

The implementation correctly completes ADR-017 frontend migration goals for this story: role-enum `MANAGER` references were removed from affected role unions/route checks, and manager identity now uses `user.isManager` consistently in auth store, route protection, and navigation/page logic.

---

## Checklist Review

### 1) Auth Store — `isManager` Integration

File: `frontend/src/stores/authStore.ts`

- [x] `User.role` union is `ADMIN | ISSUER | EMPLOYEE` (no `MANAGER`)
- [x] `User.isManager: boolean` added
- [x] All 5 mapping points set `isManager` with fallback:
  - `login()`
  - `register()`
  - `loginViaSSO()`
  - `validateSession()` initial profile
  - `validateSession()` refresh-retry profile
- [x] `useIsManager()` selector exported
- [x] Selector defaults to `false` when user is null

Reviewer note:
- The pattern `{ ...userData, isManager: userData?.isManager ?? false }` correctly preserves `true` and normalizes missing values to `false`.

### 2) ProtectedRoute — `requireManager` Prop

File: `frontend/src/components/ProtectedRoute.tsx`

- [x] `requiredRoles` union no longer includes `MANAGER`
- [x] `requireManager?: boolean` added and destructured
- [x] Access check implemented with role/manager/admin paths
- [x] Admin bypass preserved (`user.role === 'ADMIN'`)
- [x] Manager check uses `user.isManager ?? false`

Reviewer note:
- Current logic applies manager checking only inside the `requiredRoles.length > 0` branch. This is safe for current usage (`/admin/badges` provides both), but leaves a minor design gap if future routes use `requireManager` alone.

### 3) Route Update in `App.tsx`

File: `frontend/src/App.tsx`

- [x] `/admin/badges` changed to `requiredRoles={['ADMIN', 'ISSUER']} requireManager`
- [x] No `MANAGER` role-enum usage in route arrays in this file

### 4) Navbar Manager Visibility

File: `frontend/src/components/Navbar.tsx`

- [x] Imports and uses `useIsManager()`
- [x] Manager link condition updated to `isManager && user?.role === 'EMPLOYEE'`
- [x] ADR-017 comment updated
- [x] No duplicate manager link shown for ADMIN/ISSUER users

### 5) MobileNav `managerAccess` Flag

File: `frontend/src/components/layout/MobileNav.tsx`

- [x] `managerAccess?: boolean` added to nav link typing
- [x] Role arrays cleaned (`MANAGER` removed)
- [x] Badge Management uses `roles: ['ADMIN', 'ISSUER']` + `managerAccess: true`
- [x] `isManager` derived from `user?.isManager ?? false`
- [x] Filter logic includes manager access path

### 6) BadgeManagementPage Migration

File: `frontend/src/pages/admin/BadgeManagementPage.tsx`

- [x] Props role union excludes `MANAGER`
- [x] New `isManager?: boolean` prop added
- [x] `isManager` resolved via `isManagerProp ?? currentUser?.isManager ?? false`
- [x] Revoke permissions now use `if (isManager) return true`
- [x] Description text updated for manager employees
- [x] Manager-related comment updated
- [x] `isManager` included in relevant callback dependencies

### 7) DashboardPage Update

File: `frontend/src/pages/dashboard/DashboardPage.tsx`

- [x] `case 'MANAGER'` removed
- [x] EMPLOYEE/default branch conditionally renders `ManagerDashboard` by `user.isManager`
- [x] Manager employee flow preserved (manager section + personal dashboard)
- [x] Non-manager employee sees only employee dashboard
- [x] `ManagerDashboard` import remains used
- [x] ADMIN branch behavior unchanged

### 8) `useDashboard` Hook Update

File: `frontend/src/hooks/useDashboard.ts`

- [x] Signature updated to `role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN', isManager?: boolean`
- [x] `MANAGER` case removed
- [x] Default branch returns `{ employee, manager }` only when `isManager` is true
- [x] ADMIN branch unchanged
- [x] `useManagerDashboard()` remains unconditional (valid hooks usage)

### 9) Test Update Scope

File: `frontend/src/stores/authStore.loginViaSSO.test.ts`

- [x] `mockUser` includes `isManager: false`
- [x] Updated test file passes

### 10) Grep / Residual `MANAGER` Validation

- [x] No blocking `MANAGER` role-enum usage found in this commit’s changed files
- [x] Remaining frontend occurrences are domain/test/comment contexts (e.g., manager relationship fields, dashboard naming, historical/comments)

### 11) Intentionally Unchanged Files

- [x] Verified not part of `b76709d..81bcd7b` frontend diff:
  - `lib/adminUsersApi.ts`
  - `hooks/useAdminUsers.ts`
  - `components/admin/CreateUserDialog.tsx`
  - `types/dashboard.ts`
  - `hooks/useDashboard.test.tsx`
  - `components/admin/RoleBadge.test.tsx`

### 12) Story Documentation

File: `docs/sprints/sprint-14/14-7-frontend-remove-manager.md`

- [x] Story status set to `review`
- [x] AC checklist marked complete
- [x] Dev Agent Record present (model/notes/file list)
- [x] Test summary recorded

---

## Verification Runs (This Review)

Executed and passed:
- `npm run test -- src/stores/authStore.loginViaSSO.test.ts --run`
- `npm run test -- src/hooks/useDashboard.test.tsx --run`
- `npm run build`

---

## Follow-up Recommendations (Non-blocking)

1. **ProtectedRoute hardening:** Consider evaluating `requireManager` independently from `requiredRoles` so future routes can use manager-only gating without role arrays.
2. **Query optimization:** Consider adding conditional `enabled` behavior for manager dashboard query paths in a future cleanup to avoid unnecessary non-manager fetch attempts.

---

## Final Decision

**APPROVED WITH FOLLOW-UP**

Story 14.7 is implementation-correct for ADR-017 frontend migration and can proceed; follow-up items are improvements, not blockers.