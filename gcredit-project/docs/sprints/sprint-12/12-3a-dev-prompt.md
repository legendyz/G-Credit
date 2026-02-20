# Dev Prompt: Story 12.3a — Manager Hierarchy + M365 Sync Enhancement

**Story:** 12.3a (16h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Depends On:** Sprint 11 complete (v1.1.0), Story 12.1 + 12.2 accepted
**Blocks:** Story 12.3b (User Management UI) depends on schema + sync changes from this story

---

## Objective

Implement schema changes (managerId FK), migrate department-based scoping to managerId-based scoping, enhance M365 sync with Security Group role mapping + directReports + group-only sync mode, and implement login-time mini-sync for M365 users. This establishes the foundational data model and sync infrastructure that Story 12.3b UI will consume.

---

## Acceptance Criteria (12.3a scope)

From the story doc — ACs owned by 12.3a:

| AC# | Summary |
|-----|---------|
| **19** | Prisma schema: `managerId` self-referential FK added to User model |
| **20** | Migration: existing seed users linked via `managerId` (employee → manager) |
| **21** | Backend scoping migrated from `department` to `managerId`: dashboard, badge-issuance, analytics |
| **22** | Seed data: keep `admin@gcredit.com` as bootstrap (others optional for dev) |
| **23** | M365 sync fetches directReports → sets `managerId` FK (two-pass) |
| **24** | M365 sync checks Security Group membership → assigns ADMIN/ISSUER roles |
| **25** | Security Group IDs configured via `.env` |
| **26** | Sync skips role update for locally-created users (`azureId = null`) |
| **27** | Group-only sync mode: `syncType: 'GROUPS_ONLY'` |
| **28** | UI: "Sync Users" + "Sync Roles" buttons |
| **29** | Sync history table shows sync type (FULL / GROUPS_ONLY) |
| **30** | Role priority: Security Group > roleSetManually > directReports > EMPLOYEE |
| **31** | Login-time mini-sync (complete single-user sync on every M365 login) |
| **32** | Empty `passwordHash` login rejection (401, no account existence leakage) |
| **35** | Degradation window: `lastSyncAt > 24h` + Graph unavailable → reject login |
| **38** | Sync logs must NOT contain user PII (name, email) — reference by internal `id` only |

---

## Tasks (9–16)

### Task 9: Schema — `managerId` self-relation (AC: #19, #20)

**File:** `gcredit-project/backend/prisma/schema.prisma`

Add to the User model (after the existing `lastSyncAt` field):

```prisma
managerId     String?
manager       User?   @relation("ManagerReports", fields: [managerId], references: [id], onDelete: SetNull)
directReports User[]  @relation("ManagerReports")
```

**Current User model** (relevant excerpt — add AFTER `lastSyncAt DateTime?`):
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  department    String?
  role          UserRole  @default(EMPLOYEE)
  azureId       String?   @unique
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  lastLoginAt   DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  roleSetManually Boolean   @default(false)
  roleUpdatedAt   DateTime?
  roleUpdatedBy   String?
  roleVersion     Int       @default(0)
  lastSyncAt      DateTime?
  // ADD HERE ↓
  // managerId     String?
  // manager       User?   @relation(...)
  // directReports User[]  @relation(...)
  // ... existing relations below
}
```

**Migration:**
```bash
npx prisma migrate dev --name add-manager-id-self-relation
```

**Seed update** (`prisma/seed-uat.ts`):
- Current seed creates 5 users: admin, issuer, manager, employee, m365DevAdmin
- After creating all users, link: employee.managerId = manager.id
- Guard other demo seeds: `if (process.env.NODE_ENV !== 'production')` or always create (they're harmless in dev)
- Keep `admin@gcredit.com` as permanent bootstrap seed

---

### Task 10: Backend scoping migration — department → managerId (AC: #21)

Migrate 4 locations from `department` string matching to `managerId` FK:

#### 10a. `dashboard.service.ts` → `getManagerDashboard()`

**Current code** (~L263):
```typescript
const manager = await this.prisma.user.findUnique({
  where: { id: userId },
  select: { department: true },
});
const department = manager?.department || null;
const teamMembers = department
  ? await this.prisma.user.findMany({
      where: { department, role: 'EMPLOYEE', isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
  : [];
```

**Change to:**
```typescript
const teamMembers = await this.prisma.user.findMany({
  where: { managerId: userId, isActive: true },
  select: { id: true, firstName: true, lastName: true, email: true },
});
```

Note: Remove the interim `findUnique` call — `managerId = userId` directly queries direct reports. No department lookup needed. No role filter (`role: 'EMPLOYEE'`) — a manager's direct reports may have any role.

#### 10b. `badge-issuance.service.ts` → `revokeBadge()` (~L398)

**Current code:**
```typescript
if (actor.role === UserRole.MANAGER) {
  canRevoke =
    !!actor.department &&
    !!badge.recipient?.department &&
    actor.department === badge.recipient.department;
}
```

**Change to:**
```typescript
if (actor.role === UserRole.MANAGER) {
  canRevoke = badge.recipient?.managerId === actor.id;
}
```

Note: `badge.recipient` must include `managerId` in the select/include. Check the Prisma query that loads the badge — add `managerId` to the recipient select.

#### 10c. `badge-issuance.service.ts` → `getIssuedBadges()` (~L692)

**Current code:**
```typescript
else if (userRole === UserRole.MANAGER) {
  const manager = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { department: true },
  });
  if (manager?.department) {
    where.recipient = { department: manager.department };
  } else {
    where.id = 'none';
  }
}
```

**Change to:**
```typescript
else if (userRole === UserRole.MANAGER) {
  where.recipient = { managerId: userId };
}
```

#### 10d. `analytics.service.ts` → `getTopPerformers()` (~L303)

**Current code:**
```typescript
if (currentUserRole === 'MANAGER') {
  const manager = await this.prisma.user.findUnique({
    where: { id: currentUserId },
    select: { department: true },
  });
  if (!manager?.department) {
    throw new ForbiddenException('Manager has no assigned department');
  }
  filterDepartment = manager.department;
  if (teamId && teamId !== filterDepartment) {
    throw new ForbiddenException('You can only view your own team');
  }
}
```

**Change to:**
```typescript
if (currentUserRole === 'MANAGER') {
  // Manager can only see their direct reports
  filterManagerId = currentUserId;
  if (teamId) {
    throw new ForbiddenException('You can only view your own team');
  }
}
```

Then in the query: `where: { ...(filterManagerId && { managerId: filterManagerId }), isActive: true }` (remove `filterDepartment` and department-based filtering for MANAGER role).

**IMPORTANT:** Keep `department` field for display only. Do NOT remove it from the schema. The migration is only about access control scoping.

**Update all affected tests** — see Task 16.

---

### Task 11: M365 sync — Security Group role mapping (AC: #24, #25, #26, #30)

**Files:** `m365-sync.service.ts`, `.env`

#### 11a. Environment variables

Already configured in `.env` (and `.env.example`):
```env
AZURE_ADMIN_GROUP_ID="3403ed09-414d-490a-ac69-3c2c38c14c38"
AZURE_ISSUER_GROUP_ID="7aa2bac0-0146-4cec-9d7a-17c9f63264ba"
```

Read these in the service via `ConfigService` or `process.env`.

#### 11b. Security Group membership check

Add a new method to `m365-sync.service.ts`:

```typescript
/**
 * Check user's Security Group memberships to determine role.
 * Returns the highest-priority role based on group membership.
 */
private async getUserRoleFromGroups(azureId: string): Promise<UserRole | null> {
  try {
    const url = `https://graph.microsoft.com/v1.0/users/${azureId}/memberOf`;
    const response = await this.fetchWithRetry<{ value: Array<{ id: string; '@odata.type': string }> }>(url);
    
    const groupIds = response.value
      .filter(m => m['@odata.type'] === '#microsoft.graph.group')
      .map(m => m.id);
    
    const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
    const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;
    
    if (adminGroupId && groupIds.includes(adminGroupId)) return UserRole.ADMIN;
    if (issuerGroupId && groupIds.includes(issuerGroupId)) return UserRole.ISSUER;
    
    return null; // No Security Group match — fall through to directReports/default
  } catch (error) {
    this.logger.warn(`Failed to check group membership for user ${azureId}: ${(error as Error).message}`);
    return null;
  }
}
```

#### 11c. Role priority logic (AC #30)

In `syncSingleUser()`, after creating/updating the user, determine role:

```
Priority (highest → lowest):
1. Security Group membership (ADMIN or ISSUER)
2. roleSetManually = true (keep current role — admin manually set it)
3. directReports > 0 → MANAGER
4. Default → EMPLOYEE
```

**CRITICAL:** Skip role update for users with `azureId = null` (locally created users — AC #26).

#### 11d. Update `syncSingleUser()` signature

The current `syncSingleUser()` sets role to `'EMPLOYEE'` for new users. Enhance it to:
1. Call `getUserRoleFromGroups(azureUser.id)`
2. If group returns a role → use it
3. Else if user exists AND `roleSetManually = true` → keep existing role
4. Else check directReports (Task 12) → MANAGER if has reports
5. Else → EMPLOYEE

**PII in logs (AC #38):** All log messages in sync service must use `user.id` or `azureId` only. NEVER log `email`, `displayName`, `firstName`, `lastName`. Audit the existing log statements and sanitize.

---

### Task 12: M365 sync — directReports + managerId linkage (AC: #23)

**Two-pass sync approach:**

**Pass 1 (existing):** Create/update all users from Graph API (already done by `syncSingleUser`)

**Pass 2 (new):** After all users are synced, resolve manager relationships:

```typescript
/**
 * Pass 2: Link manager relationships using Graph API /manager endpoint.
 * Must run AFTER all users are created/updated (Pass 1).
 */
private async linkManagerRelationships(syncedAzureIds: string[]): Promise<{ linked: number; errors: number }> {
  let linked = 0;
  let errors = 0;
  
  for (const azureId of syncedAzureIds) {
    try {
      const url = `https://graph.microsoft.com/v1.0/users/${azureId}/manager`;
      const managerData = await this.fetchWithRetry<{ id: string }>(url);
      
      if (managerData?.id) {
        // Find local user by azureId
        const localUser = await this.prisma.user.findUnique({ where: { azureId } });
        const localManager = await this.prisma.user.findUnique({ where: { azureId: managerData.id } });
        
        if (localUser && localManager) {
          await this.prisma.user.update({
            where: { id: localUser.id },
            data: { managerId: localManager.id },
          });
          linked++;
        }
      }
    } catch (error) {
      // 404 = no manager assigned (normal)
      if ((error as any)?.statusCode !== 404) {
        errors++;
        this.logger.warn(`Failed to resolve manager for azureId ${azureId}`);
      }
    }
  }
  
  return { linked, errors };
}
```

**Integrate into `runSync()`:** After the `syncSingleUser` loop completes, call `linkManagerRelationships()`.

**directReports → MANAGER role:** After linking managers, users who have at least one direct report (`directReports.length > 0`) should get role `MANAGER` — unless overridden by Security Group (ADMIN/ISSUER take priority per AC #30).

---

### Task 13: Group-only sync mode (AC: #27, #28, #29)

**File:** `m365-sync.service.ts`, `trigger-sync.dto.ts`

#### 13a. Update `SyncType`

**Current** (`trigger-sync.dto.ts`):
```typescript
export type SyncType = 'FULL' | 'INCREMENTAL';
```

**Change to:**
```typescript
export type SyncType = 'FULL' | 'INCREMENTAL' | 'GROUPS_ONLY';

export class TriggerSyncDto {
  @IsOptional()
  @IsEnum(['FULL', 'INCREMENTAL', 'GROUPS_ONLY'])
  syncType?: SyncType = 'FULL';
}
```

#### 13b. GROUPS_ONLY sync implementation

Add to `m365-sync.service.ts`:

```typescript
/**
 * Group-only sync: Re-check Security Group membership + manager for existing M365 users.
 * Does NOT import new users from Graph API. Only updates roles + managerId.
 * Performance: avoids re-fetching all user profiles.
 */
private async runGroupsOnlySync(syncedBy?: string): Promise<SyncResultDto> {
  // 1. Get all M365 users from local DB (azureId != null, isActive = true)
  const m365Users = await this.prisma.user.findMany({
    where: { azureId: { not: null }, isActive: true },
    select: { id: true, azureId: true, role: true, managerId: true, roleSetManually: true },
  });
  
  // 2. For each user: check /memberOf + /manager (can batch with Promise.allSettled)
  // 3. Update roles based on priority logic
  // 4. Update managerId based on /manager endpoint
  // 5. Create M365SyncLog with syncType: 'GROUPS_ONLY'
  // 6. Log only counts (roleChanges, managerChanges), no PII
}
```

**Integrate into `runSync()`:** If `syncType === 'GROUPS_ONLY'`, call `runGroupsOnlySync()` instead of the full sync flow.

#### 13c. Sync log enhancement

The `M365SyncLog` model already has `syncType String @default("FULL") @db.VarChar(20)`. Just ensure `'GROUPS_ONLY'` is recorded. The model comment says `'FULL' | 'INCREMENTAL'` — update it:

```prisma
syncType     String   @default("FULL") @db.VarChar(20) // 'FULL' | 'INCREMENTAL' | 'GROUPS_ONLY'
```

---

### Task 14: M365 Sync UI controls (AC: #28, #29)

**Files:** New component + enhance existing page

Since no M365 sync frontend code exists yet, create:

#### 14a. API layer

**File:** `frontend/src/lib/m365SyncApi.ts` (NEW)

```typescript
import { apiFetch } from './apiFetch';

export interface SyncResult {
  syncId: string;
  syncType: 'FULL' | 'INCREMENTAL' | 'GROUPS_ONLY';
  userCount: number;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  status: string;
  durationMs: number;
}

export interface SyncLog {
  id: string;
  syncDate: string;
  syncType: string;
  userCount: number;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  status: string;
  durationMs: number | null;
  syncedBy: string | null;
}

export interface IntegrationStatus {
  available: boolean;
  lastSync: SyncLog | null;
  permissions: string[];
}

export async function triggerSync(syncType: 'FULL' | 'GROUPS_ONLY' = 'FULL'): Promise<SyncResult> {
  return apiFetch('/admin/m365-sync', {
    method: 'POST',
    body: JSON.stringify({ syncType }),
  });
}

export async function getSyncLogs(limit = 10): Promise<SyncLog[]> {
  return apiFetch(`/admin/m365-sync/logs?limit=${limit}`);
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  return apiFetch('/admin/m365-sync/status');
}
```

#### 14b. Hook

**File:** `frontend/src/hooks/useM365Sync.ts` (NEW)

TanStack Query hooks:
- `useM365SyncLogs(limit?)` — query sync logs
- `useM365IntegrationStatus()` — query integration status
- `useTriggerSync()` — mutation to trigger sync
- `m365SyncKeys` — query key factory

#### 14c. UI Component

**File:** `frontend/src/components/admin/M365SyncPanel.tsx` (NEW)

Integrate into the existing `AdminUserManagementPage.tsx` as a collapsible panel/section:
- **"Sync Users" button** → triggers `POST /api/admin/m365-sync` with `syncType: 'FULL'`
- **"Sync Roles" button** → triggers `POST /api/admin/m365-sync` with `syncType: 'GROUPS_ONLY'`
- Both with loading states, success/error toast feedback
- **Sync history table** below buttons: columns = date, type (FULL/GROUPS_ONLY/INCREMENTAL), users synced, status, duration
- **Last sync timestamp** + integration status indicator

Design: Follow existing admin component patterns (Shadcn UI, Tailwind).

---

### Task 15: Login-time mini-sync (AC: #31, #32, #35)

**File:** `auth.service.ts`

This is the most critical task. After the user is found and password is validated, but BEFORE generating JWT tokens, perform a mini-sync for M365 users.

#### 15a. Empty passwordHash guard (AC #32)

**BEFORE** `bcrypt.compare()`, add:

```typescript
// SEC-GAP-1: M365 users with empty passwordHash cannot login via password
if (!user.passwordHash) {
  throw new UnauthorizedException('Invalid credentials');
}
```

This prevents bcrypt.compare from throwing on empty string input and prevents M365 users (who have `passwordHash=''`) from being password-authenticated.

**Insert location:** In `auth.service.ts` `login()` method, after `lockedUntil` check, BEFORE `bcrypt.compare`:

```typescript
// Current code:
// 2.5. Check if account is locked
if (user.lockedUntil) {
  if (user.lockedUntil > new Date()) throw new UnauthorizedException('Invalid credentials');
}

// ADD THIS ↓ (AC #32 — empty passwordHash rejection)
if (!user.passwordHash) {
  throw new UnauthorizedException('Invalid credentials');
}

// 3. Verify password (existing)
const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
```

#### 15b. Login-time mini-sync

After successful password verification, before generating tokens:

```typescript
// After bcrypt.compare succeeds...
// Login-time mini-sync for M365 users (AC #31)
if (user.azureId) {
  const syncResult = await this.syncUserFromGraph(user);
  if (syncResult.rejected) {
    throw new UnauthorizedException('Invalid credentials');
  }
  // Refresh user data after sync (role may have changed)
  user = await this.prisma.user.findUnique({ where: { id: user.id } });
}

// Generate JWT with FRESH role from synced user data
const payload = { sub: user.id, email: user.email, role: user.role };
```

#### 15c. `syncUserFromGraph()` — shared helper

**CRITICAL architecture decision:** This method must be reusable by both login-time sync AND full M365 sync (`syncSingleUser`). Consider placing it in `m365-sync.service.ts` and injecting `M365SyncService` into `AuthService`, OR creating a shared `UserSyncHelper` service.

**Recommended approach:** Add `syncUserFromGraph()` to `M365SyncService` and inject it into `AuthService`.

```typescript
/**
 * Shared helper: sync a single M365 user from Graph API.
 * Used by both login-time mini-sync and full/group-only sync.
 * 
 * Fires 3 Graph API calls in parallel for performance (~200-300ms total).
 * 
 * @returns { rejected: boolean, reason?: string } — rejected=true means login should be denied
 */
async syncUserFromGraph(user: { id: string; azureId: string; lastSyncAt: Date | null }): Promise<{
  rejected: boolean;
  reason?: string;
}> {
  const DEGRADATION_WINDOW_HOURS = 24;
  
  try {
    // Fire 3 Graph API calls in parallel (AC #31g — ~200-300ms)
    const [profileResult, memberOfResult, managerResult] = await Promise.allSettled([
      this.fetchWithRetry<GraphUser>(`https://graph.microsoft.com/v1.0/users/${user.azureId}?$select=accountEnabled,displayName,department`),
      this.fetchWithRetry<{ value: Array<{ id: string; '@odata.type': string }> }>(`https://graph.microsoft.com/v1.0/users/${user.azureId}/memberOf`),
      this.fetchWithRetry<{ id: string }>(`https://graph.microsoft.com/v1.0/users/${user.azureId}/manager`).catch(err => {
        // 404 = no manager (normal)
        if (err?.statusCode === 404) return null;
        throw err;
      }),
    ]);

    // a. Check accountEnabled
    if (profileResult.status === 'fulfilled') {
      const profile = profileResult.value;
      if (!profile.accountEnabled) {
        return { rejected: true, reason: 'M365 account disabled' };
      }
      
      // b. Update profile fields
      const updateData: any = {
        firstName: profile.displayName?.split(' ')[0] || undefined,
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || undefined,
        department: profile.department || undefined,
        lastSyncAt: new Date(),
      };
      
      // c. Determine role from Security Group
      let newRole: UserRole | undefined;
      if (memberOfResult.status === 'fulfilled') {
        const groupIds = memberOfResult.value.value
          .filter(m => m['@odata.type'] === '#microsoft.graph.group')
          .map(m => m.id);
        
        const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
        const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;
        
        if (adminGroupId && groupIds.includes(adminGroupId)) {
          newRole = UserRole.ADMIN;
        } else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
          newRole = UserRole.ISSUER;
        }
        // If no Security Group match, check directReports via existing data
      }
      
      // d. Update managerId
      if (managerResult.status === 'fulfilled' && managerResult.value) {
        const managerAzureId = managerResult.value.id;
        const localManager = await this.prisma.user.findUnique({
          where: { azureId: managerAzureId },
          select: { id: true },
        });
        if (localManager) {
          updateData.managerId = localManager.id;
        }
      }
      
      // Apply role if determined
      if (newRole) {
        updateData.role = newRole;
      }
      
      // e. Update user record
      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
      
      return { rejected: false };
    }
    
    // Profile fetch failed — enter degradation mode
    throw new Error('Profile fetch failed');
    
  } catch (error) {
    // f. Graceful fallback — degradation window (AC #35)
    if (user.lastSyncAt) {
      const hoursSinceSync = (Date.now() - user.lastSyncAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync <= DEGRADATION_WINDOW_HOURS) {
        this.logger.warn(`Graph API unavailable for user ${user.id}, using cached data (last sync ${hoursSinceSync.toFixed(1)}h ago)`);
        return { rejected: false };
      }
    }
    
    // lastSyncAt > 24h OR no lastSyncAt → reject
    this.logger.error(`Graph API unavailable for user ${user.id}, cached data expired — rejecting login`);
    return { rejected: true, reason: 'Graph API unavailable and cached data expired' };
  }
}
```

#### 15d. Inject M365SyncService into AuthModule

**File:** `auth.module.ts`

Import `M365SyncModule` (which exports `M365SyncService`) into `AuthModule`. Then inject `M365SyncService` into `AuthService` constructor.

#### 15e. Token refresh optimization

In `refreshTokens()` method: if the user is M365 and `lastSyncAt` is within the current session window (e.g., within the last `JWT_ACCESS_EXPIRES_IN` period = 15 min), skip Graph API calls and use cached data. Only re-sync if `lastSyncAt` is older than the access token lifetime.

---

### Task 16: Tests (AC: all 12.3a ACs)

#### 16a. Schema tests

**File:** `prisma/` — ensure migration applies cleanly

```typescript
describe('managerId schema', () => {
  it('should create user with managerId FK', async () => { /* ... */ });
  it('should set managerId to null when manager is deleted (onDelete: SetNull)', async () => { /* ... */ });
  it('should allow querying directReports relation', async () => { /* ... */ });
});
```

#### 16b. Dashboard scoping migration tests

**File:** `dashboard.service.spec.ts`

Update existing `getManagerDashboard` tests:
- ~~"should handle manager without department"~~ → "should return empty team when manager has no direct reports"
- Change mock to use `managerId` instead of `department`
- Test: manager gets only their direct reports (users where `managerId = manager.id`)

#### 16c. Badge issuance scoping migration tests

**File:** `badge-issuance.service.spec.ts`

Update `revokeBadge` test:
- Change from `actor.department === badge.recipient.department` to `badge.recipient.managerId === actor.id`
- Test: manager can revoke badge for their direct report
- Test: manager cannot revoke badge for user outside their team

Update `getIssuedBadges` test:
- Change from department filter to `managerId` filter

#### 16d. Analytics scoping migration tests

**File:** `analytics.service.spec.ts`

Update `getTopPerformers` tests:
- Manager sees only direct reports' top performers
- ~~"Manager has no assigned department"~~ → manager with no direct reports gets empty list (not ForbiddenException)

#### 16e. M365 sync Security Group role mapping tests

**File:** `m365-sync.service.spec.ts`

```typescript
describe('Security Group role mapping', () => {
  it('should assign ADMIN role for user in Admin Security Group', async () => { /* ... */ });
  it('should assign ISSUER role for user in Issuer Security Group', async () => { /* ... */ });
  it('should assign MANAGER role for user with directReports', async () => { /* ... */ });
  it('should default to EMPLOYEE when no group match and no directReports', async () => { /* ... */ });
  it('should prioritize Security Group over roleSetManually', async () => { /* ... */ });
  it('should prioritize Security Group over directReports', async () => { /* ... */ });
  it('should skip role update for local users (azureId = null)', async () => { /* ... */ });
  it('should handle memberOf API failure gracefully', async () => { /* ... */ });
});
```

#### 16f. directReports + managerId linkage tests

```typescript
describe('directReports + managerId linkage', () => {
  it('should set managerId after two-pass sync', async () => { /* ... */ });
  it('should handle 404 (no manager) gracefully', async () => { /* ... */ });
  it('should handle manager not yet synced to local DB', async () => { /* ... */ });
});
```

#### 16g. Group-only sync mode tests

```typescript
describe('GROUPS_ONLY sync', () => {
  it('should not import new users', async () => { /* ... */ });
  it('should update roles based on Security Group membership', async () => { /* ... */ });
  it('should update managerId based on manager endpoint', async () => { /* ... */ });
  it('should create sync log with syncType GROUPS_ONLY', async () => { /* ... */ });
});
```

#### 16h. Login-time mini-sync tests

**File:** `auth.service.spec.ts`

```typescript
describe('Login-time mini-sync', () => {
  it('should reject login for M365 user with empty passwordHash (AC #32)', async () => { /* ... */ });
  it('should update profile fields from Graph API on login', async () => { /* ... */ });
  it('should update role from Security Group on login', async () => { /* ... */ });
  it('should update managerId from Graph API on login', async () => { /* ... */ });
  it('should reject login when M365 account is disabled', async () => { /* ... */ });
  it('should allow login with cached data when Graph unavailable AND lastSyncAt < 24h', async () => { /* ... */ });
  it('should reject login when Graph unavailable AND lastSyncAt > 24h (AC #35)', async () => { /* ... */ });
  it('should reject login when Graph unavailable AND no lastSyncAt', async () => { /* ... */ });
  it('should handle partial Graph API failures gracefully', async () => { /* ... */ });
  it('should use fresh role in JWT payload after mini-sync', async () => { /* ... */ });
});
```

#### 16i. PII-free logging tests (AC #38)

Verify existing log statements in `m365-sync.service.ts` do not contain email or displayName. Audit all `this.logger.*` calls.

#### 16j. Regression tests

- Existing login flow for local users (no azureId) must not be affected
- Existing admin dashboard must work with managerId-based scoping
- Existing badge issuance/revocation must work with new scoping

---

## Existing Code Reference

### Key Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `managerId`, manager relation, directReports relation to User model |
| `prisma/seed-uat.ts` | Link employee→manager via managerId |
| `src/m365-sync/m365-sync.service.ts` | Security Group check, directReports linkage, GROUPS_ONLY mode, PII cleanup, shared `syncUserFromGraph()` |
| `src/m365-sync/dto/trigger-sync.dto.ts` | Add `'GROUPS_ONLY'` to SyncType |
| `src/modules/auth/auth.service.ts` | Empty passwordHash guard, login-time mini-sync call |
| `src/modules/auth/auth.module.ts` | Import M365SyncModule |
| `src/modules/dashboard/dashboard.service.ts` | `getManagerDashboard()` — department→managerId |
| `src/modules/badge-issuance/badge-issuance.service.ts` | `revokeBadge()`, `getIssuedBadges()` — department→managerId |
| `src/modules/analytics/analytics.service.ts` | `getTopPerformers()` — department→managerId |
| `src/modules/admin-users/admin-users.service.ts` | Add `source` computed field to getUserSelect (for 12.3b readiness) |

### New Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/lib/m365SyncApi.ts` | API functions for sync trigger + logs + status |
| `frontend/src/hooks/useM365Sync.ts` | TanStack Query hooks for sync operations |
| `frontend/src/components/admin/M365SyncPanel.tsx` | Sync buttons + history table component |

