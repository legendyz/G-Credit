# Story 14.3: JWT Payload — Add `isManager` Claim

**Status:** backlog  
**Priority:** CRITICAL  
**Estimate:** 2h  
**Wave:** 2 — Role Model Refactor (Backend)  
**Source:** ADR-017 §4.1-4.3  
**Depends On:** 14.2

---

## Story

**As a** user with direct reports,  
**I want** my JWT token to include `isManager: true`,  
**So that** the frontend can show me team management features.

## Acceptance Criteria

1. [ ] `JwtPayload` interface: add `isManager: boolean` field
2. [ ] `AuthenticatedUser` interface: add `isManager: boolean` field
3. [ ] `auth.service.ts` — 3 JWT generation points updated:
   - Registration: `isManager: false` (new users)
   - Login: `isManager` computed from `prisma.user.count({ where: { managerId } })`
   - Token refresh: `isManager` recomputed (may change between refreshes)
4. [ ] `jwt.strategy.ts` — `validate()` passes `isManager` through (with `?? false` fallback for old tokens)
5. [ ] Helper method: `computeIsManager(userId)` uses `@@index([managerId])` — O(1) lookup
6. [ ] Backward compatibility: tokens without `isManager` treated as `false`
7. [ ] Unit tests: JWT payload contains `isManager` for user with/without direct reports

## Tasks / Subtasks

- [ ] **Task 1: Update interfaces** (AC: #1, #2)
  - [ ] Add `isManager: boolean` to `JwtPayload` interface
  - [ ] Add `isManager: boolean` to `AuthenticatedUser` interface
  - [ ] Ensure `@nestjs/passport` types are compatible
- [ ] **Task 2: Create `computeIsManager()` helper** (AC: #5)
  - [ ] Implement in `auth.service.ts` or a shared utility
  - [ ] Use `prisma.user.count({ where: { managerId: userId } })` > 0
  - [ ] Verify `@@index([managerId])` exists in schema for O(1) performance
- [ ] **Task 3: Update JWT generation** (AC: #3)
  - [ ] Registration flow: set `isManager: false`
  - [ ] Login flow: call `computeIsManager(userId)` and include in payload
  - [ ] Token refresh flow: recompute `isManager` (may change between refreshes)
- [ ] **Task 4: Update JWT validation** (AC: #4, #6)
  - [ ] `jwt.strategy.ts` `validate()`: extract `isManager` from payload
  - [ ] Apply `?? false` fallback for old tokens without the field
  - [ ] Pass `isManager` to `AuthenticatedUser` object
- [ ] **Task 5: Write unit tests** (AC: #7)
  - [ ] Test: user with 0 direct reports → `isManager: false` in JWT
  - [ ] Test: user with 1+ direct reports → `isManager: true` in JWT
  - [ ] Test: old token without `isManager` → defaults to `false`
  - [ ] Test: token refresh recomputes `isManager`

## Dev Notes

### Architecture Patterns Used
- JWT claim extension pattern
- Prisma count query with indexed field
- Backward-compatible token evolution

### Source Tree Components
- `src/auth/interfaces/jwt-payload.interface.ts`
- `src/auth/interfaces/authenticated-user.interface.ts`
- `src/auth/auth.service.ts` — 3 generation points
- `src/auth/strategies/jwt.strategy.ts` — validate()

### Testing Standards
- Unit test each generation point independently
- Test backward compatibility with mock old tokens
- Verify O(1) query performance with explain plan (optional)

### References
- ADR-017 §4.1 — JwtPayload changes
- ADR-017 §4.2 — AuthenticatedUser changes
- ADR-017 §4.3 — Auth service 3-point update

## Dev Agent Record

### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
