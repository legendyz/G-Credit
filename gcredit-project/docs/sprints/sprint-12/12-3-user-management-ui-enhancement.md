# Story 12.3: User Management UI Enhancement

Status: backlog

## Story

As an **Admin**,
I want an enhanced user management page with dual-mode user provisioning (M365 sync + manual creation), source-aware management controls, and proper organizational hierarchy support,
So that I can efficiently manage all platform users across both M365-synced and locally-created accounts.

## Context

- Current `UserManagementPage.tsx` exists but has limited functionality
- Backend RBAC system is complete (4 roles: ADMIN, ISSUER, MANAGER, EMPLOYEE)
- User model includes: id, email, firstName, lastName, role, isLocked, badgeCount, azureId, etc.
- Account lockout system from Sprint 11 (Story 11.1) — `isLocked`, `failedLoginAttempts`
- M365 sync infrastructure exists (Sprint 8) — `POST /api/admin/m365-sync`, sync logs, retry logic
- M365 sync currently creates all users as EMPLOYEE with `passwordHash=''`
- Manager-Employee relationship currently uses `department` string matching — needs migration to `managerId` FK
- Seed admin (`admin@gcredit.com`) retained for bootstrap + dev/demo environments

### Key Design Decisions (PO-Confirmed 2026-02-20)

| # | Decision | Resolution |
|---|---|---|
| DEC-003 | Manual user creation | ✅ Supported — Admin can create local users for dev/demo environments |
| DEC-005 | Admin bootstrap | ✅ Keep seed `admin@gcredit.com` for initial M365 sync trigger |
| NEW-001 | M365 role mapping | ✅ Azure AD Security Group → ADMIN/ISSUER; `directReports` > 0 → MANAGER |
| NEW-002 | M365 user roles in UI | ✅ Read-only — roles managed exclusively by Security Group, not editable in UI |
| NEW-003 | Group-only sync | ✅ Required — separate "Sync Groups" for role-only refresh (scale: 100K+ users) |
| NEW-004 | M365 user management scope | ✅ Limited to lock/disable only — identity/role managed by M365 |
| NEW-005 | User source indicator | ✅ Show `M365` vs `Local` badge in table, detail panel, and profile page |
| NEW-006 | Password for M365 users | ✅ Temporary default password until SSO; show notice to user |
| NEW-007 | Manager assignment | ✅ Schema: add `managerId` FK; migrate department-scoping → managerId-scoping |

### Dual-Mode User Provisioning

```
┌─────────────────────────────────────┐
│         User Sources                │
├──────────────────┬──────────────────┤
│   M365 Sync      │   Manual Create  │
│   (Production)   │   (Dev/Demo)     │
├──────────────────┼──────────────────┤
│ azureId != null  │ azureId == null   │
│ Roles: Security  │ Roles: Admin     │
│   Group mapped   │   selects at     │
│ Manager: direct  │   creation       │
│   Reports API    │ Manager: select  │
│ Password: temp   │   from existing  │
│   default        │ Password: Admin  │
│ Edit: lock only  │   sets default   │
│                  │ Edit: full CRUD  │
└──────────────────┴──────────────────┘
```

### Source-Aware Management Rules

| Feature | M365 User (`azureId != null`) | Local User (`azureId == null`) |
|---|---|---|
| View in table | ✅ | ✅ |
| Search/filter | ✅ | ✅ |
| View detail panel | ✅ | ✅ |
| Edit role | ❌ Read-only (Security Group) | ✅ Admin selects |
| Edit name/email | ❌ (managed by M365) | ✅ |
| Edit department | ❌ (managed by M365) | ✅ |
| Change manager | ❌ (managed by directReports) | ✅ Select from dropdown |
| Lock/Disable | ✅ (safety override) | ✅ |
| Delete | ❌ (M365 = source of truth) | ✅ |
| Change password | ⚠️ Temporary until SSO (with notice) | ✅ |
| Source badge | "M365" (blue) | "Local" (gray) |

## Acceptance Criteria

