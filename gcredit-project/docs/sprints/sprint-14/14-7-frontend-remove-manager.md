# Story 14.7: Frontend Type Updates + Remove MANAGER References

**Status:** done  
**Priority:** HIGH  
**Estimate:** 3h *(reduced from 4h — partial work done in 14.2)*  
**Wave:** 3 — Role Model Refactor (Frontend)  
**Source:** ADR-017 §5  
**Depends On:** 14.3

**Partial Work Note:** Story 14.2 (commit `25c0ae3`) already completed AC #2, #7, #12. Remaining work is AC #1, #3, #4, #5, #6, #8, #9, #10, #11.

---

## Story

**As a** frontend developer,  
**I want** all `'MANAGER'` type references removed and `isManager` available from auth store,  
**So that** UI components use the dual-dimension model correctly.

## Acceptance Criteria

1. [x] `authStore.ts`: User interface adds `isManager: boolean`, new `useIsManager()` selector
2. [x] `adminUsersApi.ts`: `UserRole` type = `'ADMIN' | 'ISSUER' | 'EMPLOYEE'` *(done in 14.2)*
3. [x] `ProtectedRoute.tsx`: `requiredRoles` type removes `'MANAGER'`, adds `requireManager?: boolean` prop
4. [x] `App.tsx`: all `requiredRoles` arrays — remove `'MANAGER'`
5. [x] `Navbar.tsx`: remove `role === 'MANAGER'` conditional block
6. [x] `MobileNav.tsx`: remove `'MANAGER'` from all `navLinks` role arrays
7. [x] `AdminUserManagementPage.tsx`: `ROLES` array removes `'MANAGER'` *(done in 14.2)*
8. [x] `BadgeManagementPage.tsx`: remove `'MANAGER'` from type union, replace `role === 'MANAGER'` checks with `isManager`
9. [x] `DashboardPage.tsx`: remove `case 'MANAGER':` — minimal change (full tabbed view in Sprint 15)
10. [x] Grep verification: zero `'MANAGER'` string matches in frontend `src/` (excluding test historical data)
11. [x] All frontend tests updated and passing (77 suites, 794 tests)
12. [x] Role display: RoleBadge component updated — MANAGER removed from `roleConfig` *(done in 14.2)*

## Tasks / Subtasks

