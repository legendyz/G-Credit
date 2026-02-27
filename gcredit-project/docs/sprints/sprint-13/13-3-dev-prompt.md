# Dev Prompt: Story 13.3 — Login-Time Mini-Sync Hardening

**Story:** 13.3  
**Sprint:** 13  
**Priority:** MEDIUM  
**Depends on:** Story 13.1 (✅ Done), Story 13.2 (✅ Done)  
**Approach:** TDD — write tests first, then implement  
**Estimated:** ~4h  
**Status:** ready-for-dev

---

## Objective

Story 13.3 was originally written assuming mini-sync didn't exist yet. In reality, **most of the work was already completed in Stories 13.1 and 13.2**. This dev prompt covers the **actual remaining gaps**:

1. **Add `jobTitle` field** — Prisma schema migration + sync from Graph API
2. **3-minute cooldown** — skip mini-sync if `lastSyncAt` < 3 minutes ago
3. **Fix role demotion** — when user is removed from Security Group, mini-sync should downgrade role (currently it only upgrades)
4. **Tests** for all the above

**This is NOT a greenfield story.** All changes go into existing code. Read the "What Already Exists" section carefully to avoid duplicating work.

---

## What Already Exists (DO NOT RE-IMPLEMENT)

### SSO Callback → Mini-Sync Invocation (`auth.service.ts` L685-704)
```typescript
// 4. Login-time mini-sync for returning M365 users (skip for JIT — already synced above)
if (!isJitUser && freshUser.azureId) {
  const syncResult = await this.m365SyncService.syncUserFromGraph({
    id: freshUser.id,
    azureId: freshUser.azureId,
    lastSyncAt: freshUser.lastSyncAt,
  });
  if (syncResult.rejected) {
    this.logger.warn(
      `[SECURITY] SSO login rejected by M365 sync: user:${freshUser.id}`,
    );
    return { error: 'sso_failed' };
  }
  const updatedUser = await this.prisma.user.findUnique({
    where: { id: freshUser.id },
  });
  if (updatedUser) {
    freshUser = updatedUser;
  }
}
```
✅ AC #1 — Already done. Do not touch.

### Parallel Graph API Calls (`m365-sync.service.ts` L388-406)
```typescript
const [profileResult, memberOfResult, managerResult] =
  await Promise.allSettled([
    this.fetchWithRetry<GraphUser>(
      `https://graph.microsoft.com/v1.0/users/${user.azureId}?$select=accountEnabled,displayName,department`,
    ),
    this.fetchWithRetry<{ value: Array<{ id: string; '@odata.type': string }> }>(
      `https://graph.microsoft.com/v1.0/users/${user.azureId}/memberOf`,
    ),
    this.fetchWithRetry<{ id: string }>(
      `https://graph.microsoft.com/v1.0/users/${user.azureId}/manager`,
    ).catch((err) => {
      if ((err as { statusCode?: number })?.statusCode === 404) return null;
      throw err;
    }),
  ]);
