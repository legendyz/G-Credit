# Story 14.7: Frontend Type Updates + Remove MANAGER References

**Status:** backlog  
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

1. [ ] `authStore.ts`: User interface adds `isManager: boolean`, new `useIsManager()` selector
2. [x] `adminUsersApi.ts`: `UserRole` type = `'ADMIN' | 'ISSUER' | 'EMPLOYEE'` *(done in 14.2)*
3. [ ] `ProtectedRoute.tsx`: `requiredRoles` type removes `'MANAGER'`, adds `requireManager?: boolean` prop
4. [ ] `App.tsx`: all `requiredRoles` arrays — remove `'MANAGER'`
5. [ ] `Navbar.tsx`: remove `role === 'MANAGER'` conditional block
6. [ ] `MobileNav.tsx`: remove `'MANAGER'` from all `navLinks` role arrays
7. [x] `AdminUserManagementPage.tsx`: `ROLES` array removes `'MANAGER'` *(done in 14.2)*
8. [ ] `BadgeManagementPage.tsx`: remove `'MANAGER'` from type union, replace `role === 'MANAGER'` checks with `isManager`
9. [ ] `DashboardPage.tsx`: remove `case 'MANAGER':` — minimal change (full tabbed view in Sprint 15)
10. [ ] Grep verification: zero `'MANAGER'` string matches in frontend `src/` (excluding test historical data)
11. [ ] All frontend tests updated and passing
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
### Completion Notes
### File List

## Retrospective Notes
