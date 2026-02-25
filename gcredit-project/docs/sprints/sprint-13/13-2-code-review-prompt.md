# Code Review Prompt: Story 13.2 — JIT User Provisioning on First SSO Login

**Commit:** `543c3fc`  
**Base:** `1df99e1`  
**Sprint:** 13 | **Story:** 13.2  
**Branch:** `sprint-13/sso-session-management`  
**Test Results:** 907 passed / 0 failed / 28 skipped (49 suites, 4 skipped)

---

## Instructions for Reviewer

You are performing a code review for Story 13.2. Review ALL changed files against the Acceptance Criteria below. For each review dimension, check every item and note any issues found.

**Output format:** For each finding, assign a severity:
- 🔴 Blocker — must fix before merge
- 🟡 Medium — should fix, risk if deferred
- 🔵 Low — suggestion / nit
- ⚪ Info — observation, no action needed

End with a verdict: `Approved` / `Approved With Notes` / `Changes Requested`

---

## Story Context

When an M365 user logs in via Azure AD SSO for the first time and no matching `azureId` exists in the database, **automatically create their account** (JIT provisioning), sync their profile from Graph API, issue JWT cookies, and redirect to the frontend.

**Related decisions:**
- DEC-005: Admin bootstrap via `INITIAL_ADMIN_EMAIL` env var
- DEC-011-13: Remove `DEFAULT_USER_PASSWORD` from M365 Sync, enforce SSO-only for M365 users
- Sprint 12.3a AC #38: No PII in logs (no email, no names in console output)

**MANAGER Role Known Behavior:** JIT only resolves ADMIN/ISSUER (from Security Groups). MANAGER role requires `directReports` to exist in DB → resolved by Full Sync Pass 2b `updateDirectReportsRoles()`. This is by design.

---

## Acceptance Criteria

1. When SSO callback finds no user with matching `azureId`, auto-create user: `azureId = token.oid`, `email = token.preferred_username`, `firstName`/`lastName` from claims, `passwordHash = ''`, `isActive = true`, default `role = 'EMPLOYEE'`
2. Immediately invoke `syncUserFromGraph()` (login-time mini-sync, NOT `syncSingleUser()`) to populate department, manager, Security Group role
3. Issue httpOnly JWT cookies after sync completes
4. If Graph API sync fails, user still created with defaults — sync retries next login
5. `INITIAL_ADMIN_EMAIL` env var: if JIT user's email matches, set `role = 'ADMIN'`
6. Concurrent first-login race condition handled (DB unique constraint on `azureId`)
7. M365 Sync code updated: remove `DEFAULT_USER_PASSWORD` → set `passwordHash = ''`
8. Data migration: clear `passwordHash` for all existing M365 users (`azureId IS NOT NULL`)
9. Tests: JIT happy path, sync failure fallback, admin bootstrap, duplicate prevention, M365 sync no longer assigns password
10. JIT user creation emits audit log event visible in Admin Activity Feed — message prompts admin to run Full Sync

---

## Changed Files (10 files, +1,340 / -79)

### File 1: `src/modules/auth/auth.service.ts` — MODIFY (+163)

**What changed:** Added `createSsoUser()`, `createJitAuditLog()` private methods. Modified `ssoLogin()` to replace `sso_no_account` error with JIT provisioning flow.

**Before (Story 13.1):**
```typescript
async ssoLogin(profile: AzureAdProfile): Promise<...> {
  const user = await this.prisma.user.findUnique({ where: { azureId: profile.oid } });

  if (!user) {
    this.logger.log(`[SSO] No user found for azureId:${profile.oid} — JIT provisioning needed (Story 13.2)`);
    return { error: 'sso_no_account' };
  }

  if (!user.isActive) { return { error: 'account_disabled' }; }

  // 4. Login-time mini-sync
  let freshUser = user;
  if (user.azureId) {
    const syncResult = await this.m365SyncService.syncUserFromGraph({...});
    // ... sync + re-fetch
  }
  // 5-7. Generate JWT tokens, store refresh, update lastLoginAt
}
```

