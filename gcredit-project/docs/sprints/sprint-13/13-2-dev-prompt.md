# Dev Prompt: Story 13.2 — JIT User Provisioning on First SSO Login

**Story:** 13.2  
**Sprint:** 13  
**Priority:** HIGH (🔴 Security-Critical)  
**Depends on:** Story 13.1 (✅ Done — commit 687127d)  
**Approach:** TDD — write tests first, then implement  
**Estimated:** 8-10h  
**Status:** ready-for-dev

---

## Objective

When an M365 user logs in via Azure AD SSO for the first time and no matching `azureId` exists in the database, **automatically create their account** (JIT provisioning), sync their profile from Graph API, issue JWT cookies, and redirect to the frontend. Additionally, remove the legacy `DEFAULT_USER_PASSWORD` temp password from M365 Sync and migrate existing M365 users to SSO-only.

**Key changes from Story 13.1:**
- Replace `sso_no_account` error path → auto-create user + login
- Admin bootstrap via `INITIAL_ADMIN_EMAIL` env var (DEC-005)
- Remove `DEFAULT_USER_PASSWORD` from M365 Sync (DEC-011-13)
- Emit audit log on JIT creation → prompt admin to run Full Sync

---

## Current Architecture (What Already Exists — Post 13.1)

### SSO Callback Flow (`auth.controller.ts` → `GET /api/auth/sso/callback`)
```
1. Extract code + state from query params
2. Validate state against sso_state cookie (CSRF protection)
3. Exchange code for tokens via azureAdSsoService.handleCallback()
4. Call authService.ssoLogin(profile)   ← THIS IS WHERE JIT HOOKS IN
5. If error 'sso_no_account' → redirect /login?error=sso_no_account
6. If success → setAuthCookies() + redirect /sso/callback?success=true
```

**Story 13.2 replaces step 5** — instead of redirecting to error, create the user.

### `authService.ssoLogin()` — Current Code (`auth.service.ts` L616-743)
```typescript
async ssoLogin(profile: AzureAdProfile): Promise<
  | { accessToken: string; refreshToken: string; user: Record<string, unknown> }
  | { error: string }
> {
  // 1. Look up user by azureId (oid from Azure AD)
  const user = await this.prisma.user.findUnique({
    where: { azureId: profile.oid },
  });

  // 2. User not found — delegate to JIT provisioning (Story 13.2)
  if (!user) {
    this.logger.log(
      `[SSO] No user found for azureId:${profile.oid} — JIT provisioning needed (Story 13.2)`,
    );
    return { error: 'sso_no_account' };  // ← REPLACE THIS WITH JIT
  }

  // 3. Check if user is active
  // ... (unchanged)

  // 4. Login-time mini-sync via syncUserFromGraph()
  // ... (unchanged — reuse this for JIT too)

  // 5-7. Generate JWT tokens, store refresh, update lastLoginAt
  // ... (unchanged)
}
```

### AzureAdProfile Interface (`interfaces/azure-ad-profile.interface.ts`)
```typescript
export interface AzureAdProfile {
  oid: string;        // Azure AD Object ID → maps to User.azureId
  email: string;      // from preferred_username claim
  displayName: string; // full name
}
```

### Login-time Mini-Sync (`m365-sync.service.ts` L377-470)
```typescript
// syncUserFromGraph() — fires 3 parallel Graph API calls:
// 1. GET /users/{azureId}?$select=accountEnabled,displayName,department
// 2. GET /users/{azureId}/memberOf  (Security Groups → ADMIN/ISSUER role)
// 3. GET /users/{azureId}/manager   (link managerId if manager exists locally)
//
// Returns: { rejected: boolean, reason?: string }
// Does NOT resolve MANAGER role (requires directReports to exist in DB)
```

### User Model (Prisma Schema)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String          // ← JIT sets '' (SSO-only)
  firstName     String?
  lastName      String?
  department    String?
  role          UserRole  @default(EMPLOYEE)
  azureId       String?   @unique   // ← JIT sets from oid
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  roleSetManually Boolean   @default(false)
  lastSyncAt      DateTime?
  managerId     String?
  manager       User?   @relation("ManagerReports", fields: [managerId], references: [id])
  directReports User[]  @relation("ManagerReports")
  // ...
  @@map("users")
}

model UserAuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String   @db.VarChar(50) // 'CREATED', 'UPDATED', 'DEACTIVATED', ...
  changes    Json?
  source     String   @db.VarChar(20) // 'M365_SYNC', 'MANUAL', 'SYSTEM'
  actorId    String?
  timestamp  DateTime @default(now())
  @@map("user_audit_logs")
}
```

### Existing UserAuditLog Usage Pattern (from `m365-sync.service.ts` ~L558)
```typescript
await this.prisma.userAuditLog.create({
  data: {
    userId: localUser.id,
    action: 'DEACTIVATED',
    changes: {
      isActive: { old: true, new: false },
      reason: deactivationReason,
    },
    source: 'M365_SYNC',
    actorId: null, // System action
  },
});
```

### DEFAULT_USER_PASSWORD — Current Usage (to be removed)

**m365-sync.service.ts ~L658-662** (in `syncSingleUser()`):
```typescript
// NEW-006: Assign temporary default password until SSO is implemented
const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
const passwordHash = await bcrypt.hash(defaultPassword, 10);
await this.prisma.user.create({
  data: {
    ...userData,
    passwordHash,     // ← REPLACE with passwordHash: ''
    isActive: true,
    role: resolvedRole,
  },
});
```

**admin-users.service.ts ~L865** (keep unchanged — local user creation):
```typescript
const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
const passwordHash = await bcrypt.hash(defaultPassword, 10);
```

### Env Vars (`.env.example`)
```dotenv
# Already exists:
AZURE_SSO_CLIENT_ID="ceafe2e0-73a9-46b6-a203-1005bfdda11f"
AZURE_SSO_CLIENT_SECRET="<your-client-secret>"
AZURE_SSO_REDIRECT_URI="http://localhost:3000/api/auth/sso/callback"
AZURE_SSO_SCOPES="openid profile email User.Read"
AZURE_TENANT_ID="afc9fe8f-1d40-41fc-9906-e001e500926c"

# Already in .env.example:
DEFAULT_USER_PASSWORD="password123"   # ← REMOVE from .env.example (keep in admin-users only)
INITIAL_ADMIN_EMAIL=""                # ← JIT admin bootstrap (DEC-005)
```

---

## What to Implement

### Task 1: Create JIT Provisioning Method in AuthService (AC: #1, #6)

**File:** `src/modules/auth/auth.service.ts`

Add method `createSsoUser()`:

```typescript
/**
 * JIT User Provisioning — create new user from Azure AD SSO first login
 * Called when ssoLogin() finds no user with matching azureId
 */
private async createSsoUser(profile: AzureAdProfile): Promise<User> {
  const nameParts = profile.displayName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  try {
    const user = await this.prisma.user.create({
      data: {
        azureId: profile.oid,
        email: profile.email.toLowerCase(),
        firstName,
        lastName,
        passwordHash: '',     // SSO-only — cannot use password login (DEC-011-13)
        isActive: true,
        role: UserRole.EMPLOYEE, // Default — upgraded by syncUserFromGraph() or Full Sync
      },
    });

    this.logger.log(
      `[SSO] JIT user provisioned: user:${user.id} (azureId: ${profile.oid})`,
    );

    return user;
  } catch (error) {
    // Handle race condition: concurrent first-login with same azureId
    if ((error as any)?.code === 'P2002') { // Prisma UniqueConstraintViolation
      this.logger.warn(
        `[SSO] JIT race condition: azureId:${profile.oid} already exists — fetching existing user`,
      );
      const existing = await this.prisma.user.findUnique({
        where: { azureId: profile.oid },
      });
      if (existing) return existing;
    }
    throw error;
  }
}
```

**Key constraints:**
- `passwordHash = ''` — enforced by existing `login()` guard (Story 13.1: empty hash → BadRequestException)
- `azureId` has `@unique` constraint → P2002 on duplicate → handle as race condition
- Default `role: EMPLOYEE` — Security Group role resolved by syncUserFromGraph() in follow-up step

### Task 2: Admin Bootstrap Mechanism (AC: #5)

**In the same `createSsoUser()` method, or as a separate check immediately after:**

```typescript
// Admin bootstrap: INITIAL_ADMIN_EMAIL (DEC-005 Resolution B)
const initialAdminEmail = this.config.get<string>('INITIAL_ADMIN_EMAIL');
if (initialAdminEmail && user.email === initialAdminEmail.toLowerCase()) {
  await this.prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN, roleSetManually: true },
  });
  user.role = UserRole.ADMIN;
  this.logger.warn(
    `[SECURITY] Admin bootstrapped via INITIAL_ADMIN_EMAIL: user:${user.id}`,
  );
}
```

**Note:** `roleSetManually = true` ensures Full Sync won't downgrade the admin back to EMPLOYEE.

### Task 3: Wire JIT into ssoLogin() (AC: #1, #2, #3, #4, #10)

**Modify `ssoLogin()` — replace the `sso_no_account` return with JIT + sync + audit log:**

```typescript
// BEFORE (Story 13.1):
if (!user) {
  return { error: 'sso_no_account' };
}

