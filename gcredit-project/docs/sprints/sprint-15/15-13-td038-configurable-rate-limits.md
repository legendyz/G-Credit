# Story 15.13: Configurable Auth Rate Limits (TD-038)

**Status:** in-progress  
**Started:** 2026-03-01  
**Priority:** MEDIUM  
**Estimate:** 3h  
**Wave:** 1 — Backend Prep  
**Source:** TD-038 (Sprint 14 created), Sprint 14 Retrospective Action Item #1  
**Dependencies:** None

---

## Story

**As a** developer running E2E tests,  
**I want** auth endpoint rate limits to be configurable via environment variables,  
**So that** test environments can use relaxed limits while production maintains strict security.

## Acceptance Criteria

1. [ ] All `@Throttle()` decorators in auth controller use `ConfigService` values instead of hardcoded numbers
2. [ ] Environment variables: `THROTTLE_TTL_SECONDS` and `THROTTLE_LIMIT` (clear units, clear purpose) _(NOTE-15.13-001)_
3. [ ] Default values match current production settings (e.g., login: 5/60s)
4. [ ] `.env.example` updated with new variables and comments
5. [ ] E2E test `.env.test` sets generous limits (e.g., `THROTTLE_LIMIT=1000`) _(NOTE-15.13-001)_
6. [ ] Existing rate limiting behavior unchanged in production (defaults match current hardcoded values)
7. [ ] `THROTTLE_LIMIT` must have a minimum floor (≥5) to prevent accidental disablement _(Arch Security Note)_
8. [ ] Unit tests verify ConfigService injection and default fallback
9. [ ] Swagger documentation updated for rate-limited endpoints

## Tasks / Subtasks

- [ ] **Task 1: Audit current rate limit decorators** (AC: #1)
  - [ ] Find all `@Throttle()` decorators in `auth.controller.ts`
  - [ ] Document current hardcoded values (e.g., login: 5/60, register: 3/60, reset: 3/60)
  - [ ] Count total decorators to migrate
- [ ] **Task 2: Create rate limit config** (AC: #2, #3)
  - [ ] Add throttle config section to `configuration.ts` or create `throttle.config.ts`
  - [ ] Define env vars with sensible defaults matching current values
  - [ ] Register in NestJS `ConfigModule`
- [ ] **Task 3: Migrate decorators** (AC: #1, #6)
  - [ ] Replace hardcoded `@Throttle({ default: { limit: 5, ttl: 60000 } })` with dynamic values
  - [ ] Use custom `ThrottleConfigGuard` or `APP_GUARD` approach with per-route config
  - [ ] Ensure defaults match current behavior exactly
- [ ] **Task 4: Update .env files** (AC: #4, #5)
  - [ ] Add new env vars to `.env.example` with comments
  - [ ] Add relaxed test values to `.env.test` (if exists)
  - [ ] Document override for E2E test setup
- [ ] **Task 5: Tests** (AC: #7)
  - [ ] Unit test: ConfigService provides correct values
  - [ ] Unit test: Default fallback when env var not set
  - [ ] Verify E2E tests can login 6+ users without hitting rate limit

## Dev Notes

### Architecture Patterns Used
- NestJS `ConfigService` for runtime configuration
- Global `ThrottlerModule` with per-route overrides
- Environment variable naming: `THROTTLE_{SCOPE}_{ENDPOINT}_{PARAM}`

### Current Hardcoded Values (from Sprint 14 discovery)
```typescript
// auth.controller.ts — 8 @Throttle() decorators
@Throttle({ default: { limit: 5, ttl: 60000 } })  // login
@Throttle({ default: { limit: 3, ttl: 60000 } })  // register
@Throttle({ default: { limit: 3, ttl: 60000 } })  // request-reset
@Throttle({ default: { limit: 3, ttl: 60000 } })  // reset-password
// ... etc
```

### Source Tree Components
- `backend/src/modules/auth/auth.controller.ts` (modified — decorators)
- `backend/src/config/throttle.config.ts` (new — or add to existing config)
- `backend/.env.example` (updated)
- `backend/.env.test` (updated with relaxed limits)
- `backend/src/modules/auth/auth.controller.spec.ts` (test updates)

### Review Findings (2026-03-01)
- **NOTE-15.13-001:** Env var naming simplified to `THROTTLE_TTL_SECONDS` + `THROTTLE_LIMIT` (clear units)
- **Arch Security:** `THROTTLE_LIMIT` must have min floor (≥5) to prevent accidental disable
- **Arch Security:** Ensure relaxed `.env.test` values never leak to production `.env`

### Testing Standards
- Verify default behavior unchanged (regression safe)
- Verify E2E can override limits
- No `.skip()` for rate-limit-related tests

### References
- Sprint 14 Story 14.8: Rate limit discovery (6th user needed JwtService.sign workaround)
- Sprint 14 Retrospective: Action Item #1
- Lesson 51: Rate limiter settings need E2E testing awareness
- [ARCHITECTURE-REVIEW-SPRINT-15.md](ARCHITECTURE-REVIEW-SPRINT-15.md) — Story 15.13 section

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
