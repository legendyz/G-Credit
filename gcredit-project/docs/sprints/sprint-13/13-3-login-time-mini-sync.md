# Story 13.3: Login-Time Mini-Sync for Returning SSO Users

Status: review

## Story

As a **returning M365 user**,
I want my profile, role, and manager to update automatically each time I log in via SSO,
So that organizational changes (department move, promotion, new manager) are reflected in G-Credit.

## Context

- ADR-011 DEC-011-10/11: "On every login/token-refresh, perform single-user sync."
- Reuses `M365SyncService.syncUserFromGraph()` — shared helper for login-time mini-sync
- SSO callback (Story 13.1) invokes this for recognized `azureId` before issuing JWT cookies
- Parallel Graph API calls for efficiency: profile + memberOf + manager

## Acceptance Criteria

1. [x] On SSO callback with existing `azureId` match, invoke `syncUserFromGraph(userId)` before issuing JWT — *already done in Story 13.1*
2. [x] Parallel Graph API calls: `GET /users/{azureId}`, `GET /users/{azureId}/memberOf`, `GET /users/{azureId}/manager` — *already done in Story 13.1*
3. [x] Update user fields: `firstName`, `lastName`, `department`, `jobTitle`, `managerId`, `role` (if Security Group membership changed) — *jobTitle added in this story; role demotion fixed*
4. [x] If mini-sync fails (Graph API timeout, permission issues), still allow login with stale data (graceful degradation) — *already done (24h degradation window)*
5. [x] `lastLoginAt` updated on every SSO login — *already done in Story 13.1*
6. [x] Tests: mini-sync updates department, mini-sync updates role from group change, mini-sync failure still logs in — *6 new tests added*

## Tasks / Subtasks

- [x] Task 1: Add `jobTitle` field (Prisma migration + Graph API `$select` + sync mapping)
  - [x] Add `jobTitle String?` to User model in `schema.prisma`
  - [x] Run `prisma migrate dev --name add-job-title-field`
  - [x] Add `jobTitle` to `$select` query in `syncUserFromGraph`
  - [x] Map `profile.jobTitle ?? null` in updateData
- [x] Task 2: 3-minute cooldown for mini-sync
  - [x] Add `COOLDOWN_MINUTES = 3` constant
  - [x] Early-return `{ rejected: false }` if `lastSyncAt` < 3 minutes ago
- [x] Task 3: Fix role demotion when removed from Security Group
  - [x] When `getUserRoleFromGroups()` returns null and user is not roleSetManually:
    - Check `prisma.user.count({ where: { managerId: user.id } })`
    - If > 0 → MANAGER, else → EMPLOYEE
  - [x] Remove old `if (newRole) { updateData.role = newRole; }` pattern that only promoted
- [x] Task 4: Tests (6 new tests)
  - [x] Cooldown: skip sync when lastSyncAt < 3min
  - [x] Cooldown: run sync when lastSyncAt exactly 3min
  - [x] jobTitle sync from Graph API
  - [x] jobTitle clear when Azure returns null
  - [x] Demote to EMPLOYEE (no direct reports)
  - [x] Demote to MANAGER (has direct reports)

## Dev Notes

### Performance
- Mini-sync adds 1-2s to login time — acceptable for enterprise SSO flows
- `Promise.allSettled()` ensures partial Graph API failures don't block login
- 3-minute cooldown prevents unnecessary Graph API calls on page refreshes

### Key References
- `m365-sync.service.ts` — `syncUserFromGraph()` implementation
- `auth.service.ts` — SSO callback handler (Story 13.1)
- ADR-011 DEC-011-10: Login-time sync strategy

---

## Dev Agent Record

### Implementation Plan
Story 13.3 hardened the existing login-time mini-sync (built in Stories 13.1/13.2) with three targeted improvements:
1. **jobTitle field**: Prisma migration + Graph API $select + sync mapping
2. **3-minute cooldown**: Skip mini-sync if lastSyncAt < 3 minutes to avoid unnecessary Graph calls
3. **Role demotion fix**: When user loses Security Group membership, downgrade from ADMIN → MANAGER/EMPLOYEE based on directReports count

### Debug Log
- Initial implementation had 9 test failures because `mockGraphUser.lastSyncAt = new Date()` triggered the new cooldown early return — fixed by setting lastSyncAt to 10 minutes ago in test fixture.
- 3 existing manager-related tests needed `prisma.user.count.mockResolvedValue(0)` added because the new demotion code path calls `count()`.

### Completion Notes
- All 6 new tests pass; 0 regressions across full suite (913 pass, 28 skipped, 4 suites skipped)
- Migration `20260226004923_add_job_title_field` applied successfully

### File List

#### New Files
| File | Purpose |
|------|---------|
| `prisma/migrations/20260226004923_add_job_title_field/migration.sql` | Add jobTitle column to User table |

#### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `jobTitle String?` after `department` |
| `src/m365-sync/m365-sync.service.ts` | 3-min cooldown, jobTitle in $select + updateData, role demotion with count() |
| `src/m365-sync/m365-sync.service.spec.ts` | 6 new tests + count mock for 3 existing tests + lastSyncAt fixture fix |

### Change Log
| Change | Reason |
|--------|--------|
| Added `jobTitle String?` to User model | AC #3 — sync jobTitle from Graph API |
| Added `COOLDOWN_MINUTES = 3` early return | Prevent unnecessary Graph calls on page refreshes |
| Added `jobTitle` to Graph API `$select` | Fetch jobTitle in parallel profile request |
| Added demotion logic with `user.count()` | Fix: role should downgrade when user leaves Security Group |
| Removed old `if (newRole) { updateData.role = newRole }` | Was promotion-only; replaced with full upgrade/downgrade logic |