// AFTER (Story 13.2):
if (!user) {
  // JIT User Provisioning
  const jitUser = await this.createSsoUser(profile);

  // Admin bootstrap check
  // ... (Task 2 logic)

  // Graph API mini-sync (same as returning-user path below)
  try {
    const syncResult = await this.m365SyncService.syncUserFromGraph({
      id: jitUser.id,
      azureId: jitUser.azureId!,
      lastSyncAt: jitUser.lastSyncAt,
    });
    if (syncResult.rejected) {
      this.logger.warn(
        `[SECURITY] JIT user sync rejected: user:${jitUser.id}, reason: ${syncResult.reason}`,
      );
      // Deactivate the JIT user — they shouldn't be active if M365 account is disabled
      await this.prisma.user.update({
        where: { id: jitUser.id },
        data: { isActive: false },
      });
      return { error: 'sso_failed' };
    }
  } catch (syncError) {
    // Sync failure is non-fatal for JIT (AC #4) — user keeps EMPLOYEE defaults
    this.logger.warn(
      `[SSO] JIT sync failed for user:${jitUser.id} — continuing with defaults: ${(syncError as Error).message}`,
    );
  }

  // Audit log + admin notification (AC #10)
  await this.createJitAuditLog(jitUser);

  // Re-fetch user to get post-sync data (role, department, managerId)
  const freshJitUser = await this.prisma.user.findUnique({
    where: { id: jitUser.id },
  });

  // Continue to token generation with freshJitUser (falls through to existing code)
  user = freshJitUser ?? jitUser;  // NOTE: adjust variable declaration from const to let
}
```

**Important:** The existing code after the `if (!user)` block handles:
- isActive check
- mini-sync (for returning users — skip for JIT since we just synced)
- JWT generation + refresh token storage + lastLoginAt update

You need to either:
- (Option A) Set a `isJitUser` flag and skip the second sync for JIT path, OR
- (Option B) Refactor the token generation into a private method and call it for both paths

**Recommended: Option A** — minimal changes, add `let isJitUser = false;` before the `if (!user)` block, set `true` inside, then skip the mini-sync section if `isJitUser`.

### Task 4: JIT Audit Log + Admin Notification (AC: #10)

**Add method to `auth.service.ts`:**

```typescript
/**
 * Create audit log entry for JIT user provisioning.
 * Visible in Admin Activity Feed — prompts admin to run Full Sync.
 */