### Environment Variables (already configured)

```env
AZURE_ADMIN_GROUP_ID="3403ed09-414d-490a-ac69-3c2c38c14c38"
AZURE_ISSUER_GROUP_ID="7aa2bac0-0146-4cec-9d7a-17c9f63264ba"
DEFAULT_USER_PASSWORD="password123"
```

### Graph API Endpoints Used

| Endpoint | Purpose | Permission |
|----------|---------|------------|
| `GET /users` (paginated) | Full user sync (existing) | `User.Read.All` |
| `GET /users/{id}/memberOf` | Security Group check | `GroupMember.Read.All` |
| `GET /users/{id}/manager` | Manager hierarchy | `User.Read.All` |
| `GET /users/{id}?$select=accountEnabled,displayName,department` | Login-time profile check | `User.Read.All` |

### Tech Stack Reference

- **Backend:** NestJS 11, Prisma 6.19, PostgreSQL 16, TypeScript 5.8
- **Frontend:** React 19.2, Vite 7.3, TailwindCSS 4.1, Shadcn/ui, TanStack Query
- **Testing:** Jest (backend), Vitest (frontend)
- **Auth:** JWT (httpOnly cookie + Bearer header), bcrypt
- **Graph API:** `@microsoft/microsoft-graph-client`, `@azure/identity`

