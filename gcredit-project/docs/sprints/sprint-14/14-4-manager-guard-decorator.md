# Story 14.4: ManagerGuard + @RequireManager() Decorator

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 2h  
**Wave:** 2 — Role Model Refactor (Backend)  
**Source:** ADR-017 §4.5  
**Depends On:** 14.3

---

## Story

**As a** backend developer,  
**I want** a dedicated guard for manager-scoped endpoints,  
**So that** organization-dimension access control is separated from permission-dimension.

## Acceptance Criteria

1. [ ] New file: `src/common/guards/manager.guard.ts` — checks `user.isManager`
2. [ ] New file: `src/common/decorators/require-manager.decorator.ts`
3. [ ] ADMIN bypasses ManagerGuard (consistent with RolesGuard)
4. [ ] Can compose: `@Roles('ISSUER') + @RequireManager()` for dual-dimension checks
5. [ ] ADR-017 code comments in guard file
6. [ ] Unit tests: manager allowed, non-manager denied, ADMIN always allowed
7. [ ] Decorator metadata test: `Reflect.getMetadata()` returns correct value

## Tasks / Subtasks

- [ ] **Task 1: Create ManagerGuard** (AC: #1, #3)
  - [ ] Create `src/common/guards/manager.guard.ts`
  - [ ] Implement `canActivate()`: check `user.isManager === true`
  - [ ] Add ADMIN bypass: if `user.role === 'ADMIN'`, always allow
  - [ ] Add ADR-017 code comment explaining the dual-dimension model
- [ ] **Task 2: Create @RequireManager() decorator** (AC: #2)
  - [ ] Create `src/common/decorators/require-manager.decorator.ts`
  - [ ] Use `SetMetadata('requireManager', true)` pattern
  - [ ] Export from common module barrel file
- [ ] **Task 3: Verify composability** (AC: #4)
  - [ ] Test combining `@Roles('ISSUER')` + `@RequireManager()` on same endpoint
  - [ ] Ensure both guards execute (execution order: RolesGuard → ManagerGuard)
  - [ ] Document composition pattern in code comments
- [ ] **Task 4: Write unit tests** (AC: #5, #6, #7)
  - [ ] Test: user with `isManager: true` → allowed
  - [ ] Test: user with `isManager: false` → denied (403)
  - [ ] Test: ADMIN with `isManager: false` → allowed (bypass)
  - [ ] Test: metadata `Reflect.getMetadata('requireManager', ...)` returns `true`
  - [ ] Test: composition with RolesGuard

## Dev Notes

### Architecture Patterns Used
- NestJS Guard pattern (`CanActivate` interface)
- Custom decorator with `SetMetadata`
- Guard composition pattern (multiple guards on single endpoint)
- ADMIN bypass pattern (consistent with existing RolesGuard)

### Source Tree Components
- `src/common/guards/manager.guard.ts` — NEW
- `src/common/decorators/require-manager.decorator.ts` — NEW
- `src/common/guards/roles.guard.ts` — reference for ADMIN bypass pattern
- `src/common/` barrel exports

### Testing Standards
- Follow existing guard test patterns (roles.guard.spec.ts)
- Test both positive and negative cases
- Test ADMIN bypass explicitly

### References
- ADR-017 §4.5 — ManagerGuard specification
- Existing: `src/common/guards/roles.guard.ts` — pattern reference
- Existing: `src/common/decorators/roles.decorator.ts` — pattern reference

## Dev Agent Record

### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