### User Table & Management (Sub-story 12.3a)
1. [ ] Admin can view all users in a data table with: name, email, role, status, **source (M365/Local)**, badge count, last active
2. [ ] Admin can search users by name or email (debounced 300ms)
3. [ ] Admin can filter by role (Admin/Issuer/Manager/Employee)
4. [ ] Admin can filter by status (Active/Locked/Inactive)
5. [ ] Admin can filter by source (M365/Local/All)
6. [ ] Admin can edit a **local** user's role via edit dialog (role edit disabled for M365 users)
7. [ ] Admin can lock/unlock **any** user account (M365 or Local)
8. [ ] Admin can view user detail slide-over panel (profile info + badge summary + activity + source indicator)
9. [ ] Table supports pagination with page size selector
10. [ ] Row hover reveals action buttons — **contextual** per source (M365: view + lock only; Local: edit + view + lock + delete)
11. [ ] Role change requires confirmation dialog
12. [ ] Route: `/admin/users` (enhance existing page)
13. [ ] User source badge displayed: `M365` (blue Microsoft icon) or `Local` (gray icon)
14. [ ] M365 user detail panel shows: "Identity managed by Microsoft 365. Role assigned via Security Group." + last sync timestamp

### Manual User Creation (Sub-story 12.3a)
15. [ ] Admin can create a local user via "Add User" dialog: email, firstName, lastName, department, role (EMPLOYEE/ISSUER/MANAGER), manager (select existing user), default password
16. [ ] Created user has `azureId = null`, `roleSetManually = true`
17. [ ] Email uniqueness enforced (400 if already exists)
18. [ ] New backend endpoint: `POST /api/admin/users`

### Schema & Manager Hierarchy (Sub-story 12.3b)
19. [ ] Prisma schema: `managerId` self-referential FK added to User model
20. [ ] Migration: existing seed users linked via `managerId` (employee → manager)
21. [ ] Backend scoping migrated from `department` to `managerId`: dashboard, badge-issuance, analytics
22. [ ] Seed data: keep only `admin@gcredit.com` as bootstrap seed (other demo users optional for dev env)

### M365 Sync Enhancement (Sub-story 12.3b)
23. [ ] M365 sync fetches `directReports` for each user → sets `managerId` FK (two-pass: create users, then link managers)
24. [ ] M365 sync checks Security Group membership (`GET /users/{id}/memberOf`) → assigns ADMIN/ISSUER roles
25. [ ] Security Group IDs configured via `.env`: `AZURE_ADMIN_GROUP_ID`, `AZURE_ISSUER_GROUP_ID`
26. [ ] Sync skips role update for locally-created users (`azureId = null`)
27. [ ] **Group-only sync** mode: `POST /api/admin/m365-sync` with `syncType: 'GROUPS_ONLY'` — refreshes Security Group memberships + directReports without re-importing all user data
28. [ ] UI: "Sync Users" button (full sync) + "Sync Roles" button (group-only sync)
29. [ ] Sync history table shows sync type (FULL / GROUPS_ONLY)
30. [ ] Role priority logic: Security Group > `roleSetManually` > directReports > default EMPLOYEE

### Login-Time Freshness (Sub-story 12.3b)
31. [ ] **Login-time mini-sync** for M365 users (`azureId != null`): on every login/token-refresh, query Graph API to perform a complete single-user sync:
    - a. `GET /me` (or `/users/{azureId}`) → verify `accountEnabled`; reject login (401) if disabled
    - b. Update profile fields: `firstName`, `lastName`, `department` from Graph API `displayName`, `department`
    - c. `GET /me/memberOf` → check Security Group membership → update `role` if changed (priority: Security Group > roleSetManually > directReports > EMPLOYEE)
    - d. `GET /me/manager` → update `managerId` FK if manager changed
    - e. Set `lastSyncAt = now()` on user record
    - f. Graceful fallback: if Graph API unavailable **AND** `lastSyncAt` within 24h, allow login with cached data + log warning; if `lastSyncAt` > 24h → reject login (401)
    - g. Target overhead: ~200-300ms per login (3 parallel Graph API calls)

### Security Hardening (Sprint 12.3)
32. [ ] Users with empty `passwordHash` (M365 synced, `passwordHash=''`) attempting password login → return 401 (same error message as invalid credentials, no account existence leakage)
33. [ ] `POST /api/admin/users` validates input via `CreateUserDto`: `@IsEmail()` email, `@MaxLength(100)` firstName/lastName, `@IsEnum(UserRole)` role, `@IsOptional() @IsUUID()` managerId (must reference existing user)
34. [ ] Deleting a Local user who is a manager → `managerId` set to null on subordinates (`onDelete: SetNull`); UI confirms: "This user manages X users. Their manager will be unassigned."
35. [ ] Login-time mini-sync degradation window: if `lastSyncAt > 24h` AND Graph API unavailable → reject login (401) with log level ERROR
36. [ ] API responses (`GET /api/admin/users`, `GET /api/admin/users/:id`) MUST exclude `azureId` raw value; only return computed `source` field (`'M365'` | `'LOCAL'`). `azureId` is internal-only — never exposed to frontend/API consumers. (Prevents Azure AD Object ID reconnaissance if API is compromised)
37. [ ] Lock confirmation for M365 users includes context notice: "This will prevent sign-in to G-Credit only. To disable their Microsoft 365 account, contact your IT administrator."
38. [ ] Sync error logs and M365SyncLog records MUST NOT contain user PII (name, email). Reference users by internal `id` only in logs. Error messages may include `azureId` for debugging but not `email`/`displayName`.