### ADR Reference

- **ADR-011:** `gcredit-project/docs/decisions/ADR-011-user-management-architecture.md` — 17 decisions covering all design choices for this story

---

## Definition of Done

1. All 12.3a ACs (#19–31, #32, #35, #38) pass verification
2. Prisma migration applies cleanly (`npx prisma migrate dev`)
3. All existing tests pass (772 BE tests baseline)
4. New tests added per Task 16 outline
5. `npm run lint` passes with no new warnings
6. Login flow works for both local and M365 users
7. Department-based scoping fully replaced by managerId-based scoping
8. Sync buttons (Sync Users + Sync Roles) functional in UI
9. Sync history shows sync type column
10. PII removed from all sync log statements
11. Empty passwordHash login correctly returns 401
12. No `azureId` values exposed in API responses (internal-only)

---

## Execution Order (Recommended)

1. **Task 9** — Schema migration (foundation for everything else)
2. **Task 10** — Backend scoping migration (depends on schema)
3. **Task 11** — Security Group role mapping (sync enhancement)
4. **Task 12** — directReports + managerId linkage (integrates with Task 11)
5. **Task 13** — Group-only sync mode (builds on Tasks 11+12)
6. **Task 15** — Login-time mini-sync (uses shared `syncUserFromGraph()` from Task 11)
7. **Task 14** — M365 Sync UI controls (frontend, can partially parallel with backend tasks)
8. **Task 16** — Tests (write alongside each task, final verification pass at end)