private async createJitAuditLog(user: User): Promise<void> {
  try {
    await this.prisma.userAuditLog.create({
      data: {
        userId: user.id,
        action: 'JIT_PROVISIONED',
        changes: {
          source: 'SSO_FIRST_LOGIN',
          email: user.email,
          azureId: user.azureId,
          message: `New user ${user.firstName} ${user.lastName} (${user.email}) auto-provisioned via SSO. Run Full Sync to update manager relationships and role assignments.`,
        },
        source: 'SYSTEM',
        actorId: null,
      },
    });

    this.logger.log(
      `[AUDIT] JIT user provisioned: user:${user.id}, email:${user.email} — recommend Full Sync for complete role/manager derivation`,
    );
  } catch (error) {
    // Audit log failure should not block login
    this.logger.error(
      `[AUDIT] Failed to create JIT audit log for user:${user.id}: ${(error as Error).message}`,
    );
  }
}
```

**Admin Dashboard integration:**
- The admin users dashboard already queries `UserAuditLog` via the admin-users service
- The `JIT_PROVISIONED` action will automatically appear in the activity feed
- The `changes.message` field provides the admin-facing notification text
- No frontend changes needed in this story — the message renders via the existing audit log display

### Task 5: Remove DEFAULT_USER_PASSWORD from M365 Sync (AC: #7)

**File:** `src/m365-sync/m365-sync.service.ts` — in `syncSingleUser()` (~L658-662)

**BEFORE:**
```typescript
// NEW-006: Assign temporary default password until SSO is implemented
const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
const passwordHash = await bcrypt.hash(defaultPassword, 10);
await this.prisma.user.create({
  data: {
    ...userData,
    passwordHash,
    isActive: true,
    role: resolvedRole,
  },
});
```

**AFTER:**
```typescript
// DEC-011-13: SSO-only — M365 users cannot use password login
await this.prisma.user.create({
  data: {
    ...userData,
    passwordHash: '',  // Empty hash → password login blocked (Story 13.1 guard)
    isActive: true,
    role: resolvedRole,
  },
});

this.logger.log(
  `[M365-SYNC] Created M365 user with SSO-only access (no temp password)`,
);
```

**Also update `.env.example`:**
- Remove `DEFAULT_USER_PASSWORD="password123"` line
- Add comment: `# DEFAULT_USER_PASSWORD removed in Sprint 13 (DEC-011-13) — M365 users are SSO-only`

**Do NOT touch `admin-users.service.ts`** — local user creation (Story 12.3a) still uses `DEFAULT_USER_PASSWORD`.

### Task 6: Data Migration — Clear Existing M365 User Passwords (AC: #8)

**Option A (Prisma migration — recommended):**

```bash
npx prisma migrate dev --name clear-m365-user-passwords
```

Migration SQL:
```sql
-- DEC-011-13: Clear temp passwords for M365 users (SSO-only enforcement)
-- This is safe and idempotent: only affects users with azureId set
UPDATE "users" SET "passwordHash" = '' WHERE "azureId" IS NOT NULL AND "passwordHash" != '';
```

**Option B (seed script):**

Create `scripts/clear-m365-passwords.ts`:
```typescript
const result = await prisma.user.updateMany({
  where: {
    azureId: { not: null },
    passwordHash: { not: '' },
  },
  data: { passwordHash: '' },
});
console.log(`Cleared temp passwords for ${result.count} M365 users`);
```

**Preferred: Option A** — migration runs automatically on deploy.

### Task 7: Tests (AC: #9, #10)

**Create:** `src/modules/auth/__tests__/auth.service.jit.spec.ts`