## Tasks / Subtasks

### Sub-story 12.3a: User Management UI + Manual Creation (~14h)

- [ ] Task 1: Enhance `UserManagementPage` data table (AC: #1, #5, #9, #10, #12, #13)
  - [ ] Wrap in `<AdminPageShell>` (from Story 12.1)
  - [ ] Redesign table columns: avatar initials, name, email, role badge, status dot, **source badge**, badge count, last active
  - [ ] Source column: `M365` badge (blue with Microsoft icon) | `Local` badge (gray)
  - [ ] Role badge chips with color coding: ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray
  - [ ] Status indicator (green dot=active, red dot=locked, gray dot=inactive)
  - [ ] **Context-aware row actions:** M365 users → view + lock only; Local users → edit + view + lock + delete
  - [ ] Pagination with `PaginatedResponse<T>` (standardized per CQ-007)
- [ ] Task 2: Search + filter bar (AC: #2, #3, #4, #5)
  - [ ] Search input with debounce (300ms) — searches name AND email simultaneously
  - [ ] Role dropdown filter
  - [ ] Status dropdown filter
  - [ ] **Source dropdown filter** (All / M365 / Local)
  - [ ] Clear filters button
- [ ] Task 3: Role edit for **local users only** (AC: #6, #11)
  - [ ] Edit dialog with role selector — **disabled/hidden for M365 users**
  - [ ] Confirmation via shared `<ConfirmDialog>`: "Change Alice Smith from Employee to Issuer?"
  - [ ] **Self-demotion guard:** Admin cannot change their OWN role (backend 403 + frontend disable)
  - [ ] API: `PATCH /api/admin/users/:id/role` (existing endpoint)
  - [ ] Backend guard: reject role change for users with `azureId != null` (400: "M365 user roles are managed via Security Group")
- [ ] Task 4: Lock/unlock functionality — **all users** (AC: #7, #37)
  - [ ] **Toggle switch** (Shadcn `Switch`) — visual state for lock status
  - [ ] Lock confirmation via `<ConfirmDialog>`: "Lock account for jane@example.com? They won't be able to sign in."
  - [ ] **M365 user lock notice:** "This will prevent sign-in to G-Credit only. To disable their Microsoft 365 account, contact your IT administrator."
  - [ ] Unlock resets `failedLoginAttempts` to 0
  - [ ] API: `PATCH /api/admin/users/:id/status`
- [ ] Task 5: User detail slide-over panel (AC: #8, #14)
  - [ ] Slide-over from RIGHT side (Shadcn `Sheet`)
  - [ ] Show: avatar, name, email, role, lock status, badge count, last login, created date
  - [ ] **Source section:** "Account Source: Microsoft 365 (synced)" or "Account Source: Local Account"
  - [ ] For M365 users: "Identity managed by Microsoft 365. Role assigned via Security Group." + `Last Synced: {lastSyncAt}`
  - [ ] For M365 users: disable all edit controls except lock/unlock
  - [ ] Badge summary section (count + recent badges)
  - [ ] Recent activity section (from audit log)
- [ ] Task 6: Manual user creation (AC: #15, #16, #17, #18, #33)
  - [ ] "Add User" button → creation dialog
  - [ ] Fields: email*, firstName*, lastName*, department, role (EMPLOYEE/ISSUER/MANAGER dropdown), manager (search/select existing user)
  - [ ] Default password: configurable via `DEFAULT_USER_PASSWORD` env var (default: `password123`)
  - [ ] Backend: `POST /api/admin/users` — creates user with `azureId=null`, `roleSetManually=true`, bcrypt-hashed default password
  - [ ] Backend: `CreateUserDto` with strict validation: `@IsEmail()`, `@IsString() @MaxLength(100)` names, `@IsEnum(UserRole)` role, `@IsOptional() @IsUUID()` managerId (verify referenced user exists)
  - [ ] Backend: email uniqueness check → 409 if exists
  - [ ] Backend: audit log entry for user creation
- [ ] Task 7: API response enhancement (AC: #36)
  - [ ] Add `source` computed field to user list/detail API responses: `azureId ? 'M365' : 'LOCAL'`
  - [ ] Add `sourceLabel` field: `azureId ? 'Microsoft 365' : 'Local Account'`
  - [ ] **Exclude `azureId` from API response** — do NOT add to `getUserSelect()`. Compute `source` internally, strip `azureId` before returning.
  - [ ] Add `lastSyncAt` to API response (for M365 users detail panel)
- [ ] Task 8: Tests (12.3a)
  - [ ] Table rendering + source badge tests
  - [ ] Filter by source tests
  - [ ] Role change flow tests (including M365 user role-edit blocked)
  - [ ] Lock/unlock toggle tests (both M365 and Local users)
  - [ ] Slide-over panel tests (source-aware content)
  - [ ] Manual user creation tests (form validation, API call, duplicate email)
  - [ ] `CreateUserDto` validation tests (invalid email, oversized names, invalid role enum, non-existent managerId)
  - [ ] Delete user with subordinates tests (managerId set to null, confirmation prompt)

### Sub-story 12.3b: Manager Hierarchy + M365 Sync Enhancement (~16h)

#### Prerequisites (Azure/M365 Setup — PO action before dev starts)

The following Azure/M365 configurations must be completed by PO (with SM guidance) before 12.3b development begins. Estimated time: ~20 minutes total.

- [ ] **Prereq 1: Add Graph API Permission** (~5 min)
  - Azure Portal → Azure Active Directory → App registrations → G-Credit app
  - API permissions → Add permission → Microsoft Graph → Application permissions
  - Add `GroupMember.Read.All`
  - Click "Grant admin consent" button
  - *Purpose: allows sync to read Security Group memberships for role mapping*

- [ ] **Prereq 2: Create Security Groups** (~10 min)
  - Microsoft 365 Admin Center → Teams & Groups → Security groups → Add
  - Create group: **G-Credit Admins** → add users who should be ADMIN → copy Object ID
  - Create group: **G-Credit Issuers** → add users who should be ISSUER → copy Object ID
  - Add Object IDs to backend `.env`:
    ```env
    AZURE_ADMIN_GROUP_ID="<G-Credit Admins Object ID>"
    AZURE_ISSUER_GROUP_ID="<G-Credit Issuers Object ID>"
    ```
  - *Purpose: maps M365 Security Group membership → G-Credit ADMIN/ISSUER roles*

- [ ] **Prereq 3: Verify M365 Organizational Hierarchy** (~5 min)
  - Microsoft 365 Admin Center → Users → Active users → select a user → check Manager field is set
  - Or: Azure Portal → Azure AD → Users → select user → Properties → Manager
  - Verify at least one user has a manager assigned + at least one user has direct reports
  - *Purpose: `directReports` API depends on manager field being set in Azure AD*

- [ ] Task 9: Schema — `managerId` self-relation (AC: #19, #20)
  - [ ] Add to Prisma schema:
    ```prisma
    managerId     String?
    manager       User?   @relation("ManagerReports", fields: [managerId], references: [id], onDelete: SetNull)
    directReports User[]  @relation("ManagerReports")
    ```
  - [ ] Generate + apply migration
  - [ ] Update seed data: link employee → manager via `managerId`
  - [ ] Keep `admin@gcredit.com` seed user as bootstrap (guard: `NODE_ENV !== 'production'` for other seeds)
- [ ] Task 10: Backend scoping migration — department → managerId (AC: #21)
  - [ ] `dashboard.service.ts`: Manager team query → `WHERE managerId = manager.id`
  - [ ] `badge-issuance.service.ts`: Manager badge scoping → `recipient.managerId = manager.id`
  - [ ] `analytics.service.ts`: Manager filter → `WHERE managerId = manager.id`
  - [ ] Keep `department` field for display only (not for access control)
  - [ ] Update affected tests
- [ ] Task 11: M365 sync — Security Group role mapping (AC: #24, #25, #26, #30)
  - [ ] Add `.env` vars: `AZURE_ADMIN_GROUP_ID`, `AZURE_ISSUER_GROUP_ID`
  - [ ] In `syncSingleUser()`: call `GET /users/{id}/memberOf` → check group IDs
  - [ ] Role priority: Security Group membership > `roleSetManually=true` > directReports > default EMPLOYEE
  - [ ] Skip role update for users with `azureId = null` (locally created)
  - [ ] Requires Graph API permission: `GroupMember.Read.All` or `Directory.Read.All`
- [ ] Task 12: M365 sync — `directReports` + `managerId` linkage (AC: #23)
  - [ ] Two-pass sync: Pass 1 — create/update all users; Pass 2 — fetch `/users/{id}/manager` for each user → set `managerId`
  - [ ] Users with `directReports > 0` → set role MANAGER (if not overridden by Security Group)
  - [ ] Set `managerId` on subordinate users based on Graph API manager endpoint
- [ ] Task 13: Group-only sync mode (AC: #27, #28, #29)
  - [ ] New `syncType: 'GROUPS_ONLY'` in `TriggerSyncDto`
  - [ ] Implementation: fetch existing M365 users from DB (skip user import) → re-check `/memberOf` + `/manager` for each → update roles + `managerId`
  - [ ] Performance: avoids re-fetching all user profiles from Graph API, only queries group/manager endpoints
  - [ ] Sync log records: `syncType: 'GROUPS_ONLY'`, counts only role/manager changes
- [ ] Task 14: M365 Sync UI controls (AC: #28, #29)
  - [ ] "Sync Users" button → triggers `POST /api/admin/m365-sync` with `syncType: 'FULL'`
  - [ ] "Sync Roles" button → triggers `POST /api/admin/m365-sync` with `syncType: 'GROUPS_ONLY'`
  - [ ] Sync history table with type column (FULL / GROUPS_ONLY / INCREMENTAL)
  - [ ] Last sync timestamp + status indicator
- [ ] Task 15: Login-time mini-sync (AC: #31)
  - [ ] In JWT auth guard or login handler: detect M365 user (`azureId != null`)
  - [ ] Fire 3 Graph API calls **in parallel** for performance:
    - `GET /users/{azureId}` → accountEnabled, displayName, department
    - `GET /users/{azureId}/memberOf` → Security Group membership
    - `GET /users/{azureId}/manager` → manager's azureId
  - [ ] If `accountEnabled = false` → reject login (401 Unauthorized)
  - [ ] Update profile: parse displayName → firstName/lastName, update department
  - [ ] Update role: apply Security Group mapping (same priority logic as full sync)
  - [ ] Update managerId: resolve manager's azureId → local User id → set FK
  - [ ] Set `lastSyncAt = now()` on user record
  - [ ] Cache result for token refresh within same session (avoid repeated Graph calls per session)
  - [ ] Graceful fallback: if Graph API unavailable (timeout/5xx) AND `lastSyncAt` within 24h → allow login with cached data + log warning; if `lastSyncAt > 24h` → reject login (401) + log ERROR
  - [ ] Extract shared helper `syncUserFromGraph(userId)` reusable by both full sync and login-time mini-sync
- [ ] Task 16: Tests (12.3b)
  - [ ] `managerId` schema tests (relation, cascade behavior)
  - [ ] Dashboard/badge-issuance/analytics scoping migration tests
  - [ ] M365 sync Security Group role mapping tests
  - [ ] M365 sync `directReports` + `managerId` linkage tests
  - [ ] Group-only sync mode tests
  - [ ] Login-time mini-sync tests (profile updated, role changed, manager changed, account disabled, Graph API unavailable, partial failure)
  - [ ] Empty passwordHash login rejection test (M365 user password login → 401)
  - [ ] Degradation window tests (lastSyncAt > 24h + Graph unavailable → reject; lastSyncAt < 24h + Graph unavailable → allow)
  - [ ] Regression tests for existing features affected by department→managerId migration

## Dev Notes

### Architecture Patterns
- Enhance existing `UserManagementPage.tsx` — don't create new page
- Wrap in `<AdminPageShell>` from Story 12.1
- Use `<ConfirmDialog>` from Story 12.1 for role change + lock confirmations
- Follow data table pattern from design-direction.md
- Role badge colors: ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray
- Lock/unlock: Shadcn `Switch` (toggle) — not a button
- Slide-over: render from RIGHT side using Shadcn `Sheet` component
- **Source-aware UI:** All edit controls check `azureId` to determine editable state
- **User source detection:** `azureId != null` → M365 synced; `azureId == null` → Local

### Existing Backend Endpoints (to enhance)
- `GET /api/admin/users` — paginated, supports search + role filter → add source filter + `source` field
- `PATCH /api/admin/users/:id/role` — update role → add M365 user guard
- `PATCH /api/admin/users/:id/status` — activate/deactivate → works for both sources
- `GET /api/admin/users/:id` — user detail → add `source` field
- `POST /api/admin/m365-sync` — trigger sync → add `GROUPS_ONLY` sync type

### New Backend Endpoints
- `POST /api/admin/users` — create local user (email, name, role, department, managerId, default password)

### Schema Changes
- `managerId String?` — self-referential FK to User (`onDelete: SetNull`)
- `manager User? @relation("ManagerReports", fields: [managerId], references: [id], onDelete: SetNull)`
- `directReports User[] @relation("ManagerReports")`

### Environment Variables (new)
```env
AZURE_ADMIN_GROUP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_ISSUER_GROUP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
DEFAULT_USER_PASSWORD="password123"
```

### Graph API Permissions (additional)
- `GroupMember.Read.All` — read security group memberships
- Already have: `User.Read.All`

### ⚠️ Out of Scope
- SSO implementation (FR27 — separate epic)
- User self-registration (existing `/api/auth/register` remains as-is)
- Bulk role changes
- Azure AD Group creation (IT admin pre-creates groups in Azure portal)
- Profile page M365 source indicator (deferred — can add later with minimal effort)

### 🔒 Known Security Risks (Deferred to Security Hardening Sprint)

| Risk ID | Severity | Description | Mitigation Plan |
|---|---|---|---|
| **SEC-GAP-2** | P1 High | Default password `password123` has no forced-change-on-first-login mechanism. Admin-created local users (including ADMIN role) may keep weak default password indefinitely. | Add `mustChangePassword` field to User model + middleware to intercept login and redirect to password change page. Requires new UI page. **Target: Security Hardening Sprint.** |
| **SEC-GAP-3** | P1 High | JWT `role` claim remains valid for up to 15 minutes after role is changed in DB (via mini-sync or admin action). Creates a stale privilege window where revoked ADMIN access is still honored. | Options: (A) `RolesGuard` queries DB for real-time role on each request (+1 query/request), (B) shorten access_token to 5 min, (C) invalidate all refresh tokens on role change. **Target: Security Hardening Sprint.** |

### ⚠️ Known Limitations

| ID | Description | Mitigation |
|---|---|---|
| **SEC-GAP-7** | M365 users disabled in Azure AD who never log in remain "active" in local DB until next full sync. Badges can still be issued to them, they appear in team lists. Login-time mini-sync only catches users who attempt to log in. | Configure scheduled full sync to run at least daily. Badge issuance could optionally check `lastSyncAt` freshness but this is not in 12.3 scope. |

### ⚠️ Breaking Changes
- **Department-based scoping → managerId-based scoping**: Dashboard team view, badge issuance manager scope, analytics manager filter all change from `WHERE department = X` to `WHERE managerId = Y`. Requires regression testing.
- **M365 user role edit blocked**: If admin previously changed M365 user roles via UI, this will no longer be possible. Roles must be managed via Security Group.

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Self-demotion guard (backend 403 + frontend disable), no new backend endpoint needed for detail panel (compose from existing APIs)
- **UX (Sally):** Toggle switch for lock/unlock (not button), role colors ADMIN=red/ISSUER=blue/MANAGER=purple/EMPLOYEE=gray, debounced search (name+email), slide-over from RIGHT, specific confirm dialog text

### ✅ PO Design Session (2026-02-20)
- **Dual-mode provisioning confirmed:** M365 sync (production) + manual create (dev/demo)
- **Security Group role mapping confirmed:** Azure AD groups → ADMIN/ISSUER; directReports → MANAGER
- **M365 user roles read-only in UI:** Managed exclusively by Security Group
- **Group-only sync required:** Separate lightweight sync for role/manager refresh (scale: 100K+ users)
- **Source-aware management:** M365 users limited to lock/disable; local users full CRUD
- **User source indicator:** M365 (blue) vs Local (gray) badge throughout UI
- **Bootstrap strategy:** Seed `admin@gcredit.com` for initial M365 sync trigger
- **Temporary password:** Default password until SSO; show notice to M365 users
- **Revised estimate:** ~30h total → split into 12.3a (14h) + 12.3b (16h)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
