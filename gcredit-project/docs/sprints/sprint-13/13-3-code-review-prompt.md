# Code Review: Story 13.3 — Login-Time Mini-Sync Hardening

**Story:** 13.3 — Login-Time Mini-Sync for Returning SSO Users  
**Sprint:** 13  
**Commit:** `67e359c` (feat(story-13.3): login-time mini-sync hardening)  
**Base:** `2a1b31e` (13.2 acceptance)  
**Branch:** `sprint-13/sso-session-management`  
**Test Results:** 913 passed, 28 skipped, 0 failures (49 suites)  
**ESLint:** 0 warnings, 0 errors

---

## Summary of Changes

Story 13.3 hardened the existing login-time mini-sync (built in Stories 13.1/13.2) with three targeted improvements:

1. **Add `jobTitle` field** — New Prisma schema field + Graph API `$select` expansion + sync mapping
2. **3-minute cooldown** — Skip mini-sync if user's `lastSyncAt` < 3 minutes ago to save Graph API quota
3. **Fix role demotion** — When user is removed from a Security Group, mini-sync now downgrades role to MANAGER (if has direct reports) or EMPLOYEE (if none)

---

## Files Changed (4 production + 1 test + 2 docs)

| File | Type | Changes |
|------|------|---------|
| `prisma/schema.prisma` | Schema | +1 line: `jobTitle String?` |
| `prisma/migrations/20260226004923_add_job_title_field/migration.sql` | Migration | +2 lines: `ALTER TABLE "users" ADD COLUMN "jobTitle" TEXT` |
| `src/m365-sync/m365-sync.service.ts` | Production | +22/−13 lines |
| `src/m365-sync/m365-sync.service.spec.ts` | Test | +168 lines (6 new tests + 3 mock fixes) |
| `docs/sprints/sprint-13/13-3-login-time-mini-sync.md` | Doc | Story file updated with implementation record |
| `docs/sprints/sprint-13/13-3-dev-prompt.md` | Doc | Dev prompt (new) |
| `docs/sprints/sprint-status.yaml` | Doc | Status: backlog → ready-for-dev |

---

## Production Code Diff: `m365-sync.service.ts`

```diff
@@ syncUserFromGraph() — top of method (L382+)
 
     const DEGRADATION_WINDOW_HOURS = 24;
+    const COOLDOWN_MINUTES = 3;
+
+    // Cooldown: skip sync if last sync was < 3 minutes ago
+    if (user.lastSyncAt) {
+      const minutesSinceSync =
+        (Date.now() - user.lastSyncAt.getTime()) / (1000 * 60);
+      if (minutesSinceSync < COOLDOWN_MINUTES) {
+        this.logger.debug(
+          `Mini-sync cooldown: user ${user.id} synced ${minutesSinceSync.toFixed(1)}m ago, skipping`,
+        );
+        return { rejected: false };
+      }
+    }

@@ $select query string (L391)

-  `...?$select=accountEnabled,displayName,department`,
+  `...?$select=accountEnabled,displayName,department,jobTitle`,

@@ updateData block (L429+)

           department: profile.department || undefined,
+          jobTitle: profile.jobTitle ?? null,
           lastSyncAt: new Date(),

@@ Security Group role logic (L443+) — REPLACED

-        // c. Determine role from Security Group
-        let newRole: UserRole | undefined;
+        // c. Determine role from Security Group + directReports fallback
         if (memberOfResult.status === 'fulfilled') {
           ...
           if (adminGroupId && groupIds.includes(adminGroupId)) {
-            newRole = UserRole.ADMIN;
+            updateData.role = UserRole.ADMIN;
           } else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
-            newRole = UserRole.ISSUER;
+            updateData.role = UserRole.ISSUER;
+          } else {
+            // Not in any privileged Security Group → check directReports for MANAGER
+            const directReportCount = await this.prisma.user.count({
+              where: { managerId: user.id },
+            });
+            updateData.role =
+              directReportCount > 0 ? UserRole.MANAGER : UserRole.EMPLOYEE;
           }
         }

-        // Apply role if determined
-        if (newRole) {
-          updateData.role = newRole;
-        }
-        (REMOVED — role now always set via updateData.role above)
```

---

