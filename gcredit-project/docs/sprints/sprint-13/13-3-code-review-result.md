# Code Review Result: Story 13.3 — Login-Time Mini-Sync Hardening

## 1) Verdict

**Approved with Notes**

The implementation satisfies Story 13.3 acceptance criteria (jobTitle sync, 3-minute cooldown, role demotion hardening) and affected tests pass.

---

## 2) Findings

### MINOR

1. **Clock-skew edge case in cooldown check can skip sync unexpectedly**  
   - Reference: `backend/src/m365-sync/m365-sync.service.ts:389-391`  
   - Current logic uses `minutesSinceSync < COOLDOWN_MINUTES`. If `lastSyncAt` is in the future (clock skew/manual DB update), `minutesSinceSync` is negative and the sync is skipped.  
   - Recommendation: guard with `minutesSinceSync >= 0 && minutesSinceSync < COOLDOWN_MINUTES`.

2. **Missing direct test for `syncUserFromGraph` when `memberOf` fails but profile succeeds**  
   - References: `backend/src/m365-sync/m365-sync.service.ts:437`, `backend/src/m365-sync/m365-sync.service.spec.ts:1620-1750`  
   - Behavior appears correct (role remains unchanged because role update only occurs when `memberOfResult.status === 'fulfilled'`), but there is no explicit test for this branch in `syncUserFromGraph` tests.  
   - Recommendation: add a focused test asserting role is not changed on `memberOf` failure.

### NIT

1. **Cooldown value is hardcoded**  
   - Reference: `backend/src/m365-sync/m365-sync.service.ts:385`  
   - `COOLDOWN_MINUTES = 3` is reasonable, but making it configurable would simplify operational tuning (quota pressure vs freshness).

---

## 3) Validation Evidence

- Reviewed files:
  - `backend/prisma/schema.prisma`
  - `backend/prisma/migrations/20260226004923_add_job_title_field/migration.sql`
  - `backend/src/m365-sync/m365-sync.service.ts`
  - `backend/src/m365-sync/m365-sync.service.spec.ts`
  - `docs/sprints/sprint-13/13-3-login-time-mini-sync.md`

- Test run:
  - Command: `npx jest src/m365-sync/m365-sync.service.spec.ts --runInBand`
  - Result: **PASS** — 1 suite, 86 tests, 0 failures

---

## 4) AC Coverage Summary

- AC1 ✅ existing-user mini-sync invoked before issuing JWT (already in place)
- AC2 ✅ parallel Graph API calls (profile/memberOf/manager)
- AC3 ✅ fields updated including new `jobTitle`; role demotion logic added
- AC4 ✅ graceful degradation still allows login with stale data window
- AC5 ✅ `lastLoginAt` update path remains intact (unchanged from Story 13.1)
- AC6 ✅ tests added for cooldown, jobTitle mapping/null-clear, and demotion outcomes

---

## 5) Fixes Applied

- **None in this review pass** (no code changes made by reviewer).