**After (Story 13.2):**
```typescript
async ssoLogin(profile: AzureAdProfile): Promise<...> {
  const user = await this.prisma.user.findUnique({ where: { azureId: profile.oid } });

  // 2. User not found — JIT provisioning (Story 13.2)
  let freshUser: User | null = null;
  let isJitUser = false;
  if (!user) {
    const jitUser = await this.createSsoUser(profile);

    // Graph API mini-sync
    try {
      const syncResult = await this.m365SyncService.syncUserFromGraph({
        id: jitUser.id, azureId: jitUser.azureId!, lastSyncAt: jitUser.lastSyncAt,
      });
      if (syncResult.rejected) {
        this.logger.warn(`[SECURITY] JIT user sync rejected: user:${jitUser.id}, reason: ${syncResult.reason}`);
        await this.prisma.user.update({ where: { id: jitUser.id }, data: { isActive: false } });
        return { error: 'sso_failed' };
      }
    } catch (syncError) {
      this.logger.warn(`[SSO] JIT sync failed for user:${jitUser.id} — continuing with defaults: ${(syncError as Error).message}`);
    }

    await this.createJitAuditLog(jitUser);

    freshUser = await this.prisma.user.findUnique({ where: { id: jitUser.id } });
    if (!freshUser) { freshUser = jitUser; }
    isJitUser = true;
  } else {
    freshUser = user;
  }

  // 3. Check if user is active
  if (!freshUser.isActive) { return { error: 'account_disabled' }; }

  // 4. Login-time mini-sync for returning M365 users (skip for JIT — already synced above)
  if (!isJitUser && freshUser.azureId) {
    // ... existing sync logic unchanged
  }

  // 5-7. Generate JWT tokens, store refresh, update lastLoginAt — UNCHANGED
}
```

**New private method — `createSsoUser()`:**
```typescript
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
        passwordHash: '',
        isActive: true,
        role: UserRole.EMPLOYEE,
      },
    });

    this.logger.log(`[SSO] JIT user provisioned: user:${user.id} (azureId: ${profile.oid})`);

    // Admin bootstrap: INITIAL_ADMIN_EMAIL (DEC-005)
    const initialAdminEmail = this.config.get<string>('INITIAL_ADMIN_EMAIL');
    if (initialAdminEmail && user.email === initialAdminEmail.toLowerCase()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN, roleSetManually: true },
      });
      user.role = UserRole.ADMIN;
      this.logger.warn(`[SECURITY] Admin bootstrapped via INITIAL_ADMIN_EMAIL: user:${user.id}`);
    }

    return user;
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      this.logger.warn(`[SSO] JIT race condition: azureId:${profile.oid} already exists — fetching existing user`);
      const existing = await this.prisma.user.findUnique({ where: { azureId: profile.oid } });
      if (existing) return existing;
    }
    throw error;
  }
}
```

**New private method — `createJitAuditLog()`:**
```typescript
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
    this.logger.error(
      `[AUDIT] Failed to create JIT audit log for user:${user.id}: ${(error as Error).message}`,
    );
  }
}
```

**Also added import:** `import { User, UserRole } from '@prisma/client';` (was just `UserRole`)

---

### File 2: `src/m365-sync/m365-sync.service.ts` — MODIFY (+12/-12)

**What changed:** Removed `DEFAULT_USER_PASSWORD` + bcrypt from `syncSingleUser()`, use `passwordHash: ''`.

**Before:**
```typescript
import * as bcrypt from 'bcrypt';
// ... (~L658)
// NEW-006: Assign temporary default password until SSO is implemented
const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
const passwordHash = await bcrypt.hash(defaultPassword, 10);
await this.prisma.user.create({
  data: { ...userData, passwordHash, isActive: true, role: resolvedRole },
});
```