```
✅ AC #2 — Already done. Only change: add `jobTitle` to `$select`.

### Profile Update + Graceful Degradation (`m365-sync.service.ts` L408-495)
✅ AC #4 — 24h degradation window already done.

### `lastLoginAt` Update (`auth.service.ts` L740-746)
✅ AC #5 — Already done.

### Existing Tests
✅ 8+ tests in `m365-sync.service.spec.ts` (L1402-1642) and `auth.service.spec.ts` (L620-750).

---

## Task 1: Add `jobTitle` Field (Prisma Migration + Sync)

### 1a. Prisma Schema Migration

Add `jobTitle` field to User model in `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  department    String?   // Sprint 8: M365 sync field
  jobTitle      String?   // Story 13.3: M365 mini-sync field
  role          UserRole  @default(EMPLOYEE)
  ...
}
```

Run migration:
```bash
npx prisma migrate dev --name add-job-title-field
```

### 1b. Add `jobTitle` to Mini-Sync `$select`

**File:** `m365-sync.service.ts` ~L391

**Current:**
```typescript
`https://graph.microsoft.com/v1.0/users/${user.azureId}?$select=accountEnabled,displayName,department`,
```

**Change to:**
```typescript
`https://graph.microsoft.com/v1.0/users/${user.azureId}?$select=accountEnabled,displayName,department,jobTitle`,
```

### 1c. Map `jobTitle` in Profile Update

**File:** `m365-sync.service.ts` ~L411-418 (the `updateData` block)

**Current:**
```typescript
const updateData: Record<string, unknown> = {
  firstName: profile.displayName?.split(' ')[0] || undefined,
  lastName: profile.displayName?.split(' ').slice(1).join(' ') || undefined,
  department: profile.department || undefined,
  lastSyncAt: new Date(),
};
```

**Change to:**
```typescript
const updateData: Record<string, unknown> = {
  firstName: profile.displayName?.split(' ')[0] || undefined,
  lastName: profile.displayName?.split(' ').slice(1).join(' ') || undefined,
  department: profile.department || undefined,
  jobTitle: profile.jobTitle ?? null,
  lastSyncAt: new Date(),
};
```

> **Note on `jobTitle` mapping:** Use `?? null` not `|| undefined`. When Azure AD has no jobTitle, we want to explicitly clear it in DB (set null), not skip the update. This ensures if someone's jobTitle is removed in Azure AD, it gets cleared in G-Credit too.

### 1d. Typing — the `profile` variable

The `fetchWithRetry<GraphUser>()` call already returns a `GraphUser` type, and `GraphUser` interface (`interfaces/graph-user.interface.ts` L21) already has:
```typescript
jobTitle?: string;
```
So no interface change needed. The type already supports `jobTitle`.

---

## Task 2: 3-Minute Cooldown Mechanism

### Purpose
If user logs in multiple times rapidly (e.g., browser refresh, multiple tabs), skip the 3 Graph API calls when `lastSyncAt` is less than 3 minutes ago. Saves API quota and reduces login latency.

### Implementation

**File:** `m365-sync.service.ts` — at the TOP of `syncUserFromGraph()`, before the `try` block

Add cooldown check:
```typescript
async syncUserFromGraph(user: {
  id: string;
  azureId: string;
  lastSyncAt: Date | null;
}): Promise<{
  rejected: boolean;
  reason?: string;
}> {
  const DEGRADATION_WINDOW_HOURS = 24;
  const COOLDOWN_MINUTES = 3;

  // Cooldown: skip sync if last sync was < 3 minutes ago
  if (user.lastSyncAt) {
    const minutesSinceSync =
      (Date.now() - user.lastSyncAt.getTime()) / (1000 * 60);
    if (minutesSinceSync < COOLDOWN_MINUTES) {
      this.logger.debug(
        `Mini-sync cooldown: user ${user.id} synced ${minutesSinceSync.toFixed(1)}m ago, skipping`,
      );
      return { rejected: false };
    }
  }

  try {
    // ... existing Graph API calls
```

### Behavior

| `lastSyncAt` | Action |
|---|---|
| null (never synced) | Run mini-sync |
| < 3 min ago | Skip, return `{ rejected: false }` |
| 3min – 24h ago | Run mini-sync |
| > 24h ago + Graph fails | Reject login (existing degradation logic) |

---

## Task 3: Fix Role Demotion in Mini-Sync

### Problem

Current code only sets `role` when user IS in a Security Group:
```typescript
if (adminGroupId && groupIds.includes(adminGroupId)) {
  newRole = UserRole.ADMIN;
} else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
  newRole = UserRole.ISSUER;
}
// Not in any group → newRole = undefined → role unchanged ← BUG
```

This means if an admin removes a user from the ADMIN Security Group in Azure AD, the user **keeps ADMIN role** in G-Credit until the next full sync. This is a security gap.

### Fix

**File:** `m365-sync.service.ts` ~L423-458 — replace the Security Group role logic

**Current code (L423-458):**
```typescript
// c. Determine role from Security Group
let newRole: UserRole | undefined;
if (memberOfResult.status === 'fulfilled') {
  const groupIds = memberOfResult.value.value
    .filter((m) => m['@odata.type'] === '#microsoft.graph.group')
    .map((m) => m.id);

  const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
  const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;

  if (adminGroupId && groupIds.includes(adminGroupId)) {
    newRole = UserRole.ADMIN;
  } else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
    newRole = UserRole.ISSUER;
  }
}

// ... (manager logic) ...

