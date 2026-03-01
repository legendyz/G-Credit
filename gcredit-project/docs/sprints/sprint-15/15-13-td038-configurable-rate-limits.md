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

1. [x] All `@Throttle()` decorators in auth controller are overridable at runtime via `ConfigurableThrottlerGuard` and env vars (decorators retain production defaults as documentation)
2. [x] Environment variables: `THROTTLE_TTL_SECONDS` and `THROTTLE_LIMIT` (clear units, clear purpose) _(NOTE-15.13-001)_
3. [x] Default values match current production settings (e.g., login: 5/60s)
4. [x] `.env.example` updated with new variables and comments
5. [x] E2E test `.env.test` sets generous limits (e.g., `THROTTLE_LIMIT=1000`) _(NOTE-15.13-001)_
6. [x] Existing rate limiting behavior unchanged in production (defaults match current hardcoded values)
7. [x] `THROTTLE_LIMIT` must have a minimum floor (≥5) to prevent accidental disablement _(Arch Security Note)_
8. [x] Unit tests verify ConfigService injection and default fallback
9. [x] Swagger documentation updated for rate-limited endpoints

## Tasks / Subtasks

- [x] **Task 1: Audit current rate limit decorators** (AC: #1)
  - [x] Find all `@Throttle()` decorators in `auth.controller.ts`
  - [x] Document current hardcoded values (e.g., login: 5/60, register: 3/60, reset: 3/60)
  - [x] Count total decorators to migrate
- [x] **Task 2: Create rate limit config** (AC: #2, #3)
  - [x] Add throttle config section to `configuration.ts` or create `throttle.config.ts`
  - [x] Define env vars with sensible defaults matching current values
  - [x] Register in NestJS `ConfigModule`
- [x] **Task 3: Migrate decorators** (AC: #1, #6)
  - [x] Replace hardcoded `@Throttle({ default: { limit: 5, ttl: 60000 } })` with dynamic values
  - [x] Use custom `ThrottleConfigGuard` or `APP_GUARD` approach with per-route config
  - [x] Ensure defaults match current behavior exactly
- [x] **Task 4: Update .env files** (AC: #4, #5)
  - [x] Add new env vars to `.env.example` with comments
  - [x] Add relaxed test values to `.env.test` (if exists)
  - [x] Document override for E2E test setup
- [x] **Task 5: Tests** (AC: #7)
  - [x] Unit test: ConfigService provides correct values
  - [x] Unit test: Default fallback when env var not set
  - [x] Verify E2E tests can login 6+ users without hitting rate limit

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

## Review Follow-ups (AI)

- [x] **HIGH — AC #1 wording and implementation mismatch**
  - Story AC #1 currently states all @Throttle() decorators in auth controller use ConfigService values instead of hardcoded numbers.
  - Current implementation uses ConfigurableThrottlerGuard runtime override while decorators remain hardcoded defaults.
  - Required resolution (choose one):
    - Update AC #1 wording to match guard-override architecture, or
    - Refactor implementation so decorators directly consume config values.
  - Evidence: backend/src/modules/auth/auth.controller.ts (decorators remain hardcoded), backend/src/modules/auth/config/configurable-throttler.guard.ts (runtime override path)
  - **Resolution:** AC #1 wording updated to reflect guard-override architecture. Decorators intentionally retained as production defaults and documentation.

- [x] **HIGH — AC #9 marked complete without Swagger evidence**
  - Story AC #9 says Swagger documentation is updated for rate-limited endpoints.
  - Auth controller currently has no NestJS Swagger annotations for 429/rate-limit responses.
  - Required resolution:
    - Add explicit Swagger response documentation for rate-limited endpoints (429), or
    - Update AC #9 status and notes if out-of-scope.
  - Evidence: backend/src/modules/auth/auth.controller.ts (no @nestjs/swagger response annotations)
  - **Resolution:** Added `@ApiTags('Auth')` and `@ApiResponse({ status: 429 })` to all 8 rate-limited endpoints in auth.controller.ts.

- [x] **MEDIUM — ThrottleConfigService lacks invalid-number guardrails**
  - ThrottleConfigService parses env values but does not explicitly handle NaN for malformed values.
  - Guard path has numeric checks; service path should match defensive behavior for consistency.
  - Required resolution:
    - Add NaN/invalid-value handling for THROTTLE_TTL_SECONDS and THROTTLE_LIMIT in service.
  - Evidence: backend/src/modules/auth/config/throttle.config.ts
  - **Resolution:** Added `isNaN()`, zero, negative, and empty-string guardrails with warning logs. 6 new unit tests covering all invalid-value paths.

- [x] **LOW — Test env naming inconsistency**
  - test/setup.ts uses THROTTLE_TTL while story and .env.test standardize THROTTLE_TTL_SECONDS.
  - Required resolution:
    - Align test setup variable naming with THROTTLE_TTL_SECONDS to reduce confusion.
  - Evidence: backend/test/setup.ts, backend/.env.test
  - **Resolution:** Changed `THROTTLE_TTL='60000'` → `THROTTLE_TTL_SECONDS='60'` in test/setup.ts (seconds, matching .env.test convention).

### Review Summary (2026-03-01)

- Targeted unit tests pass for Story 15.13 scope: throttle.config.spec.ts and configurable-throttler.guard.spec.ts (25 tests).
- All 4 review follow-up items resolved (2 HIGH, 1 MEDIUM, 1 LOW).
- 6 new NaN/invalid-value guardrail tests added to throttle.config.spec.ts (total: 19 config tests).
- 8 Swagger `@ApiResponse({ status: 429 })` annotations added to auth.controller.ts.

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
**Approach:** Created `ConfigurableThrottlerGuard` extending NestJS `ThrottlerGuard`, overriding `handleRequest()` to substitute `limit`/`ttl` from environment variables when set. `@Throttle()` decorators remain as production defaults (unchanged behavior). In test envs, `THROTTLE_TTL_SECONDS` and `THROTTLE_LIMIT` in `.env.test` override all per-endpoint limits via the guard's `onModuleInit()`.

**Key design decisions:**
- Guard reads `process.env` in `onModuleInit()` (after ConfigModule populates env) rather than injecting ConfigService (avoids complex DI chain inheritance from ThrottlerGuard)
- `ThrottleConfigService` provides a separate injectable service for programmatic access
- `THROTTLE_LIMIT` floor ≥5 enforced in both guard and service (AC #7)
- No changes to existing `@Throttle()` decorators — they serve as documentation and production defaults

**Test results:** 985 tests passed (54 suites), 0 failures. 25 new tests for throttle config + guard.

### File List
| File | Action | Purpose |
|------|--------|---------|
| `backend/src/modules/auth/config/throttle.config.ts` | NEW | ThrottleConfigService — env var parsing, floor enforcement |
| `backend/src/modules/auth/config/throttle.config.spec.ts` | NEW | 13 unit tests for config service |
| `backend/src/modules/auth/config/configurable-throttler.guard.ts` | NEW | ConfigurableThrottlerGuard — extends ThrottlerGuard with env overrides |
| `backend/src/modules/auth/config/configurable-throttler.guard.spec.ts` | NEW | 12 unit tests for guard override logic + onModuleInit parsing |
| `backend/src/app.module.ts` | MODIFIED | Replaced ThrottlerGuard with ConfigurableThrottlerGuard as APP_GUARD |
| `backend/src/modules/auth/auth.module.ts` | MODIFIED | Added ThrottleConfigService to providers + exports |
| `backend/.env.example` | MODIFIED | Added THROTTLE_TTL_SECONDS + THROTTLE_LIMIT with documentation |
| `backend/.env.test` | MODIFIED | Set THROTTLE_TTL_SECONDS=60, THROTTLE_LIMIT=1000 for E2E tests |
