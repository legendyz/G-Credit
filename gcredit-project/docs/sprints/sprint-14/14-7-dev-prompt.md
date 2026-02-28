# Dev Prompt: Story 14.7 — Frontend Type Updates + Remove MANAGER References

**Story File:** `docs/sprints/sprint-14/14-7-frontend-remove-manager.md`  
**Branch:** `sprint-14/role-model-refactor`  
**Priority:** HIGH | **Estimate:** 3h | **Wave:** 3 (Role Model Refactor — Frontend)  
**Depends On:** 14.3 ✅ (JWT `isManager` claim — commit `d0c2dc5`), 14.4 ✅ (ManagerGuard — commit `6d820ac`)

---

## Objective

Remove all `'MANAGER'` role-as-enum references from the frontend codebase. The MANAGER role no longer exists in the backend (ADR-017, removed in 14.2). Manager identity is now a **boolean `isManager` claim** in the JWT (added in 14.3). The frontend needs to:

1. Add `isManager` to the auth store User interface
2. Remove `'MANAGER'` from all type unions and role arrays
3. Replace `role === 'MANAGER'` conditionals with `isManager` checks
4. Ensure navigation and routing work for manager-employees

---

## ⚠️ CRITICAL WARNINGS

1. **`'MANAGER'` as a role value is DEAD.** The backend only returns `ADMIN | ISSUER | EMPLOYEE` in `user.role`. The JWT now carries `isManager: boolean` separately.
2. **DO NOT delete `ManagerDashboard`, `useManagerDashboard()`, `managerId` fields, or `updateUserManager()`.** These are legitimate domain concepts — the _dashboard_ for manager users, the manager _relationship_ assignment. They are NOT the removed MANAGER role enum.
3. **The `useDashboard()` hook needs a design change.** It currently takes `role` as parameter and has a `case 'MANAGER':` branch. After this story, a manager-employee has `role === 'EMPLOYEE'` + `isManager === true`. The hook must be updated to handle this dual-dimension model.
4. **DO NOT run `npx prisma format`** — Lesson 22.
5. **Pre-push hook enforces `--max-warnings=0`.** All ESLint warnings must be zero. Use `git push --no-verify` ONLY if necessary during development, but final push must pass.

---

## Scope — Exact File Changes

### Previously Done (DO NOT RE-DO)

