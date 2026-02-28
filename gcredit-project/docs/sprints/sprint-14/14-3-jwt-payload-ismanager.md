# Story 14.3: JWT Payload — Add `isManager` Claim

**Status:** done  
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

1. [x] `JwtPayload` interface: add `isManager: boolean` field
2. [x] `AuthenticatedUser` interface: add `isManager: boolean` field
3. [x] `auth.service.ts` — 3 JWT generation points updated:
   - Registration: `isManager: false` (new users)
   - Login: `isManager` computed from `prisma.user.count({ where: { managerId } })`
   - Token refresh: `isManager` recomputed (may change between refreshes)
4. [x] `jwt.strategy.ts` — `validate()` passes `isManager` through (with `?? false` fallback for old tokens)
5. [x] Helper method: `computeIsManager(userId)` uses `@@index([managerId])` — O(1) lookup
6. [x] Backward compatibility: tokens without `isManager` treated as `false`
7. [x] Unit tests: JWT payload contains `isManager` for user with/without direct reports

## Tasks / Subtasks

- [x] **Task 1: Update interfaces** (AC: #1, #2)
  - [x] Add `isManager: boolean` to `JwtPayload` interface
  - [x] Add `isManager: boolean` to `AuthenticatedUser` interface
  - [x] Ensure `@nestjs/passport` types are compatible
- [x] **Task 2: Create `computeIsManager()` helper** (AC: #5)
  - [x] Implement in `auth.service.ts` or a shared utility
  - [x] Use `prisma.user.count({ where: { managerId: userId } })` > 0
  - [x] Verify `@@index([managerId])` exists in schema for O(1) performance
- [x] **Task 3: Update JWT generation** (AC: #3)
  - [x] Registration flow: set `isManager: false`
  - [x] Login flow: call `computeIsManager(userId)` and include in payload
  - [x] Token refresh flow: recompute `isManager` (may change between refreshes)
  - [x] SSO Login flow: call `computeIsManager(userId)` (4th generation point)
- [x] **Task 4: Update JWT validation** (AC: #4, #6)
  - [x] `jwt.strategy.ts` `validate()`: extract `isManager` from payload
  - [x] Apply `?? false` fallback for old tokens without the field
  - [x] Pass `isManager` to `AuthenticatedUser` object
- [x] **Task 5: Write unit tests** (AC: #7)
  - [x] Test: user with 0 direct reports → `isManager: false` in JWT
  - [x] Test: user with 1+ direct reports → `isManager: true` in JWT
  - [x] Test: old token without `isManager` → defaults to `false`
  - [x] Test: token refresh recomputes `isManager`
  - [x] Fix downstream TypeScript errors in mock AuthenticatedUser objects (11 locations)

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
Claude Opus 4.6 (GitHub Copilot)

### Implementation Plan
1. Added `isManager: boolean` to `JwtPayload` and `AuthenticatedUser` interfaces
2. Created `computeIsManager()` private helper in AuthService — uses `prisma.user.count({ where: { managerId } })` with existing `@@index([managerId])`
3. Updated 4 JWT generation points: registration (hardcoded false), login, SSO login, token refresh (all compute from DB)
4. Updated `jwt.strategy.ts` `validate()` with `?? false` fallback for backward compat
5. Fixed 11 downstream TypeScript errors in mock `AuthenticatedUser` objects across 4 spec files
6. Added `user.count` mock to `auth.service.spec.ts` and `auth.service.jit.spec.ts`

### Completion Notes
- All 7 ACs satisfied
- 4 new unit tests added (isManager true/false/refresh/registration)
- 49/49 backend test suites pass, 923 tests total (up from 916)
- ESLint: 0 warnings
- TypeScript: 0 errors
- Note: Dev prompt listed 3 JWT generation points but there are actually 4 (SSO login is the 4th) — all 4 updated

### File List
- `backend/src/modules/auth/strategies/jwt.strategy.ts` — JwtPayload interface + validate() isManager
- `backend/src/common/interfaces/request-with-user.interface.ts` — AuthenticatedUser + isManager
- `backend/src/modules/auth/auth.service.ts` — computeIsManager() + 4 JWT generation points
- `backend/src/modules/auth/auth.service.spec.ts` — user.count mock + 4 isManager tests
- `backend/src/modules/auth/__tests__/auth.service.jit.spec.ts` — user.count mock
- `backend/src/admin-users/admin-users.controller.spec.ts` — isManager in mock
- `backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts` — isManager in mock
- `backend/src/badge-sharing/controllers/teams-sharing.controller.spec.ts` — isManager in 2 mocks
- `backend/src/dashboard/dashboard.controller.spec.ts` — isManager in 7 mocks

### Change Log
- 2026-02-28: Story 14.3 implementation complete — JWT isManager claim (ADR-017 §4.1-4.3)

## Retrospective Notes

### SM Acceptance — 2026-02-28
- **Commit:** `d0c2dc5`
- **CR Verdict:** APPROVED (all follow-ups resolved)
- **Backend:** 50/50 suites, 927 tests passed
- **Frontend:** 77/77 suites, 794 tests passed
- **Verified:** 4 JWT generation points (register, login, SSO, refresh), `computeIsManager()` O(1) helper, `?? false` backward compat, 11 downstream mocks fixed
- **Note:** Story listed 3 JWT generation points but dev correctly identified and updated all 4 (SSO login was the 4th)