```typescript
describe('AuthService — JIT User Provisioning (Story 13.2)', () => {
  // Test 1: JIT creates user with correct fields
  it('should create new user when azureId not found', async () => {
    // profile = { oid: 'test-oid', email: 'new@example.com', displayName: 'John Doe' }
    // Mock prisma.user.findUnique → null (no existing user)
    // Mock prisma.user.create → new user
    // Mock m365SyncService.syncUserFromGraph → { rejected: false }
    // Call ssoLogin(profile)
    // Assert: user.create called with azureId='test-oid', passwordHash='', role=EMPLOYEE
    // Assert: result has accessToken + refreshToken
  });

  // Test 2: JIT with sync failure → user still created with EMPLOYEE role
  it('should continue login if Graph API sync fails', async () => {
    // Mock syncUserFromGraph → throws Error
    // Assert: user created, JWT tokens issued, no crash
  });

  // Test 3: Admin bootstrap sets ADMIN role
  it('should set ADMIN role when email matches INITIAL_ADMIN_EMAIL', async () => {
    // Mock config.get('INITIAL_ADMIN_EMAIL') → 'admin@example.com'
    // profile.email = 'admin@example.com'
    // Assert: user.update called with role=ADMIN, roleSetManually=true
  });

  // Test 4: Admin bootstrap case-insensitive
  it('should match INITIAL_ADMIN_EMAIL case-insensitively', async () => {
    // profile.email = 'Admin@Example.COM'
    // INITIAL_ADMIN_EMAIL = 'admin@example.com'
    // Assert: still bootstraps as ADMIN
  });

  // Test 5: Duplicate azureId → returns existing user
  it('should handle race condition (P2002) by fetching existing user', async () => {
    // Mock prisma.user.create → throws P2002 (unique constraint violation)
    // Mock prisma.user.findUnique → existing user
    // Assert: login succeeds with existing user
  });

  // Test 6: JIT emits audit log
  it('should create JIT_PROVISIONED audit log entry', async () => {
    // Mock prisma.userAuditLog.create
    // Assert: called with action='JIT_PROVISIONED', source='SYSTEM'
    // Assert: changes.message contains 'Full Sync' recommendation
  });

  // Test 7: Audit log failure doesn't block login
  it('should not fail login if audit log creation fails', async () => {
    // Mock prisma.userAuditLog.create → throws Error
    // Assert: ssoLogin still returns tokens
  });

  // Test 8: syncUserFromGraph rejected → deactivate JIT user
  it('should deactivate JIT user if M365 account is disabled', async () => {
    // Mock syncUserFromGraph → { rejected: true, reason: 'M365 account disabled' }
    // Assert: user.update called with isActive=false
    // Assert: returns { error: 'sso_failed' }
  });
});
```

**Modify:** `src/m365-sync/__tests__/m365-sync.service.spec.ts` (or relevant spec)
```typescript
// Test: M365 sync no longer assigns DEFAULT_USER_PASSWORD
it('should create M365 user with empty passwordHash (no temp password)', async () => {
  // Assert: prisma.user.create called with passwordHash: ''
  // Assert: bcrypt.hash NOT called for new M365 users
});
```

**Create or reuse:** Migration test
```typescript
// Test: data migration clears existing M365 user passwords
it('should clear passwordHash for all users with azureId', async () => {
  // Setup: create users with azureId + non-empty passwordHash
  // Run migration
  // Assert: all azureId users now have passwordHash = ''
  // Assert: non-azureId users unchanged
});
```

---

## File Creation / Modification Map

| Action | File | Notes |
|--------|------|-------|
| **MODIFY** | `src/modules/auth/auth.service.ts` | Add `createSsoUser()`, `createJitAuditLog()`, modify `ssoLogin()` JIT path |
| **MODIFY** | `src/m365-sync/m365-sync.service.ts` | Remove `DEFAULT_USER_PASSWORD` in `syncSingleUser()` (~L658-662) |
| **MODIFY** | `.env.example` | Remove `DEFAULT_USER_PASSWORD`, add migration comment |
| **CREATE** | `prisma/migrations/xxx_clear_m365_user_passwords/migration.sql` | Data migration |
| **CREATE** | `src/modules/auth/__tests__/auth.service.jit.spec.ts` | JIT provisioning tests |
| **MODIFY** | `src/m365-sync/__tests__/m365-sync.service.spec.ts` | Update for passwordHash change |

---

## MANAGER Role Delay — Known Behavior (Do NOT Try to Fix)

JIT only resolves **ADMIN/ISSUER** roles (from Security Groups) during first login. The **MANAGER** role requires `directReports` to exist in the local database.

**Scenario:**
1. Manager logs in first → JIT creates with EMPLOYEE role (no subordinates in system yet)
2. Subordinates log in later → their `managerId` points to this manager
3. Manager's role is **not auto-upgraded** at this point
4. Next **Full Sync** runs `updateDirectReportsRoles()` (Pass 2b) → detects `directReports.some({})` → upgrades EMPLOYEE → MANAGER

**Mitigation:** JIT creates `JIT_PROVISIONED` audit log entry recommending Full Sync (Task 4).

This is by design — consistent with Sprint 12 architecture where MANAGER is derived from organizational relationships, not directly assigned.