These were completed in Story 14.2 (commit `25c0ae3`):
- ✅ `adminUsersApi.ts` — `UserRole = 'ADMIN' | 'ISSUER' | 'EMPLOYEE'` (AC #2)
- ✅ `AdminUserManagementPage.tsx` — `ROLES` array already excludes `'MANAGER'` (AC #7)
- ✅ `RoleBadge` — `roleConfig` already excludes `'MANAGER'` (AC #12)

### Files to Change

| # | File | Change | AC |
|---|------|--------|-----|
| 1 | `src/stores/authStore.ts` | Add `isManager` to User, create `useIsManager()` selector, update role type | #1 |
| 2 | `src/components/ProtectedRoute.tsx` | Remove `'MANAGER'` from type, add `requireManager?: boolean` prop | #3 |
| 3 | `src/App.tsx` | Remove `'MANAGER'` from `requiredRoles`, add `requireManager` where needed | #4 |
| 4 | `src/components/Navbar.tsx` | Replace `role === 'MANAGER'` with `isManager` check | #5 |
| 5 | `src/components/layout/MobileNav.tsx` | Remove `'MANAGER'` from all role arrays | #6 |
| 6 | `src/pages/admin/BadgeManagementPage.tsx` | Replace `'MANAGER'` type + conditionals with `isManager` | #8 |
| 7 | `src/pages/dashboard/DashboardPage.tsx` | Remove `case 'MANAGER':` — use `isManager` for manager dashboard rendering | #9 |
| 8 | `src/hooks/useDashboard.ts` | Remove `'MANAGER'` from type, update `useDashboard()` to accept `isManager` | (support) |
| 9 | Tests — update affected test files | #11 |

---

## Target Files — Detailed Instructions

### 1. `src/stores/authStore.ts` (AC #1)

**Current (line 21):**
```typescript
role: 'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE';
```

**Change to:**
```typescript
role: 'ADMIN' | 'ISSUER' | 'EMPLOYEE';
isManager: boolean;
```

**Add selector hook** (after the store definition):
```typescript
/**
 * Selector: is current user a manager? (ADR-017 dual-dimension)
 * Reads isManager from JWT claim, not from role.
 */
export function useIsManager(): boolean {
  return useAuthStore((state) => state.user?.isManager ?? false);
}
```

**JWT decode update:** Wherever the JWT payload is decoded and stored as the User object, ensure `isManager` is extracted. Look for where `user` is set in login/SSO/validateSession responses — the backend already includes `isManager` in the response (Story 14.3). Default to `false` if absent (backward compatibility with old tokens).

Search the file for places that set `user:` in the store state — likely in `login()`, `loginViaSSO()`, `validateSession()`, and `register()`. Ensure the response mapping includes `isManager: response.user?.isManager ?? false`.

### 2. `src/components/ProtectedRoute.tsx` (AC #3)

**Current (line 15):**
```tsx
requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE'>;
```

**Change to:**
```tsx
requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'EMPLOYEE'>;
requireManager?: boolean;
```

**Add manager check logic** after the role check block (~line 48):
```tsx
// Check manager authorization if required (ADR-017 dual-dimension)
if (requireManager && user) {
  const isManager = user.isManager ?? false;
  const isAdmin = user.role === 'ADMIN';
  if (!isManager && !isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }
}
```

Note: ADMIN bypasses manager check — consistent with backend `ManagerGuard`.

### 3. `src/App.tsx` (AC #4)

**Line 112 — Badge Management route:**

Current:
```tsx
<ProtectedRoute requiredRoles={['ADMIN', 'ISSUER', 'MANAGER']}>
```

Change to:
```tsx
<ProtectedRoute requiredRoles={['ADMIN', 'ISSUER', 'EMPLOYEE']} requireManager>
```

Wait — this needs careful thinking. The Badge Management page currently allows ADMIN, ISSUER, and MANAGER. In the new model:
- ADMIN: always access (no change)
- ISSUER: always access (no change)
- MANAGER (now EMPLOYEE with `isManager: true`): needs access

The correct approach: Allow `['ADMIN', 'ISSUER', 'EMPLOYEE']` for role check, but note that not ALL employees should see this page — only manager-employees. However, `ProtectedRoute` evaluates `requiredRoles` as OR logic. If we add `'EMPLOYEE'`, all employees get in.

**Better approach:** Keep `requiredRoles={['ADMIN', 'ISSUER']}` and DON'T add `'EMPLOYEE'`. Instead, handle the manager-employee case in the `BadgeManagementPage` itself, OR add `requireManager` as an alternative access path. The cleanest design:

```tsx
<ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']} requireManager>
```

Where `requireManager` means: "also allow users with `isManager: true`, regardless of role check". The ProtectedRoute logic should be:

```tsx
// Role + Manager check (ADR-017 dual-dimension)
if (requiredRoles && requiredRoles.length > 0 && user) {
  const hasRole = requiredRoles.includes(user.role);
  const isManager = requireManager && (user.isManager ?? false);
  const isAdmin = user.role === 'ADMIN';
  if (!hasRole && !isManager && !isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }
}
```

This means:
- ADMIN → `hasRole = true` → pass
- ISSUER → `hasRole = true` → pass
- EMPLOYEE with `isManager: true` → `hasRole = false`, `isManager = true` → pass
- EMPLOYEE with `isManager: false` → `hasRole = false`, `isManager = false` → denied

### 4. `src/components/Navbar.tsx` (AC #5)

**Current (lines 153-164):**
```tsx
{/* Manager Links */}
{user?.role === 'MANAGER' && (
  <li>
    <Link to="/admin/badges" ...>Badges</Link>
  </li>
)}
```

**Change to:**
```tsx
{/* Manager Links — ADR-017: check isManager from JWT, not role */}
{user?.isManager && user?.role !== 'ADMIN' && user?.role !== 'ISSUER' && (
  <li>
    <Link to="/admin/badges" ...>Badges</Link>
  </li>
)}
```

Why `&& role !== 'ADMIN' && role !== 'ISSUER'`? Because ADMIN and ISSUER already see Badges via their own nav section above. This avoids duplicate nav items. If the existing code already shows Badges for ADMIN/ISSUER, the manager link should only show for EMPLOYEE managers.

Alternatively, use the `useIsManager()` selector:
```tsx
// At top of component:
import { useIsManager } from '../stores/authStore';
// In component body:
const isManager = useIsManager();

// In JSX:
{isManager && user?.role === 'EMPLOYEE' && (
  <li><Link to="/admin/badges" ...>Badges</Link></li>
)}
```

### 5. `src/components/layout/MobileNav.tsx` (AC #6)

**Current (lines 101-111):**
```tsx
const navLinks = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  { to: '/wallet', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  { to: '/admin/templates', label: 'Badge Templates', roles: ['ADMIN', 'ISSUER'] },
  { to: '/admin/badges', label: 'Badge Management', roles: ['ADMIN', 'ISSUER', 'MANAGER'] },
  ...
  { to: '/profile', label: 'Profile', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
];
```

**Change to:**
```tsx
const navLinks = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'ISSUER', 'EMPLOYEE'] },
  { to: '/wallet', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'EMPLOYEE'] },
  { to: '/admin/templates', label: 'Badge Templates', roles: ['ADMIN', 'ISSUER'] },
  { to: '/admin/badges', label: 'Badge Management', roles: ['ADMIN', 'ISSUER'], managerAccess: true },
  ...
  { to: '/profile', label: 'Profile', roles: ['ADMIN', 'ISSUER', 'EMPLOYEE'] },
];
```

For items that were `['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE']`, simply change to `['ADMIN', 'ISSUER', 'EMPLOYEE']` — that covers all roles.

For Badge Management (was `['ADMIN', 'ISSUER', 'MANAGER']`), add `managerAccess: true` flag and update the filter:

```tsx
const isManager = user?.isManager ?? false;

const accessibleLinks = navLinks.filter((link) =>
  user?.role && (
    link.roles.includes(user.role) ||
    (link.managerAccess && isManager)
  )
);
```

Update the `navLinks` type to include `managerAccess?: boolean`.

### 6. `src/pages/admin/BadgeManagementPage.tsx` (AC #8)

**Line 44 — Props interface:**
```tsx
// Current:
userRole?: 'ADMIN' | 'ISSUER' | 'MANAGER';
// Change to:
userRole?: 'ADMIN' | 'ISSUER' | 'EMPLOYEE';
isManager?: boolean;
```

**Line 161 — Role resolution:**
```tsx
// Current:
const userRole = userRoleProp || (currentUser?.role as 'ADMIN' | 'ISSUER' | 'MANAGER') || 'ADMIN';
// Change to:
const userRole = userRoleProp || (currentUser?.role as 'ADMIN' | 'ISSUER' | 'EMPLOYEE') || 'ADMIN';
const isManager = isManagerProp ?? currentUser?.isManager ?? false;
```

**Line 365 — Revoke permission check:**
```tsx
// Current:
if (userRole === 'MANAGER') return true;
// Change to:
if (isManager) return true;
```

**Line 433 — Description text:**
```tsx
// Current:
: userRole === 'MANAGER'
  ? 'Manage badges for your department'
// Change to:
: isManager
  ? 'Manage badges for your department'
```

**Line 213 — Comment update:**
```tsx
// Current:
// Fetch badges - Admin sees all, Issuer sees own, Manager sees department badges
// Change to:
// Fetch badges - Admin sees all, Issuer sees own, manager employees see department badges
```

### 7. `src/pages/dashboard/DashboardPage.tsx` (AC #9)

**Current (lines 54-66) — `case 'MANAGER':`:**
```tsx
case 'MANAGER':
  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <ManagerDashboard />
        <div className="border-t pt-8">
          <h2 ...>Your Personal Dashboard</h2>
          <EmployeeDashboard />
        </div>
      </div>
    </ErrorBoundary>
  );
```

**Remove the `case 'MANAGER':` entirely.** Replace with `isManager` check in the EMPLOYEE case:

```tsx
case 'EMPLOYEE':
default:
  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {user.isManager && (
          <>
            <ManagerDashboard />
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold mb-4 px-4 md:px-6 lg:px-8">
                Your Personal Dashboard
              </h2>
            </div>
          </>
        )}
        <EmployeeDashboard />
      </div>
    </ErrorBoundary>
  );
```

Note: ADMIN case stays as-is (admin sees everything). The ISSUER case stays as-is. Only `EMPLOYEE/default` gains the conditional manager dashboard.

### 8. `src/hooks/useDashboard.ts` (Support)

**Line 83 — Type parameter:**
```tsx
// Current:
export function useDashboard(role: 'EMPLOYEE' | 'ISSUER' | 'MANAGER' | 'ADMIN') {
// Change to:
export function useDashboard(role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN', isManager?: boolean) {
```

**Lines 97-101 — Remove `case 'MANAGER':`:**
```tsx
// REMOVE:
case 'MANAGER':
  return {
    employee: employeeQuery,
    manager: managerQuery,
  };
```

**Move manager data into the relevant cases.** ADMIN already includes `manager: managerQuery`. For EMPLOYEE with `isManager`:

```tsx
case 'EMPLOYEE':
default:
  if (isManager) {
    return {
      employee: employeeQuery,
      manager: managerQuery,
    };
  }
  return {
    employee: employeeQuery,
  };
```

NOTE: The `useManagerDashboard()` hook unconditionally calls the API. Since hooks can't be called conditionally in React, the manager query will fire for all users. This is acceptable — the backend returns 403 for non-managers, and React Query will handle the error gracefully. If you want to optimize, you can use `enabled: isManager` in the hook, but that's a Sprint 15 optimization.

---

## Files NOT to Change (Verify)

These contain `Manager` as domain term (person, relationship) — NOT the removed role enum:

| File | Why NOT change |
|------|---------------|
| `lib/adminUsersApi.ts` | `managerId`, `managerName`, `UpdateManagerRequest` — DB field names for manager _relationship_ |
| `hooks/useAdminUsers.ts` | `useUpdateUserManager()` — assigns manager relationship |
| `components/admin/CreateUserDialog.tsx` | Manager dropdown, `managerId` state — relationship assignment |
| `types/dashboard.ts` | `ManagerDashboard` interface — dashboard _for_ managers |
| `hooks/useDashboard.ts` (`useManagerDashboard`) | API hook for `/dashboard/manager` endpoint |
| `hooks/useDashboard.test.tsx` | Tests for `useManagerDashboard()` |
| `utils/searchFilters.test.ts:66` | Test data: `lastName: 'Manager'` (person's name) |
| `components/.../NewEmployeeEmptyState.tsx` | UI copy: "Check with your manager" |
| `pages/AdminAnalyticsPage.tsx:269` | Comment: "Admin/Manager only" |
| `types/analytics.ts:18` | Comment: "MANAGER removed from enum" |
| `components/admin/RoleBadge.test.tsx` | Fallback test with `@ts-expect-error` (intentional) |

---

## Test Updates

### Existing test files to check for `'MANAGER'` role references:

1. **`hooks/useDashboard.test.tsx`** — Tests for `useManagerDashboard()` are fine (domain term). But if there's a test for `useDashboard('MANAGER')`, remove/update it.
2. **`components/layout/MobileNav.test.tsx`** — Check for any `'MANAGER'` in role arrays in test mocks.
3. **`pages/admin/BadgeManagementPage.test.tsx`** — Check for `'MANAGER'` in props or role mocks.

### New tests to add:

1. **`authStore` test:** Test that `useIsManager()` returns correct value.
2. **`ProtectedRoute` test (if file exists):** Test `requireManager` prop gating.

---

## Grep Verification (AC #10)

After all changes, run:
```powershell
Get-ChildItem -Recurse gcredit-project/frontend/src -Include *.ts,*.tsx | Select-String "'MANAGER'" | Where-Object { $_.Line -notmatch '(removed|@ts-expect-error|lastName.*Manager|with your manager|Admin/Manager)' }
```

Expected: **zero matches**. The only remaining `MANAGER` strings should be:
- Comments saying "MANAGER removed"
- `@ts-expect-error` test for RoleBadge fallback
- Natural language: "your manager", person name "Manager"
- Domain terms: `ManagerDashboard`, `managerId`, `managerName`, `useManagerDashboard`

---

## Test Execution

```bash
# Frontend tests
cd gcredit-project/frontend
npm test

# Target: all suites pass, 0 ESLint warnings
```

Previous baseline: 77/77 suites, 794 tests.

---

## Commit Convention

```
feat: remove MANAGER role enum from frontend, add isManager support (ADR-017 §5) [14.7]
```

Single commit preferred. If the scope is large, acceptable to split into:
1. `feat: add isManager to auth store + ProtectedRoute (ADR-017 §5) [14.7]`
2. `refactor: remove 'MANAGER' from all frontend components [14.7]`

---

## Completion Checklist

Before marking story as `review`:

- [ ] `authStore.ts` User type has `isManager: boolean`, `useIsManager()` exported
- [ ] `ProtectedRoute.tsx` accepts `requireManager` prop, no `'MANAGER'` in type
- [ ] `App.tsx` no `'MANAGER'` in any `requiredRoles` array
- [ ] `Navbar.tsx` uses `isManager` instead of `role === 'MANAGER'`
- [ ] `MobileNav.tsx` no `'MANAGER'` in any role array
- [ ] `BadgeManagementPage.tsx` uses `isManager` for manager logic
- [ ] `DashboardPage.tsx` no `case 'MANAGER':` — uses `isManager` conditionally
- [ ] `useDashboard.ts` no `'MANAGER'` in type union or switch
- [ ] Grep verification: zero `'MANAGER'` role-as-enum matches
- [ ] All frontend tests pass
- [ ] 0 ESLint warnings
- [ ] Story file updated: ACs checked, Dev Agent Record filled
- [ ] `sprint-status.yaml` updated to `review`