**After:**
```typescript
// (bcrypt import removed)
// ... (~L658)
// DEC-011-13: SSO-only — M365 users cannot use password login
await this.prisma.user.create({
  data: { ...userData, passwordHash: '', isActive: true, role: resolvedRole },
});
this.logger.log(`[M365-SYNC] Created M365 user with SSO-only access (no temp password)`);
```

---

### File 3: `prisma/migrations/20260301000000_clear_m365_user_passwords/migration.sql` — CREATE (+4)

```sql
-- Story 13.2 / DEC-011-13: Clear temp passwords for M365 users (SSO-only enforcement)
-- M365 users authenticate exclusively via Azure AD SSO — temp passwords are no longer needed.
-- This migration is idempotent: only affects users with azureId set and non-empty passwordHash.
UPDATE "users" SET "passwordHash" = '' WHERE "azureId" IS NOT NULL AND "passwordHash" != '';
```

---

### File 4: `.env.example` — MODIFY (+2/-2)

```diff
-# Story 12.3a: Manual User Creation
+# Story 12.3a: Manual User Creation (admin-users only — M365 users are SSO-only per DEC-011-13)
 DEFAULT_USER_PASSWORD="password123"
```

---

### File 5: `src/modules/auth/__tests__/auth.service.jit.spec.ts` — CREATE (+375)

**New test file with 10 test cases:**

```
describe('AuthService — JIT User Provisioning (Story 13.2)')
  1. should create new user when azureId not found (JIT provisioning)
  2. should continue login if Graph API sync fails (non-fatal)
  3. should set ADMIN role when email matches INITIAL_ADMIN_EMAIL
  4. should match INITIAL_ADMIN_EMAIL case-insensitively
  5. should handle race condition (P2002) by fetching existing user
  6. should create JIT_PROVISIONED audit log entry
  7. should not fail login if audit log creation fails
  8. should deactivate JIT user if M365 account is disabled (sync rejected)
  9. should set passwordHash to empty string for JIT users (SSO-only)
  10. should not trigger mini-sync twice for JIT users
```

**Test setup:** Uses NestJS `TestingModule` with mocked `PrismaService`, `JwtService`, `ConfigService`, `EmailService`, `M365SyncService`. Bcrypt is globally mocked.

**Key test patterns:**
- `mockPrismaService.user.findUnique` chained with `.mockResolvedValueOnce(null)` (azureId lookup) then `.mockResolvedValueOnce(mockJitUser)` (re-fetch after sync)
- P2002 simulated via `Object.assign(new Error('Unique constraint violation'), { code: 'P2002' })`
- Audit log assertion: `expect(changes.message).toContain('Full Sync')`

---

### File 6: `src/modules/auth/auth.service.spec.ts` — MODIFY (+30)

**Changes:**
- Added `userAuditLog: { create: jest.fn().mockResolvedValue({}) }` to mock PrismaService
- Replaced test `'should return { error: sso_no_account } when azureId not found'` with `'should JIT provision new user when azureId not found (Story 13.2 replaces sso_no_account)'`

---

### File 7: `src/m365-sync/m365-sync.service.spec.ts` — MODIFY (+17)

**New test case:**
```typescript
// Story 13.2 AC #7: M365 sync no longer assigns DEFAULT_USER_PASSWORD
it('should create M365 user with empty passwordHash (no temp password)', async () => {
  // ...
  expect(prisma.user.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ passwordHash: '' }),
  });
});
```

---

### Files 8-10: Documentation

- `13-2-dev-prompt.md` — CREATE (+641) — development prompt
- `13-2-jit-user-provisioning.md` — MODIFY (+173/-79) — story ACs checkmarked, tasks completed
- `sprint-status.yaml` — MODIFY — status: `backlog` → `ready-for-dev`

---

## Existing Code Context (Unchanged, for Reference)