---

## Patterns to Follow

### Error Logging Pattern (from existing code)
```typescript
this.logger.log(`[SSO] JIT user provisioned: user:${user.id}`);
this.logger.warn(`[SECURITY] SSO login blocked: user:${user.id}`);
this.logger.error(`[AUDIT] Failed to create JIT audit log: ${error.message}`);
```

### Audit Log Pattern (from `m365-sync.service.ts`)
```typescript
await this.prisma.userAuditLog.create({
  data: {
    userId: user.id,
    action: 'JIT_PROVISIONED',     // New action type
    changes: { /* JSON details */ },
    source: 'SYSTEM',
    actorId: null,                  // System action, no actor
  },
});
```

### Prisma P2002 Error Handling Pattern
```typescript
} catch (error) {
  if ((error as any)?.code === 'P2002') {
    // Unique constraint violation → race condition
    const existing = await this.prisma.user.findUnique({ where: { azureId } });
    if (existing) return existing;
  }
  throw error;
}
```

### Config Access Pattern
```typescript
const initialAdminEmail = this.config.get<string>('INITIAL_ADMIN_EMAIL');
```

---

## Critical Constraints

1. **Do NOT modify existing JWT payload shape** — `{ sub, email, role }` must stay the same
2. **Do NOT modify existing cookie names or paths** — `access_token` (path=/api) + `refresh_token` (path=/api/auth)
3. **Do NOT touch `admin-users.service.ts`** — local user creation still uses `DEFAULT_USER_PASSWORD` (that's correct)
4. **Do NOT modify `syncUserFromGraph()`** — JIT calls it as-is, no changes needed
5. **`passwordHash = ''`** for all JIT + M365 Sync created users — enforced by existing password login guard in `login()` (Story 13.1 Task 8)
6. **Sync failure is non-fatal for JIT** — user keeps EMPLOYEE defaults, sync retries next login
7. **Sync rejection IS fatal for JIT** — if `syncUserFromGraph()` returns `{ rejected: true }` (M365 account disabled), deactivate the JIT user
8. **`INITIAL_ADMIN_EMAIL` is case-insensitive** — always compare `.toLowerCase()` on both sides
9. **Audit log failure must NOT block login** — wrap in try-catch, log error, continue
10. **Data migration must be idempotent** — safe to re-run (WHERE ... AND passwordHash != '')

---

## Definition of Done

- [ ] JIT user created automatically on first SSO login (azureId not found → create + sync + login)
- [ ] `passwordHash = ''` for JIT users (SSO-only, cannot use password form)
- [ ] `syncUserFromGraph()` called after JIT creation (department, managerId, Security Group role)
- [ ] Sync failure → user still created with EMPLOYEE defaults, login succeeds
- [ ] Sync rejected (M365 account disabled) → JIT user deactivated, login fails
- [ ] `INITIAL_ADMIN_EMAIL` bootstrap: matching email → role set to ADMIN
- [ ] Race condition handled: concurrent first-login → P2002 → fetch existing user
- [ ] `DEFAULT_USER_PASSWORD` removed from `syncSingleUser()` — `passwordHash = ''` instead
- [ ] `DEFAULT_USER_PASSWORD` removed from `.env.example`
- [ ] Data migration: all existing M365 users (`azureId IS NOT NULL`) get `passwordHash = ''`
- [ ] `JIT_PROVISIONED` audit log created — message recommends Full Sync
- [ ] All new code has unit tests (8+ test cases)
- [ ] All existing tests pass (0 regression, current: 896 pass / 28 skip)
- [ ] No sensitive data in logs (no passwords, no tokens)

---

## Handoff Notes for Story 13.3

Story 13.3 (Login-time Mini-Sync) will optimize the returning-user sync path. The mini-sync in `ssoLogin()` already works — 13.3 may add:
- Cooldown logic (skip sync if `lastSyncAt` < 5 min ago)
- Additional profile fields (jobTitle, phone)
- Error recovery refinements

The JIT path shares the same `syncUserFromGraph()` call — any 13.3 improvements will automatically apply to JIT users on subsequent logins.
