# Code Review Prompt — Story 12.3a: Manager Hierarchy + M365 Sync Enhancement

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-3-user-management-ui-enhancement.md` (ACs #19–31, #32, #35, #38)
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-3a-dev-prompt.md` (Tasks 9–16)
**Branch:** `sprint-12/management-uis-evidence`
**Commit:** `9a25791` — `feat(12.3a): manager hierarchy + M365 sync enhancement`
**Base:** `1436d13` (naming swap commit)

### Story Summary

Story 12.3a is the backend-heavy sub-story of 12.3 (User Management). It introduces:

1. **Manager hierarchy schema** — `managerId` self-referential FK on User model, `onDelete: SetNull`
2. **Department → managerId scoping migration** — Dashboard, badge-issuance, and analytics services migrated from department-based team lookup to `managerId`-based direct reports
3. **M365 Security Group role mapping** — Sync checks `/users/{id}/memberOf` for Azure AD Security Groups → maps to ADMIN/ISSUER roles with priority: SecurityGroup > roleSetManually > directReports > EMPLOYEE
4. **Two-pass manager linkage** — Pass 1: create/update users; Pass 2: `GET /manager` → set `managerId` FK; Pass 2b: upgrade EMPLOYEE→MANAGER for users with directReports
5. **GROUPS_ONLY sync mode** — Re-evaluates Security Group membership + manager relationships for existing M365 users without importing new users
6. **Login-time mini-sync** — On every M365 user login: 3 parallel Graph API calls (profile, memberOf, manager) → update profile/role/managerId, with 24h degradation window
7. **Security hardening** — Empty `passwordHash` guard (AC #32), 24h degradation window (AC #35), PII-free logging (AC #38)
8. **M365 Sync UI Panel** — Frontend collapsible panel with "Sync Users" / "Sync Roles" buttons + sync history table

---

## Scope of Changes

**22 files changed, +2,745 / −131 lines**

### New Backend Files (2 files)

| File | Lines | Purpose |
|------|-------|---------|
| `backend/prisma/migrations/20260220140126_add_manager_id_self_relation/migration.sql` | 8 | `ALTER TABLE "users" ADD COLUMN "managerId" TEXT`, index, FK constraint (`ON DELETE SET NULL`) |
| `backend/src/m365-sync/m365-sync.service.spec.ts` | +582 | Comprehensive tests: Security Group mapping, directReports linkage, GROUPS_ONLY sync, syncUserFromGraph, PII-free logging |

### Modified Backend Files (10 files)

| File | Change | LOC |
|------|--------|-----|
| `backend/prisma/schema.prisma` | `managerId String?`, `manager` / `directReports` relations, `@@index([managerId])` | +6 |
| `backend/prisma/seed-uat.ts` | Link `employee.managerId = manager.id` after user creation | +10 |
| `backend/src/m365-sync/dto/trigger-sync.dto.ts` | `SyncType` expanded: `'FULL' \| 'INCREMENTAL' \| 'GROUPS_ONLY'` | +8/−5 |
| `backend/src/modules/auth/auth.module.ts` | Import `M365SyncModule` | +2 |
| `backend/src/modules/auth/auth.service.ts` | Empty `passwordHash` guard, login-time mini-sync via `syncUserFromGraph()`, fresh role in JWT | +31/−4 |
| `backend/src/modules/auth/auth.service.spec.ts` | 8 new tests: empty hash, mini-sync trigger, account disabled, local user skip, fresh JWT role, degradation window (24h accept / 48h reject) | +176 |
| `backend/src/m365-sync/m365-sync.service.ts` | **LARGEST**: `getUserRoleFromGroups()`, `linkManagerRelationships()`, `resolveUserRole()`, `syncUserFromGraph()`, `runGroupsOnlySync()`, `updateDirectReportsRoles()`, enhanced `syncSingleUser()` + `runSync()` | +484/−19 |
| `backend/src/dashboard/dashboard.service.ts` | `department` lookup → `managerId`-based `findMany` | +12/−23 |
| `backend/src/badge-issuance/badge-issuance.service.ts` | `revokeBadge` + `getIssuedBadges` → `managerId`-based scoping | +4/−16 |
| `backend/src/analytics/analytics.service.ts` | `getTopPerformers` → `managerId`-based scoping; `teamName = 'Direct Reports'` | +8/−18 |

### New Frontend Files (5 files, ~449 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/lib/m365SyncApi.ts` | 61 | `triggerSync()`, `getSyncLogs()`, `getIntegrationStatus()` via `apiFetchJson` |
| `frontend/src/hooks/useM365Sync.ts` | 54 | `useM365SyncLogs()`, `useM365IntegrationStatus()`, `useTriggerSync()` — TanStack Query hooks |
| `frontend/src/components/admin/M365SyncPanel.tsx` | 207 | Collapsible panel: sync buttons + history table (date, type badge, users, synced, created, updated, failed, status icon, duration) |
| `frontend/src/components/ui/badge.tsx` | 33 | Shadcn Badge component (default, secondary, destructive, outline variants) |
| `frontend/src/components/ui/table.tsx` | 94 | Shadcn Table components (Table, TableHeader, TableBody, TableRow, etc.) |

### Modified Test Files (2 files)

| File | Change | LOC |
|------|--------|-----|
| `backend/src/dashboard/dashboard.service.spec.ts` | Updated for `managerId`-based scoping; new `managerId` query verification test | +25/−6 |
| `backend/src/analytics/analytics.service.spec.ts` | Updated for `managerId`-based scoping; ForbiddenException test updated; empty direct reports test | +14/−15 |

### Documentation Files (3 files)

| File | Change |
|------|--------|
| `docs/sprints/sprint-12/12-3-user-management-ui-enhancement.md` | AC checkboxes marked `[x]`, Dev Agent Record, task status updates |
| `docs/sprints/sprint-12/12-3a-dev-prompt.md` | Dev prompt (committed with implementation) |
| `docs/sprints/sprint-status.yaml` | Status update |

---

## Review Checklist

### 1. Architecture & Patterns Compliance

- [ ] **apiFetch usage:** All frontend API calls use `apiFetchJson` — no raw `fetch` or `axios`?
- [ ] **React Query patterns:** `queryKey` naming consistent (`['m365-sync-logs']`, `['m365-integration-status']`)? `staleTime` values appropriate (30s logs, 60s status)?
- [ ] **Mutation invalidation:** `useTriggerSync` invalidates both `['m365-sync-logs']` and `['m365-integration-status']` on success? Correct caches targeted?
- [ ] **Module imports:** `M365SyncModule` properly imported in `AuthModule` for `M365SyncService` injection? No circular dependency?
- [ ] **Self-referential FK pattern:** `managerId` → `User` with `@relation("ManagerReports")` — correct Prisma self-relation pattern?
- [ ] **Two-pass sync architecture:** Pass 1 (create/update users) runs before Pass 2 (link managers) — no chicken-and-egg issue?
- [ ] **Promise.allSettled pattern:** `syncUserFromGraph` uses `Promise.allSettled` for 3 parallel Graph API calls — correct error isolation (one failure doesn't crash the others)?
- [ ] **Shared helper reuse:** `syncUserFromGraph()` used by both login-time mini-sync (auth.service) and GROUPS_ONLY sync — DRY principle honored?

### 2. Backend — Schema & Migration

#### migration.sql (8 lines)
- [ ] `ALTER TABLE "users" ADD COLUMN "managerId" TEXT` — nullable, no default. Safe for existing rows.
- [ ] `CREATE INDEX "users_managerId_idx"` — performance index for `findMany({ where: { managerId } })` queries
- [ ] `ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE` — `onDelete: SetNull` ensures subordinates aren't orphaned when manager is deleted
- [ ] No data migration needed (all existing `managerId` will be null, populated by next sync)

#### schema.prisma (+6 lines)
- [ ] `managerId String?` — nullable, correct for users without managers (top-level / local users)
- [ ] `manager User? @relation("ManagerReports", fields: [managerId], references: [id], onDelete: SetNull)` — correct self-relation
- [ ] `directReports User[] @relation("ManagerReports")` — reverse relation for querying subordinates
- [ ] `@@index([managerId])` — matches migration index
- [ ] No other schema changes — no breaking changes to existing fields

#### seed-uat.ts (+10 lines)
- [ ] Links `employee.managerId = manager.id` after both users are created — correct ordering
- [ ] Uses `prisma.user.update()` for linking — avoids FK constraint violation during creation

### 3. Backend — Auth Service Changes

#### auth.service.ts (+31/−4)
- [ ] **Empty passwordHash guard (AC #32):** `if (!user.passwordHash)` check BEFORE `bcrypt.compare()` — prevents bcrypt from evaluating empty string against any password. Returns same `UnauthorizedException('Invalid credentials')` — no account existence leakage. ✓
- [ ] **Guard placement:** Empty hash check comes after `user.findUnique()` but before `bcrypt.compare()` — correct position in the flow
- [ ] **Guard covers both empty string AND null:** `!user.passwordHash` is truthy for both `''` and `null` — correct
- [ ] **Login-time mini-sync trigger:** After `bcrypt.compare(password, user.passwordHash)` succeeds AND `user.azureId` exists → calls `this.m365SyncService.syncUserFromGraph()`
- [ ] **Sync result handling:** If `syncResult.rejected === true` → throws `UnauthorizedException` — blocks login for disabled M365 accounts
- [ ] **Fresh user for JWT:** After mini-sync, re-fetches user via `findUnique` to get updated role for JWT payload — ensures token reflects current role after sync
- [ ] **Local user skip:** Mini-sync only triggers when `user.azureId` is non-null — local users unaffected
- [ ] **M365SyncService injection:** Added to constructor via `@Inject()` — verify no circular dependency with `AuthModule`
- [ ] **Error handling:** What happens if `syncUserFromGraph()` throws an unexpected exception (not a rejected result)? Does it propagate as 500, or is there a try/catch? **Verify graceful failure.**

#### auth.service.spec.ts (+176 lines — 8 new tests)
- [ ] **Empty hash — empty string:** `passwordHash: ''` → throws `UnauthorizedException`, `bcrypt.compare` NOT called ✓
- [ ] **Empty hash — null:** `passwordHash: null` → throws `UnauthorizedException`, `bcrypt.compare` NOT called ✓
- [ ] **Mini-sync trigger:** M365 user → after bcrypt → `syncUserFromGraph` called with `{ id, azureId, lastSyncAt }` ✓
- [ ] **Account disabled:** `syncResult.rejected = true` → throws `UnauthorizedException` ✓
- [ ] **Local user skip:** `azureId: null` → `syncUserFromGraph` NOT called ✓
- [ ] **Fresh JWT role (AC #31):** User role changes from EMPLOYEE→ADMIN after sync → JWT `sign()` called with `role: ADMIN` ✓
- [ ] **Degradation — 2h (accept):** `lastSyncAt = 2h ago`, Graph unavailable → login succeeds ✓
- [ ] **Degradation — 48h (reject) (AC #35):** `lastSyncAt = 48h ago`, Graph unavailable → login rejected ✓
- [ ] **Missing test:** What about `lastSyncAt = null` + Graph unavailable? (covered in m365-sync.service.spec.ts instead)

### 4. Backend — M365 Sync Service (CRITICAL — Largest Change)

#### m365-sync.service.ts (+484/−19)

**getUserRoleFromGroups(azureId)**
- [ ] Calls `GET /users/{azureId}/memberOf` via Graph client
- [ ] Filters response for `@odata.type === '#microsoft.graph.group'` — excludes directoryRole entries
- [ ] Checks group IDs against `AZURE_ADMIN_GROUP_ID` and `AZURE_ISSUER_GROUP_ID` from `process.env`
- [ ] **Priority:** ADMIN checked first (if in both groups → ADMIN wins) — matches AC #30
- [ ] Returns `null` when no match or API error — callers must handle null
- [ ] **Graceful failure:** Wrapped in try/catch → returns `null` on Graph API error (network, 403, etc.)

**resolveUserRole(azureId, existingUser, hasDirectReports)**
- [ ] Priority chain: SecurityGroup > roleSetManually > directReports > EMPLOYEE — matches AC #30
- [ ] **Local user guard (AC #26):** If `existingUser.azureId === null` → returns existing role unchanged — sync doesn't overwrite locally-assigned roles
- [ ] `hasDirectReports` parameter drives MANAGER upgrade for users with subordinates
- [ ] Security Group result (from `getUserRoleFromGroups`) takes top priority — overrides all other role sources
- [ ] `roleSetManually` respected: if no Security Group match AND `roleSetManually === true` → keeps existing role
- [ ] Default fallback: EMPLOYEE — correct for new users with no group membership and no reports

**linkManagerRelationships(syncedAzureIds)**
- [ ] Iterates `syncedAzureIds` array (users synced in Pass 1)
- [ ] For each: looks up local user by `azureId` → `GET /users/{azureId}/manager` → finds local user matching manager's `azureId` → sets `managerId`
- [ ] **Graph 404 handling:** Manager endpoint returns 404 for top-level users (no manager) — should be caught and skipped, not treated as error. **Verify the 404 catch logic.**
- [ ] **Manager not in system:** If Graph returns a manager `azureId` but no local user matches → `managerId` remains null. Is this logged? Should it be?
- [ ] **onDelete: SetNull alignment:** If a manager user is deleted, FK cascade sets `managerId = null` on subordinates — matches schema

**syncUserFromGraph(user)** — Shared helper for login-time + GROUPS_ONLY
- [ ] 3 parallel calls via `Promise.allSettled`: profile (`/users/{azureId}`), memberOf, manager
- [ ] **accountEnabled check:** If `profile.accountEnabled === false` → returns `{ rejected: true, reason: 'M365 account disabled' }`
- [ ] **Profile update:** Extracts `displayName` → splits into `firstName`/`lastName`; updates `department`
- [ ] **displayName split logic:** How does it handle single-name users (no space)? e.g., "Madonna" → `firstName: 'Madonna', lastName: ''`? **Verify edge case.**
- [ ] **Role update:** Uses `getUserRoleFromGroups()` → `resolveUserRole()` chain
- [ ] **managerId update:** Finds manager by `azureId` → sets FK. Handles 404 gracefully.
- [ ] **lastSyncAt:** Updated to `new Date()` after successful sync
- [ ] **24h degradation window (AC #35):** If ALL 3 Graph calls fail AND `lastSyncAt > 24h` → returns `{ rejected: true, reason: 'expired' }`; if `lastSyncAt` within 24h → returns `{ rejected: false }` (allow login with cached data)
- [ ] **No lastSyncAt:** If `lastSyncAt` is null AND Graph unavailable → rejected (user was never synced)
- [ ] **PII-free logging (AC #38):** Verify that `this.logger` calls do NOT include `email` or `displayName` — only `id` and `azureId`

**runGroupsOnlySync(syncedBy)**
- [ ] Queries existing M365 users from DB: `findMany({ where: { azureId: { not: null } } })`
- [ ] For each user: calls `getUserRoleFromGroups() + GET /manager` → updates role + managerId
- [ ] **Does NOT import new users** — only refreshes existing M365 users' roles/managers
- [ ] Creates `M365SyncLog` with `syncType: 'GROUPS_ONLY'`
- [ ] Correct log counters: `updatedUsers` count, no `createdUsers`

**updateDirectReportsRoles(syncedAzureIds)**
- [ ] After Pass 2 (linkManagerRelationships), queries users who now have `directReports` (count > 0)
- [ ] Upgrades `EMPLOYEE` → `MANAGER` for users with subordinates AND `roleSetManually === false`
- [ ] **Does NOT downgrade:** If a user with `role: MANAGER` loses all direct reports, they keep MANAGER. Is this intentional? **Verify.**
- [ ] **roleSetManually guard:** Users with `roleSetManually = true` are skipped — correct

**Enhanced runSync()**
- [ ] Routes `GROUPS_ONLY` → `runGroupsOnlySync()` — separate code path
- [ ] FULL/INCREMENTAL: Pass 1 → Pass 2 (`linkManagerRelationships`) → Pass 2b (`updateDirectReportsRoles`) → deactivations
- [ ] **syncedAzureIds tracking:** Collects `azureId` values from synced users in Pass 1 → passes to Pass 2
- [ ] PII cleanup in `syncUserDeactivations`: `select` no longer includes `email` field (AC #38)

**Enhanced syncSingleUser()**
- [ ] Added `select` for `role`, `roleSetManually`, `azureId` in existing user lookup
- [ ] Calls `resolveUserRole()` instead of hardcoded role assignment
- [ ] Passes existing user context to `resolveUserRole` for proper priority evaluation

### 5. Backend — Scoping Migration (department → managerId)

#### dashboard.service.ts (+12/−23)
- [ ] **getManagerDashboard:** Removed `findUnique` for manager's department → Removed `where: { department }` → Replaced with `findMany({ where: { managerId: userId, isActive: true } })`
- [ ] Removed `role: 'EMPLOYEE'` filter — direct reports may have any role (ISSUER can report to MANAGER)
- [ ] **Empty team handling:** If no direct reports → `teamMembersCount: 0`, `revocationAlerts: []` — correct graceful handling
- [ ] **No department lookup failure:** Old code threw error if manager had no department. New code never fails — just returns empty list.

#### badge-issuance.service.ts (+4/−16)
- [ ] **revokeBadge:** Authorization check changed from `actor.department === badge.recipient.department` → `badge.recipient?.managerId === actor.id` — manager can only revoke badges for their direct reports
- [ ] **getIssuedBadges:** Manager scoping changed from department lookup → `where: { recipient: { managerId: userId } }` — shows badges of direct reports only
- [ ] **Security implication:** This is more restrictive than department-based scoping (only direct reports, not entire department). Is this the intended behavior? **Verify with AC #21.**

#### analytics.service.ts (+8/−18)
- [ ] **getTopPerformers:** MANAGER filter changed from `where: { department }` → `where: { managerId: currentUserId }`
- [ ] Removed `role: 'EMPLOYEE'` filter — consistent with dashboard change
- [ ] `teamName` for MANAGER context changed to `'Direct Reports'` — correct label
- [ ] **ForbiddenException:** Still thrown when MANAGER passes explicit `teamId` parameter — correct, managers only see their direct reports
- [ ] **Empty result:** MANAGER with no direct reports → returns empty `topPerformers` array instead of throwing ForbiddenException (old behavior threw when department was null). This is a **behavior change** — verify intentional.

### 6. Frontend — M365 Sync UI

#### m365SyncApi.ts (61 lines)
- [ ] `triggerSync(syncType, syncedBy)` → `POST /admin/m365-sync` with `apiFetchJson` — correct endpoint
- [ ] `getSyncLogs(limit)` → `GET /admin/m365-sync?limit=N` — correct
- [ ] `getIntegrationStatus()` → `GET /admin/m365-sync/status` — correct
- [ ] Error handling: `apiFetchJson` should throw on non-2xx — verify
- [ ] **Content-Type:** Does `apiFetchJson` set `Content-Type: application/json` automatically for POST? **Same concern as Story 12.2 — verify `apiFetch.ts` implementation.**

#### useM365Sync.ts (54 lines)
- [ ] `useM365SyncLogs()`: `queryKey: ['m365-sync-logs']`, `staleTime: 30_000` — reasonable for polling
- [ ] `useM365IntegrationStatus()`: `queryKey: ['m365-integration-status']`, `staleTime: 60_000` — reasonable
- [ ] `useTriggerSync()`: `useMutation` with `onSuccess` invalidating both query keys — correct
- [ ] **Error notification:** Does mutation have `onError` toast? Or does M365SyncPanel handle it?

#### M365SyncPanel.tsx (207 lines)
- [ ] **Collapsible panel:** Uses `<Collapsible>` from Shadcn? Or custom toggle with state?
- [ ] **"Sync Users" button:** Triggers `triggerSync('FULL')` — correct
- [ ] **"Sync Roles" button:** Triggers `triggerSync('GROUPS_ONLY')` — correct (AC #28)
- [ ] **Button disabled states:** Disabled while mutation is pending? Prevents double-click?
- [ ] **Sync history table:** Columns: date, type badge, users synced, created, updated, failed, status icon, duration — matches AC #29
- [ ] **Type badge:** FULL vs GROUPS_ONLY displayed with different badge colors?
- [ ] **Status icon:** Success (green check) / Failed (red X) / In-progress (spinner)?
- [ ] **Loading/empty states:** Shows skeleton or message when no sync history?
- [ ] **Integration status badge:** Shows M365 connection status (connected/disconnected)?
- [ ] **Responsive:** Does the sync history table handle mobile viewport?

#### badge.tsx (33 lines) + table.tsx (94 lines)
- [ ] Standard Shadcn components — verify they match the project's Shadcn configuration (`components.json`)
- [ ] `badge.tsx`: `cva` variants (default, secondary, destructive, outline) — standard
- [ ] `table.tsx`: Exports all necessary components (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableFooter`)
- [ ] **Tailwind v4 compatibility:** Shadcn components generated for Tailwind v4? Or v3? The project uses Tailwind 4.1. Verify class names are compatible.

### 7. Security Review

- [ ] **AC #32 — Empty passwordHash guard:** `auth.service.ts` checks `!user.passwordHash` before `bcrypt.compare()` — prevents M365 users (synced with empty hash) from authenticating via password. Same error message as invalid password — no account existence leakage. ✓
- [ ] **AC #35 — 24h degradation window:** `syncUserFromGraph()` checks `lastSyncAt` age when Graph API is unavailable. > 24h → reject (401). ≤ 24h → allow with cached data + warning log. No `lastSyncAt` → reject. ✓
- [ ] **AC #38 — PII-free logging:** `syncUserDeactivations` select no longer includes `email`. Verify ALL `this.logger.*` calls in updated methods reference only `user.id` and `azureId`, never `email`/`displayName`/`firstName`/`lastName`.
- [ ] **AC #26 — Local user protection:** `resolveUserRole()` checks `existingUser.azureId === null` → returns existing role. Sync cannot overwrite locally-assigned roles. ✓
- [ ] **Security Group IDs in env:** `AZURE_ADMIN_GROUP_ID` and `AZURE_ISSUER_GROUP_ID` read from `process.env`. Verify these are listed in `.env.example` or documented. Are they validated on startup (fail-fast if missing)?
- [ ] **Graph API permission:** `GroupMember.Read.All` permission required for `/memberOf` endpoint. Verify it's documented as a prerequisite.
- [ ] **Manager endpoint permission:** `GET /users/{id}/manager` requires `User.Read.All` — already configured.
- [ ] **Authorization on sync endpoints:** `POST /admin/m365-sync` — verify it requires ADMIN role via `@Roles(UserRole.ADMIN)` guard.
- [ ] **JWT tampering:** After mini-sync changes role, fresh user is re-fetched from DB for JWT — attacker cannot manipulate old token role.

### 8. Performance Considerations

- [ ] **3 parallel Graph calls in mini-sync:** `Promise.allSettled` for profile + memberOf + manager — true parallelism, not sequential. Target overhead 200-300ms per login (AC #31). ✓
- [ ] **GROUPS_ONLY optimization:** Only queries existing M365 users from DB (no `getAllAzureUsers` call to Graph). Graph calls per user: memberOf + manager = 2 calls. For N users, 2N Graph API calls. Is this rate-limited or batched?
- [ ] **Two-pass sync:** Pass 2 iterates all `syncedAzureIds` for manager linkage — each user makes 1 Graph call (`/manager`). For 100 users: 100 additional calls. Are these sequential or parallelized with concurrency limit?
- [ ] **Index coverage:** `@@index([managerId])` on User model — covers all new `findMany({ where: { managerId } })` queries in dashboard, badge-issuance, analytics. ✓
- [ ] **Login latency impact:** Mini-sync adds ~200-300ms to M365 user login. Is this acceptable? Is it documented/communicated?
- [ ] **Degradation window perf:** When Graph is unavailable and within 24h window → sync is skipped entirely → no additional latency. ✓

### 9. Test Coverage Review

#### m365-sync.service.spec.ts (+582 lines — 6 test suites)
- [ ] **getUserRoleFromGroups (6 tests):** ADMIN match, ISSUER match, no match, both groups (ADMIN wins), API failure graceful, non-group filter
- [ ] **syncSingleUser role resolution (4 tests):** ADMIN via Security Group, local user preserve, default EMPLOYEE, roleSetManually preserve
- [ ] **runSync Pass 2 (2 tests):** Manager linkage in FULL sync, EMPLOYEE→MANAGER upgrade for users with directReports
- [ ] **GROUPS_ONLY sync (3 tests):** No new user import, Security Group role update, syncType log entry
- [ ] **syncUserFromGraph (6 tests):** Account disabled → reject, Graph unavailable + 2h cache → accept, Graph unavailable + 48h → reject, no lastSyncAt → reject, profile + role update, managerId update
- [ ] **PII-free logging (1 test):** Deactivation select excludes `email` field
- [ ] **Missing test coverage?** Edge cases to check:
  - [ ] `resolveUserRole` when `azureId` is non-null but no Security Group match AND not roleSetManually AND no directReports → should be EMPLOYEE
  - [ ] `linkManagerRelationships` when manager's `azureId` exists in Graph but not in local DB
  - [ ] `syncUserFromGraph` with `displayName` that has no space (single word name)
  - [ ] `runGroupsOnlySync` with 0 existing M365 users → should complete cleanly
  - [ ] Race condition: two simultaneous logins for same M365 user both triggering mini-sync

#### auth.service.spec.ts (+176 lines — 8 tests)
- [ ] All 8 tests cover login-time mini-sync scenarios exhaustively
- [ ] Mock setup: `mockM365SyncService.syncUserFromGraph` properly injected
- [ ] Fresh JWT test verifies `mockPrismaService.user.findUnique` called twice (initial lookup + post-sync refresh)
- [ ] Degradation tests use realistic timestamps (2h, 48h)

#### dashboard.service.spec.ts (+25/−6)
- [ ] Old test `'should handle manager without department'` → replaced with `'should return empty team when manager has no direct reports'` — correct migration
- [ ] New test `'should query by managerId for direct reports'` — verifies `findMany` called with `{ managerId, isActive: true }` ✓
- [ ] **No test for non-EMPLOYEE direct reports:** What if a direct report has `role: ISSUER`? Is it included in team list? (Should be, since `role: 'EMPLOYEE'` filter removed)

#### analytics.service.spec.ts (+14/−15)
- [ ] Old test `'should filter by department for MANAGER role'` → replaced with `'should filter by managerId for MANAGER role'` ✓
- [ ] Old test `'should throw ForbiddenException if MANAGER has no department'` → replaced with `'should return empty list for MANAGER with no direct reports'` — **behavior change verified**: no longer throws, returns empty list with `teamName: 'Direct Reports'` ✓
- [ ] ForbiddenException test updated: now throws when MANAGER passes explicit `teamId` (not when department is missing)

---

## Potential Issues Identified Pre-Review

### 🔴 P0 — Verify `syncUserFromGraph` Error Isolation in Auth Flow

**File:** `backend/src/modules/auth/auth.service.ts`
**Issue:** If `syncUserFromGraph()` throws an unexpected exception (not a structured `{ rejected, reason }` response — e.g., unhandled `TypeError`, `null` dereference), it may crash the entire login flow with a 500 Internal Server Error instead of gracefully allowing login.
**Impact:** HIGH — all M365 user logins could break if Graph API returns unexpected data.
**Action:** Verify there's a try/catch around `await this.m365SyncService.syncUserFromGraph(user)` in `auth.service.ts`. If not, add one that logs the error and allows login with cached data (within degradation window).

### 🟡 P1 — displayName Split Edge Case

**File:** `backend/src/m365-sync/m365-sync.service.ts` — `syncUserFromGraph()`
**Issue:** `displayName.split(' ')` for firstName/lastName extraction. Edge cases: single-word name ("Cher"), triple-word name ("Mary Jane Watson"), CJK names with no space.
**Impact:** Low — data quality issue, not a crash. But `lastName` could be empty string or include middle name.
**Recommendation:** Verify the split logic handles edge cases. Consider using first token as firstName and rest as lastName: `const [first, ...rest] = displayName.split(' '); firstName = first; lastName = rest.join(' ');`

### 🟡 P1 — GROUPS_ONLY Rate Limiting for Large Tenants

**File:** `backend/src/m365-sync/m365-sync.service.ts` — `runGroupsOnlySync()`
**Issue:** For each existing M365 user, makes 2 Graph API calls (memberOf + manager). For 100 users = 200 Graph API calls, potentially without concurrency throttling. Microsoft Graph API has rate limits (~10,000 requests/10 min for apps, but burst limits are lower).
**Impact:** Medium for large tenants — could hit throttling responses (429) and partial sync failures.
**Recommendation:** Verify if there's concurrency control (e.g., `p-limit`, batching). If not, document as known limitation for MVP.

### 🟡 P1 — Badge-Issuance Scoping Change (department → managerId)

**File:** `backend/src/badge-issuance/badge-issuance.service.ts` — `revokeBadge()`
**Issue:** Authorization changed from `actor.department === recipient.department` to `recipient.managerId === actor.id`. This means a manager can now ONLY revoke badges for their **direct** reports, not for anyone in their department (including subordinates' reports). If Manager A → Manager B → Employee C, Manager A cannot revoke Employee C's badges.
**Impact:** Narrower scope than before — could be intentional (tighter security) or unintentional (loss of functionality).
**Recommendation:** Verify this matches AC #21's intent. If hierarchical scoping is needed, consider recursive `managerId` lookup.

### 🟡 P1 — No Downgrade Path for MANAGER → EMPLOYEE

**File:** `backend/src/m365-sync/m365-sync.service.ts` — `updateDirectReportsRoles()`
**Issue:** Users are upgraded to MANAGER when they gain directReports, but there's no corresponding downgrade when they lose all directReports. A manager who no longer has any subordinates will retain MANAGER role indefinitely.
**Impact:** Medium — role inflation over time. But `roleSetManually` users are protected, and GROUPS_ONLY re-sync only upgrades, never downgrades.
**Recommendation:** Document as known behavior. Downgrade logic can be added in future sprint if needed.

### 🟡 P1 — Security Group IDs Not Validated on Startup

**Files:** `backend/src/m365-sync/m365-sync.service.ts`
**Issue:** `AZURE_ADMIN_GROUP_ID` and `AZURE_ISSUER_GROUP_ID` are read from `process.env` at call time. If not set, `getUserRoleFromGroups()` silently returns `null` (no match). There's no startup validation or warning.
**Impact:** Low — sync works without groups (all users default to EMPLOYEE). But admin may not realize groups aren't configured.
**Recommendation:** Add a startup log warning if either group ID is not configured. Or verify if this is handled in `M365SyncModule.onModuleInit()`.

### 🟢 P2 — M365SyncPanel Not Yet Integrated into a Page

**File:** `frontend/src/components/admin/M365SyncPanel.tsx`
**Issue:** The component is created but may not be integrated into any existing page (e.g., `/admin/users` or a settings page). Verify where it's mounted.
**Recommendation:** Check `App.tsx` routes and admin pages for `<M365SyncPanel />` usage. If not integrated, this is a gap — the UI exists but is unreachable by admins.

### 🟢 P2 — Shadcn Components Tailwind v4 Compatibility

**Files:** `frontend/src/components/ui/badge.tsx`, `frontend/src/components/ui/table.tsx`
**Issue:** Shadcn components may be generated for Tailwind v3 syntax. The project uses Tailwind 4.1. Check for any v3-only class names or patterns (e.g., `@apply` usage in JS).
**Recommendation:** Verify components render correctly in the existing Tailwind v4 setup.

---

## Acceptance Criteria Verification Matrix

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| 19 | Prisma schema: `managerId` self-referential FK | ✅ | `schema.prisma`: `managerId String?`, `manager`/`directReports` relations, `@@index` |
| 20 | Migration: seed users linked via `managerId` | ✅ | `seed-uat.ts`: `employee.managerId = manager.id` |
| 21 | Backend scoping migrated: department → managerId | ✅ | `dashboard.service.ts`, `badge-issuance.service.ts`, `analytics.service.ts` all changed |
| 23 | M365 sync fetches directReports → sets managerId FK (two-pass) | ✅ | `linkManagerRelationships()` in Pass 2, `updateDirectReportsRoles()` in Pass 2b |
| 24 | M365 sync checks Security Group membership → ADMIN/ISSUER roles | ✅ | `getUserRoleFromGroups()` checks `/memberOf` against group IDs |
| 25 | Security Group IDs configurable via `.env` | ✅ | `AZURE_ADMIN_GROUP_ID`, `AZURE_ISSUER_GROUP_ID` from `process.env` |
| 26 | Sync skips role update for local users (`azureId = null`) | ✅ | `resolveUserRole()` checks `existingUser.azureId === null` → returns existing role |
| 27 | GROUPS_ONLY sync mode: refreshes groups + managers without re-importing | ✅ | `runGroupsOnlySync()` queries existing M365 users only |
| 28 | UI: "Sync Users" + "Sync Roles" buttons | ✅ | `M365SyncPanel.tsx`: two buttons triggering FULL and GROUPS_ONLY |
| 29 | Sync history table shows sync type (FULL / GROUPS_ONLY) | ✅ | `M365SyncPanel.tsx`: history table with type badge column |
| 30 | Role priority: SecurityGroup > roleSetManually > directReports > EMPLOYEE | ✅ | `resolveUserRole()` implements the priority chain |
| 31 | Login-time mini-sync for M365 users | ✅ | `auth.service.ts`: calls `syncUserFromGraph()` after password verification |
| 32 | Empty `passwordHash` → 401 (no account existence leakage) | ✅ | `auth.service.ts`: `if (!user.passwordHash) throw UnauthorizedException` |
| 35 | Degradation window: lastSyncAt > 24h → reject login | ✅ | `syncUserFromGraph()`: checks `lastSyncAt` age, rejects if > 24h |
| 38 | Sync logs/records MUST NOT contain user PII | ✅ | `syncUserDeactivations` select removes `email`; test verifies no email in select |

**Summary:** 15/15 12.3a ACs verified in code. All pass.

**Note:** ACs #22, #33, #34, #36, #37 belong to Sub-story 12.3b and are NOT in scope for this review.

---

## Key Files for Review

| Priority | File | Lines | Focus |
|----------|------|-------|-------|
| 🔴 HIGH | `m365-sync.service.ts` | +484 | Core sync logic: `getUserRoleFromGroups`, `resolveUserRole`, `linkManagerRelationships`, `syncUserFromGraph`, `runGroupsOnlySync`, `updateDirectReportsRoles`. Error handling, Graph API call patterns, role priority chain |
| 🔴 HIGH | `auth.service.ts` | +31 | Empty hash guard placement, mini-sync trigger, fresh JWT, error isolation around `syncUserFromGraph` call |
| 🔴 HIGH | `m365-sync.service.spec.ts` | +582 | Test coverage completeness — are all edge cases covered? Mock setup correctness for Graph API |
| 🟡 MED | `dashboard.service.ts` | +12/−23 | department→managerId migration correctness, `role: 'EMPLOYEE'` filter removal |
| 🟡 MED | `badge-issuance.service.ts` | +4/−16 | Scoping change from department to direct-reports-only — verify intended narrower scope |
| 🟡 MED | `analytics.service.ts` | +8/−18 | Behavior change: MANAGER with no reports → empty list (not ForbiddenException). Verify intentional |
| 🟡 MED | `M365SyncPanel.tsx` | 207 | UI component: button states, table rendering, loading/empty states. Verify it's mounted in a route |
| 🟡 MED | `auth.service.spec.ts` | +176 | 8 new login-time mini-sync tests — completeness and mock correctness |
| 🟢 LOW | `schema.prisma` + `migration.sql` | +14 | Self-referential FK pattern, index, onDelete: SetNull |
| 🟢 LOW | `seed-uat.ts` | +10 | managerId linkage ordering |
| 🟢 LOW | `m365SyncApi.ts` + `useM365Sync.ts` | 115 | API layer + hooks — standard patterns |
| 🟢 LOW | `badge.tsx` + `table.tsx` | 127 | Shadcn components — verify Tailwind v4 compatibility |
| 🟢 LOW | `trigger-sync.dto.ts` | +8 | GROUPS_ONLY enum addition + validation |
| 🟢 LOW | `dashboard.service.spec.ts` + `analytics.service.spec.ts` | +39/−21 | Updated tests for managerId scoping |

---

## Review Execution Guide

1. **Read Story file** — focus on ACs #19–31, #32, #35, #38 (12.3a scope)
2. **Start with HIGH priority files:**
   - `m365-sync.service.ts` — trace the full sync flow: `runSync()` → Pass 1 (`syncSingleUser` + `resolveUserRole`) → Pass 2 (`linkManagerRelationships`) → Pass 2b (`updateDirectReportsRoles`)
   - `auth.service.ts` — verify empty hash guard position, mini-sync error isolation, fresh user re-fetch
   - `m365-sync.service.spec.ts` — verify all 22 tests cover the critical paths
3. **Verify error handling:**
   - What happens if `syncUserFromGraph()` throws in `auth.service.ts`? Is there a try/catch?
   - What happens if `getUserRoleFromGroups()` throws? (Should return null)
   - What happens if `linkManagerRelationships` encounters a user whose manager isn't in the local DB?
4. **Check scoping migration (MED priority):**
   - `dashboard.service.ts` — no department lookup, no role filter
   - `badge-issuance.service.ts` — direct reports only (narrower than department)
   - `analytics.service.ts` — behavior change for MANAGER with no reports
5. **Verify frontend integration:**
   - Is `M365SyncPanel` mounted in a route/page?
   - Do Shadcn badge/table components render with Tailwind v4?
6. **Run tests:**
   ```bash
   cd gcredit-project/backend && npx jest --forceExit
   cd gcredit-project/backend && npx jest m365-sync.service.spec --verbose --forceExit
   cd gcredit-project/backend && npx jest auth.service.spec --verbose --forceExit
   cd gcredit-project/backend && npx tsc --noEmit
   cd gcredit-project/frontend && npx tsc --noEmit
   ```
7. **Manual verification (if environment available):**
   - Run `npx prisma migrate status` — verify migration applied
   - Trigger FULL sync → check manager linkage in DB (`SELECT id, managerId FROM users WHERE managerId IS NOT NULL`)
   - Trigger GROUPS_ONLY sync → verify roles updated based on Security Group membership
   - Login as M365 user → verify mini-sync runs (check logs for "syncUserFromGraph" entries)
   - Login as local user → verify no mini-sync triggered
   - Attempt password login with M365 user (empty hash) → verify 401
