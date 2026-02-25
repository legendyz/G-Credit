# Story 13.2: JIT User Provisioning on First SSO Login

Status: backlog

## Story

As a **new M365 employee logging in for the first time**,
I want my account to be automatically created when I sign in with Microsoft,
So that I don't need to register separately or wait for an admin to add me.

## Context

- SSO callback (Story 13.1) passes `azureId`, `email`, `displayName` when no matching user found
- Existing `M365SyncService.syncSingleUser()` already handles Graph API profile/role/manager sync
- Admin bootstrap via `INITIAL_ADMIN_EMAIL` env var (DEC-005 Resolution: Option B)
- ADR-011 DEC-011-12: "First SSO login → azureId not in DB → JIT create → syncUserFromGraph() → return JWT"

## Acceptance Criteria

1. [ ] When SSO callback finds no user with matching `azureId`, auto-create user:
   - `azureId = token.oid`, `email = token.preferred_username`, `firstName`/`lastName` from claims
   - `passwordHash = ''` (SSO-only user, cannot use password login)
   - `isActive = true`, default `role = 'EMPLOYEE'`
2. [ ] Immediately invoke `syncUserFromGraph(userId)` to populate:
   - Department, job title from `GET /users/{azureId}`
   - Manager relationship from `GET /users/{azureId}/manager`
   - Role from Security Group membership (Admin/Issuer groups)
3. [ ] Issue httpOnly JWT cookies after sync completes
4. [ ] If Graph API sync fails, user still created with defaults — sync retries next login
5. [ ] `INITIAL_ADMIN_EMAIL` env var: if JIT user's email matches, set `role = 'ADMIN'`
6. [ ] Concurrent first-login race condition handled (DB unique constraint on `azureId`)
7. [ ] M365 Sync code updated: remove `DEFAULT_USER_PASSWORD` temp password assignment → set `passwordHash = ''` for newly synced users
8. [ ] Data migration: clear `passwordHash` for all existing M365 users (those with `azureId` set) to enforce SSO-only login
9. [ ] Tests: JIT happy path, sync failure fallback, admin bootstrap, duplicate prevention, M365 sync no longer assigns password

## Tasks / Subtasks

- [ ] Task 1: Create JIT provisioning service method (AC: #1)
  - [ ] `AuthService.createSsoUser(azureProfile: AzureAdProfile): Promise<User>`
  - [ ] Create user with `azureId`, `email`, `firstName`, `lastName`, `passwordHash = ''`
  - [ ] Set `isActive = true`, `role = 'EMPLOYEE'` (default)
  - [ ] Handle `Prisma.UniqueConstraintViolation` on `azureId` → return existing user
- [ ] Task 2: Graph API sync integration (AC: #2, #4)
  - [ ] Call `M365SyncService.syncSingleUser(userId)` after user creation
  - [ ] Wrap in try-catch: sync failure → log warning, continue with default role
  - [ ] Parallel Graph API calls: `GET /users/{azureId}`, `/memberOf`, `/manager`
- [ ] Task 3: Admin bootstrap mechanism (AC: #5)
  - [ ] Read `INITIAL_ADMIN_EMAIL` from ConfigService
  - [ ] If JIT user's email matches (case-insensitive) → set `role = 'ADMIN'`
  - [ ] Log bootstrap event: "Admin bootstrapped via INITIAL_ADMIN_EMAIL"
  - [ ] Update `.env.example` with `INITIAL_ADMIN_EMAIL=` entry
- [ ] Task 4: Wire into SSO callback (AC: #3)
  - [ ] Story 13.1 callback delegates to this service when `azureId` not found
  - [ ] After JIT + sync, issue cookies via `setAuthCookies()`
  - [ ] Redirect to frontend dashboard
- [ ] Task 5: Race condition handling (AC: #6)
  - [ ] DB unique constraint on `User.azureId` prevents duplicates
  - [ ] On constraint violation: fetch existing user, continue with login
  - [ ] Test: 2 concurrent first-logins → only 1 user created, both get logged in
- [ ] Task 6: Remove DEFAULT_USER_PASSWORD from M365 Sync (AC: #7)
  - [ ] In `m365-sync.service.ts` (~L658): replace `DEFAULT_USER_PASSWORD` assignment with `passwordHash = ''`
  - [ ] Remove `DEFAULT_USER_PASSWORD` env var from `.env.example` (no longer needed)
  - [ ] Add log warning: "M365 users now authenticate via SSO — no temp password assigned"
- [ ] Task 7: Data migration — clear existing M365 user passwords (AC: #8)
  - [ ] Create Prisma migration or seed script: `UPDATE users SET "passwordHash" = '' WHERE "azureId" IS NOT NULL`
  - [ ] Verify migration is idempotent (safe to re-run)
  - [ ] Log: "Cleared temp passwords for N M365 users"
- [ ] Task 8: Tests (AC: #9)
  - [ ] Unit: JIT creates user with correct fields (`passwordHash = ''`)
  - [ ] Unit: JIT with sync failure → user created with EMPLOYEE role
  - [ ] Unit: admin bootstrap sets ADMIN role
  - [ ] Unit: duplicate azureId → returns existing user
  - [ ] Unit: M365 sync no longer assigns DEFAULT_USER_PASSWORD
  - [ ] Integration: full JIT flow with mocked Graph API
  - [ ] Verify: data migration clears existing M365 user passwords

## Dev Notes

### Architecture
- Reuse `M365SyncService.syncSingleUser()` — same function used by manual sync and JIT
- `passwordHash = ''` ensures SSO-only users cannot use password login form
- JIT + sync is a single transaction from user's perspective but two operations internally

### M365 Password Deprecation (DEC-011-13 Enforcement)
- **Removed:** `DEFAULT_USER_PASSWORD` temp password in M365 Sync (was at `m365-sync.service.ts` ~L658)
- **Removed:** `DEFAULT_USER_PASSWORD` env var (no longer needed)
- **Migration:** All existing M365 users (`azureId IS NOT NULL`) get `passwordHash = ''`
- **Combined with Story 13.1 Task 8:** Password login blocked for any user with `azureId` → enforces SSO-only for M365 users
- **Admin-created local users** (via Admin panel, Story 12.3a) still use `DEFAULT_USER_PASSWORD` → keep that path unchanged

### Key References
- `m365-sync.service.ts` — `syncSingleUser()` implementation (~L658: temp password code to remove)
- `admin-users.service.ts` — `createUser()` (~L865: local user creation, keep `DEFAULT_USER_PASSWORD` here)
- `auth.service.ts` — `setAuthCookies()`, `generateTokenPair()`, `validateUser()` (password login guard)
- ADR-011 DEC-011-12, DEC-011-13
