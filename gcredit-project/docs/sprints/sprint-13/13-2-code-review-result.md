# Code Review Result: Story 13.2 — JIT User Provisioning on First SSO Login

**Story:** 13.2  
**Sprint:** 13  
**Review Date:** 2026-02-25  
**Review Basis:** `13-2-code-review-prompt.md`  
**Commit Under Review:** `543c3fc`

---

## Test Evidence

Executed targeted suites:

```powershell
npm test -- src/modules/auth/__tests__/auth.service.jit.spec.ts src/modules/auth/auth.service.spec.ts src/m365-sync/m365-sync.service.spec.ts
```

Result: **3 suites passed, 127 tests passed, 0 failed**.

---

## Findings by Severity

### 🔴 Blocker

1. **PII in application logs (violates Sprint 12.3a AC #38)**  
   - File: `backend/src/modules/auth/auth.service.ts`  
   - `createJitAuditLog()` logs email in console:  
     - `[AUDIT] JIT user provisioned: user:${user.id}, email:${user.email} ...`  
   - Story/prompt explicitly requires **no email/name in console logs**; use `user:{id}` only.  
   - Impact: Security/compliance violation; must be fixed before merge.

### 🟡 Medium

1. **Race-condition handler catches generic `P2002`, not specifically `azureId` conflict**  
   - File: `backend/src/modules/auth/auth.service.ts`  
   - Current logic assumes any `P2002` can be resolved by `findUnique({ azureId })`.  
   - If the unique conflict is on another field (e.g., email), fallback may fail and throw unexpectedly.  
   - Recommendation: inspect Prisma error target and only do azureId recovery when target includes `azureId`.

### 🔵 Low

1. **`INITIAL_ADMIN_EMAIL` matching does not trim whitespace**  
   - File: `backend/src/modules/auth/auth.service.ts`  
   - Comparison is case-insensitive but not whitespace-tolerant.  
   - Recommendation: compare `user.email` with `initialAdminEmail.trim().toLowerCase()`.

### ⚪ Info

1. **AC #1 / #2 / #3 / #4 / #5 implemented as expected**  
   - JIT create fields, immediate `syncUserFromGraph()`, token issuance path, non-fatal sync exception handling, admin bootstrap all present.

2. **AC #6 handled with DB uniqueness + recovery path**  
   - `createSsoUser()` catches `P2002` and fetches existing user by `azureId`.

3. **AC #7 implemented correctly**  
   - `m365-sync.service.ts` no longer assigns temp password; uses `passwordHash: ''`.

4. **AC #8 implemented correctly**  
   - Migration is idempotent:
   ```sql
   UPDATE "users" SET "passwordHash" = ''
   WHERE "azureId" IS NOT NULL AND "passwordHash" != '';
   ```

5. **AC #9 test coverage is strong**  
   - Dedicated `auth.service.jit.spec.ts` includes the requested 10 JIT scenarios.

6. **AC #10 implemented**  
   - `JIT_PROVISIONED` `UserAuditLog` entry created with Full Sync recommendation for Admin Activity Feed.

7. **Known design behavior preserved**  
   - Sync rejection path (`syncResult.rejected`) deactivates JIT user and returns `sso_failed`; this differs from exception fallback and appears intentional.

---

## AC Compliance Snapshot

- AC1 ✅
- AC2 ✅
- AC3 ✅
- AC4 ✅ (for sync exceptions; rejection path intentionally stricter)
- AC5 ✅
- AC6 ✅ (with medium robustness note)
- AC7 ✅
- AC8 ✅
- AC9 ✅
- AC10 ✅

---

## Verdict

**Changes Requested**

Reason: one **🔴 blocker** remains (PII in logs). After removing email/name from console log lines and re-running related tests, this should be ready for **Approved With Notes** or **Approved**.