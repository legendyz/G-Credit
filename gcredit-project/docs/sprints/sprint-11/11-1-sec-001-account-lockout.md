# Story 11.1: SEC-001 — Account Lockout (Failed Login Counter + Lock)

**Status:** backlog  
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3h  
**Source:** Security Audit  

## Story

As a system administrator,  
I want failed login attempts tracked and accounts temporarily locked after repeated failures,  
So that brute-force attacks are prevented.

## Acceptance Criteria

1. [ ] After 5 consecutive failed login attempts, account is locked for 30 minutes
2. [ ] Locked account returns generic 401 error (no "account locked" disclosure)
3. [ ] Successful login resets the failed attempt counter to 0
4. [ ] After lockout period expires, account auto-unlocks on next login attempt
5. [ ] Admin can see lockout status in user management (optional)
6. [ ] Existing IP-based `@Throttle` on login endpoint remains (defense in depth)
7. [ ] Unit tests cover all lockout scenarios (lock, unlock, reset, edge cases)
8. [ ] All existing auth tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: DB Schema** (AC: #1)
  - [ ] Add `failedLoginAttempts` (Int, default 0) to User model in `schema.prisma`
  - [ ] Add `lockedUntil` (DateTime?, nullable) to User model
  - [ ] Run `npx prisma migrate dev --name add-account-lockout-fields`
  - [ ] Verify migration applies cleanly

- [ ] **Task 2: Auth Service lockout logic** (AC: #1, #2, #3, #4)
  - [ ] In `auth.service.ts` `login()` method (L64-L130):
    - Before password check: verify `lockedUntil` — if set and future, reject with generic 401
    - If `lockedUntil` expired, reset `failedLoginAttempts` to 0 and clear `lockedUntil`
    - On password mismatch: increment `failedLoginAttempts`, if >= 5 set `lockedUntil = now + 30min`
    - On success: reset `failedLoginAttempts = 0`, clear `lockedUntil`
  - [ ] Use constants: `MAX_FAILED_ATTEMPTS = 5`, `LOCKOUT_DURATION_MINUTES = 30`
  - [ ] Return same generic error for locked vs invalid credentials (prevent enumeration)

- [ ] **Task 3: Unit tests** (AC: #7)
  - [ ] Test: 4 failed attempts → still can login
  - [ ] Test: 5 failed attempts → account locked, login returns 401
  - [ ] Test: locked account, wait 30min → can login again
  - [ ] Test: successful login after 3 failures → counter resets
  - [ ] Test: locked account, correct password → still rejected until lockout expires

- [ ] **Task 4: Verification** (AC: #8)
  - [ ] Run full backend test suite (`npm test`)
  - [ ] Run `tsc --noEmit`
  - [ ] Run ESLint

## Dev Notes

### Architecture Patterns
- **Location:** `backend/src/modules/auth/auth.service.ts` (511 lines)
- **Existing throttle:** `@Throttle({ default: { ttl: 60000, limit: 5 } })` on controller (IP-based) — keep as defense-in-depth
- **Login method:** L64-L130, uses `prisma.user.findUnique()` then `bcrypt.compare()`
- **Email enumeration prevention:** Already returns generic "Invalid credentials" — maintain this pattern for lockout

### Coding Standards
- Use `NestJS Logger` (already present in auth module)
- No Chinese characters in code
- PII sanitization in logs (mask email in lockout log messages per SEC-004)

### References
- Lesson 9 (Sprint 1): Email enumeration protection pattern
- OWASP Account Lockout: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