- [ ] **Task 1: Update auth store** (AC: #1)
  - [ ] Add `isManager: boolean` to User interface in `authStore.ts`
  - [ ] Create `useIsManager()` selector hook
  - [ ] Ensure JWT decode extracts `isManager` from token payload
  - [ ] Default to `false` if not present (backward compatibility)
- [ ] **Task 2: Update type definitions** (AC: #2)
  - [ ] `adminUsersApi.ts`: change `UserRole` type to `'ADMIN' | 'ISSUER' | 'EMPLOYEE'`
  - [ ] Search for any other `UserRole` type definitions — update all
- [ ] **Task 3: Update ProtectedRoute** (AC: #3)
  - [ ] Remove `'MANAGER'` from `requiredRoles` type union
  - [ ] Add optional `requireManager?: boolean` prop
  - [ ] Implement manager check using `useIsManager()` selector
- [ ] **Task 4: Update App.tsx routing** (AC: #4)
  - [ ] Remove `'MANAGER'` from all `requiredRoles` arrays
  - [ ] Add `requireManager={true}` where manager access is needed
- [ ] **Task 5: Update navigation components** (AC: #5, #6)
  - [ ] `Navbar.tsx`: remove `role === 'MANAGER'` conditional block
  - [ ] `Navbar.tsx`: replace with `isManager` check where needed
  - [ ] `MobileNav.tsx`: remove `'MANAGER'` from `navLinks` role arrays
  - [ ] `MobileNav.tsx`: add manager-specific nav items using `isManager`
- [ ] **Task 6: Update page components** (AC: #7, #8, #9)
  - [ ] `AdminUserManagementPage.tsx`: remove `'MANAGER'` from `ROLES` array
  - [ ] `BadgeManagementPage.tsx`: replace `role === 'MANAGER'` with `isManager` checks
  - [ ] `DashboardPage.tsx`: remove `case 'MANAGER':` switch case (minimal change)
- [ ] **Task 7: Role display update** (AC: #12)
  - [ ] Implement combined role tags: `[Issuer] [Manager]` where applicable
  - [ ] Manager tag shown based on `isManager` flag, not role value
- [ ] **Task 8: Grep verification** (AC: #10)
  - [ ] Run: `grep -r "'MANAGER'" frontend/src/ --include="*.ts" --include="*.tsx"`
  - [ ] Verify zero matches in production code
  - [ ] Document any intentional exclusions (test fixtures)
- [ ] **Task 9: Update tests** (AC: #11)
  - [ ] Update all frontend tests referencing `'MANAGER'` role
  - [ ] Add tests for `isManager` flag behavior
  - [ ] Test `useIsManager()` selector
  - [ ] Test ProtectedRoute with `requireManager` prop
  - [ ] Run full frontend test suite — all pass

## Dev Notes

### Architecture Patterns Used
- Zustand store selectors (`useIsManager()`)
- JWT claim extraction in frontend
- Component prop extension (`requireManager?: boolean`)
- Dual-dimension rendering: role tags + manager badge

### Source Tree Components
- `src/store/authStore.ts` — User interface + selector
- `src/api/adminUsersApi.ts` — UserRole type
- `src/components/ProtectedRoute.tsx`
- `src/App.tsx` — route definitions
- `src/components/Navbar.tsx`
- `src/components/MobileNav.tsx`
- `src/pages/admin/AdminUserManagementPage.tsx`
- `src/pages/admin/BadgeManagementPage.tsx`
- `src/pages/DashboardPage.tsx`

### Testing Standards
- Test each component that previously checked for MANAGER role
- Verify ProtectedRoute gating works with new `requireManager` prop
- Full regression: all frontend tests pass

### References
- ADR-017 §5 — Frontend changes specification
- Story 14.3 — JWT `isManager` claim (dependency)
- Sprint 15 — Dashboard composite view will build on this

## Dev Agent Record

### Agent Model Used
Claude Opus 4 (via GitHub Copilot)

### Completion Notes
- Removed all `'MANAGER'` role-as-enum references from 8 frontend files
- Added `isManager: boolean` to User interface with `useIsManager()` selector
- ProtectedRoute supports `requireManager` prop for dual-dimension gating
- Navbar/MobileNav use `isManager` flag instead of role checks
- DashboardPage renders ManagerDashboard conditionally via `user.isManager`
- useDashboard hook accepts optional `isManager` parameter
- Grep verification: zero `'MANAGER'` role-enum matches in production code
- All 77 test suites (794 tests) passing; fixed SSO test mock to include `isManager`
- ESLint `--max-warnings=0` clean
- CR follow-up 1: ProtectedRoute evaluates `requireManager` independently from `requiredRoles`
- CR follow-up 2: Dashboard hooks accept `{ enabled }` option; `useDashboard()` disables unnecessary queries by role

### File List
- `frontend/src/stores/authStore.ts` — User interface + `useIsManager()` selector + isManager mapping
- `frontend/src/components/ProtectedRoute.tsx` — `requireManager` prop, dual-dimension access logic
- `frontend/src/App.tsx` — Badge Management route uses `requireManager`
- `frontend/src/components/Navbar.tsx` — isManager-based nav link visibility
- `frontend/src/components/layout/MobileNav.tsx` — `managerAccess` flag + isManager filter
- `frontend/src/pages/admin/BadgeManagementPage.tsx` — isManager prop, revoke logic
- `frontend/src/pages/dashboard/DashboardPage.tsx` — conditional ManagerDashboard rendering
- `frontend/src/hooks/useDashboard.ts` — isManager parameter, removed MANAGER case
- `frontend/src/stores/authStore.loginViaSSO.test.ts` — added isManager to mockUser

## SM Acceptance Record

- **Date:** 2026-02-28
- **SM:** Bob (SM Agent — Claude Opus 4.6)
- **CR Verdict:** APPROVED (follow-ups addressed in commit `bc9b86f`)
- **Commits:** `81bcd7b` (main impl) + `bc9b86f` (CR follow-ups)
- **Test Results:** 77/77 suites, 794 tests passed, 0 ESLint warnings
- **Verification:**
  - [x] All 12 ACs met (3 pre-done from 14.2, 9 completed this story)
  - [x] `authStore.ts`: User has `isManager: boolean`, `useIsManager()` selector, 5 mapping points with `?? false` fallback
  - [x] `ProtectedRoute.tsx`: `requireManager` prop works independently + with `requiredRoles`, ADMIN bypass
  - [x] `App.tsx`: Badge Management route uses `requireManager` instead of `'MANAGER'`
  - [x] `Navbar.tsx`: `isManager && role === 'EMPLOYEE'` — no duplicate links
  - [x] `MobileNav.tsx`: `managerAccess` flag + filter, all `'MANAGER'` removed from role arrays
  - [x] `BadgeManagementPage.tsx`: `isManager` prop replaces all `'MANAGER'` type/conditional usage
  - [x] `DashboardPage.tsx`: `case 'MANAGER':` removed, conditional render via `user.isManager`
  - [x] `useDashboard.ts`: `isManager` param, `enabled` query gating (CR follow-up)
  - [x] Grep verification: zero `'MANAGER'` role-enum matches in production code
  - [x] Minor note: `CreateUserDialog.tsx:136` toast "to MANAGER" — backend auto-upgrade message, not role enum usage. Cosmetic follow-up deferred.
  - [x] Sprint-status updated to `done`

## Retrospective Notes