### Password Login Guard (Story 13.1 — `auth.service.ts` `login()`)
```typescript
// Guard: empty passwordHash → M365 SSO-only user (Story 13.1)
if (!user.passwordHash) {
  throw new BadRequestException('This account uses Microsoft SSO. Please sign in with Microsoft.');
}
```

### AzureAdProfile Interface
```typescript
export interface AzureAdProfile {
  oid: string;        // Azure AD Object ID → User.azureId
  email: string;      // preferred_username claim
  displayName: string; // full name
}
```

### UserAuditLog Schema (Prisma)
```prisma
model UserAuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   @db.VarChar(50)  // 'CREATED', 'UPDATED', 'DEACTIVATED', ...
  changes   Json?
  source    String   @db.VarChar(20)  // 'M365_SYNC', 'MANUAL', 'SYSTEM'
  actorId   String?
  timestamp DateTime @default(now())
}
```

### Existing audit log usage pattern (m365-sync.service.ts)
```typescript
await this.prisma.userAuditLog.create({
  data: {
    userId: localUser.id,
    action: 'DEACTIVATED',
    changes: { isActive: { old: true, new: false }, reason: deactivationReason },
    source: 'M365_SYNC',
    actorId: null,
  },
});
```

### User.azureId has @unique constraint — enforces no duplicate M365 users

### Sprint 12.3a AC #38 — No PII in logs
Console logs must NOT contain email addresses, names, or other personally identifiable information. Use `user:${user.id}` format only.

---

## Review Dimensions

### 1. Correctness — AC Compliance
For each of the 10 ACs above, verify the implementation matches the requirement exactly. Pay attention to:
- JIT user field values (passwordHash, role, isActive)
- syncUserFromGraph() called (not syncSingleUser())
- JWT cookie issuance after JIT
- Sync failure vs. sync rejection handling (different behavior)
- INITIAL_ADMIN_EMAIL case-insensitive comparison
- P2002 race condition recovery
- DEFAULT_USER_PASSWORD removal scope (only m365-sync, NOT admin-users)
- Migration idempotency
- Audit log content and failure isolation

### 2. Security Review
- [ ] No PII in console logs (Sprint 12.3a AC #38) — check ALL `this.logger.*` lines
- [ ] Password enforcement: `passwordHash: ''` at all M365 user creation points
- [ ] Admin bootstrap: cannot be re-triggered on returning login
- [ ] `roleSetManually: true` prevents Full Sync downgrade
- [ ] Sync rejection properly deactivates JIT user
- [ ] Rate limiting coverage (inherited from SSO endpoints)
- [ ] No secrets/tokens in logs

### 3. Architecture & Code Quality
- [ ] Variable scoping: `let freshUser` / `let isJitUser` pattern
- [ ] Method separation: `createSsoUser()`, `createJitAuditLog()` as private methods
- [ ] Consistency with existing logging tags (`[SSO]`, `[SECURITY]`, `[AUDIT]`)
- [ ] Prisma error handling patterns
- [ ] Import changes (bcrypt removed from m365-sync, User added to auth.service)

### 4. Edge Cases & Robustness
- [ ] displayName with no space (single name) — what happens?
- [ ] displayName with multiple spaces
- [ ] Empty/undefined profile.email
- [ ] P2002 on email unique constraint (not azureId) — different scenario?
- [ ] INITIAL_ADMIN_EMAIL undefined vs empty string
- [ ] Re-fetch returning null after JIT creation
- [ ] Prisma object mutation (in-place `user.role = UserRole.ADMIN`)

### 5. Testing Coverage
- [ ] All 10 JIT test cases cover the right scenarios
- [ ] Mock setup correctness (chained `mockResolvedValueOnce` ordering)
- [ ] M365 sync passwordHash test
- [ ] Existing test updated (sso_no_account → JIT)
- [ ] Missing test cases? (edge cases, negative paths)
- [ ] Migration not tested (acceptable?)
