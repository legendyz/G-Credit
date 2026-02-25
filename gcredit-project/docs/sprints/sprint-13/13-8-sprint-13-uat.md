# Story 13.8: Sprint 13 Integration Testing + UAT

Status: backlog

## Story

As a **product owner**,
I want end-to-end verification of SSO login and session management,
So that I can be confident the system is pilot-ready for M365 users.

## Context

- Final story in Sprint 13 — depends on all 7 prior stories being complete
- Tests both new SSO/session management features AND full regression
- Target: 0 regressions, all existing 855+ BE and 738+ FE tests pass
- UAT format: formal test scripts per Sprint 12 retro action item

## Acceptance Criteria

1. **SSO Flow E2E:**
   - [ ] New M365 user clicks "Sign in with Microsoft" → redirected to Azure AD → grants consent → JIT provisioned → lands on dashboard with correct role
   - [ ] Returning M365 user logs in via SSO → profile synced → dashboard shows updated info
   - [ ] Non-M365 user logs in via email/password → works as before (no regression)
   - [ ] SSO user with `passwordHash = ''` cannot use password login form
2. **Session Management E2E:**
   - [ ] User idle for 25 min → warning modal appears → "Continue Working" resets timer
   - [ ] User idle for 30 min → auto-logged out → redirect to login with message
   - [ ] Access token expires mid-session → 401 interceptor refreshes → user doesn't notice
   - [ ] Multiple tabs open → token refresh queue prevents race conditions
3. **Regression:**
   - [ ] All 855+ backend tests pass (0 new failures)
   - [ ] All 738+ frontend tests pass (0 new failures)
   - [ ] CRUD operations for badges, templates, skills, users, milestones all functional
   - [ ] Badge issuance → claim → share → verify flow works end-to-end
4. **Edge Cases:**
   - [ ] Azure AD consent revoked → graceful error on next SSO attempt
   - [ ] Token refresh during idle warning → timer still accurate
   - [ ] Rapid login/logout cycles → no state corruption
   - [ ] Azure AD token expiry during callback processing → error message shown

## Tasks / Subtasks

- [ ] Task 1: Automated test verification (AC: #3)
  - [ ] Run full backend test suite: `cd backend && npm test`
  - [ ] Run full frontend test suite: `cd frontend && npm test`
  - [ ] Verify 0 new failures, document any remaining skipped tests (TD-006: 28 expected)
  - [ ] Run lint + build for both projects
- [ ] Task 2: SSO E2E testing (AC: #1)
  - [ ] Configure test Azure AD user accounts (or use dev tenant)
  - [ ] Script: new user SSO login → verify JIT provisioning → check DB for correct fields
  - [ ] Script: returning user SSO login → modify Azure profile → verify sync updates
  - [ ] Script: SSO user tries password login → verify rejected
  - [ ] Script: password user login → verify no regression
- [ ] Task 3: Session management E2E testing (AC: #2)
  - [ ] Script: idle timeout → verify warning at 25 min, logout at 30 min
  - [ ] Script: active user → verify no timeout
  - [ ] Script: token expiry → verify silent refresh
  - [ ] Script: multiple concurrent tabs → verify single refresh
  - [ ] Script: refresh failure → verify logout
- [ ] Task 4: Edge case testing (AC: #4)
  - [ ] Revoke Azure AD consent for app → attempt SSO → verify error handling
  - [ ] Simulate slow network → verify timeout handling
  - [ ] Rapid login/logout/login → verify state consistency
  - [ ] Test with expired Azure AD tokens in callback
- [ ] Task 5: UAT documentation
  - [ ] Create UAT test script with formal steps (per Sprint 12 retro)
  - [ ] Document test results: pass/fail per scenario
  - [ ] Capture screenshots of key flows (SSO login, warning modal, etc.)
  - [ ] Note any issues found → create tickets or fix immediately
- [ ] Task 6: Sprint closeout prep
  - [ ] Update CHANGELOG.md for v1.3.0
  - [ ] Update package.json versions (BE + FE) to 1.3.0
  - [ ] Update sprint-status.yaml: all stories → `done`
  - [ ] Prepare PR description for merge to main
  - [ ] Capture sprint metrics (actual hours, stories completed, test counts)

## Dev Notes

### UAT Approach
- Sprint 12 retro: "Formal UAT test scripts with numbered steps"
- Create Playwright scripts for repeatable E2E if time permits
- Manual testing acceptable for Azure AD flows (requires real Azure tenant interaction)

### Test Environment
- Azure Tenant: `2wjh85.onmicrosoft.com`
- Need at least 2 test users: one new (for JIT), one existing (for mini-sync)
- Local dev environment: `localhost:3000` (frontend) + `localhost:3001` (backend)

### Key References
- Sprint 12 UAT scripts: `_bmad-output/playwright-sessions/` for reference
- Existing test counts: 855 BE, 738 FE (baseline from Sprint 12.5)
- 28 skipped tests = TD-006 (Teams permissions) — expected, not Sprint 13 concern