// Apply role if determined
if (newRole) {
  updateData.role = newRole;
}
```

**Replace with:**
```typescript
// c. Determine role from Security Group + directReports fallback
if (memberOfResult.status === 'fulfilled') {
  const groupIds = memberOfResult.value.value
    .filter((m) => m['@odata.type'] === '#microsoft.graph.group')
    .map((m) => m.id);

  const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
  const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;

  if (adminGroupId && groupIds.includes(adminGroupId)) {
    updateData.role = UserRole.ADMIN;
  } else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
    updateData.role = UserRole.ISSUER;
  } else {
    // Not in any privileged Security Group → check directReports for MANAGER
    const directReportCount = await this.prisma.user.count({
      where: { managerId: user.id },
    });
    updateData.role = directReportCount > 0 ? UserRole.MANAGER : UserRole.EMPLOYEE;
  }
}

// ... (manager logic — unchanged) ...

// REMOVE the old "if (newRole)" block — role is now always set via updateData.role above
```

### Security Impact
- **Upgrade** (EMPLOYEE → ADMIN): immediate on next login ✅ (was already working)
- **Downgrade** (ADMIN → EMPLOYEE): now also immediate on next login ✅ (was broken, now fixed)
- **MANAGER detection**: uses DB `count()` query on `managerId` — one extra lightweight query per login

### Why This Is Safe
- M365 users cannot have `roleSetManually = true` (blocked by `admin-users.service.ts` L321-326)
- The `else` branch only fires when `memberOfResult` succeeded — if Graph fails, degradation logic handles it
- `directReportCount` query is indexed (`@@index([managerId])` in schema)

---

## Task 4: Tests

### 4a. New Tests for `syncUserFromGraph` in `m365-sync.service.spec.ts`

Add to the existing `describe('syncUserFromGraph (Story 12.3a)')` block:

```typescript
// === Story 13.3 Tests ===

it('should skip sync when lastSyncAt < 3 minutes ago (cooldown)', async () => {
  const recentUser = {
    ...mockGraphUser,
    lastSyncAt: new Date(Date.now() - 60 * 1000), // 1 minute ago
  };

  const result = await service.syncUserFromGraph(recentUser);

  expect(result.rejected).toBe(false);
  // Verify NO Graph API calls were made
  expect(Client.initWithMiddleware).not.toHaveBeenCalled();
});

it('should run sync when lastSyncAt is exactly 3 minutes ago', async () => {
  const borderlineUser = {
    ...mockGraphUser,
    lastSyncAt: new Date(Date.now() - 3 * 60 * 1000), // exactly 3 min
  };

  // Set up Graph mocks for a normal sync
  const mockGet = jest.fn()
    .mockResolvedValueOnce({ accountEnabled: true, displayName: 'Test', department: 'Eng', jobTitle: null })
    .mockResolvedValueOnce({ value: [] })
    .mockRejectedValueOnce({ statusCode: 404 });
  const mockApi = jest.fn().mockReturnValue({ get: mockGet });
  (Client.initWithMiddleware as jest.Mock).mockReturnValue({ api: mockApi });
  (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
  prisma.user.count.mockResolvedValue(0);
  prisma.user.update.mockResolvedValue({});

  const result = await service.syncUserFromGraph(borderlineUser);

  expect(result.rejected).toBe(false);
  expect(Client.initWithMiddleware).toHaveBeenCalled();
});

it('should sync jobTitle from Graph API', async () => {
  const mockGet = jest.fn()
    .mockResolvedValueOnce({
      accountEnabled: true,
      displayName: 'John Doe',
      department: 'Engineering',
      jobTitle: 'Senior Developer',
    })
    .mockResolvedValueOnce({ value: [] })  // no security groups
    .mockRejectedValueOnce({ statusCode: 404 }); // no manager
  const mockApi = jest.fn().mockReturnValue({ get: mockGet });
  (Client.initWithMiddleware as jest.Mock).mockReturnValue({ api: mockApi });
  (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
  prisma.user.count.mockResolvedValue(0);
  prisma.user.update.mockResolvedValue({});

  await service.syncUserFromGraph(mockGraphUser);

  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      jobTitle: 'Senior Developer',
    }),
  });
});

