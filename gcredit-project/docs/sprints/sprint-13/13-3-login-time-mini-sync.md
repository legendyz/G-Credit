# Story 13.3: Login-Time Mini-Sync for Returning SSO Users

Status: backlog

## Story

As a **returning M365 user**,
I want my profile, role, and manager to update automatically each time I log in via SSO,
So that organizational changes (department move, promotion, new manager) are reflected in G-Credit.

## Context

- ADR-011 DEC-011-10/11: "On every login/token-refresh, perform single-user sync."
- Reuses `M365SyncService.syncSingleUser()` — same function used by JIT and manual sync
- SSO callback (Story 13.1) invokes this for recognized `azureId` before issuing JWT cookies
- Parallel Graph API calls for efficiency: profile + memberOf + manager

## Acceptance Criteria

1. [ ] On SSO callback with existing `azureId` match, invoke `syncUserFromGraph(userId)` before issuing JWT
2. [ ] Parallel Graph API calls: `GET /users/{azureId}`, `GET /users/{azureId}/memberOf`, `GET /users/{azureId}/manager`
3. [ ] Update user fields: `firstName`, `lastName`, `department`, `jobTitle`, `managerId`, `role` (if Security Group membership changed)
4. [ ] If mini-sync fails (Graph API timeout, permission issues), still allow login with stale data (graceful degradation)
5. [ ] `lastLoginAt` updated on every SSO login
6. [ ] Tests: mini-sync updates department, mini-sync updates role from group change, mini-sync failure still logs in

## Tasks / Subtasks

- [ ] Task 1: Create mini-sync invocation in SSO callback (AC: #1)
  - [ ] After `azureId` lookup succeeds, call `M365SyncService.syncSingleUser(userId)`
  - [ ] Await result before issuing JWT (sync-before-login pattern)
  - [ ] Set `lastLoginAt = new Date()` on user record
- [ ] Task 2: Optimize for parallel Graph API calls (AC: #2)
  - [ ] Verify `syncSingleUser()` uses `Promise.all()` for profile + memberOf + manager
  - [ ] If not, refactor to parallel (`Promise.allSettled()` for graceful partial failure)
  - [ ] Measure sync time — target < 2s total
- [ ] Task 3: Field update logic (AC: #3)
  - [ ] Map Graph API fields → Prisma User model: `displayName` → `firstName`/`lastName`, `department`, `jobTitle`
  - [ ] Role derivation from Security Group membership (match group names → app roles)
  - [ ] Manager lookup: `GET /users/{azureId}/manager` → resolve to internal `managerId`
  - [ ] Only update fields that actually changed (avoid unnecessary DB writes)
- [ ] Task 4: Graceful degradation (AC: #4)
  - [ ] Wrap `syncSingleUser()` in try-catch
  - [ ] On failure: log warning with error details, continue to issue JWT with current DB data
  - [ ] Track sync failures for observability (log level: WARN)
- [ ] Task 5: Tests (AC: #6)
  - [ ] Unit: mini-sync updates department correctly
  - [ ] Unit: role change from Security Group membership → DB role updated
  - [ ] Unit: sync failure → JWT still issued with stale data
  - [ ] Unit: `lastLoginAt` updated on successful login
  - [ ] Integration: full returning-user SSO flow with mocked Graph API

## Dev Notes

### Performance
- Mini-sync adds 1-2s to login time — acceptable for enterprise SSO flows
- `Promise.allSettled()` ensures partial Graph API failures don't block login
- Consider adding `lastSyncedAt` timestamp for debugging/audit purposes

### Key References
- `m365-sync.service.ts` — `syncSingleUser()` implementation
- `auth.service.ts` — SSO callback handler (Story 13.1)
- ADR-011 DEC-011-10: Login-time sync strategy