## Schema Diff: `prisma/schema.prisma`

```diff
   firstName     String?
   lastName      String?
   department    String?   // Sprint 8: M365 sync field
+  jobTitle      String?   // Story 13.3: M365 mini-sync field
   role          UserRole  @default(EMPLOYEE)
```

Migration: `ALTER TABLE "users" ADD COLUMN "jobTitle" TEXT;`

---

## Test Diff: `m365-sync.service.spec.ts`

### Fixture Change
```diff
     const mockGraphUser = {
       id: 'user-1',
       azureId: 'azure-id-123',
-      lastSyncAt: new Date(),
+      lastSyncAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago — outside 3-min cooldown
     };
```

### Existing Tests Updated (3 tests)
Added `prisma.user.count.mockResolvedValue(0)` to 3 existing tests that now hit the new demotion code path:
- `'should update managerId from Graph API'`
- `'should clear managerId when Graph returns no manager (404)'`
- `'should clear managerId when manager exists in Graph but not in local DB'`

### New Tests (6 tests)
| Test | What it verifies |
|------|------------------|
| `should skip sync when lastSyncAt < 3 minutes ago (cooldown)` | Cooldown early return, no Graph API calls |
| `should run sync when lastSyncAt is exactly 3 minutes ago` | Boundary check — sync runs at exactly 3 min |
| `should sync jobTitle from Graph API` | jobTitle mapped from profile response |
| `should clear jobTitle when Azure AD returns null` | jobTitle explicitly set to null (not skipped) |
| `should demote to EMPLOYEE when removed from Security Group and no direct reports` | Role demotion, count=0 |
| `should demote to MANAGER when removed from Security Group but has direct reports` | Role demotion, count>0 |

---

## Review Checklist

### Correctness
- [ ] Cooldown: does `minutesSinceSync < COOLDOWN_MINUTES` handle the edge case where `lastSyncAt` is in the future (clock skew)?
- [ ] Cooldown: is 3 minutes hardcoded acceptable, or should it be configurable via env var?
- [ ] `jobTitle: profile.jobTitle ?? null` — correct to use `??` (nullish coalescing) vs `||` (falsy coalesce)?
- [ ] Role demotion: when `memberOfResult.status !== 'fulfilled'` (Graph failed), role is untouched — is this the right degradation behavior?
- [ ] Role demotion: `prisma.user.count({ where: { managerId: user.id } })` — is `user.id` correct (not `user.azureId`)?
- [ ] Does the new `else` branch create an `await` inside the already-`await`ed `Promise.allSettled` result processing — any risk?

### Security
- [ ] Does removing the `newRole` indirection introduce any path where role could be set to an unexpected value?
- [ ] Cooldown bypass: could an attacker manipulate `lastSyncAt` to avoid sync checks? (It's DB-stored, so no)
- [ ] Demotion path: immediately effective on login — is there any race condition with concurrent logins?

### Performance
- [ ] Additional `prisma.user.count()` query runs on every non-Security-Group login — is `@@index([managerId])` sufficient?
- [ ] Cooldown check runs before `try` block — any issue if `lastSyncAt` computation throws?

### Testing
- [ ] Are the 6 new tests sufficient, or are there gaps?
- [ ] Boundary test: `lastSyncAt` exactly 3 minutes — is `<` vs `<=` semantics correct?
- [ ] Do existing tests still validate the ADMIN promotion path (should be unaffected)?
- [ ] Is there a test for: memberOf call fails but profile succeeds → role should NOT change?

### Schema
- [ ] `jobTitle TEXT` — correct data type? Any length constraint needed?
- [ ] Migration is additive (ADD COLUMN, nullable) — safe for zero-downtime deploy?

---

## How to Review

```bash
# See the full diff
git diff 2a1b31e 67e359c

# Run tests
cd gcredit-project/backend
npx jest --runInBand

# Run only affected tests
npx jest m365-sync.service.spec --runInBand
```

---

## Output Format

Please produce your review as `13-3-code-review-result.md` with:
1. **Verdict**: Approved / Approved with Notes / Changes Requested
2. **Findings**: Each finding with severity (CRITICAL / MAJOR / MINOR / NIT) and file:line reference
3. **Fixes Applied**: If you fix anything, list the commit SHA