it('should clear jobTitle when Azure AD returns null', async () => {
  const mockGet = jest.fn()
    .mockResolvedValueOnce({
      accountEnabled: true,
      displayName: 'Test',
      department: 'Eng',
      jobTitle: null,
    })
    .mockResolvedValueOnce({ value: [] })
    .mockRejectedValueOnce({ statusCode: 404 });
  const mockApi = jest.fn().mockReturnValue({ get: mockGet });
  (Client.initWithMiddleware as jest.Mock).mockReturnValue({ api: mockApi });
  (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
  prisma.user.count.mockResolvedValue(0);
  prisma.user.update.mockResolvedValue({});

  await service.syncUserFromGraph(mockGraphUser);

  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      jobTitle: null,
    }),
  });
});

it('should demote to EMPLOYEE when removed from Security Group and no direct reports', async () => {
  const mockGet = jest.fn()
    .mockResolvedValueOnce({
      accountEnabled: true,
      displayName: 'Former Admin',
      department: 'Eng',
      jobTitle: 'Developer',
    })
    .mockResolvedValueOnce({ value: [] })  // ← NOT in any security group
    .mockRejectedValueOnce({ statusCode: 404 });
  const mockApi = jest.fn().mockReturnValue({ get: mockGet });
  (Client.initWithMiddleware as jest.Mock).mockReturnValue({ api: mockApi });
  (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
  prisma.user.count.mockResolvedValue(0); // no direct reports
  prisma.user.update.mockResolvedValue({});

  await service.syncUserFromGraph(mockGraphUser);

  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      role: 'EMPLOYEE',
    }),
  });
});

it('should demote to MANAGER when removed from Security Group but has direct reports', async () => {
  const mockGet = jest.fn()
    .mockResolvedValueOnce({
      accountEnabled: true,
      displayName: 'Former Admin',
      department: 'Eng',
      jobTitle: 'Team Lead',
    })
    .mockResolvedValueOnce({ value: [] }) // not in any group
    .mockRejectedValueOnce({ statusCode: 404 });
  const mockApi = jest.fn().mockReturnValue({ get: mockGet });
  (Client.initWithMiddleware as jest.Mock).mockReturnValue({ api: mockApi });
  (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
  prisma.user.count.mockResolvedValue(3); // has 3 direct reports
  prisma.user.update.mockResolvedValue({});

  await service.syncUserFromGraph(mockGraphUser);

  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      role: 'MANAGER',
    }),
  });
});
```

### 4b. Update Existing Tests

Some existing tests may need a `prisma.user.count.mockResolvedValue(0)` added, since the new role demotion path calls `count()`. Check and add mock where needed.

The existing test `'should update profile and role from Graph API'` already tests ADMIN promotion — it should continue to pass.

---

## File Change Summary

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `jobTitle String?` after `department` |
| `m365-sync.service.ts` L391 | Add `jobTitle` to `$select` query string |
| `m365-sync.service.ts` L411-418 | Add `jobTitle: profile.jobTitle ?? null` to `updateData` |
| `m365-sync.service.ts` top of `syncUserFromGraph()` | Add 3-minute cooldown check |
| `m365-sync.service.ts` L423-458 | Replace Security Group role logic with full demotion support |
| `m365-sync.service.spec.ts` | Add 6 new tests (cooldown x2, jobTitle x2, demotion x2) |

---

## Verification Checklist

After implementation, run:

```bash
cd gcredit-project/backend
npx prisma migrate dev --name add-job-title-field
npx jest --runInBand 2>&1 | tail -20
```

Expected: All 907+ existing tests still pass + 6 new tests pass.

Manual verification:
- [ ] `jobTitle` column exists in database after migration
- [ ] Mini-sync `$select` includes `jobTitle`
- [ ] Cooldown: login twice within 3 min → second login skips Graph API calls (check debug log)
- [ ] Demotion: remove user from ADMIN group in Azure AD → next login → role is EMPLOYEE (or MANAGER if has reports)

---

## Architecture Notes

- **Cooldown constant** (`COOLDOWN_MINUTES = 3`): hardcoded is fine for now, can move to env var later if needed
- **`jobTitle ?? null` vs `|| undefined`**: Use `?? null` to explicitly clear jobTitle when removed in Azure AD. Using `|| undefined` would skip the field, leaving stale data.
- **`user.count()` performance**: `managerId` is already indexed (`@@index([managerId])`) — this is a fast query
- The `syncUserFromGraph()` method signature stays the same — no callers need updating
